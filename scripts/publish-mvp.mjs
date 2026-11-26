/**
 * Publishes the "King of the Gameweek" MVP tile once its portrait is available.
 *
 * For every gameweek that FPL has finished AND data-checked, and that has no
 * `mvp` tile yet, it takes the official top scorer, looks for a portrait with a
 * matching file name (first in media-inbox/players/, then in
 * public/media/players/), and writes the tile into content/gameweeks/gw-NN.json.
 * Inbox images are resized to JPEG under the 1 MB build limit on the way into
 * public/. No image yet and an empty inbox = nothing to do. Safe to re-run.
 *
 * Run by .github/workflows/publish-mvp.yml.
 *
 *   node scripts/publish-mvp.mjs
 *   node scripts/publish-mvp.mjs --preview 10   # print GW10's tile, write nothing
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INBOX = path.join(ROOT, "media-inbox", "players");
const PLAYERS = path.join(ROOT, "public", "media", "players");
const GAMEWEEKS = path.join(ROOT, "content", "gameweeks");
const API = "https://fantasy.premierleague.com/api";
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const MAX_BYTES = 1024 * 1024;

// FPL's short club names that read badly in a sentence.
const CLUB_NAMES = {
  "Coventry City": "Coventry",
  "Ipswich Town": "Ipswich",
  "Man City": "Manchester City",
  "Man Utd": "Manchester United",
  "Nott'm Forest": "Nottingham Forest",
  Spurs: "Tottenham",
};

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const tokens = (text) => slug(text).split("-").filter(Boolean);

/**
 * A file matches when every word in its name belongs to the player AND it
 * carries either the full FPL display name or the player's last surname. So
 * "thierno-barry" and "barry" match Barry; "thierno" alone does not.
 */
function matches(file, player) {
  const fileTokens = tokens(path.parse(file).name);
  if (fileTokens.length === 0) return false;
  const known = new Set(
    tokens(`${player.first_name} ${player.second_name} ${player.web_name}`),
  );
  if (!fileTokens.every((t) => known.has(t))) return false;
  const hasDisplayName = tokens(player.web_name).every((t) => fileTokens.includes(t));
  const hasSurname = fileTokens.includes(tokens(player.second_name).at(-1));
  return hasDisplayName || hasSurname;
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => !f.startsWith(".") && f !== "README.md");
}

function findImage(dir, player) {
  const found = listImages(dir).filter((f) => IMAGE_RE.test(f) && matches(f, player));
  if (found.length > 1) {
    throw new Error(
      `More than one image matches ${player.web_name}: ${found.join(", ")}. Keep only one.`,
    );
  }
  return found[0] ?? null;
}

/** "B.Fernandes" -> "Bruno Fernandes"; other display names are kept as-is. */
const displayName = (player) =>
  player.web_name.includes(".")
    ? `${player.first_name.split(" ")[0]} ${player.web_name.split(".").at(-1)}`
    : player.web_name;

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const joinList = (items, and) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;

