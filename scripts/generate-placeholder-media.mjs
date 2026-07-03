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
const MEDIA = path.join(ROOT, "public", "media");

const TONES = ["#c8ccd0", "#b9bfc6", "#d3d0cb", "#c2c7c3", "#cdc9d2", "#bfc6cc"];

const TYPE_WORD = {
  podcast: "PODCAST",
  article: "ARTÍCULO",
  data: "DATOS",
  chart: "GRÁFICO",
  video: "VÍDEO",
  tweet: "SOCIAL",
  image: "IMAGEN",
  quote: "CITA",
};

function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function coverSvg(tile, gw, index) {
  const tone = TONES[index % TONES.length];
  const word = TYPE_WORD[tile.type] ?? "MEDIA";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${tone}"/>
      <stop offset="1" stop-color="#8f959b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="470" cy="180" r="220" fill="#ffffff" opacity="0.08"/>
  <circle cx="90" cy="700" r="260" fill="#111111" opacity="0.10"/>
  <text x="300" y="460" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="190" font-weight="900" fill="#ffffff" opacity="0.5">J${gw}</text>
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
console.log(`Wrote ${count} placeholder covers to public/media/`);
