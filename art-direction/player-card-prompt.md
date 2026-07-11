# Player Card Prompt — Mid-Century Bust (production template)

**Purpose:** Gameweek entry-point card art. Renders in `components/TileCard.tsx` at
`aspect-[3/4]` with `object-cover` — author at **exactly 3:4 portrait** so nothing is cropped.

---

## Slots the backend fills

| Slot | Type | Required | Notes |
|---|---|---|---|
| `{player_name}` | string | yes | Display only in filenames/logging — **never rendered inside the image** |
| `{reference_image_path}` | path | yes* | Photo of the player (bust visible, kit visible). *See edge case E1 if missing |
| `{kit_dominant_hex}` | hex | no | If the backend pre-samples the kit's dominant color; otherwise the generator samples it per the rule below |
| `{background_hex}` | hex | no | If omitted, resolved by the Background Contrast Rule below |
| `{backdrop_shape}` | `circle` \| `semicircle` | no | Default `semicircle` (see Shape Rule) |
| `{aspect_ratio}` | string | no | Default `3:4` (portrait). Only override for non-tile uses |

---

## Template (fill slots, send verbatim)

> Mid-century art. Input: the reference photo at `{reference_image_path}` with a main
> character. Output: an illustration following these instructions, composed for a
> **`{aspect_ratio}` portrait frame** (default 3:4).
>
> **Art style:** High-quality digital illustration in a quirky, contemporary flat vector
> illustration style with a strong mid-century modern and editorial design influence.
>
> **Character:** Highly stylized, abstract character featuring exaggerated, elongated
> proportions, sharp geometric angles, and highly expressive, oversized facial features.
> Illustrate **bust only**; do not add clothing layers.
>
> **Jersey & apparel fidelity (HIGH PRIORITY):** Strictly sample and utilize the exact hex
> color codes from the input photo's garment for the base, collar, and trim. Translate the
> original fabric patterns (stripes, geometric weaves, chevrons) into the sharp, angular
> geometric color blocking native to this style. Retain the exact collar structure (e.g.
> V-neck, crew).
>
> **Linework:** Minimalist to nonexistent traditional linework; forms are defined almost
> entirely by the intersection of flat, geometric color shapes and sharp, angular silhouettes.
>
> **Shading & texture:** Flat, two-dimensional rendering without traditional volume shading.
> Infuse with rich, tactile digital textures: visible dry-brush grit on heavier fabrics,
> speckled sponge-like textures on the hair, and coarse halftone/risograph-style dot patterns
> applied specifically to mimic the jersey's fabric gradients and patterns.
>
> **Color & lighting:** For the character's skin tones, shadows, and highlights, use an
> editorial, sophisticated palette of muted, earthy neutrals and crisp whites. Do **not**
> apply this muted palette to the vibrant jersey colors.
>
> **Backdrop:** Large minimalist **`{backdrop_shape}`** in **`{background_hex}`** directly
> behind the character's body. When using a semicircle, anchor its flat side to the **bottom
> edge of the frame** — never floating, never showing an empty half behind the player.
>
> **Composition & safe area:** Portrait 3:4 frame. Center the bust horizontally; eyes in the
> upper third. The face and collar must sit inside a centered safe area of ~85% of frame
> width/height — keep all important elements away from the edges (the site crops with
> `object-cover`; authoring at exact 3:4 means zero crop, the margin is a safety buffer).
>
> **Branding (NON-NEGOTIABLE):** Strictly no logos, team shields, sponsor names, badges,
> manufacturer marks, or publicity of any kind on the clothing or accessories, and no text
> anywhere in the image. This is the most important rule — **zero branding at all times**.
> Where the reference photo shows a crest or sponsor, replace it with plain geometric color
> blocking in the sampled kit colors.
>
> **Quality:** Render at the highest possible resolution with sharp, clean edges and
> professional digital polish.

---

## Background Contrast Rule (deterministic — replaces "chosen based on maximum contrast")

Background options (reconciled to brand tokens — see Palette Notes):

| Option | Hex | Token | Value pole |
|---|---|---|---|
| Gold | `#F2C572` | `--bf-gold` | light |
| Coral | `#F2594B` | `--bf-coral` | mid, warm |
| Navy | `#204F59` | `--bf-navy` | dark, cool |

Compute the kit's dominant color (largest color area of the jersey base; `{kit_dominant_hex}`
if supplied). Then, using its relative luminance **L** (0–1) and hue **H**:

