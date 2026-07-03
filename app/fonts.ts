import { Anton, Barlow } from "next/font/google";

/**
 * Anton is a PLACEHOLDER for the ultra-bold condensed display face (SPEC
 * §7A) — no brand display face was supplied, only Barlow as the body sans.
 * Barlow is the confirmed brand primary sans (DESIGN_TOKENS.md).
 */
export const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const barlow = Barlow({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});
