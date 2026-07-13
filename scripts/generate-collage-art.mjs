/**
 * Collage-cover generator (Roadmap Phase 3, #1) — fills the BF-UCSG collage
 * template (art-direction/collage-card-prompt.md) per tile and calls OpenAI's
 * image API, replacing the placeholder SVG a tile is born with.
 *
 *   node scripts/generate-collage-art.mjs [--dry-run] [--limit N] [--tile <id>]
 *
 * A tile that hasn't gotten real art yet points its `cover` at the placeholder
 * `/media/{tile.id}.svg` that scripts/generate-placeholder-media.mjs writes at
 * build time (see content/gameweeks/gw-00.json's gw1-pretemporada tile for the
 * convention). This script finds every tile still on that placeholder, fills
 * the collage template's slots deterministically (no semantic extraction yet —
 * hero object/palette come from the content-type tables in the prompt doc, not
 * from reading the article), generates the image, center-crops it to the
 * site's real 3:4 frame, drops it in public/media/thumbnails/, and rewrites the
 * tile's `cover` field to point at it.
 *
 * Requires OPENAI_API_KEY (repo secret in CI, local env var for manual runs).
 * Does NOT touch git — that's the CI workflow's job
 * (.github/workflows/generate-collage-art.yml), which opens a PR (not a direct
 * push) so a human reviews the art against art-direction/qa-checklist.md
 * before it goes live.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CONTENT_DIRS = ["gameweeks", "specials", "seasons"].map((d) =>
  path.join(ROOT, "content", d),
);
const THUMBNAILS_DIR = path.join(ROOT, "public", "media", "thumbnails");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i !== -1 ? Number(process.argv[i + 1]) : Infinity;
})();
const TILE_ARG = (() => {
  const i = process.argv.indexOf("--tile");
  return i !== -1 ? process.argv[i + 1] : null;
})();

function log(...args) {
  console.log(...args);
}

// content_type table (art-direction/collage-card-prompt.md §6) — source of
// truth for the emblem fallback (Edge Case E1) and the accent/support colors
// (Palette Rule §3). Keep in sync with that doc if the mapping ever changes.
const CONTENT_TYPE_TABLE = {
  article: { accent: "#025E73", support: "#F2C572", emblem: "un símbolo editorial recortado" },
  social: { accent: "#02EBAE", support: "#204F59", emblem: "burbujas de conversación recortadas" },
  poll: { accent: "#F2594B", support: "#04C4D9", emblem: "una papeleta con checkmarks" },
  podcast: { accent: "#F2594B", support: "#F2C572", emblem: "un micrófono de estudio recortado" },
  data: { accent: "#04C4D9", support: "#012340", emblem: "un gráfico de barras abstracto" },
  chart: { accent: "#04C4D9", support: "#012340", emblem: "un gráfico de barras abstracto" },
  video: { accent: "#F27A5E", support: "#204F59", emblem: "una claqueta de video recortada" },
  quote: { accent: "#8C5E26", support: "#F2C572", emblem: "unas comillas grandes recortadas" },
  mvp: { accent: "#F2594B", support: "#02EBAE", emblem: "una carta de fantasy football" },
};

// Edge Case E4 — map a TileType with no direct §6 row to its nearest relative.
const TYPE_FALLBACK = { tweet: "social", image: "article" };

const BASE_NAVY = "#204F59";

function resolveContentType(tile) {
  const key = tile.tag ?? tile.type;
  if (CONTENT_TYPE_TABLE[key]) return key;
  const fallback = TYPE_FALLBACK[key];
  if (fallback && CONTENT_TYPE_TABLE[fallback]) return fallback;
  return "article";
}

/** Title/description truncation per Edge Case E2 — title stays 1-4 words. */
function truncateWords(text, maxWords) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function truncateSentence(text) {
  const match = (text ?? "").match(/^[^.!?]*/);
  return (match ? match[0] : text ?? "").trim();
}

