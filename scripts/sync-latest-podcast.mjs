/**
 * Recurring YouTube -> gameweek/special sync (SPEC follow-up: automate the
 * podcast import once the historical backfill is done).
 *
 * Steady-state case is much simpler than the historical backfill: one new
 * episode a week, its title says "GW<N>" directly, and live gameweek files
 * (content/gameweeks/*.json) aren't mvp-wrapped like closed seasons — no
 * MVP-stat lookup needed here at all.
 *
 * Alongside the current-season gameweek playlist, content/youtube-sync-config.json
 * can also list one-off tournament playlists (e.g. a World Cup) under
 * "specials" — those sync into content/specials/<id>.json instead, keyed off
 * an episode-number prefix in the title ("326 - ...") rather than a GW number.
 *
 *   node scripts/sync-latest-podcast.mjs [--dry-run]
 *
 * Requires `yt-dlp` on PATH. Reads/writes content/gameweeks/*.json and
 * content/specials/*.json, and downloads real thumbnails into public/media/
 * — never hotlinks (this repo has no remote image domains configured in
 * next.config.mjs).
 *
 * Intentionally does NOT touch git (branch/commit/PR) — that's the CI
 * workflow's job (.github/workflows/sync-youtube-podcast.yml), so this
 * script stays testable on its own via --dry-run.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "content", "youtube-sync-config.json");
const GAMEWEEKS_DIR = path.join(ROOT, "content", "gameweeks");
const MEDIA_DIR = path.join(ROOT, "public", "media");

const DRY_RUN = process.argv.includes("--dry-run");
/** Shorts/clips from the channel are well under this; real episodes run 30-90+ min. */
const MIN_EPISODE_SECONDS = 15 * 60;

