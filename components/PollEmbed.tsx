"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { PollPayload } from "@/lib/types";

interface PollResults {
  totals: Record<string, number>;
  totalVotes: number;
}

function voteStorageKey(tileId: string): string {
  return `poll-vote-${tileId}`;
}

/**
 * Shared vote/results UI for a poll — deliberately typed only against the
 * poll's own payload + tile id (not `Tile`/`SlideProps`), so it renders
 * identically whether wrapped by PollSlide.tsx (standalone card/lightbox) or
 * dropped into an MDX article body via the `<Poll id="..." />` tag.
 */
export default function PollEmbed({
  payload,
  tileId,
  className,
}: {
  payload: PollPayload;
  tileId: string;
  className?: string;
}) {
  const { t, l } = useLang();
  const [results, setResults] = useState<PollResults | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(false);

  const closed = Date.now() > Date.parse(payload.closesAt);

  useEffect(() => {
    setSelectedOption(window.localStorage.getItem(voteStorageKey(tileId)));
  }, [tileId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/polls/${tileId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: PollResults) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tileId]);

  const vote = async (optionId: string) => {
    setVoting(true);
    setError(false);
    try {
      const res = await fetch(`/api/polls/${tileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId,
          closesAt: payload.closesAt,
          validOptionIds: payload.options.map((o) => o.id),
        }),
      });
      if (!res.ok) throw new Error("vote failed");
      const data: PollResults = await res.json();
      window.localStorage.setItem(voteStorageKey(tileId), optionId);
      setSelectedOption(optionId);
      setResults(data);
    } catch {
      setError(true);
    } finally {
      setVoting(false);
    }
  };

  const showResults = closed || Boolean(selectedOption);
  const totalVotes = results?.totalVotes ?? 0;

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-ink">{l(payload.question)}</p>

      {loading ? (
        <div className="mt-4 space-y-2">
          {payload.options.map((option) => (
            <div key={option.id} className="h-9 animate-pulse rounded-pill bg-line" />
          ))}
        </div>
      ) : showResults ? (
        <div className="mt-4 space-y-2">
          {payload.options.map((option) => {
            const votes = results?.totals[option.id] ?? 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isMine = option.id === selectedOption;
            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-pill border ${isMine ? "border-accent" : "border-line"}`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-accent opacity-25 transition-[width] duration-slow ease-brand"
                  style={{ width: `${Math.max(pct, votes > 0 ? 4 : 0)}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                  <span className={isMine ? "font-semibold text-ink" : "text-ink-mid"}>
                    {l(option.label)}
                    {isMine && " ✓"}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{pct}%</span>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] font-semibold uppercase tracking-kicker text-ink-soft">
            {closed ? t("pollClosed") : t("pollVoted")} · {totalVotes} {t("pollVotes")}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {payload.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={voting}
              onClick={() => vote(option.id)}
              className="block w-full rounded-pill border border-line px-3 py-2 text-left text-sm text-ink transition-colors duration-fast hover:border-ink disabled:opacity-60"
            >
              {l(option.label)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p aria-live="polite" className="mt-2 text-xs text-accent">
          {t("pollError")}
        </p>
      )}
    </div>
  );
}
