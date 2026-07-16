import type { Lang, Localized, TagKey } from "./types";

/**
 * One searchable thing on the site: an MDX article or a row tile. Built
 * server-side (lib/build-search-index.ts), fetched by the search overlay from
 * /api/search-index, matched client-side below.
 */
export interface SearchRecord {
  /** tile id, or "article:<slug>" for MDX articles */
  id: string;
  /** groups results; display name comes from the i18n TAG_NAMES dictionary */
  section: TagKey;
  title: Localized;
  description: Localized;
  /** ISO — newest first within a section */
  date: string;
  /** "/articulo/<slug>" or "/?item=<tileId>" (lightbox deep link) */
  url: string;
  cover?: string;
}

export interface SearchGroup {
  section: TagKey;
  records: SearchRecord[];
}

/** Sections in editorial priority order; anything unlisted trails behind. */
const SECTION_ORDER: TagKey[] = [
  "podcast",
  "article",
  "data",
  "chart",
  "video",
  "social",
  "quote",
  "mvp",
  "poll",
];

/** Lowercase and strip diacritics so "nunez" matches "Núñez" both ways. */
export function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Match records against a query in the active language: every query token
 * must appear in the normalized title or description. Title hits rank a
 * record above description-only hits; ties break newest-first. Results come
 * back grouped by section in SECTION_ORDER. Swap this function's internals
 * for a real fuzzy library if the corpus ever outgrows substring matching.
 */
export function searchRecords(
  records: SearchRecord[],
  query: string,
  lang: Lang,
): SearchGroup[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { record: SearchRecord; score: number }[] = [];
  for (const record of records) {
    const title = normalize(record.title[lang]);
    const description = normalize(record.description[lang]);
    let score = 0;
    let matched = true;
    for (const token of tokens) {
      if (title.includes(token)) score += 2;
      else if (description.includes(token)) score += 1;
      else {
        matched = false;
        break;
      }
    }
    if (matched) scored.push({ record, score });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.record.date < b.record.date ? 1 : -1;
  });

  const bySection = new Map<TagKey, SearchRecord[]>();
  for (const { record } of scored) {
    const group = bySection.get(record.section);
    if (group) group.push(record);
    else bySection.set(record.section, [record]);
  }

  const order = (s: TagKey) => {
    const i = SECTION_ORDER.indexOf(s);
    return i === -1 ? SECTION_ORDER.length : i;
  };
  return [...bySection.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([section, sectionRecords]) => ({ section, records: sectionRecords }));
}