function log(...args) {
  console.log(...args);
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

/**
 * CI runner IPs get YouTube's "Sign in to confirm you're not a bot" wall on
 * the web client; the android client's endpoint doesn't require that check.
 */
const YT_DLP_EXTRACTOR_ARGS = ["--extractor-args", "youtube:player_client=android"];

function ytDlpJsonLines(args) {
  const out = execFileSync("yt-dlp", [...YT_DLP_EXTRACTOR_ARGS, ...args], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function existingYoutubeIds() {
  const ids = new Set();
  if (!fs.existsSync(GAMEWEEKS_DIR)) return ids;
  const collect = (tile) => {
    if (tile.payload?.youtubeId) ids.add(tile.payload.youtubeId);
    (tile.slides ?? []).forEach(collect);
  };
  for (const file of fs.readdirSync(GAMEWEEKS_DIR)) {
    if (!file.endsWith(".json") || file.includes("template")) continue;
    const week = JSON.parse(fs.readFileSync(path.join(GAMEWEEKS_DIR, file), "utf8"));
    week.tiles.forEach(collect);
  }
  return ids;
}

function parseGw(title) {
  // Matches plain "GW25" as well as FPL's "DGW25"/"BGW25" (double/blank
  // gameweek) notation — those are real gameweek numbers, not a different
  // thing. The range check is the real safety net: it rejects things like a
  // season-review episode titled "...DGW39", since the PL season caps at 38
  // and that's not a real gameweek, just loose labeling on that one episode.
  const match = title.match(/GW\s?(\d{1,2})(?!\d)/i);
  if (!match) return null;
  const gw = Number(match[1]);
  return gw >= 1 && gw <= 38 ? gw : null;
}

function formatDuration(totalSeconds) {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

/**
 * Strip the raw upload title down to just its parenthetical hook, if any.
 * The hook is always in Spanish (the podcast is Spanish-language) — no
 * mechanical script should invent an English translation of it, so `en`
 * only ever gets the plain "Gameweek N" fallback, never a guessed rendering
 * of the Spanish phrase. A human can improve the English copy later via a
 * normal PR edit before merging.
 */
function cleanTitle(rawTitle, gw) {
  const parenMatch = rawTitle.match(/\(([^)]+)\)/);
  const hook = parenMatch ? parenMatch[1].trim() : null;
  return {
    es: hook ?? `Jornada ${gw}`,
    en: `Gameweek ${gw}`,
  };
}

function pickWinner(candidates) {
  if (candidates.length === 1) return candidates[0];
  // owner's tie-break: same-ish duration -> first in playlist order;
  // meaningfully different -> the longer one (the full episode, not a re-upload clip)
  const [first, ...rest] = candidates;
  const allClose = rest.every((c) => Math.abs(c.duration - first.duration) < 120);
  if (allClose) return first;
  return candidates.reduce((longest, c) => (c.duration > longest.duration ? c : longest));
}

function downloadThumbnail(videoId, destPath) {
  const urls = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
  for (const url of urls) {
    try {
      execFileSync("curl", ["-sf", "-o", destPath, url]);
      if (fs.statSync(destPath).size > 0) return true;
    } catch {
      // try the next fallback URL
    }
  }
  return false;
}

function gwFilePath(gw) {
  return path.join(GAMEWEEKS_DIR, `gw-${String(gw).padStart(2, "0")}.json`);
}

function upsertPodcastTile(gw, tile, isoDate) {
  const filePath = gwFilePath(gw);
  if (fs.existsSync(filePath)) {
    const week = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const alreadyThere = week.tiles.some((t) => t.payload?.youtubeId === tile.payload.youtubeId);
    if (alreadyThere) return false;
    week.tiles = week.tiles.map((t) => ({ ...t, featured: false }));
    week.tiles.unshift(tile);
    if (!DRY_RUN) fs.writeFileSync(filePath, JSON.stringify(week, null, 2) + "\n");
    log(`Updated ${path.basename(filePath)}: prepended podcast tile.`);
  } else {
    const week = {
      gw,
      label: { es: `Jornada ${gw}`, en: `Gameweek ${gw}` },
      date: isoDate,
      tiles: [tile],
    };
    if (!DRY_RUN) fs.writeFileSync(filePath, JSON.stringify(week, null, 2) + "\n");
    log(`Created ${path.basename(filePath)} with the podcast as its first tile.`);
  }
  return true;
}

/**
 * Strip the episode-number prefix ("326 - "), the trailing " | ..." tag
 * suffix, and any emoji from a special-playlist title. These playlists
 * (e.g. a World Cup) aren't GW-numbered, so titles look like
 * "326 - Se acabó el sueño 😢 ... | Fantasy Mundial en español".
 */
function cleanSpecialTitle(rawTitle) {
  return rawTitle
    .replace(/^\d{1,4}\s*[-–]\s*/, "")
    .split(/\s*\|\s*/)[0]
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .trim()
    .replace(/\s+/g, " ");
}

function upsertSpecialTile(filePath, tile) {
  const special = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const alreadyThere = special.tiles.some((t) => t.payload?.youtubeId === tile.payload.youtubeId);
  if (alreadyThere) return false;
  special.tiles.unshift(tile);
  if (!DRY_RUN) fs.writeFileSync(filePath, JSON.stringify(special, null, 2) + "\n");
  log(`Updated ${path.basename(filePath)}: prepended podcast tile.`);
  return true;
}

function syncSpecial(special) {
  const filePath = path.join(ROOT, special.file);
  log(`Checking special "${special.id}" playlist: ${special.playlistUrl}`);

  const entries = ytDlpJsonLines(["--flat-playlist", "--dump-json", special.playlistUrl]);

  const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const synced = new Set();
  const collect = (tile) => {
    if (tile.payload?.youtubeId) synced.add(tile.payload.youtubeId);
    (tile.slides ?? []).forEach(collect);
  };
  existing.tiles.forEach(collect);

  const candidates = entries.filter(
    (e) => !synced.has(e.id) && (e.duration ?? 0) >= MIN_EPISODE_SECONDS,
  );
  if (candidates.length === 0) {
    log(`No new full-length episodes found for "${special.id}". Nothing to do.`);
    return false;
  }

  const byEpisode = new Map();
  const skipped = [];
  for (const entry of candidates) {
    const match = entry.title.match(/^(\d{1,4})\s*[-–]\s*/);
    if (!match) {
      skipped.push(entry.title);
      continue;
    }
    const ep = match[1];
    if (!byEpisode.has(ep)) byEpisode.set(ep, []);
    byEpisode.get(ep).push(entry);
  }

  if (skipped.length > 0) {
    log(`Skipped ${skipped.length} entr${skipped.length === 1 ? "y" : "ies"} (no episode number in title):`);
    skipped.forEach((title) => log(`  - ${title}`));
  }

  let changed = false;
  for (const [ep, group] of byEpisode) {
    const winner = pickWinner(group);
    if (group.length > 1) {
      log(`Episode ${ep}: ${group.length} candidates, picked "${winner.title}" (${winner.id}).`);
    }

    const full = ytDlpJsonLines(["--dump-json", `https://www.youtube.com/watch?v=${winner.id}`])[0];
    const isoDate = full.upload_date
      ? `${full.upload_date.slice(0, 4)}-${full.upload_date.slice(4, 6)}-${full.upload_date.slice(6, 8)}`
      : new Date().toISOString().slice(0, 10);
    const descriptionLine = (full.description ?? "").split("\n").find((l) => l.trim().length > 0) ?? "";

    const tileId = `${special.id}-podcast-e${ep}`;
    const coverPath = path.join(MEDIA_DIR, `${tileId}.jpg`);
    if (!DRY_RUN) {
      const ok = downloadThumbnail(winner.id, coverPath);
      if (!ok) log(`WARNING: couldn't download a thumbnail for ${winner.id}, leaving cover unset.`);
    }

    const tile = {
      id: tileId,
      type: "podcast",
      date: isoDate,
      featured: false,
      title: {
        es: cleanSpecialTitle(winner.title),
        en: `Bendito Fantasy's World Cup podcast, episode ${ep}.`,
      },
      description: {
        es: descriptionLine.slice(0, 200),
        en: `Bendito Fantasy's World Cup podcast, episode ${ep}.`,
      },
      tag: "podcast",
      cover: `/media/${tileId}.jpg`,
      credit: "Bendito Fantasy",
      payload: {
        youtubeId: winner.id,
        duration: formatDuration(winner.duration),
      },
    };

    changed = upsertSpecialTile(filePath, tile) || changed;
  }

  return changed;
}

function syncGameweeks(playlistUrl) {
  log(`Checking playlist: ${playlistUrl}`);

  const entries = ytDlpJsonLines(["--flat-playlist", "--dump-json", playlistUrl]);

  const synced = existingYoutubeIds();
  const candidates = entries.filter(
    (e) => !synced.has(e.id) && (e.duration ?? 0) >= MIN_EPISODE_SECONDS,
  );

  if (candidates.length === 0) {
    log("No new full-length episodes found. Nothing to do.");
    return false;
  }

  // group new candidates by parsed gameweek number, same duplicate tie-break
  // rule as the historical backfill (see FABLE_YOUTUBE_BRIEF.md)
  const byGw = new Map();
  const skipped = [];
  for (const entry of candidates) {
    const gw = parseGw(entry.title);
    if (gw === null) {
      skipped.push(entry.title);
      continue;
    }
    if (!byGw.has(gw)) byGw.set(gw, []);
    byGw.get(gw).push(entry);
  }

  if (skipped.length > 0) {
    log(`Skipped ${skipped.length} entr${skipped.length === 1 ? "y" : "ies"} (no GW number in title):`);
    skipped.forEach((title) => log(`  - ${title}`));
  }

  let changed = false;
  for (const [gw, group] of byGw) {
    const winner = pickWinner(group);
    if (group.length > 1) {
      log(`GW${gw}: ${group.length} candidates, picked "${winner.title}" (${winner.id}).`);
    }

    const full = ytDlpJsonLines(["--dump-json", `https://www.youtube.com/watch?v=${winner.id}`])[0];
    const title = cleanTitle(winner.title, gw);
    const isoDate = full.upload_date
      ? `${full.upload_date.slice(0, 4)}-${full.upload_date.slice(4, 6)}-${full.upload_date.slice(6, 8)}`
      : new Date().toISOString().slice(0, 10);
    // the podcast description is Spanish-language; a mechanical script has
    // no business inventing an English translation of it (same reasoning as
    // the title above) — es gets the real teaser, en gets an honest plain
    // fallback for a human to improve in the PR before merging.
    const descriptionLine = (full.description ?? "").split("\n").find((l) => l.trim().length > 0) ?? "";

    const tileId = `gw${gw}-podcast`;
    const coverPath = path.join(MEDIA_DIR, `${tileId}.jpg`);
    if (!DRY_RUN) {
      const ok = downloadThumbnail(winner.id, coverPath);
      if (!ok) log(`WARNING: couldn't download a thumbnail for ${winner.id}, leaving cover unset.`);
    }

    const tile = {
      id: tileId,
      type: "podcast",
      featured: true,
      title,
      description: {
        es: descriptionLine.slice(0, 200),
        en: `Bendito Fantasy's Gameweek ${gw} podcast episode.`,
      },
      tag: "podcast",
      cover: `/media/${tileId}.jpg`,
      credit: "Bendito Fantasy",
      date: isoDate,
      payload: {
        youtubeId: winner.id,
        duration: formatDuration(winner.duration),
      },
    };

    changed = upsertPodcastTile(gw, tile, isoDate) || changed;
  }

  return changed;
}

function main() {
  const config = loadConfig();
  let changed = false;

  if (config.currentSeasonPlaylistUrl) {
    changed = syncGameweeks(config.currentSeasonPlaylistUrl) || changed;
  } else {
    log(
      "No currentSeasonPlaylistUrl set in content/youtube-sync-config.json " +
        "(expected once a year, right after a new season's playlist goes up " +
        "on the channel) — nothing to sync there.",
    );
  }

  for (const special of config.specials ?? []) {
    changed = syncSpecial(special) || changed;
  }

  if (!changed) log("Everything found was already synced.");
}

main();
