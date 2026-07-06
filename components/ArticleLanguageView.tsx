"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLang } from "@/lib/i18n";

interface ArticleViewData {
  title: string;
  description: string;
  section?: string;
  gw: number;
  author: string;
  cover?: string;
}

interface ArticleLanguageViewProps {
  es: ArticleViewData;
  en?: ArticleViewData;
  esBody: ReactNode;
  enBody?: ReactNode;
}

export default function ArticleLanguageView({
  es,
  en,
  esBody,
  enBody,
}: ArticleLanguageViewProps) {
  const { lang, t } = useLang();
  const active = lang === "en" && en ? en : es;
  const showEnglish = lang === "en" && Boolean(en && enBody);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-8 sm:pt-36">
      <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
        {active.section ?? `Jornada ${active.gw}`} · {active.author}
      </p>
      <h1 className="mt-4 font-display uppercase leading-[0.9] tracking-display text-accent [font-size:clamp(2.5rem,7vw,5.5rem)]">
        {active.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-mid">{active.description}</p>
      {active.cover && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-tile bg-line">
          <Image
            src={active.cover}
            alt={active.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover object-[center_25%]"
            priority
          />
        </div>
      )}
      <article className="prose-editorial mt-10">
        <div hidden={showEnglish}>{esBody}</div>
        {enBody && <div hidden={!showEnglish}>{enBody}</div>}
      </article>
      <Link
        href="/"
        className="mt-14 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 hover:text-accent"
      >
        ← {t("backHome")}
      </Link>
    </main>
  );
}