1. **L < 0.25 (dark kit)** → gold `#F2C572`.
2. **L > 0.65 (light/white kit)** → navy `#204F59`.
3. **Mid-value kit (0.25 ≤ L ≤ 0.65):** warm hue (H in 0–90° or 330–360° — reds/oranges/yellows) →
   navy `#204F59`; cool hue (H in 90–330° — greens/blues/teals) → coral `#F2594B`.
4. **Conflict override:** if the chosen background is within 30° of the kit's dominant hue
   *and* within 0.15 luminance, step to the next option in fixed order
   gold → coral → navy → gold.
5. **No clear dominant color** (multi-color kit, no single color ≥ 40% of jersey area):
   use the kit's *collar/trim* color for the rule; if still ambiguous, default navy `#204F59`.

## Backdrop Shape Rule (deterministic)

- **Default: `semicircle`**, flat side anchored to the bottom edge of the 3:4 frame — the bust
  rises out of it. This is the standard portrait-card composition.
- Use **`circle`** only when the bust (including hair volume) fits fully inside a circle with
  ≥ 8% margin to every frame edge — i.e., a small/tight bust crop.
- Never render a semicircle floating in the frame or with its empty half visible behind the player.

## Edge cases

| # | Case | Rule |
|---|---|---|
| E1 | **No reference image** | Do not generate. Return an error to the pipeline — kit fidelity is impossible without a reference. (No generic-player fallback; recommendation for owner: consider a stock "arbitro/VAR"-style neutral illustration as pipeline fallback.) |
| E2 | **Reference shows full body / multiple players** | Crop to the single main subject's bust before styling; if the main subject is ambiguous, pick the largest/most central figure. |
| E3 | **Kit with no clear dominant color** | Rule 5 above (trim color → else navy). |
| E4 | **Very light kit (white)** | Rule 2 → navy background; ensure crisp-white kit blocks keep a visible edge against skin/neutrals via the halftone texture, not outlines. |
| E5 | **Very dark kit** | Rule 1 → gold background. |
| E6 | **Long/unusual player names** | Irrelevant to the image (no text ever appears); affects only the output filename slug (see integration-notes.md). |
| E7 | **Goalkeeper/keeper kit differs from team colors** | Sample the *worn* garment in the photo, not the team's canonical colors. |

## Negative constraints (never do)

- ❌ Logos, team shields, sponsor names, kit-manufacturer marks, competition patches — **zero branding, ever**.
- ❌ Any text, numbers, or player name inside the image.
- ❌ Clothing layers beyond the jersey bust; full-body poses.
- ❌ Traditional outline linework, volume shading, gradients outside halftone texture.
- ❌ Muted/earthy treatment applied to the jersey colors (jersey stays vibrant).
- ❌ Floating semicircles or semicircles with the empty half showing.
- ❌ Backgrounds other than the three approved options.
- ❌ Landscape or square framing (3:4 portrait unless explicitly overridden).

## Palette notes (defect 3b reconciliation)

| Old prompt hex | New value | Why |
|---|---|---|
| `#D9B471` (sand) | `#F2C572` (`--bf-gold`) | **Snapped to token** (recommendation, see SUMMARY.md): keeps every background a brand token, and as the light pole it gives stronger value contrast against dark kits. The warmer sand had no token and read as drift. |
| `#FF6A4D` (coral) | `#F2594B` (`--bf-coral`) | Deprecated placeholder → approved primary accent token. |
| `#204F59` (navy) | `#204F59` (`--bf-navy`) | Already correct — unchanged. |

The muted earthy neutrals / crisp whites for skin & shadows are a **deliberate art-direction
choice with no brand token** — not drift; do not "fix" them to the palette.

---

## Worked example (filled)

Slots: `player_name=Erling Haaland`, `reference_image_path=public/media/players/haaland-norway.png`
(kit: dark red base → L ≈ 0.2 → **rule 1 → gold `#F2C572`**), `backdrop_shape=semicircle`,
`aspect_ratio=3:4`.

> Mid-century art. Input: the reference photo at `public/media/players/haaland-norway.png`
> with a main character. Output: an illustration following these instructions, composed for a
> **3:4 portrait frame**. … *(style/character/jersey/linework/shading/color paragraphs as
> above, verbatim)* … **Backdrop:** Large minimalist **semicircle** in **#F2C572** directly
> behind the character's body, flat side anchored to the bottom edge of the frame — never
> floating, never showing an empty half behind the player. … *(composition, branding, quality
> paragraphs verbatim)*
