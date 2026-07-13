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
  // A slim table (≤4 columns, e.g. the xG/xA leaders) fits any phone, so it
  // shouldn't be pinned to a 480px min-width that forces a sideways drag on
  // mobile. Only wide tables keep the min-width + horizontal scroll; narrow
  // ones fill the width and let long cells (e.g. a long player name) wrap.
  const compact = payload.columns.length <= 4;
  return (
    <motion.div
      data-backdrop="true"
      className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-20 sm:px-16"
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
        <div className={`mt-6 ${compact ? "" : "overflow-x-auto"}`}>
          <table
            className={`w-full border-collapse text-left text-sm ${compact ? "" : "min-w-[480px]"}`}
          >
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
