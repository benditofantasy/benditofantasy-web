import type { Lang, Localized } from "@/lib/types";

export type ProfileId = "I" | "N" | "E" | "M" | "C" | "G";
export type Choice = "A" | "B" | "C" | "D";
export type Affinity = readonly [ProfileId, ProfileId];

export interface QuizQuestion {
  question: Localized;
  answers: Record<Choice, Localized>;
  affinity: Record<Choice, Affinity>;
}

export const ARTICLE_URL = "/articulo/que-tipo-de-manager-eres";
export const QUIZ_URL = "/test/que-tipo-de-manager-eres";
export const PROFILE_IDS: ProfileId[] = ["I", "N", "E", "M", "C", "G"];
export const CHOICES: Choice[] = ["A", "B", "C", "D"];

export const PROFILES: Record<ProfileId, { name: Localized; summary: Localized }> = {
  I: {
    name: { es: "Jugar por inercia", en: "Playing on Autopilot" },
    summary: {
      es: "El Fantasy forma parte de tu rutina, pero no ocupa el centro de tus prioridades. Resuelves lo necesario y sigues con tu semana.",
      en: "FPL is part of your routine, but it isn't at the top of your priorities. You make the changes you need and get on with your week.",
    },
  },
  N: {
    name: { es: "Jugar para no perder", en: "Playing Not to Lose" },
    summary: {
      es: "Sueles prestar atención a los riesgos y a cómo proteger lo que has conseguido, especialmente cuando hay algo en juego.",
      en: "You tend to think about risks and how to protect what you've achieved, especially when there's something on the line.",
    },
  },
  E: {
    name: { es: "Jugar para avanzar con lo mínimo", en: "Playing to Cruise" },
    summary: {
      es: "Buscas decisiones prácticas con la información que tienes a mano. Quieres buenos resultados sin dedicarle al juego más tiempo del que consideras razonable.",
      en: "You aim to make practical decisions with the information at hand. You want good results without spending more time on FPL than feels reasonable.",
    },
  },
  M: {
    name: { es: "Jugar para mejorar", en: "Playing to Improve" },
    summary: {
      es: "Te interesa entender tus decisiones, aprender de los errores y desarrollar tu criterio, incluso cuando los puntos no acompañan.",
      en: "You want to understand your decisions, learn from mistakes and develop your own judgment, even when the points don't follow.",
    },
  },
  C: {
    name: { es: "Jugar para competir", en: "Playing to Compete" },
    summary: {
      es: "Tus rivales y la clasificación influyen en cómo afrontas cada jornada. Buscas oportunidades para avanzar y sacar ventaja en tu mini liga.",
      en: "Your rivals and the standings shape how you approach each Gameweek. You look for opportunities to move up and gain an edge in your mini-league.",
    },
  },
  G: {
    name: { es: "Jugar para ganar", en: "Playing to Win" },
    summary: {
      es: "Las metas ambiciosas orientan tu preparación. Planificas, evalúas opciones y quieres llegar a cada deadline con un plan sólido.",
      en: "Ambitious goals drive your preparation. You plan ahead, weigh your options and want to reach every deadline with a solid plan.",
    },
  },
};

