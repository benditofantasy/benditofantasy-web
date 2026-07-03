import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GameweekRow from "@/components/GameweekRow";
import { getGameweek, getGameweeks } from "@/lib/content";

interface PageProps {
  params: Promise<{ gw: string }>;
}

export function generateStaticParams() {
  return getGameweeks().map((week) => ({ gw: String(week.gw) }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { gw } = await params;
  const week = getGameweek(Number(gw));
  if (!week) return {};
  return {
    title: week.label.es,
    description: `Todo el contenido de la ${week.label.es}: podcast, análisis, datos y más.`,
    alternates: { canonical: `/jornada/${week.gw}` },
    openGraph: { title: week.label.es },
  };
}

/** Per-gameweek permalink page (SPEC §3) — the row, shareable. */
export default async function GameweekPage({ params }: PageProps) {
  const { gw } = await params;
  const week = getGameweek(Number(gw));
  if (!week) notFound();
  return (
    <main className="pt-24 sm:pt-28">
      <GameweekRow gameweek={week} />
    </main>
  );
}
