"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { Tile } from "@/lib/types";
import { BlueskyIcon, LinkIcon, ThreadsIcon, WhatsAppIcon, XSocialIcon } from "./icons";

/**
 * Copy link / Bluesky / Threads / X / WhatsApp — deep-linking to /?item=<id>
 * (SPEC §9). Order reflects the owner's actual platform priority: Bluesky and
 * Threads are where Bendito Fantasy is actually growing, X stays (too
 * popular to drop) but trails them.
 */
export default function ShareButtons({ tile }: { tile: Tile }) {
  const { t, l } = useLang();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(`/?item=${tile.id}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/?item=${tile.id}`);
  }, [tile.id]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const shareText = encodeURIComponent(l(tile.title));
  const encodedUrl = encodeURIComponent(shareUrl);
  const buttonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-pill border border-line text-ink-mid transition-colors duration-fast hover:border-ink hover:text-ink";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        aria-label={t("copyLink")}
        title={t("copyLink")}
        className={buttonClass}
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <a
        href={`https://bsky.app/intent/compose?text=${shareText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("shareOnBluesky")}
        title={t("shareOnBluesky")}
        className={buttonClass}
      >
        <BlueskyIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://www.threads.net/intent/post?text=${shareText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("shareOnThreads")}
        title={t("shareOnThreads")}
        className={buttonClass}
      >
        <ThreadsIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://x.com/intent/post?text=${shareText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("shareOnX")}
        title={t("shareOnX")}
        className={buttonClass}
      >
        <XSocialIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://wa.me/?text=${shareText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("shareOnWhatsApp")}
        title={t("shareOnWhatsApp")}
        className={buttonClass}
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <span
        aria-live="polite"
        className="text-[11px] font-semibold uppercase tracking-kicker text-ink-soft"
      >
        {copied ? t("copied") : ""}
      </span>
    </div>
  );
}
