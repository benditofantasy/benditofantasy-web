"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { ChartPayload } from "@/lib/types";
import type { SlideProps } from "../Lightbox";
import SlideMeta from "./SlideMeta";

/**
 * Chart layout (§9): same grammar as Data — centered kicker, big left-aligned
 * title, the chart on the stage.
 *
 * Mark specs (dataviz): 2px round-cap lines, ≥8px end markers with a 2px
 * surface ring, columns ≤24px with a 4px rounded data-end (square baseline),
 * 1px solid recessive gridlines, selective direct labels, text in text tokens
 * (never the series color), single series → no legend. Hover tooltip per mark.
 */

const W = 640;
const H = 320;
const PAD = { top: 24, right: 48, bottom: 36, left: 44 };

function niceTicks(maxValue: number): number[] {
  const rough = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10]
      .map((m) => m * magnitude)
      .find((s) => s >= rough) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= maxValue + step * 0.999; v += step) ticks.push(v);
  return ticks;
}

export default function ChartSlide({ tile, gameweek }: SlideProps) {
  const { t, l } = useLang();
  const titleId = useId();
  const payload = tile.payload as ChartPayload;
  const [hover, setHover] = useState<number | null>(null);

  const { labels, values, unit = "" } = payload;
  const ticks = niceTicks(Math.max(...values));
  const yMax = ticks[ticks.length - 1];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const maxIndex = values.indexOf(Math.max(...values));

  const bandW = plotW / labels.length;
  const xCenter = (i: number) =>
    payload.chartType === "bar"
      ? PAD.left + bandW * i + bandW / 2
      : PAD.left + (plotW / Math.max(labels.length - 1, 1)) * i;

  const barW = Math.min(24, bandW * 0.5);
  const capR = 4;

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
        <h2
          id={titleId}
          className="font-display uppercase leading-none tracking-display text-ink [font-size:clamp(1.75rem,4vw,3rem)]"
        >
          {l(tile.title)}
        </h2>
        <p className="mt-2 text-sm text-ink-mid">{l(tile.description)}</p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby={titleId}
          className="mt-6 w-full"
          onMouseLeave={() => setHover(null)}
        >
          {/* recessive hairline gridlines + y ticks in text tokens */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--color-line)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--color-ink-soft)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {tick}
              </text>
            </g>
          ))}

          {/* x labels */}
          {labels.map((label, i) => (
            <text
              key={label}
              x={xCenter(i)}
              y={H - PAD.bottom + 20}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-ink-soft)"
            >
              {label}
            </text>
          ))}

          {payload.chartType === "bar" ? (
            values.map((value, i) => {
              const top = y(value);
              const x0 = xCenter(i) - barW / 2;
              const height = y(0) - top;
              const r = Math.min(capR, height);
              return (
                <g key={i}>
                  {/* ≤24px column, 4px rounded data-end, square baseline */}
                  <path
                    d={`M${x0},${y(0)} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${y(0)} Z`}
                    fill="var(--color-accent)"
                    opacity={hover === null || hover === i ? 1 : 0.4}
                  />
                  {/* selective direct label: the extreme only */}
                  {(i === maxIndex || hover === i) && (
                    <text
                      x={xCenter(i)}
                      y={top - 8}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="var(--color-ink)"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {value}
                      {unit}
                    </text>
                  )}
                  {/* hover hit target bigger than the mark */}
                  <rect
                    x={PAD.left + bandW * i}
                    y={PAD.top}
                    width={bandW}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                  >
                    <title>{`${labels[i]}: ${value}${unit}`}</title>
                  </rect>
                </g>
              );
            })
          ) : (
            <>
              <polyline
                points={values.map((v, i) => `${xCenter(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {values.map((value, i) => {
                const isEnd = i === values.length - 1;
                const visible = isEnd || hover === i;
                return (
                  <g key={i}>
                    {/* ≥8px marker with a 2px surface ring */}
                    {visible && (
                      <circle
                        cx={xCenter(i)}
                        cy={y(value)}
                        r="5"
                        fill="var(--color-accent)"
                        stroke="var(--color-surface)"
                        strokeWidth="2"
                      />
                    )}
                    {/* direct label at the endpoint (and on hover) */}
                    {visible && (
                      <text
                        x={xCenter(i) + (isEnd ? 10 : 0)}
                        y={y(value) - (isEnd ? -4 : 12)}
                        textAnchor={isEnd ? "start" : "middle"}
                        fontSize="12"
                        fontWeight="600"
                        fill="var(--color-ink)"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {value}
                        {unit}
                      </text>
                    )}
                    <rect
                      x={xCenter(i) - bandW / 2}
                      y={PAD.top}
                      width={bandW}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                    >
                      <title>{`${labels[i]}: ${value}${unit}`}</title>
                    </rect>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* table view for accessibility */}
        <table className="sr-only">
          <caption>{`${t("chartFigure")}: ${l(tile.title)}`}</caption>
          <thead>
            <tr>
              <th scope="col">—</th>
              <th scope="col">{l(payload.seriesLabel)}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>
                  {values[i]}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlideMeta tile={tile} gameweek={gameweek} align="center" />
    </motion.div>
  );
}
