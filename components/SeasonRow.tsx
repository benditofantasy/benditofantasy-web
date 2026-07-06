"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLang } from "@/lib/i18n";
import type { Season } from "@/lib/types";
import TileCard from "./TileCard";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * A rolled-up season row — same visual language as `GameweekRow` (the "year
 * row" model, SPEC follow-up), one tile per gameweek that season (each an
 * `mvp` tile whose `slides[]` hold the week's real content). Lives below the
 * live gameweek rows once a season ends; the live timeline never breaks.
 */
/**
 * Two sizes only: the active (newest) season's year label is full size; every
 * older/inactive season shares one smaller size. Left-anchored, so the smaller
 * inactive years retract toward the gutter — only a fraction of the last digit
 * bleeds onto the strip, per the Body Issue reference.
 */
const YEAR_SCALE_ACTIVE = 1;
const YEAR_SCALE_INACTIVE = 0.7;

function ageScale(age: number): number {
  return age === 0 ? YEAR_SCALE_ACTIVE : YEAR_SCALE_INACTIVE;
}

export default function SeasonRow({
  season,
  age = 0,
}: {
  season: Season;
  /** Position among seasons, newest first (0 = newest). Drives label sizing. */
  age?: number;
}) {
  const { t, l } = useLang();
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { ref: revealRef, visible } = useReveal<HTMLElement>();

  const updateArrows = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    setCanScrollLeft(strip.scrollLeft > 8);
    setCanScrollRight(
      strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 8,
    );
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  const page = (direction: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * strip.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const onStripClickCapture = (event: React.MouseEvent) => {
    const strip = stripRef.current;
    if (!strip) return;
    const tileEl = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-tile-id]",
    );
    if (!tileEl) return;
    const stripRect = strip.getBoundingClientRect();
    const tileRect = tileEl.getBoundingClientRect();
    const fullyVisible =
      tileRect.left >= stripRect.left - 4 && tileRect.right <= stripRect.right + 4;
    if (fullyVisible) return;

    // The tile is peeking off an edge. Scroll it to the strip start (its
    // snap-start position) so the tap reveals it instead of opening it. But
    // when the tile is already at its maximal-reveal position and simply wider
    // than the strip viewport (portrait phones, where one tile can be wider
    // than the visible strip), scrolling can't reveal any more of it — so let
    // the tap open the tile instead of swallowing it forever.
    const padLeft = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
    const maxScroll = strip.scrollWidth - strip.clientWidth;
    const target = Math.max(
      0,
      Math.min(strip.scrollLeft + (tileRect.left - stripRect.left) - padLeft, maxScroll),
    );
    if (Math.abs(target - strip.scrollLeft) <= 4) return; // can't reveal more → open

    event.preventDefault();
    event.stopPropagation();
    strip.scrollTo({ left: target, behavior: "smooth" });
  };

  const [labelWord, ...labelRest] = l(season.label).split("/");

  return (
    <section
      ref={revealRef}
      id={`temporada-${season.season}`}
      aria-label={l(season.label)}
      data-animate="slide"
      data-animate-visible={visible || undefined}
      className="py-10 sm:py-12 lg:py-16"
    >
      <div className="relative mx-auto max-w-[1600px]">
        <div className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 sm:left-6 lg:left-8">
          <div
            style={{ transform: `scale(${ageScale(age)})`, transformOrigin: "left center" }}
          >
            <h2 className="font-display uppercase tracking-display">
              <span className="block text-lg leading-none text-accent drop-shadow-[0_1px_2px_rgba(1,35,64,0.2)] sm:text-2xl xl:text-3xl">
                {t("season")}
              </span>
              <span className="block leading-[0.82] text-accent drop-shadow-[0_1px_3px_rgba(1,35,64,0.2)] [font-size:clamp(5rem,12vw,6rem)] lg:[font-size:6rem] xl:[font-size:7rem]">
                {labelWord}
                {labelRest.length > 0 && (
                  <span className="text-[0.55em] text-brand-salmon">/{labelRest.join("/")}</span>
                )}
              </span>
            </h2>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-kicker text-accent drop-shadow-[0_1px_1px_rgba(1,35,64,0.18)]">
              {season.tiles.length} {t("entries")}
            </p>
          </div>
        </div>

        <div className="group/strip relative z-10 ml-36 sm:ml-36 lg:ml-40 xl:ml-48">
          <div
            ref={stripRef}
            onScroll={updateArrows}
            onClickCapture={onStripClickCapture}
            className="strip-scroll flex gap-3 overflow-x-auto pb-2 pr-8 sm:gap-4"
          >
            {season.tiles.map((tile) => (
              <TileCard key={tile.id} tile={tile} />
            ))}
            <div className="w-8 shrink-0" aria-hidden="true" />
          </div>

          {canScrollLeft && (
            <button
              type="button"
              onClick={() => page(-1)}
              aria-label={t("scrollLeft")}
              className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-lifted transition-opacity duration-fast lg:inline-flex lg:opacity-0 lg:group-hover/strip:opacity-100 lg:focus-visible:opacity-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => page(1)}
              aria-label={t("scrollRight")}
              className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-lifted lg:inline-flex"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
