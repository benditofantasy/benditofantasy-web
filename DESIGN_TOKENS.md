# Bendito Fantasy — Real Design Tokens (final, approved 2026-07-03)

**Status: applied.** `styles/tokens.css` and `tailwind.config.ts` carry the full 10-color brand
palette below. This supersedes the first draft token sheet the owner initially sent (dark
navy/coral/teal set that turned out to be a rough placeholder, not the true brand colors) — the
two follow-up "true color" swatches (Coolors screenshots) are the source of truth.

## The 10-color palette

| Token | Hex | Role |
|---|---|---|
| `--bf-navy-deep` | `#012340` | Deepest dark surface — footer, gated/premium content backdrop |
| `--bf-navy` | `#204F59` | General dark component surface (cards/panels/stat blocks); also body ink-mid |
| `--bf-teal` | `#025E73` | Analytical/stats accent (data tables, chart lines), Article tag |
| `--bf-cyan` | `#04C4D9` | Info / secondary CTA, Data tag, FDR-2 |
| `--bf-turquoise` | `#02EBAE` | Success / active state, Social tag, FDR-1 (easiest) |
| `--bf-salmon` | `#F27A5E` | Warm secondary accent, Video tag, FDR-4 |
| `--bf-coral` | `#F2594B` | **Primary accent** — CTAs, podcast badge, links, Podcast tag |
| `--bf-crimson` | `#D9042B` | Danger/error, FDR-5 (hardest) — reserved, not overused |
| `--bf-gold` | `#F2C572` | Pricing/premium (lightest of the gold ladder), FDR-3 |
| `--bf-mustard` | `#BF8D30` | Caution / warning (deeper gold) |
| `--bf-brown` | `#8C5E26` | Muted editorial gravitas — Quote tag |
| `--bf-gray` | `#ABA9AC` | Neutral — kickers, hairlines, metadata, FDR-unknown |

Full role mapping (status colors, FDR scale, category tags) lives directly in
`styles/tokens.css` with inline comments — that file is the single source of truth; this doc is
historical/reference only.

## Scoping (confirmed 2026-07-03)

**Page background stays light theme**, per SPEC §0/§7A — white bg, near-black text, matching
The Body Issue. Dark navy tokens (`--surface-card`, `--surface-deep`) are **scoped to
components only** (cards, panels, stat blocks, footer), not the page shell or lightbox
background.

## Still placeholder (owner: leave as-is for now)

- **Display/headline face**: no condensed ultra-bold face was given for the oversized Body-Issue
  headlines (SPEC §7A); Barlow is the confirmed body/primary sans only. Currently using Anton as
  a stand-in (`app/fonts.ts`) until a real display face is confirmed.

## History

1. **2026-07-03, first sheet**: owner supplied a CSS/Tailwind token sheet (dark navy `#211F29`
   base, coral `#FF6A4D` accent, teal/turquoise/cyan accents, Barlow font, concrete motion
   timings). Applied to `styles/tokens.css` with page background kept white per owner scoping
   (navy reserved for component surfaces only).
2. **Same day, correction**: owner shared two Coolors palettes labeled "true colors" — these
   turned out to not match the first sheet's base colors (only `--bf-gold #F2C572` and the three
   accent colors `--bf-teal #025E73` / `--bf-cyan #04C4D9` / `--bf-salmon #F27A5E` survived
   unchanged). The first sheet's guessed navy/coral values were replaced.
3. **Role mapping**: proposed via color psychology (crimson → danger/FDR-5, near-black navy →
   deepest surface, gold ladder → FDR-3/warning/premium, etc.) and owner-approved as a full set
   — including the category tag color reassignment. This is the version now live in
   `styles/tokens.css`.
4. **2026-07-05, legacy Squarespace panels ported**: owner surfaced four settings panels from the
   prior Squarespace build that had no equivalent yet — Animations (Style: Fade/Scale/Slide/Clip/
   Flex, Speed: Slow/Medium/Fast), Site Styles color themes (Lightest/Light/Bright/Dark/Darkest ×
   1/2), Fonts (Headings/Paragraphs/Buttons/Miscellaneous roles + Base Size), and Image Blocks
   (Poster/Card/Overlap/Collage/Stack layout percentages). Added as `--anim-*`, `--theme-*-bg`/
   `--theme-*-ink`, `--font-buttons`/`--font-misc`/`--font-size-base`, and `--imgblock-*` tokens in
   `styles/tokens.css`, plus `[data-animate]` keyframes in `app/globals.css`. The color themes were
   deliberately built as reusable bg/ink *pairs* from the existing brand palette rather than a
   page-level theme switcher, since the light-only page shell was an explicit owner decision
   (scoping note above) — no component wiring for switching themes exists yet, just the tokens.
5. **Same day, animation wiring**: the `[data-animate]` scroll-reveal system was wired into
   `GameweekRow`/`SpecialRow`/`SeasonRow` via a shared `useReveal` hook (IntersectionObserver,
   fires once) — each row now slides in on scroll using the legacy default Style/Speed
   (Slide/Medium). Theme color-pairs, font-buttons/font-misc, and Image Blocks remain tokens-only;
   the site has no generic content-block builder for them to plug into yet (owner call, scope
   deferred).

Related: `SPEC.md` §4 (brand & design system), §19 item 1 (brand identity — now resolved except
the display face).
