"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { Tile } from "@/lib/types";
import { TypeIcon } from "./icons";

/**
 * A strip tile (SPEC §7A): tall ~3:4 image card, hover zoom, pill badge
 * bottom-right, gray UPPERCASE title beneath. Featured (podcast) = larger.
 *
 * Breakpoint widths (SPEC §12): mobile ≈1.3 tiles visible (swipe), tablet
 * 2–3 visible, desktop fixed-width tiles with edge arrows.
 *
 * The cover carries a framer-motion layoutId so opening the lightbox is a
 * shared-element "explode": this image travels into the slide's media slot.
 */
export default function TileCard({ tile }: { tile: Tile }) {
  const { l } = useLang();
  const width = tile.featured
    ? "w-[80vw] sm:w-[46vw] md:w-[42vw] lg:w-[380px] xl:w-[420px]"
    : "w-[68vw] sm:w-[38vw] md:w-[34vw] lg:w-[290px] xl:w-[320px]";

  return (
    <Link
      href={`/?item=${tile.id}`}
      scroll={false}
      id={`tile-${tile.id}`}
      data-tile-id={tile.id}
      className={`group block shrink-0 snap-start ${width}`}
    >
      <div className="relative aspect-[3/4] rounded-tile bg-line shadow-tile">
        <motion.div
          layoutId={`cover-${tile.id}`}
          className="absolute inset-0 overflow-hidden rounded-tile"
        >
          <Image
            src={tile.cover}
            alt={l(tile.title)}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 46vw, 420px"
            className="object-cover transition-transform duration-slow ease-brand motion-safe:group-hover:scale-105"
          />
        </motion.div>
        {tile.featured && (
          <span className="absolute left-3 top-3 rounded-pill bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-kicker text-accent-ink">
            {l(TAG_NAMES.podcast)}
          </span>
        )}
        {tile.badge && (
          <span className="absolute bottom-3 left-3 font-badge text-sm font-bold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            {l(tile.badge)}
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-pill bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
          01
          <TypeIcon type={tile.type} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-kicker text-ink-soft transition-colors duration-fast group-hover:text-ink">
        {l(tile.title)}
      </p>
    </Link>
  );
}
