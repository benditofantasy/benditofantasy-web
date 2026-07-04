"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import type { MvpPayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import { TrophyIcon } from "../icons";
import SlideMeta from "./SlideMeta";

/**
 * MVP / "king of the gameweek" layout — built on CoverSlide's skeleton
 * (SPEC §9 cover layout): whitespace-forward, the player's name is the
 * protagonist, the cover photo is reduced to a peeking sliver on the right,
 * not a full-bleed background. The pale oversized "J{gw}" behind the name is
 * a real, intentional watermark here (in the article slide it's only an
 * accident of the placeholder-cover generator, which disappears once real
 * photography replaces the SVGs).
 */
export default function MvpSlide({ tile, gameweek, shared }: SlideProps) {
  const { l } = useLang();
  const payload = tile.payload as MvpPayload;

  return (
    <div data-backdrop="true" className="relative flex h-full items-center overflow-hidden">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 select-none font-display uppercase leading-none tracking-display text-ink [font-size:clamp(6rem,22vw,20rem)] opacity-[0.06]"
      >
        J{payload.gw}
      </span>

      <motion.div
        className="relative w-full max-w-[65%] pl-6 sm:pl-16 lg:pl-28"
        initial={{ opacity: 0, x: -48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.45,
          delay: shared ? 0.18 : 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-tag-mvp px-3 py-1 text-[11px] font-bold uppercase tracking-kicker text-surface-deep">
          <TrophyIcon className="h-3.5 w-3.5" />
          {l({ es: "Rey de la jornada", en: "King of the gameweek" })}
        </span>
        <h2 className="mt-4 font-display uppercase leading-[0.9] tracking-display text-ink [font-size:clamp(2.5rem,7vw,6.5rem)]">
          {payload.playerName}
        </h2>
        {typeof payload.points === "number" && (
          <p className="mt-4 text-lg font-bold text-tag-mvp sm:text-xl">
            {payload.points} {l({ es: "puntos", en: "points" })}
          </p>
        )}
        <p className="mt-3 max-w-xl text-base text-ink-mid sm:text-lg">
          {l(payload.statLine)}
        </p>
        <div className="mt-8">
          <SlideMeta tile={tile} gameweek={gameweek} />
        </div>
      </motion.div>

      {/* Vertical sliver of the cover peeking on the right edge, matching
          CoverSlide — the shared element the clicked tile's image travels into */}
      <motion.div
        layoutId={shared ? `cover-${tile.id}` : undefined}
        transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
        className="absolute bottom-0 right-0 top-0 hidden w-[14vw] max-w-[220px] overflow-hidden sm:block"
        aria-hidden="true"
      >
        <Image src={tile.cover} alt="" fill sizes="14vw" className="object-cover" />
      </motion.div>
    </div>
  );
}
