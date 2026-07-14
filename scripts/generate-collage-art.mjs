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
// truth for the emblem fallback (Edge Case E1), the accent/support colors
// (Palette Rule §3), and the per-type secondary elements. Emblems are
// photographic-cutout descriptions (not clip-art symbols): the reference-grade
// ChatGPT outputs the owner compared against all lead with a real photo cutout.
// Keep in sync with that doc if the mapping ever changes.
const CONTENT_TYPE_TABLE = {
  article: {
    base: "light",
    chips: ["ANÁLISIS","CLAVES"],
    accent: "#025E73",
    support: "#F2C572",
    emblem: "a torn-edge photographic cutout of an anonymous footballer in an unbranded kit, mid-action",
    secondary: "a taped paper scrap with a tactical sketch, and a folded newspaper fragment",
  },
  social: {
    base: "dark",
    chips: ["SOCIAL","TRENDING"],
    accent: "#02EBAE",
    support: "#204F59",
    emblem: "a torn-edge photographic cutout of a fan or player celebrating",
    secondary: "paper speech bubbles taped at angles, and a small stack of conversation cards",
  },
  poll: {
    base: "dark",
    chips: ["ENCUESTA","VOTA"],
    accent: "#F2594B",
    support: "#04C4D9",
    emblem: "a photographic cutout of a hand dropping a paper ballot",
    secondary: "torn paper strips with hand-drawn checkboxes, and a bold question mark cut from colored paper",
  },
  podcast: {
    base: "dark",
    chips: ["PODCAST","AUDIO"],
    accent: "#F2594B",
    support: "#F2C572",
    emblem: "a torn-edge photographic cutout of a vintage studio microphone",
    secondary: "headphones resting on a taped paper scrap, and a strip of hand-drawn audio waveform",
  },
  data: {
    base: "dark",
    chips: ["DATA","TREND","XG"],
    accent: "#04C4D9",
    support: "#012340",
    emblem: "a torn-edge photographic cutout of an anonymous footballer in an unbranded white kit, mid-stride",
    secondary: "taped paper scraps carrying a pitch heatmap, a plotted line chart, and a small radar chart",
  },
  chart: {
    base: "dark",
    chips: ["DATA","TREND","XG"],
    accent: "#04C4D9",
    support: "#012340",
    emblem: "a torn-edge photographic cutout of an anonymous footballer in an unbranded white kit, mid-stride",
    secondary: "taped paper scraps carrying a pitch heatmap, a plotted line chart, and a small radar chart",
  },
  video: {
    base: "dark",
    chips: ["VIDEO","REPLAY"],
    accent: "#F27A5E",
    support: "#204F59",
    emblem: "a torn-edge photographic film-still cutout of a match moment",
    secondary: "a strip of film frames taped diagonally, and a paper play-button cutout",
  },
  quote: {
    base: "light",
    chips: ["CITA"],
    accent: "#8C5E26",
    support: "#F2C572",
    emblem: "oversized quotation marks cut from textured colored paper",
    secondary: "a torn-edge photographic cutout of a coach or player gesturing, and a taped notebook scrap",
  },
  mvp: {
    base: "dark",
    chips: ["FANTASY","CAPITÁN"],
    accent: "#F2594B",
    support: "#02EBAE",
    emblem: "a torn-edge photographic cutout of an anonymous footballer in an unbranded kit, arms raised",
    secondary: "a fantasy-football card mockup with no logos, and paper transfer arrows",
  },
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

// Connector words that read as amputated when a truncation ends on them
// ("5 consejos para tu…") — trimmed off the tail so the rendered title ends
// on a content word. ES + EN since tiles are bilingual.
const DANGLING_WORDS = new Set([
  "de", "del", "para", "por", "con", "sin", "tu", "su", "mi", "el", "la",
  "los", "las", "un", "una", "y", "o", "en", "a", "al", "que",
  "the", "a", "an", "of", "for", "your", "my", "and", "or", "in", "to", "on",
]);

/** Title truncation per Edge Case E2 — 1-4 words, never ending on a connector. */
function truncateWords(text, maxWords) {
  // Some source titles carry their own decorative quotes ("Invierno caliente")
  // which nest badly inside the prompt's quoted title — strip them.
  text = (text ?? "").trim().replace(/^["'«]+|["'»]+$/g, "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    // A complete opening question ("¿Darwin o Solanke?") is a natural short
    // title; cutting mid-question ("¿Quiénes son los jugadores") is not.
    const question = text.match(/^¿[^?]+\?/);
    if (question) {
      const qWords = question[0].split(/\s+/).filter(Boolean);
      if (qWords.length <= maxWords) return question[0];
    }
    // Likewise a "Label: subject" title cut mid-subject reads amputated; if
    // the pre-colon label fits on its own, it IS the natural short title.
    const preColon = text.split(":")[0].trim();
    const preWords = preColon.split(/\s+/).filter(Boolean);
    if (preColon.length > 0 && preColon !== text && preWords.length <= maxWords) {
      return preWords.join(" ");
    }
  }
  const cut = words.slice(0, maxWords);
  while (
    cut.length > 1 &&
    DANGLING_WORDS.has(cut[cut.length - 1].toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))
  ) {
    cut.pop();
  }
  let result = cut.join(" ");
  // A truncated question keeps its opening ¿ — close it so the title reads
  // as a complete question rather than an amputated one.
  if (result.startsWith("¿") && !result.includes("?")) result += "?";
  return result;
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
  const { accent, support, emblem, secondary, base, chips } = CONTENT_TYPE_TABLE[contentType];
  const title = truncateWords(tile.title?.es, 4);
  const coreConcept = truncateSentence(tile.description?.es);
  const chipList = chips.map((c) => `"${c}"`).join(", ");

  // Base tone per content type: dark editorial board for the energetic/techy
  // types (matches the owner's ChatGPT reference cards), warm light paper for
  // the newspaper-flavored ones.
  const backgroundSpec =
    base === "dark"
      ? `Background: a near-black / deep-navy (${BASE_NAVY} to #012340) editorial board built ` +
        `from layered torn dark paper, with a subtle technical texture — clusters of halftone ` +
        `dots, thin plotted grid or contour lines, small hand-drawn crosses and marker strokes ` +
        `in the accent colors — so it feels like a designer's working board at night, never a ` +
        `flat empty field.`
      : `Background: warm off-white paper with a subtle technical texture — faint halftone ` +
        `dots, thin plotted grid or contour lines, loose pencil scribbles and small hand-drawn ` +
        `crosses — so it feels like a designer's working board, never a flat empty field.`;

  const colorSpec =
    base === "dark"
      ? `Color discipline: the dark board and paper neutrals (cream scraps, warm gray, ` +
        `off-white) dominate the surface area; use the accent ${accent} in bold deliberate ` +
        `pops — one title word, the tag chips, one or two marker strokes — with ${support} as ` +
        `a quiet supporting tone. Saturated color stays in the details, never flooding the frame.`
      : `Color discipline: the paper neutrals (off-white, cream, warm gray, editorial black ` +
        `ink) dominate the surface area; use the accent ${accent} deliberately and sparingly — ` +
        `in the title, the tag chips, one hand-drawn mark, and details inside the paper ` +
        `scraps — with ${support} and ${BASE_NAVY} as quiet supporting tones. Never flood the ` +
        `background with saturated color.`;

  const prompt =
    `Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards. ` +
    `Format: 3:4 vertical editorial card; keep the focal point inside a centered ~85% safe ` +
    `area and all important elements away from the edges. Content type: ${contentType}. ` +
    `Core concept (context only — NEVER render this sentence as text in the image): ` +
    `${coreConcept}.\n\n` +
    `Hero object: ${emblem}. The hero is LARGE — it fills roughly half the frame and may ` +
    `bleed off one edge, with its key detail (face, mic capsule, chart) kept inside the safe ` +
    `area. Secondary cutouts: ${secondary}.\n\n` +
    `TEXT RULE: the main title is "${title}", typeset in an ultra-bold condensed sans-serif ` +
    `display face, stacked in two or three short lines, with one word or line in the accent ` +
    `color ${accent} and the rest in ${base === "dark" ? "crisp off-white" : "deep editorial ink"}; ` +
    `give it a single hand-drawn underline or circled emphasis in marker. Besides the title, ` +
    `the only other text allowed is two or three tiny single-word tag chips — small torn tape ` +
    `strips or label chips in the accent colors carrying generic words like ${chipList} in ` +
    `small clean capitals. No other words, sentences, captions, numbers, or labels anywhere; ` +
    `all chart and interface elements stay abstract and unlabeled.\n\n` +
    `Build the collage in physical layers: every cutout has torn or scissor-cut paper edges, ` +
    `a visible soft drop shadow lifting it off the layer beneath, and here and there a piece ` +
    `of washi tape, a paperclip, or a binder clip holding it down. ${backgroundSpec}\n\n` +
    `${colorSpec}\n\n` +
    `Mixed-media editorial collage with matte grain, tactile depth, negative space, and ` +
    `asymmetrical balance. One dominant focal point and clear hierarchy, legible at thumbnail ` +
    `size. Visual tone: editorial, premium, energetic. Do not use real-time data, platform ` +
    `logos, team logos or shields, league logos, sponsor marks, kit branding, watermarks, or ` +
    `unrelated decorative elements — zero branding at all times; any clothing or gear shown ` +
    `must be plain and unbranded. The result must feel like a polished Bendito Fantasy ` +
    `website card, not a poster, webpage mockup, generic social template, or full interface ` +
    `screenshot.`;

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
      quality: "high",
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

/**
 * Center-crop to the site's real 3:4 frame — same math as TileCard's
 * object-cover — then re-encode as JPEG. The raw gpt-image-1 PNG output runs
 * ~3MB per card; mozjpeg at q82 gets collage-style photographic art down to a
 * few hundred KB with no visible loss at thumbnail size, matching the other
 * hand-authored thumbnails already in public/media/thumbnails/ (poll-card.jpg).
 */
async function cropToTileFrame(buffer) {
  return sharp(buffer)
    .resize({ width: 1024, height: 1365, fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
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
    const filename = `${slugify(tile.id)}-card.jpg`;
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
