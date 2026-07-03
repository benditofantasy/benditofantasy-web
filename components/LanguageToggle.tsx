"use client";

import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const OPTIONS: Lang[] = ["es", "en"];

export default function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t("languageToggle")}
      className="flex items-center rounded-pill border border-line p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-kicker transition-colors duration-fast ${
            lang === option
              ? "bg-ink text-surface"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
