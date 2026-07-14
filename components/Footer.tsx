"use client";

import { useLang } from "@/lib/i18n";

/**
 * Site footer: copyright plus the editorial-illustration notice covering the
 * AI-generated collage covers (owner decision 2026-07-13 — real player
 * likenesses are allowed in the art as digitally generated editorial
 * illustration, disclosed here in both languages).
 */
export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mx-auto max-w-[1600px] px-4 py-14 sm:px-8">
      <p className="text-xs uppercase tracking-kicker text-ink-soft">
        © {new Date().getFullYear()} Bendito Fantasy
      </p>
      <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-ink-soft/80">
        {t("editorialArtNotice")}
      </p>
    </footer>
  );
}
