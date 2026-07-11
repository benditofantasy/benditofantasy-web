# SUMMARY — Art-direction prompt system (Fable brief execution, 2026-07-11)

## Produced

| File | What it is |
|---|---|
| [player-card-prompt.md](player-card-prompt.md) | Parametrized mid-century player-card template: 6 slots, deterministic background-contrast + backdrop-shape rules, kit-sampling rules, 7 edge cases, hardened negative block, worked example (Haaland). |
| [collage-card-prompt.md](collage-card-prompt.md) | Parametrized BF-UCSG collage template (Spanish voice kept, slots language-neutral): 11 slots, deterministic palette rule keyed to the site's tag colors, cutout-count + variant rules, 6 edge cases, worked example (podcast). |
| [integration-notes.md](integration-notes.md) | Pipeline spec: slot inventory, detect→fill→generate→drop→attach mapping, file naming/folder contract matching today's `public/media/` conventions, 6 owner decisions flagged. |
| [qa-checklist.md](qa-checklist.md) | Acceptance checklist: 7 shared checks + 5 per card type; zero-branding is a hard fail. |

## Defects reconciled

### 3a — Aspect ratio (collage §1 said 4:3 horizontal)
Fixed to **3:4 vertical**, now an `{aspect_ratio}` slot defaulting to `3:4`, verified against
`components/TileCard.tsx` (`aspect-[3/4]`, `object-cover`). Added an explicit ~85% centered
safe-area rule to both templates as a crop buffer. The player-card prompt previously specified
**no** ratio at all — it now also defaults to 3:4, with the semicircle bottom-anchored for the
portrait frame. *(Note: the brief's own §5 deliverable list and QA item still said "4:3" —
treated as stale typos of the same defect; every deliverable uses 3:4.)*

### 3b — Palette drift (both prompts)
All hexes reconciled against `DESIGN_TOKENS.md`:

| Was | Now | Where |
|---|---|---|
| `#FF6A4D` coral | `#F2594B` `--bf-coral` | both templates |
| `#211F29` near-black | `#012340` `--bf-navy-deep` | collage |
| `#1F4B59` dark teal | `#204F59` `--bf-navy` | collage |
| `#01435B` deep blue (also non-token) | dropped; navies cover the role | collage |
| `#D9B471` sand | `#F2C572` `--bf-gold` — **decision below** | player bg |
| `#02EBAE / #F2C572 / #04C4D9 / #F27A5E / #ABA9AC` | unchanged (already tokens) | both |

**Decision (recommendation): snap `#D9B471` → `--bf-gold #F2C572`.** Rationale: it keeps all
three player-card backgrounds on brand tokens (automatable QA check #6), and as the light pole
of the contrast rule the lighter gold performs *better* against dark kits than the muted sand.
Reversible in one line if the owner prefers the warmer sand as a deliberate art choice.

**Kept deliberately non-token (flagged in-place so it's not mistaken for drift):** paper
neutrals, off-white, editorial black, textured grays (collage base) and the muted earthy
skin/shadow neutrals (player card).

## Judgment calls made deterministic
- Player background: luminance/hue rule with fixed tie-break order (gold→coral→navy).
- Backdrop shape: semicircle bottom-anchored by default; circle only if bust fits with ≥8% margin.
- Collage palette: accent = site tag color per `content_type`, fixed support color per type.
- Secondary cutouts: 2 default / 1 complex hero / 3 only for duel-comparison cards.
- Variants: parity of `variant_index` drives mirrored layout vs. base-navy + cutout rotation.

## Open questions for the owner
1. Generator/API choice (blocks wiring; templates are engine-agnostic).
2. Confirm the `#F2C572` gold-background snap (or revert to `#D9B471` sand).
3. `poll` has no tag color token — coral used as default.
4. Fallback behavior when a player card has no reference photo (currently: pipeline error).
5. `credit` field wording for AI-generated covers.
6. Whether QA runs as a manual approval gate before attach (recommended initially).
