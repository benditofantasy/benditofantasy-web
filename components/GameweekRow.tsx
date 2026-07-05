"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLang } from "@/lib/i18n";
import type { Gameweek } from "@/lib/types";
import TileCard from "./TileCard";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * A gameweek row (SPEC §7/§7A/§8), matching the reference layout:
 *
 * - Desktop (lg+): the giant red label sits at the left, vertically centered,
 *   layered BEHIND the strip — the first tile overlaps the number's right
 *   side (like the Body Issue year labels running under the photos). Edge
 *   arrows page the strip.
 * - Mobile/tablet (<lg): the label stacks above a full-width swipeable strip
 *   (SPEC §12); no hover arrows.
 * - The tile peeking off either edge is itself clickable: clicking a
 *   partially visible tile scrolls it into full view instead of opening it
 *   (same peek-and-click pattern the lightbox slivers use).
 */
export default function GameweekRow({ gameweek }: { gameweek: Gameweek }) {
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

  /** Peek-and-click: a partially visible tile scrolls into view, it doesn't open. */
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
    if (!fullyVisible) {
      event.preventDefault();
      event.stopPropagation();
      // Scroll the tile to the strip start (its snap-start position) —
      // scrollIntoView can't be used here: the container's scroll-snap pulls
      // the minimal-reveal position straight back to the previous snap point.
      const padLeft = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
      strip.scrollTo({
        left: strip.scrollLeft + (tileRect.left - stripRect.left) - padLeft,
        behavior: "smooth",
      });
    }
  };

  const [labelWord, ...labelRest] = l(gameweek.label).split(" ");

  return (
    <section
      ref={revealRef}
      id={`jornada-${gameweek.gw}`}
      aria-label={l(gameweek.label)}
      data-animate="slide"
      data-animate-visible={visible || undefined}
      className="py-10 sm:py-12 lg:py-16"
    >
      <div className="relative mx-auto max-w-[1600px]">
        {/* Label always at the left side, vertically centered, painted ON TOP
            of the strip (reference: the year label overlays the photos; the
            strip scrolls beneath it). pointer-events-none so tiles stay
            clickable through it. */}
        <div className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 sm:left-6 lg:left-8">
          <h2 className="font-display uppercase tracking-display">
            <span className="block text-lg leading-none text-accent drop-shadow-[0_1px_2px_rgba(1,35,64,0.2)] sm:text-2xl xl:text-3xl">
              {labelWord}
            </span>
            <span className="block leading-[0.82] text-accent drop-shadow-[0_1px_3px_rgba(1,35,64,0.2)] [font-size:clamp(3.5rem,9.7vw,8.3rem)] lg:[font-size:11rem] xl:[font-size:12.5rem]">
              {labelRest.join(" ") || gameweek.gw}
            </span>
          </h2>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-kicker text-accent drop-shadow-[0_1px_1px_rgba(1,35,64,0.18)]">
            {gameweek.tiles.length} {t("entries")}
          </p>
        </div>

        {/* strip starts inside the label zone so the number overlays the first tile */}
        <div className="group/strip relative z-10 ml-14 sm:ml-24 lg:ml-40 xl:ml-48">
          <div
            ref={stripRef}
            onScroll={updateArrows}
            onClickCapture={onStripClickCapture}
            className="strip-scroll flex gap-3 overflow-x-auto pb-2 pr-8 sm:gap-4"
          >
            {gameweek.tiles.map((tile) => (
              <TileCard key={tile.id} tile={tile} />
            ))}
            {/* right edge-bleed spacer */}
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
