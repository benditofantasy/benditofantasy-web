"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { SocialPayload } from "@/lib/types";
import { InstagramIcon, ThreadsIcon } from "../icons";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

const EMBED_SCRIPT_SRC: Record<SocialPayload["platform"], string> = {
  threads: "https://www.threads.net/embed.js",
  instagram: "https://www.instagram.com/embed.js",
};

const EMBED_TIMEOUT_MS = 4000;

/**
 * Threads/Instagram slide (SPEC §11 Social): loads the platform's real oEmbed
 * widget (their own embed.js) rather than a re-creation, so a shared post
 * looks native to its own platform. A fresh <script> tag is appended per
 * mount instead of calling a `window.instgrm`-style reprocess function, whose
 * exact name differs per platform — this way client-side navigation between
 * lightbox slides always re-triggers the widget scan. Falls back to a plain
 * card (payload.text, same spirit as TweetSlide) if nothing rendered within
 * EMBED_TIMEOUT_MS — an ad blocker, or the post having been taken down.
 */
export default function SocialSlide({ tile, gameweek, shared }: SlideProps) {
  const { t, l } = useLang();
  const payload = tile.payload as SocialPayload;
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    setEmbedFailed(false);
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC[payload.platform];
    script.async = true;
    document.body.appendChild(script);

    const timer = window.setTimeout(() => {
      if (!container.querySelector("iframe")) setEmbedFailed(true);
    }, EMBED_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      script.remove();
    };
  }, [payload.platform, payload.postUrl]);

  const Icon = payload.platform === "threads" ? ThreadsIcon : InstagramIcon;
  const viewLabel = payload.platform === "threads" ? t("viewOnThreads") : t("viewOnInstagram");

  return (
    <motion.div
      data-backdrop="true"
      className="flex h-full flex-col items-center justify-center gap-6 px-4 py-20 sm:px-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: shared ? 0.2 : 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
        {l(TAG_NAMES[tile.tag])}
      </p>
      <div ref={containerRef} className="w-full max-w-xl">
        {payload.platform === "threads" ? (
          <blockquote
            className="text-post-media"
            data-text-post-permalink={payload.postUrl}
            data-text-post-version="0"
          >
            <a href={payload.postUrl} target="_blank" rel="noopener noreferrer">
              {payload.handle}
            </a>
          </blockquote>
        ) : (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={payload.postUrl}
            data-instgrm-version="14"
          >
            <a href={payload.postUrl} target="_blank" rel="noopener noreferrer">
              {payload.handle}
            </a>
          </blockquote>
        )}
        {embedFailed && (
          <div className="rounded-tile border border-line bg-surface p-6 shadow-tile sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-ink">{payload.handle}</p>
              <Icon className="h-6 w-6 text-ink" />
            </div>
            <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">{l(payload.text)}</p>
            <p className="mt-2 text-xs text-ink-soft">{t("embedUnavailable")}</p>
            <a
              href={payload.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              {viewLabel}
            </a>
          </div>
        )}
      </div>
      <SlideMeta tile={tile} gameweek={gameweek} align="center" />
    </motion.div>
  );
}
