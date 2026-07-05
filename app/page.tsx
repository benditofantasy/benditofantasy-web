import { Suspense } from "react";
import type { Metadata } from "next";
import GameweekRow from "@/components/GameweekRow";
import Hero from "@/components/Hero";
import Lightbox from "@/components/Lightbox";
import SeasonRow from "@/components/SeasonRow";
import SpecialRow from "@/components/SpecialRow";
import { findTile, getGameweeks, getSeasons, getSpecialRows } from "@/lib/content";

interface PageProps {
  searchParams: Promise<{ item?: string }>;
}

/** Deep-linked tiles get their own share metadata (SPEC §16). */
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { item } = await searchParams;
  if (item) {
    const found = findTile(item);
    if (found) {
      return {
        title: found.tile.title.es,
        description: found.tile.description.es,
        openGraph: {
          title: found.tile.title.es,
          description: found.tile.description.es,
        },
      };
    }
  }
  return {};
}

export default function HomePage() {
  const gameweeks = getGameweeks();
  const specials = getSpecialRows();
  const seasons = getSeasons();
  return (
    <main>
      <Hero currentWeek={gameweeks[0]} />
      <div>
        {gameweeks.map((gameweek) => (
          <GameweekRow key={gameweek.gw} gameweek={gameweek} />
        ))}
        {specials.map((special) => (
          <SpecialRow key={special.id} special={special} />
        ))}
        {seasons.map((season, index) => (
          <SeasonRow key={season.season} season={season} age={index} />
        ))}
      </div>
      <footer className="mx-auto max-w-[1600px] px-4 py-14 text-xs uppercase tracking-kicker text-ink-soft sm:px-8">
        © {new Date().getFullYear()} Bendito Fantasy
      </footer>
      <Suspense fallback={null}>
        <Lightbox gameweeks={[...gameweeks, ...specials]} seasons={seasons} />
      </Suspense>
    </main>
  );
}
