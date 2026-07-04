"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import type { QuotePayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Quote layout (§9, screenshots 12–13): gray attribution label → large
 * near-black REGULAR-weight quote (deliberately not red, not condensed) →
 * optional "Leer más" link.
 */
export default function QuoteSlide({ tile, gameweek }: SlideProps) {
  const { l } = useLang();
  const payload = tile.payload as QuotePayload;
  return (
    <div data-backdrop="true" className="flex h-full items-center justify-center px-6 py-20 sm:px-16">
      <motion.div
        className="max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
          {payload.attribution}
        </p>
        <blockquote className="mt-6 font-sans font-normal leading-snug text-ink [font-size:clamp(1.75rem,4vw,3.25rem)]">
          “{l(payload.quote)}”
        </blockquote>
        {tile.link && (
          <Link
            href={tile.link.href}
            className="relative z-10 mt-8 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 transition-colors duration-fast hover:text-accent"
          >
            {l(tile.link.label)}
          </Link>
        )}
        <div className="mt-8 flex justify-center">
          <SlideMeta tile={tile} gameweek={gameweek} align="center" />
        </div>
      </motion.div>
    </div>
  );
}
