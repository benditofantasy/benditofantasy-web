"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { Tile } from "@/lib/types";
import { TypeIcon } from "./icons";

/**
 * A strip tile (SPEC §7A): tall ~3:4 image card, hover zoom, pill badge
 * bottom-right, gray UPPERCASE title beneath. Featured (newest in the row,
 * whatever its type) = larger, with its category tag pill top-left.
 *
 * Breakpoint widths (SPEC §12): mobile ≈1.3 tiles visible (swipe), tablet
 * 2–3 visible, desktop fixed-width tiles with edge arrows.
 *
 * The cover carries a framer-motion layoutId so opening the lightbox is a
 * shared-element "explode": this image travels into the slide's media slot.
 */
/**
 * YouTube podcast thumbnails share the channel's 16:9 layout: the player
 * illustration sits against the right edge, branding/text on the left. Cropping
 * that into the tile's 3:4 portrait keeps ~42% of the width, so a centered crop
 * slices the player in half. Right-anchoring the crop frames the player instead
 * (and cleanly isolates the right subject on older two-player covers).
 *
 * These covers are named `…-podcast.jpg` by the weekly gameweek sync
 * (`scripts/sync-latest-podcast.mjs`) and `…-podcast-e323.jpg` for the World
 * Cup specials, so match `-podcast` with an optional episode suffix. Article
 * art and the `/media/players/*` portraits keep the default centered crop.
 */
function isYoutubeThumb(cover: string): boolean {
  return /-podcast(-[a-z0-9]+)?\.(jpe?g|png|webp)$/i.test(cover);
}

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
            className={`object-cover transition-transform duration-slow ease-brand motion-safe:group-hover:scale-105 ${
              isYoutubeThumb(tile.cover) ? "object-right" : "object-center"
            }`}
          />
        </motion.div>
        {tile.featured && (
          <span className="absolute left-3 top-3 rounded-pill bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-kicker text-accent-ink">
            {l(TAG_NAMES[tile.tag])}
          </span>
        )}
        {tile.badge && (
          <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-14">
            <span className="font-badge text-2xl font-extrabold uppercase leading-none tracking-wide text-white sm:text-3xl">
              {l(tile.badge)}
            </span>
          </div>
        )}
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-pill bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
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
