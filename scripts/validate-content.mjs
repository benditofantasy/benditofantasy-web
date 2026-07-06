/**
 * Content guard: fails the build if any live-row tile is missing a `date`.
 *
 * Why this exists: the homepage orders tiles within a row by recency
 * (`orderTilesByRecency` in lib/types.ts), reading each tile's optional
 * `date`. A tile with NO `date` silently falls back to the row's date and
 * keeps its position in the JSON array — which is how a fresh article can get
 * buried behind an older podcast. This script makes that failure loud: every
 * tile in a recency-ordered row must carry its own publish date.
 *
 * Scope:
 *   - content/gameweeks/*.json  → REQUIRED. Live weekly cycle, mixed content
 *                                 types (podcast/article/…) competing for the
 *                                 top slot. This is where recency matters.
 *   - content/specials/*.json   → REQUIRED. One-off editorial rows (e.g. World
 *                                 Cup) with the same mixed-content problem.
 *   - content/seasons/*.json    → EXEMPT. Archival roll-ups: one MVP tile per
 *                                 gameweek, intentionally ordered by gameweek
 *                                 (all tiles share the season's fallback date,
 *                                 so array order = gameweek order). Dating them
 *                                 would be busywork and could disturb that
 *                                 order. Flip REQUIRE_SEASON_DATES to change.
 *   - content/articles/*.mdx    → REQUIRED frontmatter `date`. Keeps the MDX
 *                                 publish date in sync with its tile and avoids
 *                                 a dateless article slipping in.
 *
 * Only TOP-LEVEL tiles are checked — those are what get positioned in a row.
 * Nested `slides[]` (a tile a card explodes into in the lightbox) are ordered
 * separately and don't affect row placement, so they're not required to carry
 * a date.
 *
 *   node scripts/validate-content.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GAMEWEEKS = path.join(ROOT, "content", "gameweeks");
const SPECIALS = path.join(ROOT, "content", "specials");
const SEASONS = path.join(ROOT, "content", "seasons");
const ARTICLES = path.join(ROOT, "content", "articles");

const REQUIRE_SEASON_DATES = false;

// Accepts a bare date (2026-07-04) or a full ISO timestamp
// (2026-07-04T09:46:55-07:00). String comparison of these still orders
// correctly by day, which is all `orderTilesByRecency` relies on.
const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ].*)?$/;

const errors = [];

function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.includes("template"))
    .map((f) => ({
      file: path.join(dir, f),
      rel: path.relative(ROOT, path.join(dir, f)),
      data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")),
    }));
}

function checkRowFiles(dir, requireDate = true) {
  if (!requireDate) return;
  for (const { rel, data } of readJsonFiles(dir)) {
    for (const tile of data.tiles ?? []) {
      const id = tile.id ?? "(no id)";
      if (tile.date == null) {
        errors.push(`${rel}: tile "${id}" is missing "date".`);
      } else if (typeof tile.date !== "string" || !DATE_RE.test(tile.date)) {
        errors.push(
          `${rel}: tile "${id}" has an invalid "date" (${JSON.stringify(tile.date)}); expected YYYY-MM-DD.`,
        );
      }
    }
  }
}

function checkArticleDates() {
  if (!fs.existsSync(ARTICLES)) return;
  for (const f of fs.readdirSync(ARTICLES)) {
    if (!f.endsWith(".mdx") || f.includes("template")) continue;
    const raw = fs.readFileSync(path.join(ARTICLES, f), "utf8");
    // Cheap frontmatter scan — no gray-matter dependency needed for a lint.
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const dateLine = fm && fm[1].match(/^date:\s*["']?([^"'\r\n]+)/m);
    const rel = path.relative(ROOT, path.join(ARTICLES, f));
    if (!dateLine) {
      errors.push(`${rel}: article frontmatter is missing "date".`);
    } else if (!DATE_RE.test(dateLine[1].trim())) {
      errors.push(
        `${rel}: article "date" is invalid (${JSON.stringify(dateLine[1].trim())}); expected YYYY-MM-DD.`,
      );
    }
  }
}

checkRowFiles(GAMEWEEKS, true);
checkRowFiles(SPECIALS, true);
checkRowFiles(SEASONS, REQUIRE_SEASON_DATES);
checkArticleDates();

if (errors.length > 0) {
  console.error(
    `\n✗ Content validation failed — ${errors.length} tile(s)/article(s) missing a valid date:\n`,
  );
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    "\nEvery tile in a live row (gameweeks, specials) must carry its own publish date so\nthe homepage can order it by recency. Add a \"date\": \"YYYY-MM-DD\" to each tile above.\n",
  );
  process.exit(1);
}

console.log("✓ Content validation passed — all live-row tiles carry a date.");