export const QUESTIONS: QuizQuestion[] = [
  {
    question: {
      es: "Se acerca el deadline y todavía no has revisado tu equipo. ¿Qué haces?",
      en: "The deadline is approaching, and you haven't checked your team yet. What do you do?",
    },
    answers: {
      A: { es: "Reviso las noticias más importantes y hago los ajustes necesarios.", en: "Check the most important news and make any necessary changes." },
      B: { es: "Consulto mis fuentes habituales y resuelvo lo que tengo pendiente.", en: "Go through my usual sources and sort out whatever still needs attention." },
      C: { es: "Compruebo qué movimientos están considerando otros managers.", en: "Check what moves other managers are considering." },
      D: { es: "Abro mi equipo y decido según lo que veo en ese momento.", en: "Open my team and decide based on what I see at that moment." },
    },
    affinity: { A: ["N", "E"], B: ["E", "G"], C: ["C", "N"], D: ["I", "E"] },
  },
  {
    question: {
      es: "Tu capitán consigue dos puntos. ¿Qué haces después de la jornada?",
      en: "Your captain scores two points. What do you do after the Gameweek?",
    },
    answers: {
      A: { es: "Compruebo qué capitanes eligieron los managers cercanos a mí.", en: "Check who the managers around me captained." },
      B: { es: "Reviso los datos que me llevaron a elegirlo.", en: "Review the data that led me to choose that captain." },
      C: { es: "Miro cómo terminó mi jornada y paso a la siguiente.", en: "See how my Gameweek went overall and move on to the next one." },
      D: { es: "Comparo lo ocurrido con las previsiones que había consultado.", en: "Compare what happened with the projections I had looked at." },
    },
    affinity: { A: ["C", "N"], B: ["M", "G"], C: ["I", "E"], D: ["G", "M"] },
  },
  {
    question: {
      es: "Aparece un jugador que está dando buenos resultados y todavía tiene pocos propietarios. ¿Qué haces?",
      en: "A player is delivering good returns but is still owned by relatively few managers. What do you do?",
    },
    answers: {
      A: { es: "Compruebo si encaja en mis próximas transferencias.", en: "Check whether he fits into my upcoming transfer plans." },
      B: { es: "Reviso sus estadísticas para entender si puede mantener ese rendimiento.", en: "Look at his statistics to understand whether he can sustain that form." },
      C: { es: "Me fijo en quiénes de mi mini liga lo tienen o podrían ficharlo.", en: "See which managers in my mini-league own him or might bring him in." },
      D: { es: "Lo considero cuando tengo que resolver un cambio en mi equipo.", en: "Keep him in mind for when I need to make a change to my team." },
    },
    affinity: { A: ["G", "E"], B: ["M", "G"], C: ["C", "N"], D: ["I", "E"] },
  },
  {
    question: {
      es: "Tienes veinte minutos libres para dedicarle al Fantasy. ¿Qué haces?",
      en: "You have twenty minutes free to spend on FPL. What do you do?",
    },
    answers: {
      A: { es: "Reviso las dudas más urgentes de mi equipo.", en: "Look at the most pressing questions about my team." },
      B: { es: "Consulto las novedades y los análisis que tengo pendientes.", en: "Catch up on the latest news and analysis I've been meaning to read." },
      C: { es: "Compruebo cómo van mis rivales y qué opciones tienen.", en: "Check how my rivals are doing and what options they have." },
      D: { es: "Reviso algunas decisiones que había dejado preparadas.", en: "Revisit a few decisions I'd already been planning." },
    },
    affinity: { A: ["E", "N"], B: ["E", "M"], C: ["N", "C"], D: ["G", "E"] },
  },
  {
    question: {
      es: "Lideras tu mini liga por pocos puntos. Se acerca una jornada complicada. ¿Qué haces?",
      en: "You're leading your mini-league by a few points. A tricky Gameweek is coming up. What do you do?",
    },
    answers: {
      A: { es: "Reviso si mis principales rivales tienen jugadores diferentes a los míos.", en: "Check which players my closest rivals have that I don't." },
      B: { es: "Mantengo mis planes, salvo que encuentre una razón para cambiarlos.", en: "Stick with my plans unless I find a good reason to change them." },
      C: { es: "Compruebo qué jugadores podrían representar un riesgo importante.", en: "Look at which players could pose the biggest threat to my lead." },
      D: { es: "Analizo las opciones disponibles antes de decidir si necesito cambiar algo.", en: "Weigh up the available options before deciding whether I need to make a change." },
    },
    affinity: { A: ["C", "N"], B: ["G", "M"], C: ["N", "C"], D: ["M", "G"] },
  },
  {
    question: {
      es: "Encuentras una herramienta nueva que compara jugadores. ¿Qué haces?",
      en: "You come across a new player comparison tool. What do you do?",
    },
    answers: {
      A: { es: "Pruebo algunas comparaciones para ver qué información ofrece.", en: "Try a few comparisons to see what information it provides." },
      B: { es: "La guardo para cuando necesite tomar una decisión.", en: "Save it for when I need to make a decision." },
      C: { es: "Compruebo si aporta información distinta a la que ya utilizo.", en: "Check whether it offers anything different from the information I already use." },
      D: { es: "Hago varias pruebas antes de decidir si la incorporo a mi preparación.", en: "Run several tests before deciding whether to add it to my usual preparation." },
    },
    affinity: { A: ["M", "E"], B: ["E", "I"], C: ["M", "G"], D: ["G", "M"] },
  },
  {
    question: {
      es: "Termina una temporada en la que no alcanzaste el resultado que esperabas. ¿Qué haces?",
      en: "The season ends, and you haven't achieved the result you were hoping for. What do you do?",
    },
    answers: {
      A: { es: "Reviso en qué momentos pude haber tomado mejores decisiones.", en: "Look back at the moments when I could have made better decisions." },
      B: { es: "Comparo mi resultado con el de los managers con los que suelo competir.", en: "Compare my finish with the managers I usually compete against." },
      C: { es: "Pienso qué cambiaría en mi preparación para la próxima temporada.", en: "Think about what I'd change in my preparation for next season." },
      D: { es: "Cierro la temporada y vuelvo a pensar en Fantasy cuando se acerca la siguiente.", en: "Put the season behind me and think about FPL again when the next one approaches." },
    },
    affinity: { A: ["M", "G"], B: ["C", "N"], C: ["G", "M"], D: ["I", "E"] },
  },
  {
    question: {
      es: "Es domingo por la noche y acaba de terminar la jornada. ¿Qué es más probable que hagas?",
      en: "It's Sunday evening, and the Gameweek has just finished. What are you most likely to do?",
    },
    answers: {
      A: { es: "Reviso cómo quedó la clasificación de mi mini liga.", en: "Check the latest standings in my mini-league." },
      B: { es: "Miro qué funcionó y qué no en mis decisiones.", en: "Look at what worked and what didn't in my decisions." },
      C: { es: "Consulto cómo se presenta la siguiente jornada.", en: "See how the next Gameweek is shaping up." },
      D: { es: "Miro los resultados y dejo pendiente cualquier otra revisión.", en: "Check the results and leave any further review for later." },
    },
    affinity: { A: ["C", "N"], B: ["M", "G"], C: ["G", "E"], D: ["I", "E"] },
  },
];

