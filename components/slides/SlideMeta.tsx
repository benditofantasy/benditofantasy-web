"use client";

import { formatDate, useLang } from "@/lib/i18n";
import type { Gameweek, Tile } from "@/lib/types";
import CategoryTag from "../CategoryTag";
import ShareButtons from "../ShareButtons";

/**
 * Every §9 layout carries: date + Jornada N + colored category tag,
 * author/credit, and share buttons.
 */
export default function SlideMeta({
  tile,
  gameweek,
  align = "left",
}: {
  tile: Tile;
  gameweek: Gameweek;
  align?: "left" | "center";
}) {
  const { lang, l } = useLang();
  const alignment = align === "center" ? "items-center text-center" : "items-start";
  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
        <CategoryTag tag={tile.tag} />
        <span>{formatDate(gameweek.date, lang)}</span>
        <span aria-hidden="true">·</span>
        <span>{l(gameweek.label)}</span>
        {tile.credit && (
          <>
            <span aria-hidden="true">·</span>
            <span>{tile.credit}</span>
          </>
        )}
      </div>
      <ShareButtons tile={tile} />
    </div>
  );
}
