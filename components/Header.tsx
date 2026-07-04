"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";
import { MenuIcon, SearchIcon } from "./icons";

/**
 * Fixed transparent header per the reference (§7A): logo lockup left,
 * thin outlined circular icons right.
 */
export default function Header() {
  const { t } = useLang();
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-bg via-bg/80 to-transparent">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2"
          aria-label="Bendito Fantasy"
        >
          <Image
            src="/brand/lion-logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="font-display text-xl uppercase tracking-display text-ink">
            Bendito Fantasy
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            type="button"
            aria-label={t("search")}
            className="hidden h-9 w-9 items-center justify-center rounded-pill border border-line text-ink transition-colors duration-fast hover:border-ink sm:inline-flex"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("menu")}
            className="hidden h-9 w-9 items-center justify-center rounded-pill border border-line text-ink transition-colors duration-fast hover:border-ink sm:inline-flex"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
