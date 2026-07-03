import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Gameweek, Tile } from "./types";

const GAMEWEEKS_DIR = path.join(process.cwd(), "content", "gameweeks");
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

/** Find a tile (and its gameweek) by its deep-link id. */
export function findTile(
  id: string,
): { gameweek: Gameweek; tile: Tile; index: number } | undefined {
  for (const gameweek of getGameweeks()) {
    const index = gameweek.tiles.findIndex((tile) => tile.id === id);
    if (index !== -1) return { gameweek, tile: gameweek.tiles[index], index };
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
