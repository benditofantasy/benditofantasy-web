"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createManagerCard, shareResultText, QUIZ_SHARE_URL } from "@/lib/manager-quiz-share";
import { useLang } from "@/lib/i18n";
import {
  ARTICLE_URL,
  CHOICES,
  PROFILES,
  QUESTIONS,
  scoreQuiz,
  type Choice,
} from "@/lib/manager-quiz";

const COPY = {
  es: {
    eyebrow: "Bendito Fantasy · Test interactivo",
    title: "¿Qué tipo de manager eres?",
    intro: "Ocho preguntas para descubrir cómo afrontas el Fantasy Premier League. No hay respuestas correctas ni incorrectas: elige lo que harías normalmente.",
    start: "Comenzar el test",
    question: "Pregunta",
    of: "de",
    prev: "Anterior",
    next: "Siguiente",
    finish: "Ver mi resultado",
    resultEyebrow: "Tu perfil de manager",
    resultLead: "Tus respuestas se parecen más a la manera de jugar de este perfil:",
    secondary: "También muestras algunas tendencias de:",
    discover: "Descubre más sobre tu perfil",
    articleTitle: "¿Qué tipo de manager eres? Seis perfiles del Fantasy",
    articleDescription: "Martin Arrieta (El Profe) explora las motivaciones detrás de nuestras decisiones, nuestras expectativas y las diferentes maneras de disfrutar el Fantasy.",
    read: "Leer el artículo completo",
    again: "Repetir el test",
    disclaimer: "Este es un test editorial para reflexionar sobre tu manera de jugar, no una evaluación científica.",
    back: "Volver al inicio",
    author: "Por Martin Arrieta (El Profe)",
    shareTitle: "Comparte tu perfil",
    shareIntro: "¿Qué tipo de manager son tus amigos? Comparte tu resultado y rétalos a descubrir el suyo.",
    share: "Compartir mi resultado",
    download: "Descargar imagen",
    copy: "Copiar enlace del test",
    copied: "Enlace copiado",
    exportError: "No pudimos generar tu tarjeta. Inténtalo de nuevo.",
  },
  en: {
    eyebrow: "Bendito Fantasy · Interactive quiz",
    title: "What Kind of FPL Manager Are You?",
    intro: "Eight questions to discover how you approach Fantasy Premier League. There are no right or wrong answers: choose what you'd normally do.",
    start: "Start the quiz",
    question: "Question",
    of: "of",
    prev: "Back",
    next: "Next",
    finish: "See my result",
    resultEyebrow: "Your FPL manager profile",
    resultLead: "Your answers most closely match this approach to Fantasy:",
    secondary: "You also show some tendencies associated with:",
    discover: "Find out more about your profile",
    articleTitle: "What Kind of FPL Manager Are You? Six Ways to Play Fantasy",
    articleDescription: "Martin Arrieta (El Profe) explores what drives our decisions, what we expect from the game, and the different ways to enjoy FPL.",
    read: "Read the full article",
    again: "Take the quiz again",
    disclaimer: "This is an editorial quiz to reflect on how you play, not a scientifically validated assessment.",
    back: "Back to home",
    author: "By Martin Arrieta (El Profe)",
    shareTitle: "Share your profile",
    shareIntro: "What kind of managers are your friends? Share your result and challenge them to find out.",
    share: "Share my result",
    download: "Download image",
    copy: "Copy quiz link",
    copied: "Link copied",
    exportError: "We couldn\u0027t create your card. Please try again.",
  },
} as const;

const QUIZ_SESSION_KEY = "bendito-manager-quiz-progress-v1";

