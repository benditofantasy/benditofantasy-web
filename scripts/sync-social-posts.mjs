/**
 * Recurring social -> gameweek sync, same spirit as sync-latest-podcast.mjs:
 * a deterministic, non-AI script a cron workflow runs on a schedule, never
 * guessing at content.
 *
 *   node scripts/sync-social-posts.mjs [--dry-run]
 *
 * Bluesky is the live source and needs no auth at all: its AT Protocol public
 * AppView (public.api.bsky.app) lists a public account's posts from just the
 * handle, like yt-dlp does for YouTube. Set `blueskyHandle` in
 * content/social-sync-config.json and it runs.
 *
 * Threads and Instagram are optional and dormant until configured: unlike
 * Bluesky they require a real access token from a Meta developer app linked to
 * @benditofantasy — there is no open way to list either account's posts. Until
 * THREADS_ACCESS_TOKEN / IG_ACCESS_TOKEN are set (as repo secrets in CI, or
 * local env vars for a manual run) and social-sync-config.json has the matching
 * numeric user id, this script no-ops cleanly for that platform, same as the
 * podcast script does when no playlist is configured.
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
const STATE_PATH = path.join(ROOT, "content", "social-sync-state.json");
const GAMEWEEKS_DIR = path.join(ROOT, "content", "gameweeks");

const DRY_RUN = process.argv.includes("--dry-run");

function log(...args) {
  console.log(...args);
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

/**
 * The watermark: an ISO timestamp; only posts created strictly after it are
 * imported. Seeded once (see scripts note / `lastSyncedAt`) to the newest
 * existing post so history is treated as already-seen, then advanced each run.
 */
function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { lastSyncedAt: "" };
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}

