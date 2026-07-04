import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSlides, type Gameweek, type Row, type Season, type Tile } from "./types";

const GAMEWEEKS_DIR = path.join(process.cwd(), "content", "gameweeks");
const SEASONS_DIR = path.join(process.cwd(), "content", "seasons");
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

/** All gameweeks, newest first (SPEC §7: newest gameweek on top). */
export function getGameweeks(): Gameweek[] {
  const files = fs
    .readdirSync(GAMEWEEKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("template"));
  const weeks = files.map((file) => {
    const raw = fs.readFileSync(path.join(GAMEWEEKS_DIR, file), "utf8");
    return JSON.parse(raw) as Gameweek;
  });
  return weeks.sort((a, b) => b.gw - a.gw);
}

export function getGameweek(gw: number): Gameweek | undefined {
  return getGameweeks().find((week) => week.gw === gw);
}

/** Rolled-up past seasons (one row per season), newest first. */
export function getSeasons(): Season[] {
  if (!fs.existsSync(SEASONS_DIR)) return [];
  const files = fs
    .readdirSync(SEASONS_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("template"));
  const seasons = files.map((file) => {
    const raw = fs.readFileSync(path.join(SEASONS_DIR, file), "utf8");
    return JSON.parse(raw) as Season;
  });
  return seasons.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Find a tile (and its row) by its deep-link id — searches every slide,
 * including tiles nested under an `mvp` tile's `slides[]` (SPEC §6). Season
 * rows are searched as one continuous sequence across all their gameweeks,
 * matching the lightbox's own season-wide navigation (owner-confirmed:
 * scrolling a season flows gameweek to gameweek, only closing at the end).
 */
export function findTile(
  id: string,
): { gameweek: Row; tile: Tile; index: number } | undefined {
  for (const gameweek of getGameweeks()) {
    const slides = gameweek.tiles.flatMap(getSlides);
    const index = slides.findIndex((slide) => slide.tile.id === id);
    if (index !== -1) return { gameweek, tile: slides[index].tile, index };
  }
  for (const season of getSeasons()) {
    const slides = season.tiles.flatMap(getSlides);
    const index = slides.findIndex((slide) => slide.tile.id === id);
    if (index !== -1) return { gameweek: season, tile: slides[index].tile, index };
  }
  return undefined;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  gw: number;
  author: string;
  cover?: string;
  body: string;
}

export function getArticleSlugs(): string[] {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getArticle(slug: string): Article | undefined {
  const file = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return undefined;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    gw: data.gw ?? 0,
    author: data.author ?? "Bendito Fantasy",
    cover: data.cover,
    body: content,
  };
}
