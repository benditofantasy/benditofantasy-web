/**
 * FPL stats -> gameweek chart tile sync, same spirit as sync-social-posts.mjs:
 * a deterministic, non-AI script a cron workflow runs on a schedule.
 *
 *   node scripts/sync-fpl-stats.mjs [--dry-run] [--file <path>]
 *
 * The FPL engine (darutto/FPL-Platform) publishes a static data/stats.json with
 * per-team goals-for/against (and, as of Phase 2, per-player xG/xA), aggregated
 * from finished fixtures. This script fetches that file (config.statsUrl, or a
 * local --file for testing), builds a small set of chart/data tiles, and
 * upserts each into the latest gameweek file. The existing ChartSlide/DataSlide
 * components (components/slides/ChartSlide.tsx, components/slides/DataSlide.tsx)
 * render them — no new UI.
 *
 * Unlike the social sync (append-only), stats are a rolling snapshot: each tile
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
const DEFAULT_COVER = "/media/thumbnails/stats-card.png";

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

/**
 * Every gameweek file carries a `gw` number (0 = preseason, 1 = Jornada 1, ...).
 * Editorial content for the NEXT gameweek is often committed ahead of the
 * engine's stats for the CURRENT one (e.g. a GW2 captain poll goes up while
 * the engine is still reporting GW1) — so "the file with the highest name"
 * is not the same file as "the gameweek these stats are for." Resolve the
 * target by matching stats.gameweek against each file's own `gw` field.
 */
function resolveTargetFile(stats) {
  const files = fs
    .readdirSync(GAMEWEEKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("template"));
  if (files.length === 0) return null;

  const byGw = files
    .map((f) => {
      const gw = JSON.parse(fs.readFileSync(path.join(GAMEWEEKS_DIR, f), "utf8")).gw;
      return { file: f, gw };
    })
    .filter((x) => typeof x.gw === "number")
    .sort((a, b) => a.gw - b.gw);
  if (byGw.length === 0) return null;

  // Offseason: the engine's final table belongs on the last gameweek played.
  if (stats.seasonStatus === "offseason" || typeof stats.gameweek !== "number") {
    return byGw.at(-1).file;
  }

  const exact = byGw.find((x) => x.gw === stats.gameweek);
  if (exact) return exact.file;

  // Engine is ahead of (or behind) any file we have a `gw` match for — fall
  // back to the closest gameweek at or before it rather than crashing.
  const fallback = [...byGw].reverse().find((x) => x.gw <= stats.gameweek) ?? byGw.at(-1);
  log(
    `No gameweek file has gw=${stats.gameweek}; falling back to ${fallback.file} (gw=${fallback.gw}).`,
  );
  return fallback.file;
}

