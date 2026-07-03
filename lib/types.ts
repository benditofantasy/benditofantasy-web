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
  | "quote";

/** Category tag keys — display names are localized via the i18n dictionary. */
export type TagKey =
  | "podcast"
  | "article"
  | "data"
  | "chart"
  | "video"
  | "social"
  | "quote";

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

export type TilePayload =
  | VideoPayload
  | ArticlePayload
  | DataPayload
  | ChartPayload
  | TweetPayload
  | ImagePayload
  | QuotePayload;

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
  link?: TileLink;
  payload: TilePayload;
}

export interface Gameweek {
  gw: number;
  label: Localized;
  date: string;
  tiles: Tile[];
}

/**
 * Slide abstraction (SPEC §6 "design for evolution"): today every tile is an
 * implicit one-slide gallery. When mini-galleries arrive, a tile will carry
 * slides[] of its own and the lightbox traverses them before stepping to the
 * next tile — no schema rewrite needed.
 */
export interface Slide {
  /** which §9 layout renders this slide */
  layout: "cover" | "media" | "video" | "data" | "chart" | "quote" | "tweet";
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
};

/** A tile's ordered slides. MVP: exactly one slide per tile. */
export function getSlides(tile: Tile): Slide[] {
  return [{ layout: LAYOUT_BY_TYPE[tile.type], tile }];
}
