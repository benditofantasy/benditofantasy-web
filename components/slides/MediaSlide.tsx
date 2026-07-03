"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { ImagePayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Full-media layout (§9, screenshots 3–8): the media centered on white with
 * generous margins; centered top kicker; caption + meta beneath. The clicked
 * tile's cover travels into the stage (shared layoutId).
 */
export default function MediaSlide({ tile, gameweek, shared }: SlideProps) {
  const { l } = useLang();
  const payload = tile.payload as ImagePayload;
  const textEnter = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      delay: shared ? 0.2 : 0.05,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
  return (
    <div data-backdrop="true" className="flex h-full flex-col items-center justify-center gap-5 px-6 py-20 sm:px-16">
      <motion.p
        {...textEnter}
        className="text-xs font-semibold uppercase tracking-kicker text-ink-soft"
      >
        {l(TAG_NAMES[tile.tag])}
      </motion.p>
      <motion.div
        layoutId={shared ? `cover-${tile.id}` : undefined}
        transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
        className="relative min-h-0 w-full max-w-4xl flex-1 overflow-hidden"
      >
        <Image
          src={payload.src ?? tile.cover}
          alt={l(tile.title)}
          fill
          sizes="(max-width: 1024px) 90vw, 896px"
          className="object-contain"
        />
      </motion.div>
      {payload.caption && (
        <motion.p {...textEnter} className="max-w-xl text-center text-sm text-ink-mid">
          {l(payload.caption)}
        </motion.p>
      )}
      <motion.div {...textEnter}>
        <SlideMeta tile={tile} gameweek={gameweek} align="center" />
      </motion.div>
    </div>
  );
}
