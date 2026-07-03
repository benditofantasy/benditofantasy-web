"use client";

import { TAG_NAMES, useLang } from "@/lib/i18n";
import type { TagKey } from "@/lib/types";

const TAG_COLOR_VAR: Record<TagKey, string> = {
  podcast: "var(--tag-podcast)",
  article: "var(--tag-article)",
  data: "var(--tag-data)",
  chart: "var(--tag-chart)",
  video: "var(--tag-video)",
  social: "var(--tag-social)",
  quote: "var(--tag-quote)",
};

export function tagColor(tag: TagKey): string {
  return TAG_COLOR_VAR[tag];
}

/** Localized category pill in the tag's own accent color (SPEC §5). */
export default function CategoryTag({ tag }: { tag: TagKey }) {
  const { l } = useLang();
  return (
    <span
      className="inline-block rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-kicker"
      style={{ color: TAG_COLOR_VAR[tag], borderColor: TAG_COLOR_VAR[tag] }}
    >
      {l(TAG_NAMES[tag])}
    </span>
  );
}
