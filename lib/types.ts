export type Lang = "es" | "en";

export interface Localized {
  es: string;
  en: string;
}

export type TileType =
  | "podcast"
  | "article"
  | "data"
  | "chart"
  | "video"
  | "tweet"
  | "image"
  | "quote"
  | "mvp";

/** Category tag keys — display names are localized via the i18n dictionary. */
export type TagKey =
  | "podcast"
  | "article"
  | "data"
  | "chart"
  | "video"
  | "social"
  | "quote"
  | "mvp";

export interface TileLink {
  href: string;
  label: Localized;
}

export interface VideoPayload {
  youtubeId: string;
  /** e.g. "48:12" — shown as the red duration badge */
  duration?: string;
  /** white pull-quote overlaid bottom-left of the player */
  hook?: Localized;
}

export interface ArticlePayload {
  slug: string;
}

export interface DataPayload {
  columns: Localized[];
  rows: (string | number)[][];
}

export interface ChartPayload {
  chartType: "line" | "bar";
  seriesLabel: Localized;
  /** x categories (line) or bar categories */
  labels: string[];
  values: number[];
  unit?: string;
}

export interface TweetPayload {
  tweetUrl: string;
  /** fallback rendering if the embed fails/doesn't load */
  text: Localized;
  author: string;
  handle: string;
}

export interface ImagePayload {
  src: string;
  caption: Localized;
}

export interface QuotePayload {
  quote: Localized;
  attribution: string;
}

/** "King of the gameweek" — the hero tile of a rolled-up season row. */
export interface MvpPayload {
  gw: number;
  season: string;
  playerName: string;
  /**
   * Optional: migrated Squarespace seasons have no verifiable points data,
   * so they omit it rather than fabricate a number (the slide hides the
   * points line when absent). Live seasons closed by close-season.mjs can
   * keep providing it.
   */
  points?: number;
  /** short "why" line, e.g. "Hat-trick vs. Villa · 61% captained" */
  statLine: Localized;
}

export type TilePayload =
  | VideoPayload
  | ArticlePayload
  | DataPayload
  | ChartPayload
  | TweetPayload
  | ImagePayload
  | QuotePayload
  | MvpPayload;

export interface Tile {
  /** stable id, used in the ?item= deep link */
  id: string;
  type: TileType;
  /** podcast of the week — larger tile */
  featured?: boolean;
  title: Localized;
  description: Localized;
  tag: TagKey;
  cover: string;
  credit: string;
  /** short label overlaid on the homepage tile-card cover (e.g. a country
   *  name over a player illustration) — not shown anywhere else. */
  badge?: Localized;
  link?: TileLink;
  payload: TilePayload;
  /**
   * Nested tiles a tile explodes into (SPEC §6 "design for evolution").
   * Used by `mvp` tiles: a rolled-up season row's tile-per-gameweek carries
   * that week's original tiles here, so the lightbox still opens into the
   * full week's content — just entered through the MVP cover instead of a
   * flat strip.
   */
  slides?: Tile[];
}

export interface Gameweek {
  gw: number;
  label: Localized;
  date: string;
  tiles: Tile[];
}

/**
 * A completed season, rolled up into one row (SPEC follow-up: "close a
 * season"). Each tile is an `mvp` tile — one per gameweek that season — with
 * that week's real tiles nested under `slides`.
 */
export interface Season {
  season: string;
  label: Localized;
  date: string;
  tiles: Tile[];
}

/**
 * A one-off editorial row outside the FPL weekly cycle (e.g. World Cup
 * coverage) — same shape and lightbox behavior as a live gameweek row (SPEC
 * §10: bounded navigation, closes at the row's last tile), just not tied to
 * a Premier League gameweek number.
 */
export interface Special {
  id: string;
  label: Localized;
  date: string;
  tiles: Tile[];
}

/** Anything that renders as a homepage row: a live gameweek, a special editorial row, or a rolled-up season. */
export type Row = Gameweek | Season | Special;

/**
 * Slide abstraction (SPEC §6 "design for evolution"): originally every tile
 * was an implicit one-slide gallery. `mvp` tiles are the first to use
 * `slides[]` for real — the lightbox flattens them before stepping to the
 * next tile, no further schema change needed for future mini-galleries.
 */
export interface Slide {
  /** which §9 layout renders this slide */
  layout: "cover" | "media" | "video" | "data" | "chart" | "quote" | "tweet" | "mvp";
  tile: Tile;
}

const LAYOUT_BY_TYPE: Record<TileType, Slide["layout"]> = {
  article: "cover",
  image: "media",
  podcast: "video",
  video: "video",
  data: "data",
  chart: "chart",
  quote: "quote",
  tweet: "tweet",
  mvp: "mvp",
};

/** A tile's ordered slides: itself, then its nested tiles' own slides (recursively). */
export function getSlides(tile: Tile): Slide[] {
  const own: Slide = { layout: LAYOUT_BY_TYPE[tile.type], tile };
  if (tile.slides && tile.slides.length > 0) {
    return [own, ...tile.slides.flatMap(getSlides)];
  }
  return [own];
}