function saveState(state) {
  if (DRY_RUN) return;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
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

async function fetchBlueskyPosts(handle) {
  // AT Protocol's public AppView needs no app, login or token to read a
  // public account's posts — just the handle. `posts_no_replies` keeps the
  // feed to the account's own posts + reposts, not its reply chatter.
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(
    handle,
  )}&limit=15&filter=posts_no_replies`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bluesky API error ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return (body.feed ?? [])
    // Skip reposts of other people's content — we only surface our own posts.
    .filter((item) => !item.reason && item.post?.author?.handle === handle)
    .map(({ post }) => {
      const rkey = post.uri.split("/").pop();
      return {
        platform: "bluesky",
        id: rkey,
        postUrl: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
        atUri: post.uri,
        cid: post.cid,
        text: post.record?.text ?? "",
        timestamp: post.record?.createdAt ?? post.indexedAt,
        // Every outbound link the post carries — the link-card embed, rich-text
        // link facets, and bare URLs in the text — so we can skip posts that
        // just point back to our own site (see linksToSite).
        links: outboundLinks(post),
      };
    });
}

/** All URLs a Bluesky post references: link-card embed + facets + text. */
function outboundLinks(post) {
  const links = [];
  const embed = post.embed;
  if (embed?.external?.uri) links.push(embed.external.uri);
  // recordWithMedia nests the external card one level down.
  if (embed?.media?.external?.uri) links.push(embed.media.external.uri);
  for (const facet of post.record?.facets ?? []) {
    for (const feature of facet.features ?? []) {
      if (feature.uri) links.push(feature.uri);
    }
  }
  for (const match of (post.record?.text ?? "").matchAll(/https?:\/\/[^\s]+/g)) {
    links.push(match[0]);
  }
  return links;
}

/** True if any of the post's links points at one of our own domains. */
function linksToSite(post, siteDomains) {
  if (!siteDomains?.length || !post.links?.length) return false;
  const needles = siteDomains.map((d) => d.replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase());
  return post.links.some((link) => {
    let host;
    try {
      host = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return false;
    }
    return needles.some((n) => host === n || host.endsWith(`.${n}`));
  });
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

const DEFAULT_COVERS = [
  "/media/thumbnails/social-card-1.png",
  "/media/thumbnails/social-card-2.png",
];

/** How many social tiles already live in content — the rotation offset so a
 *  run picks up the cover sequence where the last one left off. */
function existingSocialTileCount() {
  let count = 0;
  if (!fs.existsSync(GAMEWEEKS_DIR)) return count;
  const walk = (tile) => {
    if (tile.type === "social") count += 1;
    (tile.slides ?? []).forEach(walk);
  };
  for (const file of fs.readdirSync(GAMEWEEKS_DIR)) {
    if (!file.endsWith(".json") || file.includes("template")) continue;
    const week = JSON.parse(fs.readFileSync(path.join(GAMEWEEKS_DIR, file), "utf8"));
    week.tiles.forEach(walk);
  }
  return count;
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

async function syncPlatform(platform, config, synced, watermark) {
  let posts;
  if (platform === "bluesky") {
    if (!config.blueskyHandle) {
      log(`bluesky: not configured (missing blueskyHandle) — skipping.`);
      return { changed: false, newest: watermark };
    }
    posts = await fetchBlueskyPosts(config.blueskyHandle);
  } else {
    const userId = platform === "threads" ? config.threadsUserId : config.instagramUserId;
    const accessToken =
      platform === "threads" ? process.env.THREADS_ACCESS_TOKEN : process.env.IG_ACCESS_TOKEN;
    if (!userId || !accessToken) {
      log(`${platform}: not configured (missing user id or access token) — skipping.`);
      return { changed: false, newest: watermark };
    }
    posts =
      platform === "threads"
        ? await fetchThreadsPosts(userId, accessToken)
        : await fetchInstagramPosts(userId, accessToken);
  }
  // The newest timestamp seen advances the watermark even for posts we skip,
  // so "start fresh" stays fresh: everything up to now is considered seen.
  const newest = posts.reduce(
    (max, p) => (p.timestamp && p.timestamp > max ? p.timestamp : max),
    watermark,
  );
  // First ever run (no watermark yet): establish the baseline and import
  // nothing — the account's whole existing history is treated as already-seen
  // (owner decision: start fresh). Every later run then imports only posts
  // made strictly after the watermark, and not already present in content.
  if (!watermark) {
    log(`${platform}: baseline established at ${newest || "(no posts)"} — importing nothing.`);
    return { changed: false, newest };
  }
  const fresh = posts.filter(
    (p) => p.timestamp && p.timestamp > watermark && !synced.has(p.postUrl),
  );
  // Drop our own site-promo posts: whenever we publish, we tend to post the
  // link on social to spread the word — surfacing those here would be a
  // circular, redundant loop (owner rule). A post is a promo if it links back
  // to one of our own domains (config.siteDomains).
  const newPosts = fresh.filter((p) => {
    if (linksToSite(p, config.siteDomains)) {
      log(`${platform}: skipping self-promo post ${p.id} (links to our own site).`);
      return false;
    }
    return true;
  });
  if (newPosts.length === 0) {
    log(`${platform}: nothing new.`);
    return { changed: false, newest };
  }

  // Rotate the branded cover cards so a strip of several posts doesn't look
  // identical (owner decision). card-1 (BF colors) is the preferred/first in
  // the list; the offset continues the sequence across runs. The real post —
  // text and any image — always renders in the lightbox embed regardless.
  const covers = config.socialCardCovers?.length ? config.socialCardCovers : DEFAULT_COVERS;
  let coverIndex = existingSocialTileCount();

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
      cover: covers[coverIndex % covers.length],
      credit: "Bendito Fantasy",
      payload: {
        platform,
        postUrl: post.postUrl,
        handle: "@benditofantasy",
        // Bluesky's embed widget keys off the at:// URI + CID, not the web link.
        ...(post.atUri ? { atUri: post.atUri, cid: post.cid } : {}),
        text: { es: post.text, en: post.text },
      },
    };
    if (upsertSocialTile(tile, isoDate)) {
      changed = true;
      coverIndex += 1; // advance the rotation only when a tile was actually added
    }
  }
  return { changed, newest };
}

async function main() {
  const config = loadConfig();
  const synced = existingPostUrls();
  const state = loadState();
  let watermark = state.lastSyncedAt || "";

  let anyChanged = false;
  for (const platform of ["bluesky", "threads", "instagram"]) {
    const { changed, newest } = await syncPlatform(platform, config, synced, watermark);
    anyChanged = anyChanged || changed;
    if (newest && newest > watermark) watermark = newest;
  }

  saveState({ lastSyncedAt: watermark });

  if (!anyChanged) {
    log("Everything found was already synced.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
