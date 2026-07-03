"use client";

import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { DataPayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Data layout (§9): centered top kicker (Datos) + large left-aligned title,
 * with the table occupying the stage. White/whitespace/accent discipline.
 */
export default function DataSlide({ tile, gameweek }: SlideProps) {
  const { l } = useLang();
  const payload = tile.payload as DataPayload;
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
      <div className="w-full max-w-3xl">
        <h2 className="font-display uppercase leading-none tracking-display text-ink [font-size:clamp(1.75rem,4vw,3rem)]">
          {l(tile.title)}
        </h2>
        <p className="mt-2 text-sm text-ink-mid">{l(tile.description)}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr>
                {payload.columns.map((column) => (
                  <th
                    key={column.es}
                    scope="col"
                    className="border-b border-line px-3 py-2.5 text-[11px] font-semibold uppercase tracking-kicker text-ink-soft"
                  >
                    {l(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`border-b border-line px-3 py-2.5 tabular-nums ${
                        cellIndex === 0 ? "font-semibold text-ink" : "text-ink-mid"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SlideMeta tile={tile} gameweek={gameweek} align="center" />
    </motion.div>
  );
}