async function buildTile(gw, bootstrap, player, cover) {
  const { history } = await getJson(`${API}/element-summary/${player.id}/`);
  const rows = history.filter((r) => r.round === gw);
  if (rows.length === 0) throw new Error(`No GW${gw} history for ${player.web_name}.`);
  const sum = (key) => rows.reduce((total, r) => total + r[key], 0);

  const goals = sum("goals_scored");
  const assists = sum("assists");
  const saves = sum("saves");
  const penalties = sum("penalties_saved");
  const bonus = sum("bonus");
  // element_type 4 = forward, who scores nothing for a clean sheet.
  const cleanSheets = player.element_type === 4 ? 0 : sum("clean_sheets");
  const points = bootstrap.events.find((e) => e.id === gw).top_element_info.points;

  const team = (id) => bootstrap.teams.find((t) => t.id === id);
  // The player's club is read off the fixture, not the player record, so a
  // later transfer can't rewrite an old result.
  const fixtures = await Promise.all(
    rows.map(async (r) => {
      const all = await getJson(`${API}/fixtures/?event=${gw}`);
      const fx = all.find((f) => f.id === r.fixture);
      const own = team(r.was_home ? fx.team_h : fx.team_a);
      const rival = team(r.opponent_team);
      const ownScore = r.was_home ? r.team_h_score : r.team_a_score;
      const rivalScore = r.was_home ? r.team_a_score : r.team_h_score;
      return {
        own: CLUB_NAMES[own.name] ?? own.name,
        rival: CLUB_NAMES[rival.name] ?? rival.name,
        ownScore,
        rivalScore,
        line: `${team(fx.team_h).short_name} ${r.team_h_score}-${r.team_a_score} ${team(fx.team_a).short_name}`,
      };
    }),
  );
  const score = fixtures.map((f) => f.line).join(", ");

  const stats = {
    es: [
      goals && (goals === 3 ? "Hat-trick" : count(goals, "gol", "goles")),
      assists && count(assists, "asistencia", "asistencias"),
      cleanSheets && "portería a cero",
      saves >= 3 && count(saves, "atajada", "atajadas"),
      penalties && count(penalties, "penalti atajado", "penaltis atajados"),
      bonus && count(bonus, "punto de bonificación", "puntos de bonificación"),
    ].filter(Boolean),
    en: [
      goals && (goals === 3 ? "Hat-trick" : count(goals, "goal", "goals")),
      assists && count(assists, "assist", "assists"),
      cleanSheets && "clean sheet",
      saves >= 3 && count(saves, "save", "saves"),
      penalties && count(penalties, "penalty save", "penalty saves"),
      bonus && count(bonus, "bonus point", "bonus points"),
    ].filter(Boolean),
  };

  const deeds = {
    es: [
      goals && `marcó ${count(goals, "gol", "goles")}`,
      assists && `dio ${count(assists, "asistencia", "asistencias")}`,
      cleanSheets && "mantuvo la portería a cero",
    ].filter(Boolean),
    en: [
      goals && `scored ${count(goals, "goal", "goals")}`,
      assists && `registered ${count(assists, "assist", "assists")}`,
      cleanSheets && "kept a clean sheet",
    ].filter(Boolean),
  };
  const did = {
    es: joinList(deeds.es, "y") || `sumó ${points} puntos`,
    en: joinList(deeds.en, "and") || `scored ${points} points`,
  };

  // A double gameweek has no single result to narrate.
  let context = { es: `en la Jornada ${gw}`, en: `in Gameweek ${gw}` };
  if (fixtures.length === 1) {
    const { own, rival, ownScore, rivalScore } = fixtures[0];
    if (ownScore > rivalScore) {
      context = {
        es: `en la victoria ${ownScore}-${rivalScore} del ${own} sobre el ${rival}`,
        en: `in ${own}'s ${ownScore}-${rivalScore} win over ${rival}`,
      };
    } else if (ownScore === rivalScore) {
      context = {
        es: `en el empate ${ownScore}-${rivalScore} del ${own} ante el ${rival}`,
        en: `in ${own}'s ${ownScore}-${rivalScore} draw with ${rival}`,
      };
    } else {
      context = {
        es: `en la derrota ${ownScore}-${rivalScore} del ${own} ante el ${rival}`,
        en: `in ${own}'s ${ownScore}-${rivalScore} defeat to ${rival}`,
      };
    }
  }

  const name = displayName(player);
  const startYear = new Date(bootstrap.events[0].deadline_time).getUTCFullYear();

  return {
    id: `gw${gw}-mvp`,
    type: "mvp",
    // en-CA formats as YYYY-MM-DD; US Eastern keeps an evening upload on "today".
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date()),
    title: { es: `Rey de la Jornada ${gw}`, en: `King of Gameweek ${gw}` },
    description: {
      es: `${name} ${did.es} ${context.es}, coronándose Rey de la Jornada ${gw}.`,
      en: `${name} ${did.en} ${context.en}, crowning him King of Gameweek ${gw}.`,
    },
    tag: "mvp",
    cover,
    credit: "Bendito Fantasy",
    payload: {
      gw,
      season: `${startYear}-${String(startYear + 1).slice(2)}`,
      playerName: name,
      points,
      statLine: {
        es: `${stats.es.join(", ")} · ${score}`,
        en: `${stats.en.join(", ")} · ${score}`,
      },
    },
  };
}

