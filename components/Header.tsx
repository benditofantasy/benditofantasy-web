"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";
import SearchOverlay from "./SearchOverlay";
import { SearchIcon } from "./icons";

/**
 * Fixed transparent header per the reference (§7A): logo lockup left,
 * thin outlined circular icons right. The menu icon returns once the menu
 * exists — an inert control would only confuse (owner-confirmed).
 */
export default function Header() {
  const { t } = useLang();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-line bg-surface/80 text-ink backdrop-blur-sm transition-colors duration-fast hover:border-ink"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
