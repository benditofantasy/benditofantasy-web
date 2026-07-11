# Integration Notes — Phase 3 pipeline mapping (spec, not code)

How the two templates ([player-card-prompt.md](player-card-prompt.md),
[collage-card-prompt.md](collage-card-prompt.md)) plug into the roadmap #1/#4
"detect → fill → generate → drop → attach" pipeline.

## Pipeline stages

| Stage | Player card | Collage card |
|---|---|---|
| **Detect** | New Gameweek entry-point content with a player subject | Any new tile-producing content: article, social post, poll, podcast episode, analysis |
| **Extract** | `player_name`, `reference_image_path`, optionally `kit_dominant_hex` | `content_type` (= the tile's `TagKey`), `title` (≤4 words, pipeline truncates), `core_concept`, optional `hero_object`, `reference_image_path`, `variant_index` |
| **Fill** | Slots into the player template; background resolved by the Background Contrast Rule unless `background_hex` supplied | Slots into the internal generation template (§8); palette resolved by the Palette Rule (tag-color mapping) unless `selected_palette` supplied |
| **Generate** | Image at exact 3:4 portrait | Image at exact 3:4 portrait |
| **Drop** | See file contract below | See file contract below |
| **Attach** | Set the tile's `cover` field (`lib/types.ts` → `Tile.cover`) to the dropped path | Same |

## Input slot inventory (shared conventions: snake_case, language-neutral)

| Slot | Player | Collage | Source in content |
|---|---|---|---|
| `player_name` | ✅ req | — | Content metadata / headline entity |
| `reference_image_path` | ✅ req | optional | Uploaded photo or `public/media/players/` asset |
| `kit_dominant_hex` | optional | — | Pre-sampling step (recommended: backend samples so results are reproducible) |
| `background_hex` / `backdrop_shape` | optional | — | Normally left to the deterministic rules |
| `content_type` | — | ✅ req | The tile's `TagKey` (`article`, `social`, `poll`, `podcast`, `data`, `chart`, `video`, `quote`, `mvp`) |
| `title` | — | ✅ req | Tile title, truncated to ≤4 words |
| `core_concept` | — | ✅ req | Tile description / first sentence |
| `hero_object`, `secondary_cutouts`, `supporting_text`, `selected_palette`, `visual_tone` | — | optional | Defaults + deterministic rules in the template |
| `aspect_ratio` | default `3:4` | default `3:4` | Constant for tiles; only override for non-tile surfaces |
| `variant_index` | — | optional | 0 default; ≥1 when several cards of one type share a strip |

## Output contract

**Format:** PNG (matches current thumbnails; JPG acceptable for photo-heavy collages —
existing `poll-card.jpg` precedent). Exact 3:4 pixel ratio; recommend **1200×1600** minimum
(TileCard's largest render is 420 px wide; 1200 px leaves retina + lightbox headroom).

**Naming + target folder** (consistent with today's conventions):

| Kind | Folder | Pattern | Today's precedent |
|---|---|---|---|
| Player card | `public/media/players/` | `{player-slug}-{team-or-country-slug}.png` | `haaland-norway.png`, `messi-argentina.png` |
| Collage card | `public/media/thumbnails/` | `{content-slug}-card[-{n}].png` | `poll-card.jpg`, `stats-card.png`, `social-card-1.png` |

Slugs: lowercase, ASCII-folded (é→e, ñ→n), spaces→hyphens; long names keep last name only
(`{player-slug}` = last name, per existing files). `-{n}` suffix = `variant_index` when > 0.

⚠️ **Naming caveat:** `TileCard.tsx` special-cases covers matching
`/-podcast(-[a-z0-9]+)?\.(jpe?g|png|webp)$/i` with a right-anchored crop (built for 16:9 YouTube
art). At exact 3:4 the crop anchor is a **no-op** (no overflow to position), so a correctly-sized
podcast collage is unaffected regardless of name — but if a generator ever emits a slightly
off-ratio image, the anchor would bite. To stay clear of the regex, name podcast collages so the
filename does **not** end in the `-podcast(-…).ext` shape. Note the optional `(-[a-z0-9]+)?` group
**absorbs a `-card` tail**, so `{slug}-podcast-card.png` still matches — do not use it. Safe
options: drop the `-podcast` segment entirely (`{slug}-card.png`) or use a different tail
(`{slug}-collage.png`).

**Attach:** write the path into the tile's `cover` field; `credit` should note AI generation
per whatever attribution policy the owner sets (open question below).

## Decisions needed from the owner

1. **Which generator/API** (ChatGPT/DALL·E, Gemini, other) — templates are generator-agnostic
   but slot fidelity (esp. exact hex adherence and kit sampling) varies by engine; pick one
   and pin it before wiring.
2. **Gold background choice** — recommendation made to snap `#D9B471` → `--bf-gold #F2C572`
   (see [SUMMARY.md](SUMMARY.md)); confirm or revert to the warmer sand as a deliberate art choice.
3. **Poll tag color** — `poll` has no dedicated tag color in the token mapping; coral was
   used as default in the collage table. Confirm.
4. **Player-card fallback** when no reference photo exists (currently: pipeline error, no
   generation). Alternative: a neutral placeholder illustration.
5. **`credit` field text** for AI-generated covers.
6. **Human review gate** — recommend the QA checklist ([qa-checklist.md](qa-checklist.md)) runs
   as a manual approve step before `attach`, at least initially.