/** ASCII-fold + kebab-case, for the output filename (integration-notes.md). */
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPrompt(tile) {
  const contentType = resolveContentType(tile);
  const { accent, support, emblem } = CONTENT_TYPE_TABLE[contentType];
  const title = truncateWords(tile.title?.es, 4);
  const coreConcept = truncateSentence(tile.description?.es);
  const palette = [accent, support, BASE_NAVY];

  const prompt =
    `Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards. ` +
    `Format: 3:4 vertical editorial card; keep the focal point inside a centered ~85% safe ` +
    `area and all important elements away from the edges. Content type: ${contentType}. ` +
    `Core concept: ${coreConcept}. Hero object: ${emblem}. Secondary cutouts: two supporting ` +
    `editorial cutouts related to the concept. Digital overlay: one subtle theme-related layer. ` +
    `Tactile sports objects: one or two. Main title: "${title}". Supporting text: none. ` +
    `Visual tone: editorial, premium, energetic. Use the official Bendito Fantasy palette, ` +
    `prioritizing ${palette.join(", ")} over a base of paper neutrals, off-white, editorial ` +
    `black, and textured grays. Mixed-media editorial collage with cut-out objects, torn-paper ` +
    `textures, matte grain, soft shadows, tactile depth, negative space, and asymmetrical ` +
    `balance. Include up to three subtle hand-drawn arrows, circles, underlines, or annotations ` +
    `to guide attention. One dominant focal point, clear hierarchy, text minimal and legible at ` +
    `thumbnail size. Do not use real-time data, excessive text, platform logos, team logos or ` +
    `shields, league logos, sponsor marks, watermarks, or unrelated decorative elements — zero ` +
    `branding at all times. The result must feel like a polished Bendito Fantasy website card, ` +
    `not a poster, webpage mockup, generic social template, or full interface screenshot.`;

  return { prompt, contentType, title };
}

/** Walk every content file (incl. nested mvp slides) and yield {filePath, week, tile, tilePath}. */
function* walkTiles() {
  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json") || file.includes("template")) continue;
      const filePath = path.join(dir, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      for (const tile of doc.tiles ?? []) {
        yield { filePath, doc, tile };
        for (const slide of tile.slides ?? []) {
          yield { filePath, doc, tile: slide };
        }
      }
    }
  }
}

function isPlaceholderCover(tile) {
  return tile.cover === `/media/${tile.id}.svg`;
}

async function generateImage(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set — cannot call the image API.");
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      n: 1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI image API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image API returned no image data.");
  }
  return Buffer.from(b64, "base64");
}

/** Center-crop to the site's real 3:4 frame — same math as TileCard's object-cover. */
async function cropToTileFrame(buffer) {
  return sharp(buffer).resize({ width: 1024, height: 1365, fit: "cover" }).png().toBuffer();
}

function writeCover(filePath, doc, tile, cover) {
  const parent = (doc.tiles ?? []).flatMap((t) => [t, ...(t.slides ?? [])]);
  const target = parent.find((t) => t.id === tile.id);
  target.cover = cover;
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  }
}

async function main() {
  const candidates = [...walkTiles()].filter(
    ({ tile }) => isPlaceholderCover(tile) && (!TILE_ARG || tile.id === TILE_ARG),
  );

  if (TILE_ARG && candidates.length === 0) {
    throw new Error(`Tile "${TILE_ARG}" not found, or not on a placeholder cover.`);
  }

  log(`Found ${candidates.length} tile(s) still on a placeholder cover.`);
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

  let done = 0;
  for (const { filePath, doc, tile } of candidates) {
    if (done >= LIMIT) {
      log(`Reached --limit ${LIMIT}, stopping.`);
      break;
    }

    const { prompt, contentType, title } = buildPrompt(tile);
    const filename = `${slugify(tile.id)}-card.png`;
    const cover = `/media/thumbnails/${filename}`;

    if (DRY_RUN) {
      log(`\n[dry-run] ${tile.id} (${contentType}) -> ${cover}`);
      log(prompt);
      done += 1;
      continue;
    }

    log(`Generating ${tile.id} (${contentType}, "${title}")...`);
    const raw = await generateImage(prompt);
    const cropped = await cropToTileFrame(raw);
    fs.writeFileSync(path.join(THUMBNAILS_DIR, filename), cropped);
    writeCover(filePath, doc, tile, cover);
    log(`  wrote public/media/thumbnails/${filename}, updated ${path.basename(filePath)}`);
    done += 1;
  }

  log(`\nDone: ${done} tile(s) processed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
