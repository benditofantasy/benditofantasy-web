"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error details are kept in the browser console for diagnosis.
    console.error("FPL manager quiz error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-28">
      <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
        Bendito Fantasy
      </p>
      <h1 className="mt-4 font-display text-4xl uppercase leading-tight text-accent">
        Something went wrong / Algo salió mal
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-mid">
        We couldn't show your result. Your answers may still be available if you reload.
      </p>
      <p className="mt-2 text-base leading-relaxed text-ink-mid">
        No pudimos mostrar tu resultado. Puedes intentar recargar la página para recuperar tus respuestas.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-pill bg-accent px-5 py-3 text-sm font-bold text-accent-ink"
        >
          Reload / Recargar
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-pill border border-line px-5 py-3 text-sm font-bold"
        >
          Try again / Reintentar
        </button>
        <Link href="/" className="self-center text-sm underline underline-offset-4">
          Home / Inicio
        </Link>
      </div>
    </main>
  );
}
