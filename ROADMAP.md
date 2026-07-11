# Bendito Fantasy — Roadmap

A living, forward-looking plan for what to build next, **sequenced by dependency**
rather than by when the idea arrived. Work top-down within a phase; a later phase
generally assumes the earlier ones exist. Add new ideas to **Parking lot**; we'll
triage them into a phase later. This is a planning doc, not a spec — each item
links out to a real plan when it starts.

_Last updated: 2026-07-11_

---

## Dependency map (why the order)

Most of the FPL-intelligence ideas share one backbone and two reusable patterns:

- **The data backbone is the external FPL engine (Phase 1).** Stats/charts (#2),
  the GW player-card automation (#4), player hyperlinks (#5.1), and the analytics
  app's answers all ultimately read the same player/team data. Connecting that
  engine first means everything above it is wiring, not re-invention.
- **"Generate an image from a prompt on publish" is one pattern used twice** —
  the collage pipeline (#1) and the GW entry-point card (#4). Same plumbing
  (detect content → run prompt → drop in folder → attach), different prompts.
  Build the mechanism once.
- **"Surface the analytics app" depends on the things it links from** — player
  hyperlinks (#5.1) need player identity from the engine; the charts CTA (#5.2)
  needs the charts (#2) to exist first.

---

## Phase 0 — Foundation & safety ✅ done

- [x] **Sync reliability net** — a broken Bluesky feed (empty API response,
  blocked push) now fails the run loudly and opens a self-healing GitHub Issue
  (auto-closed on the next success), instead of a silently-green no-op. Also
  confirmed `main` has no branch protection/rulesets. Shipped in PR #15;
  alert cycle verified live. See [Done](#done).

## Phase 1 — The data backbone (unlocks most of what follows)

- [ ] **#6 — Connect the external FPL engine.** A separate repo already has
  scripts that extract most common FPL data (player info, team stats, fixtures,
  etc.). Wire it to this repo as the **shared data source** feeding stats/charts
  (#2), the GW card automation (#4), player hyperlinks (#5.1), and the analytics
  app. Decide the integration shape: shared package, generated data files in
  `content/`, or a small service. _Foundational — sequence early._

## Phase 2 — Turn data into on-page content

- [ ] **#2 — Stats & data-visualization backend.** Season generates a firehose:
  top-scoring teams, worst defenses, xG/xA, player form trends, favorable fixture
  runs, etc. Build a backend that ingests this (from the engine, #6) and produces
  charts/plots/tables that surface on the page. _Concept only — needs its own
  discovery pass: data sources, chart types, placement._
- [ ] **#3 — Mini-leagues & top-10 tables.** Recurring tournaments: the classic
  mini-league, **Copa Santamaría** (20-team head-to-head), and the **FPL Cup**
  (tracked from the FPL site). Scheduled **weekly posts** per competition — top-10
  standings or head-to-head results. _Needs exploration on format + cadence._

## Phase 3 — Automated content art (one pattern, two uses)

- [ ] **#1 — Automated collage/cover image pipeline.** A ChatGPT-based generator
  already produces collage-format images from a piece of content (article, poll,
  social post). Wire it into publishing: recognize content type → generate the
  right image → drop in the correct folder → attach to the post. No manual
  round-trip. _Broader cousin of the Reach & discovery OG-card item._
- [ ] **#4 — Auto-generated Gameweek entry-point card.** Beyond Player of the
  Gameweek, each GW needs an entry-point card. Today it's manual: find a player
  image, run a **ready-made art-style prompt** through Gemini/Copilot. Once the
  player name is extracted, run that prompt automatically to generate the card.
  _Shares the "prompt → image → folder → attach" plumbing with #1._

## Phase 4 — Surface the analytics app (app.benditofantasy.com)

The analytics arm is a **chat-first** interface (team/player questions, stats,
substitution recommendations), tied to **Patreon** tiers — each tier unlocks more
capability; free members get **5 questions/day**. It's not surfaced on the main
site at all. Goal: introduce it **organically, without breaking the existing
structure, flow, or design language.**

- [ ] **#5.1 — Player-name hyperlinks.** Every player mentioned in an article
  becomes a link to the app with a **pre-populated prompt** for that player's
  performance/stats/intel. Frictionless entry point. _Needs player identity from
  the engine (#6)._
- [ ] **#5.2 — CTA from charts & tables.** From the stats visuals (#2), a button
  ("More analytics" / "Analyst" / "Bendito Asistente" — label TBD) routes to the
  analytics side. _Needs #2 to exist first; idea needs refinement._

## Phase 5 — Meta (Threads / Instagram), parked

Dormant on purpose — Meta's developer-login wall blocked setup (2026-07-10). Code
paths exist; they only need tokens + numeric user IDs.

- [ ] Retry via an **Instagram Business account + oEmbed**, which may sidestep the
  developer-login wall. ~1-hour token job when revisited, not a re-investigation.

---

## Standalone / opportunistic (not blocked by the phases above)

Live-feed polish and reach items that can slot in whenever there's a gap.

- [ ] **Live feed — post-type coverage.** Image + text are proven; verify
  quote-posts, video posts, and link-cards render in the lightbox.
- [ ] **Live feed — freshness signal.** "Updated X ago" or a gentle pulse on the
  newest card.
- [ ] **Auto-generated OG / share cards** — per-article share images. _Overlaps
  with #1; may fall out of that pipeline._
- [ ] **RSS / podcast feed** — if not already exposed, so podcasts can syndicate.
- [ ] **Search / archive browsing** — filter/search across the content index as
  it grows.
- [ ] **Cross-linking** — article → related podcast episode → related socials.
- [ ] **Season structure** — how seasons surface as browsable units.

---

## Parking lot

Unsorted ideas. Add freely; triage into a phase later.

- _(add ideas here)_

---

## Done

Shipped work, newest first.

- **Phase 0 — sync reliability net** (2026-07-11, PR #15) — the hourly social sync
  fails loudly on a broken feed and opens/auto-closes a "Social sync failing"
  GitHub Issue; push rebases onto `main` first. Full alert cycle verified live.
- **Art-direction prompt system** (2026-07-11) — Fable-hardened player-card +
  collage-card prompt templates (parametrized, palette-reconciled, 3:4-locked)
  under `art-direction/`, for Phase 3 automation.
- **Bluesky social live feed** (2026-07-10) — homepage social cards from Bluesky
  (no token), hourly sync straight to `main`, rotating branded covers, self-promo
  filter, real embed in lightbox. Smoke-tested end-to-end.
- **Article typography** — paragraph spacing, teal pull-quotes, highlight panels.
- **YouTube podcast backfill** (2026-07-05) — `content/youtube-podcasts`, 2025/26
  rolled into a season file.
