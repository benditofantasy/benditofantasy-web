"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { VideoPayload } from "@/lib/types";
import { PlayIcon } from "../icons";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Video layout (§9, screenshots 10–11) — Podcast & Vídeo: centered player,
 * white circular play button, red duration badge, white pull-quote headline
 * bottom-left. YouTube loads lazily on play (facade = cover image). The
 * clicked tile's cover travels into the player stage (shared layoutId).
 */
export default function VideoSlide({ tile, gameweek, shared }: SlideProps) {
  const { t, l } = useLang();
  const payload = tile.payload as VideoPayload;
  const [playing, setPlaying] = useState(false);
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
    <div data-backdrop="true" className="flex h-full flex-col items-center justify-center gap-5 px-4 py-20 sm:px-16">
      <motion.p
        {...textEnter}
        className="text-xs font-semibold uppercase tracking-kicker text-ink-soft"
      >
        {l(TAG_NAMES[tile.tag])}
      </motion.p>
      <motion.div
        layoutId={shared ? `cover-${tile.id}` : undefined}
        transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-tile bg-ink"
      >
        {playing && payload.youtubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${payload.youtubeId}?autoplay=1&rel=0`}
            title={l(tile.title)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${t("play")}: ${l(tile.title)}`}
            className="group absolute inset-0 h-full w-full"
          >
            <Image
              src={tile.cover}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover opacity-90"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface text-ink shadow-lifted transition-transform duration-base ease-brand motion-safe:group-hover:scale-110 sm:h-20 sm:w-20">
              <PlayIcon className="h-6 w-6 translate-x-[2px]" />
            </span>
            {payload.duration && (
              <span className="absolute right-4 top-4 rounded-pill bg-accent px-2.5 py-1 text-xs font-bold tabular-nums text-accent-ink">
                {payload.duration}
              </span>
            )}
            {payload.hook && (
              <span className="absolute bottom-5 left-5 max-w-[70%] text-left font-display text-xl uppercase leading-tight tracking-display text-white sm:text-3xl">
                {l(payload.hook)}
              </span>
            )}
          </button>
        )}
      </motion.div>
      <motion.p {...textEnter} className="max-w-2xl text-center text-sm text-ink-mid">
        {l(tile.description)}
      </motion.p>
      <motion.div {...textEnter}>
        <SlideMeta tile={tile} gameweek={gameweek} align="center" />
      </motion.div>
    </div>
  );
}
