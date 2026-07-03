# Bendito Fantasy — "The Body Issue"–style FPL Blog

**Spec for Fable 5.** Build a Spanish-language (bilingual) Fantasy Premier League blog whose
homepage faithfully reproduces the interaction and visual language of ESPN's *The Body Issue*
website, but repurposed: **rows are gameweeks** and **tiles are mixed content** (podcast, articles,
data tables, charts, videos, tweets, images, quotes).

> Working name: **Bendito Fantasy** (from the project folder). Final name/identity comes from the
> brand design system — see §4.

---

## 0. Fidelity requirement (read first)

The single most important success criterion: **the homepage must feel like The Body Issue.**
- Light theme (white/near-white background — **not dark**), bold oversized editorial typography,
  generous whitespace, full-bleed imagery, cinematic hover/scroll feel.
- Horizontal scrollable strips grouped into labeled sections.
- Click a tile → it "explodes" into a full-screen lightbox with a **huge title**, description, and
  **←/→ navigation** between items.

**Asset dependencies:**
1. ✅ **Body Issue reference screenshots** — RECEIVED (landing/rows + a full 12-slide athlete
   walkthrough). Documented in detail in **§7A**. Match that layout, spacing, type scale, and motion.
2. ⏳ **claude.ai/design design system** (link or `design.md`) — real brand colors, typography, logo,
   tone. → drives §4. Until provided, use a tasteful placeholder and keep all brand tokens in one
   file so they're trivially swappable. **The one thing to confirm: the reference's loud accent is
   ESPN red — your brand's accent color replaces it everywhere red appears.**

---

## 1. Goal & context

- **Purpose:** completely replace the owner's current Squarespace site.
- **Audience:** Spanish-speaking FPL (Fantasy Premier League) community.
- **Cadence:** new content **every gameweek**, including a **weekly YouTube podcast**.
- **Update model:** the owner feeds Claude Code raw text files (articles) + a small structured entry
  each week; Claude Code commits; Vercel auto-deploys. **Editing content must not require touching
  component code.**

---

## 2. Tech stack (locked)

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** for styling; all brand values as design tokens (CSS variables / Tailwind theme)
- **MDX** for article bodies; structured content (gameweeks, tiles) as data files (see §6)
- **Vercel** deployment (build now, deploy later — see §17)
- Mobile-first, works cleanly on phones, tablets, and laptops/desktops.
- No heavy CMS. Content = files in git (Claude-Code-friendly). A headless CMS is explicitly out of
  scope for MVP.

---

## 3. Information architecture

- `/` — **Homepage**: hero masthead + gameweek rows (the Body Issue experience). This is the core.
- `/jornada/[gw]` (`/gameweek/[gw]`) — optional per-gameweek permalink page (nice for SEO/sharing).
- `/articulo/[slug]` — full article page (MDX) for "Leer más / Read more".
- Exploded tile view is an **overlay/route** over `/` (deep-linkable, e.g. `/?item=gw5-podcast`),
  so ←/→ and share links work and browser back closes it.

---

## 4. Brand & design system  ⟵ PLUG IN DESIGN SYSTEM HERE

Consume the owner's claude.ai/design system. Centralize every brand decision in one place
(`/styles/tokens.css` + `tailwind.config`):
- Color palette (light theme base), semantic tokens (bg, surface, text, accent, tag colors).
- Type families + a bold display face for the oversized headlines; full type scale.
- Logo (masthead + favicon), spacing scale, radius, shadow, motion timings.

Until the design system arrives: use a clean light placeholder (white bg, near-black condensed
display type, one accent) and clearly comment each token as `PLACEHOLDER — replace from design system`.

---

## 5. Global UX rules

- **Bilingual toggle (ES/EN)** in the header. Spanish is default. All UI chrome and category tags
  are translated; article/content bodies carry their own language (owner writes in Spanish, optional
  EN field). Persist choice in `localStorage`. Keep strings in a simple `i18n` dictionary so adding
  translations is trivial.
- **Category tags** (localized): `Artículo` (Article), `Datos` (Data), `Gráfico` (Chart),
  `Vídeo` (Video), `Podcast` (Podcast), `Social` (Social). Each tag has its own accent color.
- Fully responsive; touch-friendly horizontal scrolling on mobile (swipe), keyboard + arrows on
  desktop.