/** Season "2025/26" -> slug "2025-26" for a filesystem/id-safe key. */
function seasonSlug(season) {
  return String(season).replace(/[^0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Shared season/gameweek period bookkeeping used by every tile builder. */
function periodOf(stats) {
  const slug = seasonSlug(stats.season);
  const offseason = stats.seasonStatus === "offseason";
  const periodKey = offseason ? "final" : `gw${stats.gameweek ?? "current"}`;
  return { slug, offseason, periodKey, gw: stats.gameweek };
}

/**
 * Resolve a tile's cover image from config.covers[key], falling back to the
 * shared default stats card if the config entry is missing OR the referenced
 * file doesn't actually exist under /public yet (the owner adds cover art
 * later; the script must never point at a 404).
 */
function resolveCover(config, key) {
  const configured = config.covers?.[key];
  if (!configured) return DEFAULT_COVER;
  const publicPath = path.join(ROOT, "public", configured.replace(/^\//, ""));
  return fs.existsSync(publicPath) ? configured : DEFAULT_COVER;
}

/** Build the top-scoring-teams bar-chart tile from the stats payload. */
function buildAttackTile(stats, config) {
  const topN = config.topN ?? 10;
  const teams = [...(stats.teams ?? [])]
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, topN);

  const { slug, offseason, periodKey, gw } = periodOf(stats);

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
    cover: resolveCover(config, "attack"),
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

/** Build the leakiest-defenses bar-chart tile from the stats payload. */
function buildDefenseTile(stats, config) {
  const topN = config.topN ?? 10;
  const teams = [...(stats.teams ?? [])]
    .sort((a, b) => b.goalsAgainst - a.goalsAgainst)
    .slice(0, topN);

  const { slug, offseason, periodKey, gw } = periodOf(stats);

  const title = offseason
    ? { es: `Temporada ${stats.season} — Peores defensas`, en: `${stats.season} — Leakiest defenses` }
    : { es: `GW${gw} — Peores defensas`, en: `GW${gw} — Most goals conceded` };

  const description = offseason
    ? {
        es: "Goles en contra por equipo en toda la temporada.",
        en: "Goals conceded by team across the whole season.",
      }
    : {
        es: `Goles en contra por equipo hasta la GW${gw}.`,
        en: `Goals conceded by team through GW${gw}.`,
      };

  return {
    id: `fpl-stats-defense-${slug}-${periodKey}`,
    type: "chart",
    title,
    description,
    tag: "chart",
    cover: resolveCover(config, "defense"),
    credit: "Datos: FPL oficial",
    date: (stats.generatedAt ?? new Date().toISOString()).slice(0, 10),
    payload: {
      chartType: "bar",
      seriesLabel: { es: "Goles en contra", en: "Goals conceded" },
      labels: teams.map((t) => t.short),
      values: teams.map((t) => t.goalsAgainst),
      unit: "",
    },
  };
}

/**
 * Build the xG/xA leaders data-table tile from stats.players. Returns null
 * (with a log line) when the source doesn't publish player data yet — this is
 * a graceful skip, not a broken-source error.
 */
function buildXgXaTile(stats, config) {
  if (!Array.isArray(stats.players) || stats.players.length === 0) {
    log("Skipping xG/xA tile: stats payload has no players data yet.");
    return null;
  }

  const topN = config.playersTopN ?? 12;
  const players = [...stats.players].sort((a, b) => b.xg - a.xg).slice(0, topN);

  const { slug, offseason, periodKey, gw } = periodOf(stats);

  const title = offseason
    ? { es: `Temporada ${stats.season} — Líderes de xG y xA`, en: `${stats.season} — xG & xA leaders` }
    : { es: `GW${gw} — Líderes de xG y xA`, en: `GW${gw} — xG & xA leaders` };

  const description = offseason
    ? {
        es: "Goles y asistencias esperados acumulados en la temporada.",
        en: "Expected goals and assists accumulated across the season.",
      }
    : {
        es: `Goles y asistencias esperados hasta la GW${gw}.`,
        en: `Expected goals and assists through GW${gw}.`,
      };

  return {
    id: `fpl-stats-xgxa-${slug}-${periodKey}`,
    type: "data",
    title,
    description,
    tag: "data",
    cover: resolveCover(config, "xgxa"),
    credit: "Datos: FPL oficial",
    date: (stats.generatedAt ?? new Date().toISOString()).slice(0, 10),
    payload: {
      columns: [
        { es: "Jugador", en: "Player" },
        { es: "xG", en: "xG" },
        { es: "xA", en: "xA" },
      ],
      rows: players.map((p) => [p.name, p.xg, p.xa]),
    },
  };
}

/** Everything about a tile except its ordering `date` — the actual content. */
function tileWithoutDate(tile) {
  const { date, ...rest } = tile;
  return rest;
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
  } else if (
    JSON.stringify(tileWithoutDate(week.tiles[idx])) === JSON.stringify(tileWithoutDate(tile))
  ) {
    // Same data, only a fresher generatedAt. Re-dating here would float
    // unchanged stats back to the top of the row on every run — during the
    // offseason the engine re-publishes the same final table indefinitely,
    // which would perpetually leapfrog genuinely new content (podcasts,
    // social posts). Keep the existing tile (and its original date); the
    // date only advances when the underlying numbers actually change.
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
  // run goes red and the workflow opens an alert issue. Players data is
  // optional (see buildXgXaTile's graceful skip) so it's not part of this guard.
  if (!Array.isArray(stats.teams) || stats.teams.length === 0) {
    throw new Error("Stats payload has no teams — treating as a broken source.");
  }

  const fileName = resolveTargetFile(stats);
  if (!fileName) {
    throw new Error("No gameweek file exists to attach a stats tile to.");
  }

  const builders = [buildAttackTile, buildDefenseTile, buildXgXaTile];

  for (const build of builders) {
    const tile = build(stats, config);
    if (!tile) continue;
    const action = upsertTile(fileName, tile);
    const count =
      tile.type === "chart" ? tile.payload.labels.length : tile.payload.rows.length;
    log(
      `${action}: ${tile.id} in ${fileName} — ${count} rows ` +
        `(season ${stats.season}, ${stats.seasonStatus}, gw ${stats.gameweek}).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