/** Resizes an inbox portrait into public/ and returns its site path. */
async function importFromInbox(file, gw) {
  const base = slug(path.parse(file).name);
  // Never overwrite: an earlier tile may already be showing that file.
  const taken = fs.existsSync(path.join(PLAYERS, `${base}.jpg`));
  const outName = taken ? `${base}-gw${gw}.jpg` : `${base}.jpg`;
  const source = path.join(INBOX, file);
  const output = await sharp(fs.readFileSync(source))
    .rotate() // honour the phone's EXIF orientation
    .resize({ width: 1400, height: 2100, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#000000" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  if (output.length > MAX_BYTES) {
    throw new Error(`${file} is still over 1 MB after resizing.`);
  }
  fs.mkdirSync(PLAYERS, { recursive: true });
  fs.writeFileSync(path.join(PLAYERS, outName), output);
  fs.rmSync(source);
  return `/media/players/${outName}`;
}

const gwFile = (gw) => path.join(GAMEWEEKS, `gw-${String(gw).padStart(2, "0")}.json`);

async function main() {
  const bootstrap = await getJson(`${API}/bootstrap-static/`);
  const playerById = (id) => bootstrap.elements.find((p) => p.id === id);

  const previewAt = process.argv.indexOf("--preview");
  if (previewAt !== -1) {
    const gw = Number(process.argv[previewAt + 1]);
    const player = playerById(bootstrap.events.find((e) => e.id === gw)?.top_element);
    if (!player) throw new Error(`GW${gw} has no top scorer yet.`);
    const file = findImage(INBOX, player) ?? findImage(PLAYERS, player);
    console.log(`Matching image: ${file ?? "(none)"}`);
    console.log(JSON.stringify(await buildTile(gw, bootstrap, player, "(preview)"), null, 2));
    return;
  }

  const pending = bootstrap.events.filter((event) => {
    if (!event.finished || !event.data_checked || !event.top_element) return false;
    if (!fs.existsSync(gwFile(event.id))) return true;
    const row = JSON.parse(fs.readFileSync(gwFile(event.id), "utf8"));
    return !row.tiles.some((t) => t.type === "mvp");
  });

  if (pending.length === 0) {
    console.log("No finished gameweek is missing its MVP tile.");
    return;
  }

  const waiting = [];
  let published = 0;
  for (const event of pending) {
    const gw = event.id;
    const player = playerById(event.top_element);
    const inboxFile = findImage(INBOX, player);
    const existing = inboxFile ? null : findImage(PLAYERS, player);
    const expected = `${slug(`${player.first_name.split(" ")[0]} ${player.web_name.split(".").at(-1)}`)}.jpg`;

    if (!inboxFile && !existing) {
      console.log(`GW${gw}: waiting for an image of ${player.web_name} (e.g. ${expected}).`);
      waiting.push(`GW${gw}: ${player.first_name} ${player.second_name} -> ${expected}`);
      continue;
    }
    if (!fs.existsSync(gwFile(gw))) {
      throw new Error(`GW${gw}: image found, but ${path.relative(ROOT, gwFile(gw))} does not exist.`);
    }

    // Build the tile first: if the API fails, the inbox image stays put.
    const tile = await buildTile(gw, bootstrap, player, "");
    tile.cover = inboxFile
      ? await importFromInbox(inboxFile, gw)
      : `/media/players/${existing}`;

    const row = JSON.parse(fs.readFileSync(gwFile(gw), "utf8"));
    row.tiles.unshift(tile);
    fs.writeFileSync(gwFile(gw), `${JSON.stringify(row, null, 2)}\n`);
    console.log(`GW${gw}: published ${tile.payload.playerName} with ${tile.cover}.`);
    published += 1;
  }

  // An uploaded file that matched no pending MVP is almost always a naming
  // mistake. Fail so the alert reaches a human — but never block a publish.
  const leftovers = listImages(INBOX);
  if (published === 0 && waiting.length > 0 && leftovers.length > 0) {
    throw new Error(
      `Inbox file(s) did not match a pending MVP: ${leftovers.join(", ")}. ` +
        `Expected: ${waiting.join("; ")}. Use .jpg, .png or .webp.`,
    );
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
