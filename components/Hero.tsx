"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import type { Gameweek } from "@/lib/types";
import { PlayIcon } from "./icons";

/**
 * Hero masthead (SPEC §7.1): oversized Body-Issue display headline + this
 * week's featured content teaser.
 */
export default function Hero({ currentWeek }: { currentWeek: Gameweek }) {
  const { t, l } = useLang();
  const featured = currentWeek.tiles.find((tile) => tile.featured) ?? currentWeek.tiles[0];

  return (
    /* SPEC §12: condensed hero on mobile, medium on tablet, full oversized on desktop */
    <section className="relative mx-auto max-w-[1600px] overflow-hidden px-4 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-32 lg:pt-40">
      {/* banner photo to the right of the headline — fades to transparent on
          its left edge so it blends into the page instead of a hard crop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 45%)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)",
        }}
      >
        <Image
          src="/brand/hero-banner.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
      </div>
      <p className="relative z-10 text-[11px] font-semibold uppercase tracking-kicker text-ink-soft sm:text-xs">
        {t("tagline")}
      </p>
      <h1 className="relative z-10 mt-3 font-display uppercase leading-[0.9] tracking-display text-accent [font-size:17vw] sm:[font-size:12vw] lg:[font-size:10rem] xl:[font-size:11rem]">
        Bendito
        <br />
        Fantasy
      </h1>
      {featured && (
        <div className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
            {t("thisWeek")} · {l(currentWeek.label)}
          </p>
          <Link
            href={`/?item=${featured.id}`}
            scroll={false}
            className="group mt-2 inline-flex items-start gap-3"
          >
            <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-ink transition-transform duration-base ease-brand motion-safe:group-hover:scale-110">
              <PlayIcon className="h-4 w-4 translate-x-[1px]" />
            </span>
            <span>
              <span className="block font-display text-2xl uppercase leading-tight tracking-display text-ink group-hover:text-accent sm:text-3xl">
                {l(featured.title)}
              </span>
              <span className="mt-1 block text-sm text-ink-mid">
                {l(featured.description)}
              </span>
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
