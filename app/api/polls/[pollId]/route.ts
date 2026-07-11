import { NextRequest, NextResponse } from "next/server";
import { getRedis, pollVotesKey } from "@/lib/redis";

export const dynamic = "force-dynamic";

interface PollResults {
  pollId: string;
  totals: Record<string, number>;
  totalVotes: number;
}

function toResults(pollId: string, hash: Record<string, string>): PollResults {
  const totals: Record<string, number> = {};
  let totalVotes = 0;
  for (const [optionId, count] of Object.entries(hash)) {
    const n = Number(count) || 0;
    totals[optionId] = n;
    totalVotes += n;
  }
  return { pollId, totals, totalVotes };
}

/** How long vote data outlives a closed poll before it's allowed to expire. */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;
  const redis = getRedis();
  const hash = (await redis.hgetall<Record<string, string>>(pollVotesKey(pollId))) ?? {};
  return NextResponse.json(toResults(pollId, hash), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;
  const body = await request.json().catch(() => null);
  const optionId = typeof body?.optionId === "string" ? body.optionId : null;
  const closesAt = typeof body?.closesAt === "string" ? body.closesAt : null;
  const validOptionIds: string[] | undefined = Array.isArray(body?.validOptionIds)
    ? body.validOptionIds
    : undefined;

  if (!optionId || !closesAt) {
    return NextResponse.json({ error: "optionId and closesAt are required" }, { status: 400 });
  }
  if (validOptionIds && !validOptionIds.includes(optionId)) {
    return NextResponse.json({ error: "invalid optionId" }, { status: 400 });
  }

  const closesAtMs = Date.parse(closesAt);
  if (Number.isNaN(closesAtMs)) {
    return NextResponse.json({ error: "invalid closesAt" }, { status: 400 });
  }

  const redis = getRedis();
  const key = pollVotesKey(pollId);
  await redis.hincrby(key, optionId, 1);
  const expiresAtSeconds = Math.floor((closesAtMs + RETENTION_MS) / 1000);
  await redis.expireat(key, expiresAtSeconds);

  const hash = (await redis.hgetall<Record<string, string>>(key)) ?? {};
  return NextResponse.json(toResults(pollId, hash), {
    headers: { "Cache-Control": "no-store" },
  });
}
