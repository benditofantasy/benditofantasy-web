"use client";

import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { TweetPayload } from "@/lib/types";
import { XSocialIcon } from "../icons";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Tweet/X slide (§11 Social): a styled card with the post's text linking out
 * to X. Rendered locally (no third-party script) so it never breaks the
 * page — the graceful-degradation path is the default rendering.
 */
export default function TweetSlide({ tile, gameweek }: SlideProps) {
  const { t, l } = useLang();
  const payload = tile.payload as TweetPayload;
  return (
    <motion.div
      data-backdrop="true"
      className="flex h-full flex-col items-center justify-center gap-6 px-4 py-20 sm:px-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
        {l(TAG_NAMES[tile.tag])}
      </p>
      <blockquote className="w-full max-w-xl rounded-tile border border-line bg-surface p-6 shadow-tile sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-ink">{payload.author}</p>
            <p className="text-sm text-ink-soft">{payload.handle}</p>
          </div>
          <XSocialIcon className="h-6 w-6 text-ink" />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">
          {l(payload.text)}
        </p>
        <a
          href={payload.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 transition-colors duration-fast hover:text-accent"
        >
          {t("viewOnX")}
        </a>
      </blockquote>
      <SlideMeta tile={tile} gameweek={gameweek} align="center" />
    </motion.div>
  );
}
