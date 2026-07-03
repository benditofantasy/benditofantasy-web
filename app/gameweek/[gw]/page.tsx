import { redirect } from "next/navigation";

/** English alias (SPEC §3) — canonical URL is /jornada/[gw]. */
export default async function GameweekAlias({
  params,
}: {
  params: Promise<{ gw: string }>;
}) {
  const { gw } = await params;
  redirect(`/jornada/${gw}`);
}
