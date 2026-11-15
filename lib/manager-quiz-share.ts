import type { Lang } from "@/lib/types";
import { PROFILES, type ProfileId } from "@/lib/manager-quiz";

/** Copy approved for the downloadable 3:4 result cards (Spanish and English). */
const CARD_DESCRIPTIONS: Record<ProfileId, { es: string; en: string }> = {
  I: {
    es: "El Fantasy es parte de tu rutina. Haces los cambios necesarios y sigues con tu semana, sin complicarte demasiado.",
    en: "FPL is part of your routine. You make the changes you need and get on with your week without overthinking it.",
  },
  N: {
    es: "Prefieres proteger lo que has conseguido. Analizas los riesgos y buscas mantener tu posición cuando hay algo en juego.",
    en: "You prefer to protect what you've achieved. You weigh the risks and look to hold your position when something is at stake.",
  },
  E: {
    es: "Quieres buenos resultados sin dedicarle horas al Fantasy. Aprovechas la información disponible y decides de forma práctica.",
    en: "You want good results without spending hours on FPL. You make use of available information and keep your decisions practical.",
  },
  M: {
    es: "Te gusta entender tus decisiones y aprender de tus errores. Sabes que una buena elección no siempre significa muchos puntos.",
    en: "You like understanding your decisions and learning from mistakes. You know a good choice doesn't always mean a big score.",
  },
  C: {
    es: "Tienes un ojo en tu equipo y otro en tus rivales. Buscas oportunidades para ganar posiciones y sacar ventaja.",
    en: "You keep one eye on your team and the other on your rivals. You're always looking for ways to move up and gain an edge.",
  },
  G: {
    es: "Tienes objetivos ambiciosos y te preparas para alcanzarlos. Planificas cada jornada sabiendo que nada garantiza la victoria.",
    en: "You set ambitious goals and prepare to achieve them. You plan each Gameweek knowing that nothing guarantees a win.",
  },
};

export const QUIZ_SHARE_URL = "https://benditofantasy.com/test/que-tipo-de-manager-eres";

function linesWithin(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const output: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      output.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) output.push(line);
  return output;
}

function printLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

async function loadPicture(): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = "/media/players/fpl-player.jpg";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load article thumbnail"));
    if (image.complete && image.naturalWidth > 0) resolve();
  });
  return image;
}

/** Generate a fresh image only when requested, never store questionnaire responses. */
export async function createManagerCard(
  primary: ProfileId,
  secondary: ProfileId | undefined,
  lang: Lang,
): Promise<Blob> {
  await document.fonts.ready;
  const image = await loadPicture();
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const navy = "#012340";
  const coral = "#f2594b";
  const muted = "#204f59";
  const label = lang === "es" ? "MI PERFIL DE MANAGER" : "MY FPL MANAGER PROFILE";
  const invite = lang === "es"
    ? "¿Y TÚ QUÉ TIPO DE MANAGER ERES?"
    : "WHAT KIND OF FPL MANAGER ARE YOU?";
  const secondaryLabel = lang === "es"
    ? "También me identifico con:"
    : "I also relate to:";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 900, 1200);
  ctx.textBaseline = "top";
  ctx.fillStyle = navy;
  ctx.font = 'bold 35px "Barlow", Arial, sans-serif';
  ctx.fillText("BENDITO FANTASY", 58, 51);
  ctx.fillStyle = "#7c898c";
  ctx.font = 'bold 21px "Barlow", Arial, sans-serif';
  ctx.fillText(label, 58, 113);
  ctx.fillStyle = coral;

  const heading = PROFILES[primary].name[lang].toLocaleUpperCase(lang === "es" ? "es" : "en");
  let titleLines: string[] = [];
  let fontSize = 92;
  do {
    ctx.font = `bold ${fontSize}px "Anton", Impact, "Arial Narrow", sans-serif`;
    titleLines = linesWithin(ctx, heading, 780);
    if (titleLines.length <= 3) break;
    fontSize -= 4;
  } while (fontSize > 54);
  printLines(ctx, titleLines, 58, 168, fontSize * 1.1);
  const descriptionTop = 178 + titleLines.length * fontSize * 1.1 + 25;

  ctx.fillStyle = navy;
  let bodyLines: string[] = [];
  let bodySize = 33;
  do {
    ctx.font = `${bodySize}px "Barlow", Arial, sans-serif`;
    bodyLines = linesWithin(ctx, CARD_DESCRIPTIONS[primary][lang], 780);
    if (descriptionTop + bodyLines.length * bodySize * 1.35 < 642) break;
    bodySize -= 2;
  } while (bodySize > 23);
  printLines(ctx, bodyLines, 58, descriptionTop, bodySize * 1.35);
  if (secondary && secondary !== primary) {
    const secondaryY = Math.max(descriptionTop + bodyLines.length * bodySize * 1.35 + 25, 598);
    ctx.font = '23px "Barlow", Arial, sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(secondaryLabel, 58, secondaryY);
    ctx.font = 'bold 24px "Barlow", Arial, sans-serif';
    ctx.fillText(PROFILES[secondary].name[lang], 58, secondaryY + 32);
  }

  // Actual approved article image, cropped to fill the 900x360 visual band.
  const top = 730;
  const bandHeight = 365;
  const scale = Math.max(900 / image.naturalWidth, bandHeight / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, 900, bandHeight);
  ctx.clip();
  ctx.drawImage(image, (900 - w) / 2, top + (bandHeight - h) / 2, w, h);
  ctx.restore();

  ctx.fillStyle = navy;
  ctx.fillRect(0, 1095, 900, 105);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 24px "Barlow", Arial, sans-serif';
  ctx.fillText(invite, 450, 1114);
  ctx.font = '21px "Barlow", Arial, sans-serif';
  ctx.fillText("benditofantasy.com", 450, 1155);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export image")), "image/png"),
  );
}

export function shareResultText(primary: ProfileId, lang: Lang): string {
  const profile = PROFILES[primary].name[lang];
  return lang === "es"
    ? `Mi perfil en Bendito Fantasy es: ${profile}. ¿Y tú qué tipo de manager eres? ${QUIZ_SHARE_URL}`
    : `My Bendito Fantasy profile is: ${profile}. What kind of FPL manager are you? ${QUIZ_SHARE_URL}`;
}
