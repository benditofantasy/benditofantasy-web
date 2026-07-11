"use client";

import { motion } from "framer-motion";
import PollEmbed from "../PollEmbed";
import type { PollPayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/** Poll layout: same centered composition as QuoteSlide, with the shared
 *  vote/results UI (PollEmbed) in place of the quote body. */
export default function PollSlide({ tile, gameweek }: SlideProps) {
  const payload = tile.payload as PollPayload;
  return (
    <div data-backdrop="true" className="flex h-full items-center justify-center px-6 py-20 sm:px-16">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <PollEmbed payload={payload} tileId={tile.id} className="text-left" />
        <div className="mt-8 flex justify-center">
          <SlideMeta tile={tile} gameweek={gameweek} align="center" />
        </div>
      </motion.div>
    </div>
  );
}