- Accessibility: keyboard-operable lightbox, focus trapping, `alt` text, respects
  `prefers-reduced-motion`, semantic headings.

---

## 6. Content / data model

Two layers, both plain files so Claude Code can update them weekly.

**a) Gameweek index** — one structured file (`/content/gameweeks/gw-05.json` per week, or a single
`gameweeks.ts`). Each gameweek:

```jsonc
{
  "gw": 5,                          // gameweek number
  "label": { "es": "Jornada 5", "en": "Gameweek 5" },
  "date": "2025-09-20",             // for ordering + display
  "tiles": [ /* ordered; podcast first — see §11 */ ]
}
```

**b) Tile** — the unit that appears in a row and explodes in the lightbox:

```jsonc
{
  "id": "gw5-podcast",              // stable, used in deep-link ?item=
  "type": "podcast",               // podcast | article | data | chart | video | tweet | image | quote
  "featured": true,                // podcast of the week = true (larger tile)
  "title": { "es": "…", "en": "…" },      // BIG headline in exploded view
  "description": { "es": "…", "en": "…" }, // paragraph shown under title
  "tag": "Podcast",                // category (drives colored label)
  "cover": "/media/gw5-pod.jpg",   // strip thumbnail / lightbox background
  "credit": "Autor / fuente",      // byline / credit line
  "link": { "href": "…", "label": { "es": "Ver más", "en": "Read more" } },
  "payload": { /* type-specific — see §11 */ }
}
```

Articles: `type: "article"` with body authored as **MDX** in `/content/articles/*.mdx`; the tile's
`link` points to `/articulo/[slug]`. Claude Code's weekly job = drop the MDX file + add one tile
entry to that gameweek's JSON.

