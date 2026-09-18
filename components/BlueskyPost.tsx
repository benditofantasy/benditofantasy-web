"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

const EMBED_SCRIPT_SRC = "https://embed.bsky.app/static/embed.js";
const EMBED_TIMEOUT_MS = 4000;

interface BlueskyPostProps {
  /** AT-URI of the post (at://did:.../app.bsky.feed.post/...), from Bluesky's "Embed post" panel. */
  uri: string;
  /** CID of the post, from the same "Embed post" panel. */
  cid: string;
  /** Public bsky.app URL, used as the fallback link and no-JS anchor. */
  url: string;
  /** Text shown in the fallback anchor, e.g. "@benditofantasy.bsky.social". */
  handle?: string;
}

/**
 * `<BlueskyPost />` MDX tag: embeds a single Bluesky post inline in an
 * article, using Bluesky's own embed.js widget (same script SocialSlide uses
 * for gameweek social tiles) so the post renders natively. Falls back to a
 * plain link if the widget doesn't produce an iframe in time.
 */
export default function BlueskyPost({ uri, cid, url, handle }: BlueskyPostProps) {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    setEmbedFailed(false);
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    const timer = window.setTimeout(() => {
      if (!container.querySelector("iframe")) setEmbedFailed(true);
    }, EMBED_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      script.remove();
    };
  }, [uri, cid]);

  return (
    <div ref={containerRef} className="my-6 flex justify-center">
      <blockquote className="bluesky-embed" data-bluesky-uri={uri} data-bluesky-cid={cid}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {handle ?? url}
        </a>
      </blockquote>
      {embedFailed && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 transition-colors duration-fast hover:text-accent"
        >
          {t("viewOnBluesky")}
        </a>
      )}
    </div>
  );
}
