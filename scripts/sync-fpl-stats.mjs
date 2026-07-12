/**
 * FPL stats -> gameweek chart tile sync, same spirit as sync-social-posts.mjs:
 * a deterministic, non-AI script a cron workflow runs on a schedule.
 *
 *   node scripts/sync-fpl-stats.mjs [--dry-run] [--file <path>]
 *
 * The FPL engine (darutto/FPL-Platform) publishes a static data/stats.json with
 * per-team goals-for/against, aggregated from finished fixtures. This script
 * fetches that file (config.statsUrl, or a local --file for testing), builds a
 * bar-chart tile of the top scoring teams, and upserts it into the latest
 * gameweek file. The existing ChartSlide (components/slides/ChartSlide.tsx)
 * renders it — no new UI.
 *
 * Unlike the social sync (append-only), stats are a rolling snapshot: the tile
 * has a stable id per season+period and is REPLACED in place each run so it
 * refreshes rather than accumulating duplicates.
 *
 * Does NOT touch git — that's the CI workflow's job
 * (.github/workflows/sync-fpl-stats.yml).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "content", "fpl-stats-config.json");
const GAMEWEEKS_DIR = path.join(ROOT, "content", "gameweeks");
const COVER = "/media/thumbnails/stats-card.png";

const DRY_RUN = process.argv.includes("--dry-run");
const FILE_ARG = (() => {
  const i = process.argv.indexOf("--file");
  return i !== -1 ? process.argv[i + 1] : null;
})();

function log(...args) {
  console.log(...args);
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

async function loadStats(config) {
  if (FILE_ARG) {
    log(`Reading stats from local file ${FILE_ARG}.`);
    return JSON.parse(fs.readFileSync(FILE_ARG, "utf8"));
  }
  const res = await fetch(config.statsUrl);
  if (!res.ok) {
    throw new Error(`Stats fetch error ${res.status}: ${config.statsUrl}`);
  }
  return res.json();
}

function latestGameweekFile() {
  const files = fs
    .readdirSync(GAMEWEEKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("template"));
  if (files.length === 0) return null;
  return files.sort().at(-1);
}

/** Season "2025/26" -> slug "2025-26" for a filesystem/id-safe key. */
function seasonSlug(season) {
  return String(season).replace(/[^0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Build the top-scoring-teams bar-chart tile from the stats payload. */
function buildAttackTile(stats, topN) {
  const teams = [...(stats.teams ?? [])]
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, topN);

  const slug = seasonSlug(stats.season);
  const offseason = stats.seasonStatus === "offseason";
  const periodKey = offseason ? "final" : `gw${stats.gameweek ?? "current"}`;
  const gw = stats.gameweek;

  const title = offseason
    ? { es: `Temporada ${stats.season} — Tabla final`, en: `${stats.season} — Final table` }
    : { es: `GW${gw} — Equipos más goleadores`, en: `GW${gw} — Top scorers` };

  const description = offseason
    ? { es: "Equipos más goleadores de la temporada.", en: "The season's top-scoring teams." }
    : {
        es: `Goles a favor por equipo hasta la GW${gw}.`,
        en: `Goals for by team through GW${gw}.`,
      };

  return {
    id: `fpl-stats-attack-${slug}-${periodKey}`,
    type: "chart",
    title,
    description,
    tag: "chart",
    cover: COVER,
    credit: "Datos: FPL oficial",
    // Snapshot date drives orderTilesByRecency; the visible date is still the row's.
    date: (stats.generatedAt ?? new Date().toISOString()).slice(0, 10),
    payload: {
      chartType: "bar",
      seriesLabel: { es: "Goles a favor", en: "Goals for" },
      labels: teams.map((t) => t.short),
      values: teams.map((t) => t.goalsFor),
      unit: "",
    },
  };
}

/** Replace an existing same-id tile, else append. Returns "updated"|"added"|"unchanged". */
function upsertTile(fileName, tile) {
  const filePath = path.join(GAMEWEEKS_DIR, fileName);
  const week = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const idx = week.tiles.findIndex((t) => t.id === tile.id);

  let action;
  if (idx === -1) {
    week.tiles.push(tile);
    action = "added";
  } else if (JSON.stringify(week.tiles[idx]) === JSON.stringify(tile)) {
    action = "unchanged";
  } else {
    week.tiles[idx] = tile;
    action = "updated";
  }

  if (action !== "unchanged" && !DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(week, null, 2) + "\n");
  }
  return action;
}

async function main() {
  const config = loadConfig();
  const stats = await loadStats(config);

  // Broken-source guard (Phase-0 parity): an empty teams array means the engine
  // published nothing usable (season rollover, API change) — fail loudly so the
  // run goes red and the workflow opens an alert issue.
  if (!Array.isArray(stats.teams) || stats.teams.length === 0) {
    throw new Error("Stats payload has no teams — treating as a broken source.");
  }

  const fileName = latestGameweekFile();
  if (!fileName) {
    throw new Error("No gameweek file exists to attach a stats tile to.");
  }

  const tile = buildAttackTile(stats, config.topN ?? 10);
  const action = upsertTile(fileName, tile);
  log(
    `${action}: ${tile.id} in ${fileName} — ${tile.payload.labels.length} teams ` +
      `(season ${stats.season}, ${stats.seasonStatus}, gw ${stats.gameweek}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