export default function ManagerQuizPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Choice | null)[]>(
    () => Array(QUESTIONS.length).fill(null),
  );
  const [completed, setCompleted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [copied, setCopied] = useState(false);
  // Guard against incomplete or corrupted progress instead of throwing while
  // React renders the final screen.
  const validAnswers = answers.length === QUESTIONS.length &&
    answers.every((value): value is Choice => value !== null && CHOICES.includes(value));
  const result = completed && validAnswers ? scoreQuiz(answers as Choice[]) : null;
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(QUIZ_SESSION_KEY);
      if (!stored) return;
      const saved: unknown = JSON.parse(stored);
      if (!saved || typeof saved !== "object") return;
      const progress = saved as { answers?: unknown; completed?: unknown; step?: unknown };
      if (!Array.isArray(progress.answers) || progress.answers.length !== QUESTIONS.length) return;
      if (!progress.answers.every((value) => value === null || CHOICES.includes(value))) return;
      const restoredAnswers = progress.answers as (Choice | null)[];
      setAnswers(restoredAnswers);
      setStarted(true);
      setCompleted(progress.completed === true && restoredAnswers.every((value) => value !== null));
      if (typeof progress.step === "number" && Number.isInteger(progress.step)) {
        setStep(Math.max(0, Math.min(QUESTIONS.length - 1, progress.step)));
      }
    } catch {
      // The quiz remains usable even when browser storage is blocked.
    }
  }, []);

  function saveProgress(nextAnswers: (Choice | null)[], nextStep: number, done: boolean) {
    try {
      sessionStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify({
        answers: nextAnswers, step: nextStep, completed: done,
      }));
    } catch {
      // Private browsing or storage restrictions should not interrupt the quiz.
    }
  }
  const question = QUESTIONS[step];
  const selected = answers[step];

  async function getCard() {
    if (!result) throw new Error("Missing quiz result");
    return createManagerCard(result.primary, result.secondary, lang);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const objectURL = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectURL;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }

  async function downloadResult() {
    if (!result || exporting) return;
    setExporting(true);
    setShareError(false);
    try {
      const blob = await getCard();
      downloadBlob(blob, `bendito-fantasy-${result.primary.toLowerCase()}.png`);
    } catch {
      setShareError(true);
    } finally {
      setExporting(false);
    }
  }

  async function shareResult() {
    if (!result || exporting) return;
    setExporting(true);
    setShareError(false);
    try {
      const blob = await getCard();
      const file = new File([blob], `bendito-fantasy-${result.primary.toLowerCase()}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: shareResultText(result.primary, lang), title: copy.title });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          // Fall back to an image download when native sharing fails.
        }
      }
      downloadBlob(blob, file.name);
    } catch {
      setShareError(true);
    } finally {
      setExporting(false);
    }
  }

  async function copyQuizLink() {
    try {
      await navigator.clipboard.writeText(QUIZ_SHARE_URL);
      setCopied(true);
    } catch {
      setShareError(true);
    }
  }

  function restart() {
    try { sessionStorage.removeItem(QUIZ_SESSION_KEY); } catch { /* storage unavailable */ }
    setAnswers(Array(QUESTIONS.length).fill(null));
    setStep(0);
    setCompleted(false);
    setStarted(true);
  }

  function advance() {
    if (!selected) return;
    if (step === QUESTIONS.length - 1) {
      const missingIndex = answers.findIndex((value) => value === null || !CHOICES.includes(value));
      if (missingIndex !== -1) {
        setStep(missingIndex);
        saveProgress(answers, missingIndex, false);
        return;
      }
      saveProgress(answers, step, true);
      setCompleted(true);
    } else {
      saveProgress(answers, step + 1, false);
      setStep((previous) => previous + 1);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft underline underline-offset-4 hover:text-accent"
        >
          {copy.back}
        </Link>
      </div>

      {!started ? (
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{copy.eyebrow}</p>
            <h1 className="mt-4 font-display uppercase leading-[0.95] tracking-display text-accent [font-size:clamp(3rem,7vw,6rem)]">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-mid">{copy.intro}</p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-8 rounded-pill bg-accent px-7 py-3 text-sm font-bold uppercase tracking-kicker text-accent-ink transition-opacity hover:opacity-85"
            >
              {copy.start}
            </button>
          </div>
          <div className="relative aspect-[3/4] max-h-[560px] overflow-hidden rounded-tile bg-line">
            <Image
              src="/media/players/vangaal.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : result ? (
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{copy.resultEyebrow}</p>
          <p className="mt-6 text-lg text-ink-mid">{copy.resultLead}</p>
          <h1 className="mt-3 font-display uppercase leading-[0.97] tracking-display text-accent [font-size:clamp(3rem,7vw,5.5rem)]">
            {PROFILES[result.primary].name[lang]}
          </h1>
          <p className="mt-5 text-lg leading-relaxed">{PROFILES[result.primary].summary[lang]}</p>
          {result.secondary && (
            <p className="mt-6 text-sm text-ink-mid">
              {copy.secondary} <strong>{PROFILES[result.secondary].name[lang]}</strong>
            </p>
          )}
          <section className="mt-10 overflow-hidden rounded-tile border border-line">
            <div className="grid sm:grid-cols-[185px_1fr]">
              <div className="relative min-h-44 bg-line">
                <Image
                  src="/media/players/fpl-player.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 185px"
                  className="object-cover object-center"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-kicker text-accent">{copy.discover}</p>
                <h2 className="mt-2 font-display text-2xl uppercase leading-tight">{copy.articleTitle}</h2>
                <p className="mt-2 text-xs font-semibold text-ink-soft">{copy.author}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-mid">{copy.articleDescription}</p>
                <Link
                  href={ARTICLE_URL}
                  className="mt-5 inline-block rounded-pill bg-accent px-5 py-3 text-xs font-bold uppercase tracking-kicker text-accent-ink hover:opacity-85"
                >
                  {copy.read}
                </Link>
              </div>
            </div>
          </section>
          <section className="mt-10 border-t border-line pt-8" aria-label={copy.shareTitle}>
            <h2 className="font-display text-2xl uppercase text-accent">{copy.shareTitle}</h2>
            <p className="mt-2 text-sm text-ink-mid">{copy.shareIntro}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={shareResult} disabled={exporting} className="rounded-pill bg-accent px-5 py-3 text-sm font-bold text-accent-ink disabled:opacity-50">{copy.share}</button>
              <button type="button" onClick={downloadResult} disabled={exporting} className="rounded-pill border border-ink px-5 py-3 text-sm font-bold disabled:opacity-50">{copy.download}</button>
              <button type="button" onClick={copyQuizLink} className="rounded-pill border border-line px-5 py-3 text-sm font-semibold">{copied ? copy.copied : copy.copy}</button>
            </div>
            {shareError && <p role="alert" className="mt-3 text-sm text-accent">{copy.exportError}</p>}
          </section>
          <button
            type="button"
            onClick={restart}
            className="mt-8 text-sm font-semibold underline underline-offset-4 hover:text-accent"
          >
            {copy.again}
          </button>
          <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-soft">{copy.disclaimer}</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
            {copy.question} {step + 1} {copy.of} {QUESTIONS.length}
          </p>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-pill bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={QUESTIONS.length}
            aria-valuenow={step + 1}
            aria-label={copy.question}
          >
            <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
          <h1 className="mt-9 font-display text-3xl uppercase leading-tight tracking-display sm:text-4xl">
            {question.question[lang]}
          </h1>
          <fieldset className="mt-8 space-y-3">
            <legend className="sr-only">{question.question[lang]}</legend>
            {CHOICES.map((choice) => (
              <label
                key={choice}
                className={`flex cursor-pointer items-start gap-4 rounded-tile border p-4 transition-colors sm:p-5 ${
                  selected === choice
                    ? "border-accent bg-accent/10"
                    : "border-line hover:border-accent"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${step}`}
                  value={choice}
                  checked={selected === choice}
                  onChange={() => {
                    setAnswers((previous) => {
                      const updated = previous.map((value, index) => index === step ? choice : value);
                      saveProgress(updated, step, false);
                      return updated;
                    });
                  }}
                  className="mt-1 accent-current"
                />
                <span className="text-xs font-bold text-accent">{choice}</span>
                <span className="flex-1 leading-relaxed">{question.answers[choice][lang]}</span>
              </label>
            ))}
          </fieldset>
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((previous) => Math.max(0, previous - 1))}
              disabled={step === 0}
              className="text-sm font-semibold underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {copy.prev}
            </button>
            <button
              type="button"
              onClick={advance}
              disabled={!selected}
              className="rounded-pill bg-accent px-6 py-3 text-sm font-bold uppercase tracking-kicker text-accent-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              {step === QUESTIONS.length - 1 ? copy.finish : copy.next}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
