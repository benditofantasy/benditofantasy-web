"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";

/**
 * Client providers: i18n + motion. reducedMotion="user" makes every
 * framer-motion animation respect prefers-reduced-motion (SPEC §15).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>{children}</LanguageProvider>
    </MotionConfig>
  );
}
