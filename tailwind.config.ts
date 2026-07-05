import type { Config } from "tailwindcss";

/**
 * All color/typography values reference CSS variables defined in
 * styles/tokens.css — the single place brand values live (SPEC §4).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        "ink-mid": "var(--color-ink-mid)",
        "ink-soft": "var(--color-ink-soft)",
        line: "var(--color-line)",
        accent: "var(--color-accent)",
        "accent-ink": "var(--color-accent-ink)",
        "tag-podcast": "var(--tag-podcast)",
        "tag-article": "var(--tag-article)",
        "tag-data": "var(--tag-data)",
        "tag-chart": "var(--tag-chart)",
        "tag-video": "var(--tag-video)",
        "tag-social": "var(--tag-social)",
        "tag-quote": "var(--tag-quote)",
        "tag-mvp": "var(--tag-mvp)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        fdr: {
          1: "var(--fdr-1)",
          2: "var(--fdr-2)",
          3: "var(--fdr-3)",
          4: "var(--fdr-4)",
          5: "var(--fdr-5)",
          unknown: "var(--fdr-unknown)",
        },
        "surface-card": "var(--surface-card)",
        "surface-deep": "var(--surface-deep)",
        "surface-card-ink": "var(--surface-card-ink)",
        "surface-card-ink-mid": "var(--surface-card-ink-mid)",
        "surface-card-border": "var(--surface-card-border)",
        "brand-navy-deep": "var(--bf-navy-deep)",
        "brand-navy": "var(--bf-navy)",
        "brand-teal": "var(--bf-teal)",
        "brand-cyan": "var(--bf-cyan)",
        "brand-turquoise": "var(--bf-turquoise)",
        "brand-salmon": "var(--bf-salmon)",
        "brand-coral": "var(--bf-coral)",
        "brand-crimson": "var(--bf-crimson)",
        "brand-gold": "var(--bf-gold)",
        "brand-mustard": "var(--bf-mustard)",
        "brand-brown": "var(--bf-brown)",
        "brand-gray": "var(--bf-gray)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        badge: "var(--font-montserrat)",
      },
      letterSpacing: {
        kicker: "var(--tracking-kicker)",
        display: "var(--tracking-display)",
      },
      borderRadius: {
        tile: "var(--radius-tile)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        tile: "var(--shadow-tile)",
        lifted: "var(--shadow-lifted)",
      },
      transitionTimingFunction: {
        brand: "var(--motion-ease)",
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        base: "var(--motion-base)",
        slow: "var(--motion-slow)",
      },
    },
  },
  plugins: [],
};

export default config;
