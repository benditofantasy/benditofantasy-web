"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDate, TAG_NAMES, useLang } from "@/lib/i18n";
import { searchRecords, type SearchRecord } from "@/lib/search";
import { CloseIcon, SearchIcon } from "./icons";

/** Fetched once per session; every later open reuses it. */
let indexCache: SearchRecord[] | null = null;

/**
 * Full-screen editorial search (SPEC §7A follow-up): oversized query line in
 * the display face, results grouped by section tag underneath. The index is
 * built at deploy time (/api/search-index) and loaded lazily on first open.
 * The overlay shell (fixed layer, fade, Esc/✕ close, scroll lock) is the
 * pattern the future menu overlay should follow.
 */
export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang, t, l } = useLang();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchRecord[] | null>(indexCache);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the index on first open; scroll lock + focus while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    if (!indexCache) {
      setFailed(false);
      fetch("/api/search-index")
        .then((res) => {
          if (!res.ok) throw new Error(`search index: ${res.status}`);
          return res.json() as Promise<SearchRecord[]>;
        })
        .then((records) => {
          indexCache = records;
          setIndex(records);
        })
        .catch(() => setFailed(true));
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const groups = index && query ? searchRecords(index, query, lang) : [];

  let status: string | null = null;
  if (failed) status = t("searchError");
  else if (!query.trim()) status = t("searchHint");
  else if (!index) status = t("searchLoading");
  else if (groups.length === 0) status = t("searchNoResults");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("search")}
          className="fixed inset-0 z-50 overflow-y-auto bg-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-24 sm:px-8 sm:pt-32">
            {/* query line — oversized, borderless, Body-Issue display type */}
            {/* the darkening bottom border is the focus indicator (SPEC §15) —
                the default focus-visible box reads as a stray frame at this size */}
            <div className="flex items-center gap-4 border-b border-line pb-4 transition-colors duration-fast focus-within:border-ink">
              <SearchIcon className="h-6 w-6 shrink-0 text-ink-soft sm:h-8 sm:w-8" />
              <input
                ref={inputRef}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("search")}
                className="w-full bg-transparent font-display text-3xl uppercase tracking-display text-ink outline-none focus-visible:outline-none placeholder:text-ink-soft/60 sm:text-5xl"
              />
            </div>

            {status && (
              <p className="mt-8 font-display text-sm uppercase tracking-display text-ink-soft">
                {status}
              </p>
            )}

            {groups.map(({ section, records }) => (
              <section key={section} className="mt-10">
                <h2 className="font-display text-sm uppercase tracking-display text-accent">
                  {TAG_NAMES[section][lang]}
                  <span className="ml-2 text-ink-soft">{records.length}</span>
                </h2>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {records.map((record) => (
                    <li key={record.id}>
                      <Link
                        href={record.url}
                        onClick={onClose}
                        className="group block py-4 transition-colors duration-fast"
                      >
                        <span className="block font-display text-xl uppercase tracking-display text-ink transition-colors duration-fast group-hover:text-accent sm:text-2xl">
                          {l(record.title)}
                        </span>
                        {l(record.description) && (
                          <span className="mt-1 block max-w-3xl text-sm text-ink-soft">
                            {l(record.description)}
                          </span>
                        )}
                        {record.date && (
                          <span className="mt-1 block text-xs uppercase tracking-wide text-ink-soft/70">
                            {formatDate(record.date, lang)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* chrome: outlined circular ✕ top-right (SPEC §7A) */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="fixed right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line bg-surface/80 text-ink backdrop-blur-sm transition-colors duration-fast hover:border-ink sm:right-6 sm:top-6"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
