/**
 * Recurring Threads/Instagram -> gameweek sync, same spirit as
 * sync-latest-podcast.mjs: a deterministic, non-AI script a cron workflow
 * runs on a schedule, never guessing at content.
 *
 *   node scripts/sync-social-posts.mjs [--dry-run]
 *
 * Unlike YouTube (yt-dlp needs no auth), Threads and Instagram require a
 * real access token from a Meta developer app linked to @benditofantasy —
 * there is no open/anonymous way to list either account's posts. Until
 * THREADS_ACCESS_TOKEN / IG_ACCESS_TOKEN are set (as repo secrets in CI, or
 * local env vars for a manual run) and content/social-sync-config.json has
 * the matching numeric user id, this script no-ops cleanly for that
 * platform, same as the podcast script does when no playlist is configured.
 *
 * A social post has no gameweek number to parse out of it the way a podcast
 * title does, so new posts are always attached to the current (most recent)
 * gameweek file as a fresh `social` tile — `orderTilesByRecency` (lib/types)
 * then puts it wherever its real timestamp puts it once the site reads it.
 *
 * Does NOT touch git — that's the CI workflow's job
 * (.github/workflows/sync-social-posts.yml).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "content", "social-sync-config.json");
const GAMEWEEKS_DIR = path.join(ROOT, "content", "gameweeks");

const DRY_RUN = process.argv.includes("--dry-run");

function log(...args) {
  console.log(...args);
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function existingPostUrls() {
  const urls = new Set();
  if (!fs.existsSync(GAMEWEEKS_DIR)) return urls;
  const collect = (tile) => {
    if (tile.payload?.postUrl) urls.add(tile.payload.postUrl);
    (tile.slides ?? []).forEach(collect);
  };
  for (const file of fs.readdirSync(GAMEWEEKS_DIR)) {
    if (!file.endsWith(".json") || file.includes("template")) continue;
    const week = JSON.parse(fs.readFileSync(path.join(GAMEWEEKS_DIR, file), "utf8"));
    week.tiles.forEach(collect);
  }
  return urls;
}

function latestGameweekFile() {
  const files = fs
    .readdirSync(GAMEWEEKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("template"));
  if (files.length === 0) return null;
  return files.sort().at(-1);
}

async function fetchThreadsPosts(userId, accessToken) {
  const fields = "id,permalink,text,timestamp";
  const url = `https://graph.threads.net/v1.0/${userId}/threads?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Threads API error ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return (body.data ?? []).map((post) => ({
    platform: "threads",
    id: post.id,
    postUrl: post.permalink,
    text: post.text ?? "",
    timestamp: post.timestamp,
  }));
}

async function fetchInstagramPosts(userId, accessToken) {
  const fields = "id,permalink,caption,timestamp";
  const url = `https://graph.facebook.com/v19.0/${userId}/media?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Instagram API error ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return (body.data ?? []).map((post) => ({
    platform: "instagram",
    id: post.id,
    postUrl: post.permalink,
    text: post.caption ?? "",
    timestamp: post.timestamp,
  }));
}

function upsertSocialTile(tile, isoDate) {
  const fileName = latestGameweekFile();
  if (!fileName) {
    log("No gameweek file exists to attach a social tile to — skipping.");
    return false;
  }
  const filePath = path.join(GAMEWEEKS_DIR, fileName);
  const week = JSON.parse(fs.readFileSync(filePath, "utf8"));
  week.tiles.push({ ...tile, date: isoDate });
  if (!DRY_RUN) fs.writeFileSync(filePath, JSON.stringify(week, null, 2) + "\n");
  log(`Updated ${fileName}: added ${tile.payload.platform} post ${tile.id}.`);
  return true;
}

async function syncPlatform(platform, userId, accessToken, synced) {
  if (!userId || !accessToken) {
    log(`${platform}: not configured (missing user id or access token) — skipping.`);
    return false;
  }
  const posts =
    platform === "threads"
      ? await fetchThreadsPosts(userId, accessToken)
      : await fetchInstagramPosts(userId, accessToken);
  const newPosts = posts.filter((p) => !synced.has(p.postUrl));
  if (newPosts.length === 0) {
    log(`${platform}: nothing new.`);
    return false;
  }

  let changed = false;
  for (const post of newPosts) {
    const isoDate = post.timestamp ? post.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const tileId = `${platform}-${post.id}`;
    const tile = {
      id: tileId,
      type: "social",
      title: { es: "Nueva publicación", en: "New post" },
      description: { es: post.text.slice(0, 200), en: post.text.slice(0, 200) },
      tag: "social",
      cover: `/media/${tileId}.jpg`,
      credit: "Bendito Fantasy",
      payload: {
        platform,
        postUrl: post.postUrl,
        handle: "@benditofantasy",
        text: { es: post.text, en: post.text },
      },
    };
    // No open thumbnail endpoint for Threads/Instagram posts (unlike YouTube's
    // i.ytimg.com) — the cover path above is left for a human to fill in via
    // the PR this opens; the lightbox itself renders the real embed widget
    // regardless, so a missing tile-grid cover doesn't block the post reading fine.
    changed = upsertSocialTile(tile, isoDate) || changed;
  }
  return changed;
}

async function main() {
  const config = loadConfig();
  const synced = existingPostUrls();

  const threadsChanged = await syncPlatform(
    "threads",
    config.threadsUserId,
    process.env.THREADS_ACCESS_TOKEN,
    synced,
  );
  const instagramChanged = await syncPlatform(
    "instagram",
    config.instagramUserId,
    process.env.IG_ACCESS_TOKEN,
    synced,
  );

  if (!threadsChanged && !instagramChanged) log("Everything found was already synced.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
