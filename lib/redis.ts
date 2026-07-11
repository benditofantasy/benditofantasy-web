import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** Lazily constructed so builds without the Upstash integration configured
 *  yet (e.g. before the Vercel Storage integration is connected) don't fail
 *  at import time — only routes that actually vote/read polls need it. */
export function getRedis(): Redis {
  if (!client) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing KV_REST_API_URL / KV_REST_API_TOKEN — connect the Upstash Redis integration in the Vercel dashboard.",
      );
    }
    client = new Redis({ url, token });
  }
  return client;
}

export function pollVotesKey(pollId: string): string {
  return `poll:${pollId}:votes`;
}