**Design for evolution — flat now, mini-galleries later.** For MVP **one tile = one content item**
(a single exploded screen). But model the tile so it can later hold an ordered array of `slides`
(cover + images + video + quote, exactly like a Body-Issue athlete's 12-slide gallery) **without a
schema rewrite**. Concretely: treat the current single view as a tile with an implicit one-item
`slides` array. When mini-galleries arrive, `←/→` will traverse a tile's own slides first, then move
to the next tile. Build the lightbox renderer around a `slides[]` abstraction from day one.

---

## 7. Homepage layout  ⟵ MATCH SCREENSHOTS

1. **Hero masthead** (top): blog logo/name, tagline, ES/EN toggle, and a feature for the current
   week (e.g. this week's podcast/headline) in Body-Issue oversized style.
2. **Gameweek rows**, **newest gameweek on top**, descending. Each row:
   - Prominent **gameweek label** (`Jornada N` / `Gameweek N`) styled like Body Issue's year labels.
   - A **horizontally scrollable strip** of tiles for that week.
   - The **podcast is the featured first tile** (larger / highlighted) — see §11.
3. Match the reference's spacing, label typography, tile aspect ratios, and scroll affordances from
   the screenshots.

## 7A. Reference visual system  (documented from the screenshots — this is the fidelity target)

All values are the **placeholder brand** until the design system lands; keep them as tokens. Where it
says "red," that is the single loud accent — **replace with the owner's brand accent color.**

**Palette**
- Background: pure white `#FFFFFF`. Massive whitespace; the page breathes.
- Accent (the only loud color): bright red (ESPN ≈ `#D50A0A`). Used ONLY for: the giant display
  headline, the year/gameweek label, pagination arrows (filled circles), and "NEXT" teaser name.
- Text: near-black `#111` for quotes/body; mid-gray `#555` for stat/description lines; light gray
  `#9A9A9A` for kickers + metadata.

**Typography**
- **Display face:** ultra-bold, condensed, ALL-CAPS (ESPN uses a Tungsten-style condensed). Placeholder:
  a heavy condensed like *Anton* / *Archivo Narrow Black* / *Bebas*-weight. Tight tracking, tight
  leading, set BIG (headline fills ~55–65% of viewport width; year label is comparably huge).
- **Kicker:** ~12–13px, gray, UPPERCASE, wide letter-spacing (`COVER ATHLETE`, `BEHIND THE SCENES`,
  `INTERVIEW`). Centered at top on media slides; left-aligned above the title on cover slides.
- **Body/stat line:** ~16–18px regular sans, mid-gray, bullet-separated (`Age • Height • Weight …`).
- **Metadata block:** ~14–15px, light gray, stacked lines (`Photoshoot / Location / Photographer …`).
- **Quote slide:** large (~40–52px) *regular-weight* near-black sans (NOT condensed, NOT red) — a
  deliberate contrast to the red display headline.

**Homepage row (landing)** — screenshot 1
- Fixed transparent header: left = logo lockup (ESPN "E" + wordmark); right = menu + search icons in
  thin outlined circles.
- Each section (a year → our **gameweek**): the huge red label sits at the **left**, vertically
  centered against the row, with a small gray `NN GALLERIES` → our `N ENTRADAS / N ITEMS` beneath it.
- To its right, a horizontally scrolling strip of large tiles. Tiles are tall (~3:4) image cards,
  small gaps, edge-bleed (next tile peeks). Under each tile: gray UPPERCASE letter-spaced name → our
  **tile title**. Bottom-right of each tile: a small pill badge `12 ▤` (item count / type icon).
- A red circular `›` sits on the right edge to page the strip.

**Lightbox chrome (every exploded slide)** — all screenshots
- Outlined circular `✕` top-left (close). Menu/search top-right.
- Centered top **kicker** naming the slide type/section when relevant.
- Bottom-center **pagination** `01 — 12`: bold black condensed numerals with an em dash.
- Bottom-left / bottom-right: **red circular ←/→** arrows (~56–64px). No `←` on the first slide.
- Adjacent slides bleed in as thin slivers at the left/right edges (a peek of prev/next).

## 8. Row / strip behavior  ⟵ MATCH SCREENSHOTS

- Horizontal scroll: mouse drag / wheel-horizontal, touch swipe, and on-hover edge arrows on desktop
  (the red circular `›` from the reference).
- Tiles bleed off the right edge so the next one peeks (signals scrollability).
- Tile hover: subtle zoom/reveal echoing the reference.
- Lazy-load offscreen media; smooth momentum scroll. No vertical page scroll hijack.

## 9. Exploded (lightbox) full view  ⟵ MATCH SCREENSHOTS

Clicking a tile opens a full-screen white overlay with the §7A chrome. Each content type maps to one
of these reference slide layouts (built on the `slides[]` abstraction from §6 so mini-galleries drop
in later):

- **Title/cover layout** (screenshots 2 & 14 — used by **Article**, and the lead of any future
  mini-gallery): left ~65% holds the gray kicker (category tag) → **giant red ALL-CAPS title** →
  mid-gray stat/description line → light-gray metadata (date, `Jornada N`, author/credit). A vertical
  **sliver of the cover image peeks on the right edge**. `READ FULL STORY` → our **"Leer más / Read
  more"** underlined gray link when `link` present.
- **Full-media layout** (screenshots 3–8 — used by **Image**, and photos inside a gallery): the media
  centered on white with generous top/bottom margins, thin slivers of prev/next at the edges. Optional
  centered top kicker (e.g. `Datos`, `Social`). Portrait and landscape both supported.
- **Video layout** (screenshots 10–11 — used by **Podcast**, **Vídeo**): centered player with a white
  circular play button; optional red **duration** badge and an overlaid **white pull-quote** headline
  bottom-left (great for the podcast's episode title/hook). Embeds YouTube.
- **Data / Chart layout** (not in reference — adopt the same grammar): centered top kicker
  (`Datos`/`Gráfico`) + a large left-aligned title, with the **table or chart** occupying the stage
  where the photo would be. Same white/whitespace/red-accent discipline.
- **Quote layout** (screenshots 12–13 — used by **Quote**): gray attribution label → **large
  near-black regular-weight quote** (not red) → `Leer más` link. This is the reference's closing-slide
  treatment.

Every layout also carries: **date + `Jornada N` + colored category tag**, **author/credit**, and
**share buttons** (copy link / X / WhatsApp) deep-linking to `/?item=<id>`.

## 10. Navigation & keyboard

- `←` / `→` and the red circular arrows: previous/next tile **within the current gameweek only**.
- **End-of-gameweek behavior (confirmed):** on the last item, `→` **closes the lightbox and returns to
  the homepage**, scrolled to that gameweek's row (a "close-and-return"). No cross-week flow-through in
  MVP. `←` on the first item is hidden/disabled. (When mini-galleries arrive, `←/→` traverse a tile's
  own slides first, then step to the next tile — still bounded by the gameweek.)
- `Esc` and browser **Back** close the lightbox; clicking the backdrop closes.
- Focus returns to the originating tile on close. Full focus trap while open.

---

## 11. Content types (MVP)

All embeddable in both the strip tile (thumbnail/preview) and the exploded view (full render).

- **Podcast** (`featured: true`, first tile each week): YouTube embed of the weekly show. Larger tile
  treatment. `payload: { youtubeId }`.
- **Article** (`Artículo`): cover image tile → exploded shows title/description/credit + "Leer más"
  to the MDX page. `payload: { slug }`.
- **Data table** (`Datos`): styled responsive stats table (e.g. top performers, points).
  `payload: { columns, rows }` — kept as data so Claude Code can paste weekly numbers.
- **Chart** (`Gráfico`): data visualization (form trends, ownership, etc.). `payload: { chartType,
  data }`. Use a light, brand-tokened chart style (follow the dataviz guidance).
- **Video** (`Vídeo`): YouTube embed (non-podcast clips). `payload: { youtubeId }`.
- **Tweet / X** (`Social`): embedded tweet from the owner's account. `payload: { tweetUrl }`.
- **Image** (`Social`/generic): full-bleed static image + caption. `payload: { src, caption }`.
- **Quote** (`Cita`): large pull-quote card. `payload: { quote, attribution }`.

Embeds must degrade gracefully (skeleton/fallback if a third-party embed fails).

---

## 12. Responsive behavior

- **Mobile:** rows swipe horizontally; lightbox is full-screen; ←/→ become on-screen tap zones +
  swipe; hero condenses. Comfortable tap targets.
- **Tablet:** 2–3 tiles visible per row; hero medium.
- **Desktop:** multiple tiles per row with edge arrows; full oversized hero.
- No horizontal page scroll — only strips scroll horizontally, inside their own overflow containers.

---

## 13. Weekly content-update workflow (must be effortless)

Documented in `README.md`. Target flow for each gameweek:
1. Create/append `/content/gameweeks/gw-NN.json` with the week's tiles.
2. Drop any article MDX into `/content/articles/`.
3. Add media to `/public/media/`.
4. `git commit && push` → Vercel auto-deploys.
Provide a **`gameweek.template.json`** and a short "add a gameweek" recipe so Claude Code (or the
owner) can do this from raw text with zero component edits.

---

## 14. Placeholder data (this build)

Ship with **realistic placeholder FPL data in Spanish**: ~3 gameweeks (e.g. Jornadas 3–5), newest on
top, each with a featured podcast tile + a mix of article, data table, chart, YouTube, tweet, image,
and quote tiles. Enough to demonstrate every type and the full interaction. Owner swaps for real
content later via §13.

---

## 15. Accessibility & performance

- Keyboard-complete lightbox, focus trap, ARIA roles, visible focus.
- `alt` text on all imagery; captions on media.
- `prefers-reduced-motion` disables zoom/parallax.
- Lazy-load media; optimize images (`next/image`); good Lighthouse mobile scores.

## 16. SEO

- Per-article and per-gameweek metadata, Open Graph images, Spanish `lang` default with `hreflang`
  for EN. Clean shareable URLs.

## 17. Deployment

- **Build now, deploy later.** Fable 5 delivers a runnable Next.js app + README with deploy steps.
  Owner connects Vercel and the (currently Squarespace) domain when ready. No live deploy this pass.

---

## 18. Phase 2 backlog (explicitly out of MVP)

- **Polls** (interactive voting — needs vote storage/backend).
- **TikTok-style vertical video** tiles.
- **Live social "float-in" feed** (auto-pulling live posts via API).
- Headless CMS / dashboard editing.

---

## 19. Open items to confirm before/at build

1. Final **brand identity** (name, logo, palette, type) from the claude.ai/design system. ← blocking §4.
   Everything the reference renders in **red** becomes the owner's accent color.
2. ✅ **Body Issue reference** — received and documented in §7A.
3. ✅ **End-of-gameweek behavior** — resolved: close-and-return (§10).
4. ✅ **Tile granularity** — resolved: flat (one tile = one item) for MVP, `slides[]`-ready for future
   mini-galleries (§6).
5. Exact **domain** (deferred; needed only at deploy time).
```
