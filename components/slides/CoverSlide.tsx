"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Title/cover layout (§9, screenshots 2 & 14): left ~65% = kicker → giant red
 * ALL-CAPS title → mid-gray description → metadata; a vertical sliver of the
 * cover image peeks on the right edge; underlined "Leer más" when linked.
 *
 * Enter motion (reference): the clicked tile's image travels to the right
 * sliver (shared layoutId), while the typography staggers in from the left
 * just after the image starts moving.
 */
export default function CoverSlide({ tile, gameweek, shared }: SlideProps) {
  const { l } = useLang();
  return (
    <div data-backdrop="true" className="relative flex h-full items-center">
      <motion.div
        className="w-full max-w-[65%] pl-6 sm:pl-16 lg:pl-28"
        initial={{ opacity: 0, x: -48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.45,
          delay: shared ? 0.18 : 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
          {l(TAG_NAMES[tile.tag])}
        </p>
        <h2 className="mt-4 font-display uppercase leading-[0.9] tracking-display text-accent [font-size:clamp(2.5rem,7vw,6.5rem)]">
          {l(tile.title)}
        </h2>
        <p className="mt-5 max-w-xl text-base text-ink-mid sm:text-lg">
          {l(tile.description)}
        </p>
        {tile.link && (
          <Link
            href={tile.link.href}
            className="mt-6 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 transition-colors duration-fast hover:text-accent"
          >
            {l(tile.link.label)}
          </Link>
        )}
        <div className="mt-8">
          <SlideMeta tile={tile} gameweek={gameweek} />
        </div>
      </motion.div>
      {/* Vertical sliver of the cover peeking on the right edge — the shared
          element the clicked tile's image travels into */}
      <motion.div
        layoutId={shared ? `cover-${tile.id}` : undefined}
        transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
        className="absolute bottom-0 right-0 top-0 hidden w-[14vw] max-w-[220px] overflow-hidden sm:block"
        aria-hidden="true"
      >
        <Image
          src={tile.cover}
          alt=""
          fill
          sizes="14vw"
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}
