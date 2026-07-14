import { Suspense } from "react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
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
      const title = found.tile.title.es;
      const description = found.tile.description.es;
      // Prefer the tile's own cover for share previews; social platforms don't
      // render SVG, so fall back to the default brand card for non-raster covers.
      const cover = found.tile.cover;
      const shareImage =
        cover && /\.(jpe?g|png|webp|gif|avif)$/i.test(cover)
          ? cover
          : "/brand/social-share.jpg";
      return {
        title,
        description,
        alternates: { canonical: `/?item=${item}` },
        openGraph: {
          title,
          description,
          url: `/?item=${item}`,
          images: [{ url: shareImage, alt: title }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [shareImage],
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
      <Footer />
      <Suspense fallback={null}>
        <Lightbox gameweeks={[...gameweeks, ...specials]} seasons={seasons} />
      </Suspense>
    </main>
  );
}
