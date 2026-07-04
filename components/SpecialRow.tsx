"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { Special } from "@/lib/types";
import TileCard from "./TileCard";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * A one-off editorial row outside the FPL weekly cycle (e.g. World Cup
 * coverage) — same strip/arrows/peek-and-click behavior as `GameweekRow`,
 * just keyed by `id` instead of a Premier League gameweek number.
 */
export default function SpecialRow({ special }: { special: Special }) {
  const { t, l } = useLang();
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    if (!fullyVisible) {
      event.preventDefault();
      event.stopPropagation();
      const padLeft = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
      strip.scrollTo({
        left: strip.scrollLeft + (tileRect.left - stripRect.left) - padLeft,
        behavior: "smooth",
      });
    }
  };

  const [labelWord, ...labelRest] = l(special.label).split(" ");

  return (
    <section
      id={`especial-${special.id}`}
      aria-label={l(special.label)}
      className="py-10 sm:py-12 lg:py-16"
    >
      <div className="relative mx-auto max-w-[1600px]">
        <div className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 sm:left-6 lg:left-8">
          <h2 className="font-display uppercase tracking-display">
            <span className="block text-lg leading-none text-ink-soft sm:text-2xl xl:text-3xl">
              {labelWord}
            </span>
            <span className="block leading-[0.82] text-accent [font-size:clamp(2.5rem,6vw,5rem)] lg:[font-size:6rem] xl:[font-size:7rem]">
              {labelRest.join(" ")}
            </span>
          </h2>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-kicker text-ink-soft">
            {special.tiles.length} {t("entries")}
          </p>
        </div>

        <div className="group/strip relative z-10 ml-10 sm:ml-16 lg:ml-28 xl:ml-32">
          <div
            ref={stripRef}
            onScroll={updateArrows}
            onClickCapture={onStripClickCapture}
            className="strip-scroll flex gap-3 overflow-x-auto pb-2 pr-8 sm:gap-4"
          >
            {special.tiles.map((tile) => (
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