/**
 * Every answer contributes 2 points to its primary affinity and 1 to its
 * secondary. Profiles do not appear equally often across the 32 answers:
 * normalize against each profile's expected score if answers are uniformly
 * random, then scale by its standard deviation across eight questions.
 * This is an editorial indicator, not a validated psychological assessment.
 */
export function scoreQuiz(answers: Choice[]): { primary: ProfileId; secondary?: ProfileId } {
  if (answers.length !== QUESTIONS.length) throw new Error("Incomplete quiz");

  const raw = Object.fromEntries(PROFILE_IDS.map((id) => [id, 0])) as Record<ProfileId, number>;
  const expected = Object.fromEntries(PROFILE_IDS.map((id) => [id, 0])) as Record<ProfileId, number>;
  const variance = Object.fromEntries(PROFILE_IDS.map((id) => [id, 0])) as Record<ProfileId, number>;
  const contributions = (pair: Affinity, id: ProfileId) =>
    (pair[0] === id ? 2 : 0) + (pair[1] === id ? 1 : 0);

  QUESTIONS.forEach((question, index) => {
    const choice = answers[index];
    if (!CHOICES.includes(choice)) throw new Error("Invalid quiz answer");
    for (const id of PROFILE_IDS) {
      const possible = CHOICES.map((option) => contributions(question.affinity[option], id));
      const mean = possible.reduce((sum, value) => sum + value, 0) / possible.length;
      expected[id] += mean;
      variance[id] += possible.reduce((sum, value) => sum + (value - mean) ** 2, 0) / possible.length;
      raw[id] += contributions(question.affinity[choice], id);
    }
  });

  const ranked = [...PROFILE_IDS].sort((a, b) => {
    const za = (raw[a] - expected[a]) / Math.sqrt(variance[a] || 1);
    const zb = (raw[b] - expected[b]) / Math.sqrt(variance[b] || 1);
    return zb - za || raw[b] - raw[a] || PROFILE_IDS.indexOf(a) - PROFILE_IDS.indexOf(b);
  });
  return { primary: ranked[0], secondary: ranked[1] };
}

export function localized(value: Localized, lang: Lang): string {
  return value[lang];
}
