"use client";

import { useLang } from "@/lib/i18n";

/** Localized fallback for a `<Poll id="..." />` MDX tag whose id doesn't
 *  resolve to a real poll tile — never crashes the article page. */
export default function PollUnavailable() {
  const { t } = useLang();
  return <p className="my-4 text-sm text-ink-soft">{t("pollUnavailable")}</p>;
}
