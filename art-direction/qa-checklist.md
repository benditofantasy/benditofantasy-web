# QA Checklist — generated card acceptance

Usable by a human reviewer now, automatable later. A card ships only if **every** row passes.
(Note: the brief's deliverable list said "4:3" here; the verified tile format is **3:4** — see
SUMMARY.md.)

## Both card types

| # | Check | Pass condition |
|---|---|---|
| 1 | **Zero branding** | No team shields, league logos, platform logos, sponsor names, kit-manufacturer marks, watermarks — anywhere, at any zoom. Hard fail; no exceptions. |
| 2 | **Aspect ratio** | Exactly 3:4 portrait (e.g. 1200×1600). No letterboxing, no landscape/square. |
| 3 | **Safe area** | Focal point inside the centered ~85% area; nothing important touching the edges (survives `object-cover` sub-pixel crop). |
| 4 | **Single focal point** | One dominant element; eye lands on it within a beat at thumbnail size. |
| 5 | **Thumbnail legibility** | Downscale to ~300 px wide: subject and any text still readable. |
| 6 | **Brand palette adherence** | Dominant colors match the token table (±small render tolerance). No off-brand neons; no deprecated hexes `#FF6A4D`, `#211F29`, `#1F4B59`, `#D9B471`. |
| 7 | **No perishable data** | No dates, scores, prices, percentages, ownership, fixtures. |

## Player card only

| # | Check | Pass condition |
|---|---|---|
| P1 | **No text at all** | Image contains zero letters/numbers (name lives in the tile, not the art). |
| P2 | **Kit fidelity** | Jersey base/collar/trim colors visibly sampled from the reference photo; collar structure retained; crest/sponsor areas replaced with plain color blocking. |
| P3 | **Background rule** | Background is one of `#F2C572` / `#F2594B` / `#204F59` and matches the contrast rule for the kit. |
| P4 | **Backdrop shape** | Semicircle anchored flat to the bottom edge (or fully-contained circle) — never floating, never with an empty half behind the player. |
| P5 | **Style** | Bust only, flat vector mid-century style, no outlines/volume shading; jersey vibrant, skin/shadows muted neutrals. |

## Collage card only

| # | Check | Pass condition |
|---|---|---|
| C1 | **Text ≤ 4 words** | Title 1–4 words; at most one short supporting line; no paragraphs. |
| C2 | **Type language** | Iconography matches `content_type` (mic for podcast, ballots for poll, etc.) and accent color matches the tag mapping. |
| C3 | **BF-UCSG texture** | Torn paper, matte grain, tactile cutouts present; not a flat "Canva template" look. |
| C4 | **Variant distinctness** | If `variant_index` > 0: side-by-side with the original, layout/entry-point/secondary objects all differ — not the same composition with minor tweaks. |
| C5 | **Element budget** | 1 hero, 1–3 secondary cutouts, 1 digital overlay, 1–2 tactile objects, ≤3 hand-drawn marks, visible negative space. |
