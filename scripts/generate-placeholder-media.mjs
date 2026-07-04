/**
 * Generates placeholder cover images (SVG, 3:4) for every tile in
 * /content/gameweeks/*.json into /public/media/. These stand in for real
 * photography — replace with .jpg/.png files of the same basename and update
 * the tile's "cover" path.
 *
 *   node scripts/generate-placeholder-media.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GAMEWEEKS = path.join(ROOT, "content", "gameweeks");
const SEASONS = path.join(ROOT, "content", "seasons");
const SPECIALS = path.join(ROOT, "content", "specials");
const MEDIA = path.join(ROOT, "public", "media");

// Brand palette (source: styles/tokens.css) — one color per category tag, the
// same mapping CategoryTag.tsx uses for the pill, so a placeholder cover
// already reads as "podcast" / "article" / etc. by color before any text loads.
const TAG_HEX = {
  podcast: "#f2594b", // --bf-coral
  article: "#025e73", // --bf-teal
  data: "#04c4d9", // --bf-cyan
  chart: "#204f59", // --bf-navy
  video: "#f27a5e", // --bf-salmon
  social: "#02ebae", // --bf-turquoise
  quote: "#8c5e26", // --bf-brown
  mvp: "#f2c572", // --bf-gold
};

const TYPE_WORD = {
  podcast: "PODCAST",
  article: "ARTÍCULO",
  data: "DATOS",
  chart: "GRÁFICO",
  video: "VÍDEO",
  tweet: "SOCIAL",
  image: "IMAGEN",
  quote: "CITA",
  mvp: "MVP",
};

function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mix(hex, target, amount) {
  const c = parseInt(hex.slice(1), 16);
  const t = parseInt(target.slice(1), 16);
  const channel = (shift) => {
    const a = (c >> shift) & 0xff;
    const b = (t >> shift) & 0xff;
    return Math.round(a + (b - a) * amount);
  };
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

function coverSvg(tile, gw, index) {
  const base = TAG_HEX[tile.tag] ?? TAG_HEX[tile.type] ?? "#025e73";
  // subtle per-index jitter so a row of same-tag tiles isn't perfectly flat
  const jitter = 0.08 * (index % 3);
  const light = mix(base, "#ffffff", 0.32 + jitter);
  const dark = mix(base, "#012340", 0.4);
  const word = TYPE_WORD[tile.type] ?? "MEDIA";
  const bigLabel = gw === null ? "" : `J${gw}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="470" cy="180" r="220" fill="#ffffff" opacity="0.08"/>
  <circle cx="90" cy="700" r="260" fill="#111111" opacity="0.10"/>
  <text x="300" y="460" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="190" font-weight="900" fill="#ffffff" opacity="0.5">${bigLabel}</text>
  <text x="52" y="770" transform="rotate(-90 52 770)" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" opacity="0.85" letter-spacing="3">${esc(word)}</text>
  <text x="300" y="766" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" opacity="0.6">placeholder</text>
</svg>
`;
}

fs.mkdirSync(MEDIA, { recursive: true });
let count = 0;
for (const file of fs.readdirSync(GAMEWEEKS)) {
  if (!file.endsWith(".json") || file.includes("template")) continue;
  const week = JSON.parse(fs.readFileSync(path.join(GAMEWEEKS, file), "utf8"));
  week.tiles.forEach((tile, index) => {
    const target = path.join(MEDIA, `${tile.id}.svg`);
    fs.writeFileSync(target, coverSvg(tile, week.gw, index));
    count += 1;
  });
}
if (fs.existsSync(SPECIALS)) {
  for (const file of fs.readdirSync(SPECIALS)) {
    if (!file.endsWith(".json") || file.includes("template")) continue;
    const special = JSON.parse(fs.readFileSync(path.join(SPECIALS, file), "utf8"));
    special.tiles.forEach((tile, index) => {
      fs.writeFileSync(path.join(MEDIA, `${tile.id}.svg`), coverSvg(tile, null, index));
      count += 1;
    });
  }
}
if (fs.existsSync(SEASONS)) {
  for (const file of fs.readdirSync(SEASONS)) {
    if (!file.endsWith(".json") || file.includes("template")) continue;
    const season = JSON.parse(fs.readFileSync(path.join(SEASONS, file), "utf8"));
    season.tiles.forEach((mvpTile, index) => {
      const gw = mvpTile.payload.gw;
      fs.writeFileSync(path.join(MEDIA, `${mvpTile.id}.svg`), coverSvg(mvpTile, gw, index));
      count += 1;
      (mvpTile.slides ?? []).forEach((tile, slideIndex) => {
        fs.writeFileSync(path.join(MEDIA, `${tile.id}.svg`), coverSvg(tile, gw, slideIndex));
        count += 1;
      });
    });
  }
}

console.log(`Wrote ${count} placeholder covers to public/media/`);
