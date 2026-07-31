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
 * Preseason episodes sit on the current-season playlist but have no gameweek to
 * belong to yet, so their titles carry only the episode-number prefix
 * ("329 - ..."). Those file into the row named by "preseason" in the config
 * (content/gameweeks/gw-00.json). Without that fallback they were silently
 * skipped every run, which is how a published episode could never reach the
 * site while the workflow still went green.
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
const SPECIALS_DIR = path.join(ROOT, "content", "specials");
const SEASONS_DIR = path.join(ROOT, "content", "seasons");
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
 * CI runner IPs get YouTube's "Sign in to confirm you're not a bot" wall, so
 * yt-dlp has to be pointed at a player client whose endpoint skips that check.
 * Which clients work is a moving target — `android` alone worked until it
 * started returning the wall for per-video metadata — so this is an ordered
 * list rather than one hardcoded client: each is tried until one returns data.
 * `default` (yt-dlp's own current pick) is last so a fresh yt-dlp release that
 * knows better than this list still gets a turn.
 *
 * Override without a code change via the YT_DLP_PLAYER_CLIENTS env var
 * (comma-separated) — the fastest lever when YouTube shifts again.
 */
const DEFAULT_PLAYER_CLIENTS = ["tv", "android_vr", "web_safari", "ios", "mweb", "default"];

const PLAYER_CLIENTS = (process.env.YT_DLP_PLAYER_CLIENTS ?? "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const YT_DLP_PLAYER_CLIENTS = PLAYER_CLIENTS.length > 0 ? PLAYER_CLIENTS : DEFAULT_PLAYER_CLIENTS;

/**
 * Run yt-dlp, walking the client list until one succeeds. Throws only when
 * every client failed — that's a real outage (or a wall we can't get past),
 * not a "nothing new" run, so it should go red and open the alert issue.
 */
function ytDlpJsonLines(args) {
  const failures = [];
  for (const client of YT_DLP_PLAYER_CLIENTS) {
    const extractorArgs =
      client === "default" ? [] : ["--extractor-args", `youtube:player_client=${client}`];
    try {
      const out = execFileSync("yt-dlp", [...extractorArgs, ...args], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 64,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const lines = out
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      // An exit-0 run with no JSON is the wall in its quiet form — keep going.
      if (lines.length === 0) {
        failures.push(`${client}: exited 0 but returned no JSON`);
        continue;
      }
      if (client !== YT_DLP_PLAYER_CLIENTS[0]) {
        log(`yt-dlp: fell back to player_client=${client} (earlier clients failed).`);
      }
      return lines;
    } catch (err) {
      const stderr = (err.stderr ?? err.message ?? "").toString().trim();
      const lastLine = stderr.split("\n").filter(Boolean).at(-1) ?? "(no stderr)";
      failures.push(`${client}: ${lastLine}`);
    }
  }
  throw new Error(
    `yt-dlp failed for every player client (${YT_DLP_PLAYER_CLIENTS.join(", ")}) on: ${args.join(" ")}\n` +
      failures.map((f) => `  - ${f}`).join("\n") +
      `\n\nIf YouTube has shifted again, try a different client order via the ` +
      `YT_DLP_PLAYER_CLIENTS env var in .github/workflows/sync-youtube-podcast.yml, ` +
      `and check https://github.com/yt-dlp/yt-dlp/wiki/Extractors for which clients currently work.`,
  );
}

function existingYoutubeIds() {
  const ids = new Set();
  const collect = (tile) => {
    if (tile.payload?.youtubeId) ids.add(tile.payload.youtubeId);
    (tile.slides ?? []).forEach(collect);
  };
  // Every place an episode can already live — not just gameweeks. Specials hold
  // the tournament rows and `seasons/` holds the rolled-up past seasons, which
  // together are the large majority of episodes ever published. Scanning only
  // gameweeks made the playlist check below cry wolf over World Cup episodes
  // that were synced long ago, and would let a re-listed old episode sync twice.
  for (const dir of [GAMEWEEKS_DIR, SPECIALS_DIR, SEASONS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json") || file.includes("template")) continue;
      const row = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      (row.tiles ?? []).forEach(collect);
    }
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

/**
 * The episode-number prefix every non-gameweek upload carries ("329 - ..."),
 * used by both the specials rows and the preseason fallback.
 */
function parseEpisodeNumber(title) {
  const match = title.match(/^(\d{1,4})\s*[-–]\s*/);
  return match ? match[1] : null;
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

/**
 * Per-video metadata without the player API.
 *
 * The two yt-dlp calls are not equally exposed: listing a playlist
 * (`--flat-playlist`) reads the playlist page and still works fine from runner
 * IPs, but `--dump-json` on a single video hits YouTube's player API, which now
 * answers "Sign in to confirm you're not a bot" for every player client we can
 * try from CI. That call only ever supplied two things — upload date and the
 * description's first line — and YouTube publishes both in the playlist's Atom
 * feed, which is plain public XML with no auth, no client spoofing, and no wall
 * (the same shape of source as Bluesky's public AppView for the social sync).
 *
 * The feed carries only the ~15 most recent uploads, which is ample for a
 * daily sync but not for a backfill — so yt-dlp stays the fallback for videos
 * the feed doesn't list.
 */
function playlistIdFromUrl(playlistUrl) {
  const match = playlistUrl.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&"); // last, so "&amp;lt;" doesn't become "<"
}

/** Parse an Atom feed's <entry> list into videoId -> { title, isoDate, descriptionLine }. */
function parseFeedEntries(xml) {
  const entries = new Map();
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    if (!id) continue;
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1];
    const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "";
    entries.set(id, {
      title: decodeEntities(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
      isoDate: published ? published.slice(0, 10) : null,
      descriptionLine:
        decodeEntities(description)
          .split("\n")
          .find((l) => l.trim().length > 0) ?? "",
    });
  }
  return entries;
}

/**
 * The playlist feed, as { meta, channelId }: `meta` is videoId -> metadata for
 * everything the playlist lists, `channelId` is the owning channel (the feed
 * declares it, so the blind-spot check below needs no extra config).
 */
async function fetchPlaylistFeed(playlistUrl) {
  const empty = { meta: new Map(), channelId: null };
  const playlistId = playlistIdFromUrl(playlistUrl);
  if (!playlistId) {
    log(`No list= id in ${playlistUrl} — falling back to yt-dlp for per-video metadata.`);
    return empty;
  }
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  let xml;
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (err) {
    // Non-fatal: yt-dlp is still tried per video, and if that is walled too the
    // run fails there with the full client-by-client diagnosis.
    log(`::warning::Couldn't read the playlist feed (${feedUrl}): ${err.message}. Falling back to yt-dlp.`);
    return empty;
  }
  const meta = parseFeedEntries(xml);
  log(`Playlist feed: read metadata for ${meta.size} recent upload(s).`);
  return { meta, channelId: xml.match(/<yt:channelId>(.*?)<\/yt:channelId>/)?.[1] ?? null };
}

/**
 * The one failure mode nothing else catches: an episode uploaded to the channel
 * but never added to the synced playlist. The sync is playlist-scoped, so that
 * episode is invisible and the run goes green with nothing to say — exactly the
 * "looks like a quiet week" shape that let episode 329 sit unnoticed.
 *
 * The channel feed lists recent uploads whether or not they're on a playlist,
 * so anything with an episode-number prefix ("329 - ") that the playlist
 * doesn't have, and that isn't already in content, is worth a shout. The prefix
 * is the filter that keeps shorts and clips out of this: every numbered episode
 * carries it, no short does.
 */
async function warnEpisodesMissingFromPlaylist(feed, syncedIds) {
  if (!feed.channelId) return;
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${feed.channelId}`;
  let xml;
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (err) {
    log(`Couldn't read the channel feed (${feedUrl}): ${err.message} — skipping the playlist check.`);
    return;
  }
  const missing = [];
  for (const [id, entry] of parseFeedEntries(xml)) {
    if (feed.meta.has(id) || syncedIds.has(id)) continue;
    if (!parseEpisodeNumber(entry.title)) continue;
    missing.push(`${entry.title} (https://www.youtube.com/watch?v=${id})`);
  }
  for (const title of missing) {
    log(
      `::warning::Episode on the channel but NOT on the synced playlist, so it will never sync — add it to the playlist: ${title}`,
    );
  }
}

/**
 * Upload date + description for one video: the feed if it lists it, otherwise
 * the (wall-prone) per-video yt-dlp call.
 */
function videoMetadata(videoId, feed) {
  const fromFeed = feed?.meta?.get(videoId);
  if (fromFeed?.isoDate) return fromFeed;
  log(`${videoId}: not in the playlist feed — falling back to yt-dlp for its metadata.`);
  const full = ytDlpJsonLines(["--dump-json", `https://www.youtube.com/watch?v=${videoId}`])[0];
  return {
    isoDate: full.upload_date
      ? `${full.upload_date.slice(0, 4)}-${full.upload_date.slice(4, 6)}-${full.upload_date.slice(6, 8)}`
      : new Date().toISOString().slice(0, 10),
    descriptionLine: (full.description ?? "").split("\n").find((l) => l.trim().length > 0) ?? "",
  };
}

/** Prepend an episode tile to any existing row file (a special, or preseason). */
function upsertRowTile(filePath, tile) {
  const row = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const alreadyThere = row.tiles.some((t) => t.payload?.youtubeId === tile.payload.youtubeId);
  if (alreadyThere) return false;
  row.tiles.unshift(tile);
  if (!DRY_RUN) fs.writeFileSync(filePath, JSON.stringify(row, null, 2) + "\n");
  log(`Updated ${path.basename(filePath)}: prepended podcast tile.`);
  return true;
}

/**
 * The tile for an episode-numbered upload (specials + preseason). Pulls the
 * full metadata, downloads the thumbnail, and — same rule as the gameweek
 * path — leaves `en` an honest plain fallback rather than inventing an English
 * rendering of the Spanish title, for a human to improve in the PR.
 */
function buildEpisodeTile(entry, ep, { idPrefix, labelEn }, feed) {
  const { isoDate, descriptionLine } = videoMetadata(entry.id, feed);

  const tileId = `${idPrefix}-e${ep}`;
  const coverPath = path.join(MEDIA_DIR, `${tileId}.jpg`);
  if (!DRY_RUN) {
    const ok = downloadThumbnail(entry.id, coverPath);
    if (!ok) log(`WARNING: couldn't download a thumbnail for ${entry.id}, leaving cover unset.`);
  }

  const fallbackEn = `${labelEn}, episode ${ep}.`;
  return {
    id: tileId,
    type: "podcast",
    date: isoDate,
    featured: false, // recomputed at read time by orderTilesByRecency (lib/types)
    title: { es: cleanSpecialTitle(entry.title), en: fallbackEn },
    description: { es: descriptionLine.slice(0, 200), en: fallbackEn },
    tag: "podcast",
    cover: `/media/${tileId}.jpg`,
    credit: "Bendito Fantasy",
    payload: { youtubeId: entry.id, duration: formatDuration(entry.duration) },
  };
}

async function syncSpecial(special) {
  const filePath = path.join(ROOT, special.file);
  log(`Checking special "${special.id}" playlist: ${special.playlistUrl}`);

  const entries = ytDlpJsonLines(["--flat-playlist", "--dump-json", special.playlistUrl]);
  const feed = await fetchPlaylistFeed(special.playlistUrl);

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
    const ep = parseEpisodeNumber(entry.title);
    if (!ep) {
      skipped.push(entry.title);
      continue;
    }
    if (!byEpisode.has(ep)) byEpisode.set(ep, []);
    byEpisode.get(ep).push(entry);
  }

  warnUnroutable(skipped, `special "${special.id}"`, "no episode number in title");

  let changed = false;
  for (const [ep, group] of byEpisode) {
    const winner = pickWinner(group);
    if (group.length > 1) {
      log(`Episode ${ep}: ${group.length} candidates, picked "${winner.title}" (${winner.id}).`);
    }
    const tile = buildEpisodeTile(
      winner,
      ep,
      { idPrefix: `${special.id}-podcast`, labelEn: special.labelEn ?? "Bendito Fantasy's podcast" },
      feed,
    );
    changed = upsertRowTile(filePath, tile) || changed;
  }

  return changed;
}

/**
 * Preseason uploads live on the current-season playlist but carry no GW number
 * — only the episode-number prefix. They file into the row configured under
 * "preseason" (content/gameweeks/gw-00.json) instead of being dropped.
 */
function syncPreseason(entries, preseason, feed) {
  const filePath = path.join(ROOT, preseason.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `youtube-sync-config.json routes preseason episodes to ${preseason.file}, but that file doesn't exist — create it or remove the "preseason" block.`,
    );
  }

  const byEpisode = new Map();
  for (const entry of entries) {
    const ep = parseEpisodeNumber(entry.title);
    if (!byEpisode.has(ep)) byEpisode.set(ep, []);
    byEpisode.get(ep).push(entry);
  }

  let changed = false;
  for (const [ep, group] of byEpisode) {
    const winner = pickWinner(group);
    if (group.length > 1) {
      log(`Preseason episode ${ep}: ${group.length} candidates, picked "${winner.title}" (${winner.id}).`);
    }
    const tile = buildEpisodeTile(
      winner,
      ep,
      {
        idPrefix: preseason.idPrefix ?? "gw0-preseason-podcast",
        labelEn: preseason.labelEn ?? "Bendito Fantasy's preseason podcast",
      },
      feed,
    );
    changed = upsertRowTile(filePath, tile) || changed;
  }

  return changed;
}

/**
 * A full-length episode nothing could route is the failure mode that bit us:
 * previously it was a plain log line on an otherwise-green run, indistinguishable
 * from a quiet week. `::warning::` surfaces it as an annotation on the Actions
 * run so a dropped episode is visible without a human reading the raw log.
 */
function warnUnroutable(titles, where, reason) {
  if (titles.length === 0) return;
  log(`Skipped ${titles.length} entr${titles.length === 1 ? "y" : "ies"} for ${where} (${reason}):`);
  for (const title of titles) {
    log(`::warning::Podcast sync skipped a full-length episode (${reason}) for ${where}: ${title}`);
  }
}

async function syncGameweeks(playlistUrl, preseason) {
  log(`Checking playlist: ${playlistUrl}`);

  const entries = ytDlpJsonLines(["--flat-playlist", "--dump-json", playlistUrl]);
  const feed = await fetchPlaylistFeed(playlistUrl);

  const synced = existingYoutubeIds();

  // Before the "nothing new" early return — an episode missing from the
  // playlist is precisely the case where there is nothing new to find.
  await warnEpisodesMissingFromPlaylist(feed, synced);

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
  const preseasonEntries = [];
  const skipped = [];
  for (const entry of candidates) {
    const gw = parseGw(entry.title);
    if (gw !== null) {
      if (!byGw.has(gw)) byGw.set(gw, []);
      byGw.get(gw).push(entry);
      continue;
    }
    // No gameweek in the title: preseason, if it at least carries an episode
    // number and a preseason row is configured. Otherwise genuinely unroutable.
    if (preseason?.file && parseEpisodeNumber(entry.title)) {
      preseasonEntries.push(entry);
      continue;
    }
    skipped.push(entry.title);
  }

  warnUnroutable(
    skipped,
    "the gameweek playlist",
    preseason?.file ? "no GW number and no episode number in title" : "no GW number in title",
  );

  let changed =
    preseasonEntries.length > 0 ? syncPreseason(preseasonEntries, preseason, feed) : false;
  for (const [gw, group] of byGw) {
    const winner = pickWinner(group);
    if (group.length > 1) {
      log(`GW${gw}: ${group.length} candidates, picked "${winner.title}" (${winner.id}).`);
    }

    const title = cleanTitle(winner.title, gw);
    // the podcast description is Spanish-language; a mechanical script has
    // no business inventing an English translation of it (same reasoning as
    // the title above) — es gets the real teaser, en gets an honest plain
    // fallback for a human to improve in the PR before merging.
    const { isoDate, descriptionLine } = videoMetadata(winner.id, feed);

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

async function main() {
  const config = loadConfig();
  let changed = false;

  if (config.currentSeasonPlaylistUrl) {
    changed = (await syncGameweeks(config.currentSeasonPlaylistUrl, config.preseason)) || changed;
  } else {
    log(
      "No currentSeasonPlaylistUrl set in content/youtube-sync-config.json " +
        "(expected once a year, right after a new season's playlist goes up " +
        "on the channel) — nothing to sync there.",
    );
  }

  for (const special of config.specials ?? []) {
    changed = (await syncSpecial(special)) || changed;
  }

  if (!changed) log("Everything found was already synced.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
