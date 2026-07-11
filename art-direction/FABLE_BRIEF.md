# Fable Brief — Bendito Fantasy Art-Direction Prompt System (Roadmap Phase 3)

**For:** a Fable-model run (creative / art-direction / prompt-craft work).
**Author of brief:** planning session, 2026-07-11.
**You may fan out into parallel subagents** — see §"Execution & parallelism".

---

## 1. Mission

Bendito Fantasy (BF) is a bilingual (ES/EN) fantasy-football content site. Two of
its content-art tasks are currently done by hand, each driven by a long prompt
pasted into an image generator (ChatGPT / Gemini / Copilot):

1. **Player card art** — a "mid-century" stylized bust of a player, used as the
   entry-point card for a Gameweek. (Roadmap #4.)
2. **Collage card art** — a mixed-media editorial "BF-UCSG" collage thumbnail that
   represents an article / poll / social post / podcast / analysis. (Roadmap #1.)

The roadmap goal is to **automate** both: on publish, the backend detects the
content, fills a template, generates the image, drops it in the right folder, and
attaches it to the post. That backend does not exist yet — **your job is to make
the prompts production-ready so that automation is later just wiring.**

**You are producing prompt/spec text and reference docs, not code.** Do not modify
application source. Write only into the `art-direction/` folder.

## 2. What "production-ready" means here

The current prompts (Appendix A & B) are strong but were written for a human
operator in a chat. To be callable by a backend they must become **parametrized,
self-consistent, edge-case-safe templates** with:

- **Explicit slots** the backend can fill (e.g. `{player_name}`, `{content_type}`,
  `{title}`, `{selected_palette}`, `{reference_image_path}`, `{aspect_ratio}`).
- **Deterministic rules** where the human currently uses judgment (which
  background color to pick, how many secondary cutouts, when to use a semicircle).
  State the decision rule, not "choose based on taste."
- **Edge-case handling**: missing reference image, unusual/long player names,
  content with no obvious hero object, poll vs. article vs. podcast, kits with no
  clear dominant color, very light vs. very dark kits (background contrast).
- **A worked, filled example** per template so the output is unambiguous.
- **A negative-constraints block** (the "never do this" list) kept intact and, if
  anything, hardened — the zero-branding rule especially.

## 3. Two known defects to reconcile (do not skip)

These are pre-existing bugs in the current prompts. Resolve both explicitly and
note what you changed and why.

### 3a. Aspect-ratio contradiction (collage prompt)
The collage prompt says **4:3 horizontal** in Section 1 but **3:4 vertical** in
Sections 9, 10, and 11. The **correct format is 3:4 (portrait)** — confirmed
against the live card component `components/TileCard.tsx`, which renders every
card at `aspect-[3/4]`. So **Section 1's "4:3 horizontal" is the stale/wrong
line**, and Sections 9/10/11 are right. Make the ratio a **parameter defaulting
to 3:4** and fix Section 1.

**Crop behavior (important):** the card `<Image>` uses `object-cover`, so the
source is scaled to fill the 3:4 frame and **cropped** if it doesn't match.
Authoring at exactly 3:4 means zero crop. Reinforce the existing "keep important
elements away from the edges" rule as a safety margin against sub-pixel cropping,
and state that the focal point should sit within a centered safe area.

**Also applies to the player card:** the mid-century prompt (Appendix A) never
specifies an aspect ratio. It renders in the same `TileCard`, so give it the same
**3:4 default**, and compose the bust + circle/semicircle backdrop for a portrait
frame (the semicircle-anchored-to-the-bottom rule already suits a vertical card).

### 3b. Palette drift from the live brand tokens (both prompts)
The prompts specify some hex codes that are the project's **deprecated first-draft
placeholder palette**, not the approved brand tokens. The **source of truth is
`DESIGN_TOKENS.md`** (the 10-color table, reproduced in §4 below). Reconcile every
hex in both prompts against it:

| In current prompt | Prompt's hex | True brand token | Action |
|---|---|---|---|
| "Coral orange" (primary accent) | `#FF6A4D` | `--bf-coral #F2594B` | **replace** — this is the drift that matters most |
| "Near-black purple" (dark base) | `#211F29` | `--bf-navy-deep #012340` | **replace** |
| "Dark teal" | `#1F4B59` | `--bf-navy #204F59` | **align** (close but off) |
| Mid-century bg option | `#D9B471` | closest is `--bf-gold #F2C572` | **decide**: keep the warmer sand as a deliberate art choice, or snap to the token. Recommend and justify. |
| Mid-century bg option | `#FF6A4D` | `--bf-coral #F2594B` | **replace** |
| Mid-century bg option | `#204F59` | `--bf-navy #204F59` | already correct ✓ |
| Bright mint / gold / cyan / salmon / gray | `#02EBAE / #F2C572 / #04C4D9 / #F27A5E / #ABA9AC` | match tokens | keep ✓ |

Where a color is a deliberate art-direction choice that has no exact token (e.g.
paper neutrals, off-white, editorial black), keep it but **say so explicitly** so
it's not mistaken for drift later.

## 4. Brand palette (source of truth — from DESIGN_TOKENS.md)

| Token | Hex | Role |
|---|---|---|
| `--bf-navy-deep` | `#012340` | Deepest dark surface, premium backdrop |
| `--bf-navy` | `#204F59` | Dark component surface; body ink-mid |
| `--bf-teal` | `#025E73` | Analytical/stats accent, Article tag |
| `--bf-cyan` | `#04C4D9` | Info / Data tag |
| `--bf-turquoise` | `#02EBAE` | Success, Social tag |
| `--bf-salmon` | `#F27A5E` | Warm secondary, Video tag |
| `--bf-coral` | `#F2594B` | **Primary accent** — CTAs, links, Podcast tag |
| `--bf-crimson` | `#D9042B` | Danger (reserved) |
| `--bf-gold` | `#F2C572` | Pricing/premium |
| `--bf-mustard` | `#BF8D30` | Caution (deeper gold) |
| `--bf-brown` | `#8C5E26` | Editorial gravitas, Quote tag |
| `--bf-gray` | `#ABA9AC` | Neutral — kickers, hairlines, metadata |

Note the **category-tag color mapping** — the collage template should be able to
tint by content type consistently with the site (Article=teal, Social=turquoise,
Podcast=coral, Video=salmon, Data=cyan, Quote=brown). Use this so a card's accent
matches its tag on the page.

## 5. Deliverables (write into `art-direction/`)

1. **`player-card-prompt.md`** — the hardened mid-century player-card template:
   parametrized, background-contrast decision rule, kit-color-sampling rules,
   edge cases, negative constraints, one filled worked example, and a short
   "slots the backend fills" list at the top.
2. **`collage-card-prompt.md`** — the hardened BF-UCSG collage template: ratio
   fixed to 4:3, palette reconciled, per-content-type guidance retained, the
   internal generation template, variant rules, edge cases, worked example, and
   the "slots the backend fills" list.
3. **`integration-notes.md`** — a short spec (not code) mapping each template's
   input slots and outputs to the Phase 3 pipeline: what the backend extracts
   (player name, content type, title, palette selection, reference image path),
   the output contract (suggested file naming + target folder convention,
   consistent with how `public/media/thumbnails/` covers are named today), and
   how "detect → fill → generate → drop → attach" maps to these templates.
   Flag any decision that needs the owner (e.g. which generator/API).
4. **`qa-checklist.md`** — a short acceptance checklist for a generated image:
   brand-palette adherence, zero-branding rule, 4:3 + thumbnail legibility, single
   dominant focal point, text ≤4 words, distinct-enough variants. Usable by a
   human or a later automated check.

Keep each deliverable self-contained and skimmable. Prefer tables and rule lists
over prose. Preserve the bilingual (ES/EN) nature where the current prompts are
in Spanish — the collage prompt is Spanish-authored; keep its Spanish voice but
ensure the *slot names and integration notes* are language-neutral.

## 6. Execution & parallelism

The two prompts are **independent** — parallelize:

- **Subagent A** → Deliverable 1 (player-card prompt). Owns defect 3b rows for the
  mid-century backgrounds.
- **Subagent B** → Deliverable 2 (collage prompt). Owns defects 3a (ratio) + 3b
  (coral/dark drift).
- **Then synthesize** (you, or a Subagent C after A & B finish) → Deliverables 3
  and 4, which depend on both templates being settled.

If spinning subagents isn't available in your run, do them sequentially in the
same order. Either way, **before finishing**, do a consistency pass so both
templates share identical slot-naming conventions and reference the same palette
table.

## 7. Guardrails

- Write only under `art-direction/`. Do not touch app source, content, or config.
- Do not invent brand colors, fonts, or rules not grounded in DESIGN_TOKENS.md or
  the existing prompts. When you make a judgment call, mark it clearly as a
  recommendation for owner review.
- The **zero-branding rule** (no logos/shields/sponsors, ever) is non-negotiable —
  carry it into both templates prominently.
- End with a short **`SUMMARY.md`** in `art-direction/` listing what you produced,
  every defect you reconciled (3a/3b) with the decision you made, and any open
  questions for the owner.

---

## Appendix A — current PLAYER CARD prompt (mid-century), verbatim

> Mid-century art
> Style Description & Technical Specifications: Input: A photo with a main
> character. Output: An illustration following these instructions:
>
> Art Style: High-quality digital illustration in a quirky, contemporary flat
> vector illustration style with a strong mid-century modern and editorial design
> influence.
>
> Characters: Highly stylized, abstract characters featuring exaggerated,
> elongated proportions, sharp geometric angles, and highly expressive, oversized
> facial features. Illustrate bust only, do not add clothing layers.
>
> Jersey & Apparel Fidelity (HIGH PRIORITY): Strictly sample and utilize the exact
> hex color codes from the input photo's garment for the base, collar, and trim.
> Translate the original fabric patterns (stripes, geometric weaves, chevrons) into
> the sharp, angular geometric color blocking native to this style. Retain the
> exact collar structure (e.g., V-neck, crew).
>
> Linework: Minimalist to nonexistent traditional linework; forms are defined
> almost entirely by the intersection of flat, geometric color shapes and sharp,
> angular silhouettes.
>
> Shading & Texture: Flat, two-dimensional rendering without traditional volume
> shading. Infuse with rich, tactile digital textures: visible dry-brush grit on
> heavier fabrics, speckled sponge-like textures on the hair, and coarse
> Halftone/risograph-style dot patterns applied specifically to mimic the jersey's
> fabric gradients and patterns.
>
> Color & Lighting: For the character's skin tones, shadows, and highlights, use an
> editorial, sophisticated palette of muted, earthy neutrals and crisp whites. (Do
> not apply this muted palette to the vibrant jersey colors).
>
> Mandatory Rules & Constraints:
> Background: Large minimalist circle or semicircle backdrop directly behind the
> character's body. Color options: #D9B471 or #FF6A4D or #204F59. To be chosen
> based on maximum contrast against the player's kit. When using semicircles, never
> display the semicircle floating or showing the empty half behind the player.
>
> Branding: Strictly no logos, team shields, sponsor names, or publicity of any
> kind on the clothing or accessories. This is the most important rule, zero
> branding at all times.
>
> Quality: Render in the highest possible resolution with sharp, clean edges and
> professional digital polish. Reference images could be found in the players
> folder.

## Appendix B — current COLLAGE CARD prompt (BF-UCSG), verbatim

Reconcile the two defects while hardening: **§3a** — the 4:3 (Section 1) vs 3:4
(Sections 9/10/11) contradiction; the correct value is **3:4**, so fix Section 1.
**§3b** — the palette hexes below vs. `DESIGN_TOKENS.md` (coral `#FF6A4D`→
`#F2594B`, near-black `#211F29`→`#012340`, dark teal `#1F4B59`→`#204F59`).

> Eres el director de arte y generador visual oficial de Bendito Fantasy. Tu función es convertir ideas, artículos, publicaciones sociales, encuestas, análisis, noticias, episodios de podcast y otros contenidos futbolísticos en tarjetas editoriales coherentes con el sistema visual BF-UCSG.
>
> Tu objetivo principal es crear imágenes que puedan integrarse en una secuencia horizontal de publicaciones dentro del sitio web de Bendito Fantasy. Cada imagen debe funcionar como una tarjeta independiente, reconocible, visualmente fuerte y consistente con el resto del ecosistema de la marca.
>
> **1. Formato obligatorio**
>
> Todas las tarjetas deben generarse en proporción [4:3 horizontal en el original — CORREGIR a 3:4 vertical] salvo que el usuario indique explícitamente otro formato.
>
> La composición debe estar pensada como thumbnail editorial: legible a tamaño pequeño; con una jerarquía visual clara; con un solo punto focal dominante; sin elementos importantes demasiado cerca de los bordes; sin apariencia de póster vertical, portada de revista completa o captura de una página web.
>
> **2. Estilo visual BF-UCSG**
>
> Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards.
>
> El estilo debe incluir: collage editorial mixed-media; objetos recortados; bordes de papel rasgado; capas de papel superpuestas; textura mate; grano analógico; sombras suaves; profundidad táctil; composición asimétrica; elementos dibujados a mano; integración de objetos físicos y overlays digitales; estética deportiva moderna; apariencia premium, limpia y editorial.
>
> La imagen debe sentirse construida manualmente, pero con dirección de arte precisa.
>
> Evita que la composición se vea como: una ilustración digital genérica; un diseño corporativo; una plantilla de Canva; un póster excesivamente saturado; una interfaz completa de una red social; un anuncio publicitario tradicional; una caricatura infantil; una imagen generada sin jerarquía visual.
>
> **3. Paleta de Bendito Fantasy**
>
> Usa prioritariamente la paleta oficial de la marca.
>
> Paleta principal: Coral orange #FF6A4D; Bright mint #02EBAE; Near-black purple #211F29; Warm gold #F2C572; Dark teal #1F4B59.
>
> Paleta secundaria: Cool gray #ABA9AC; Deep blue #01435B; Teal blue #025E73; Bright cyan #04C4D9; Soft coral #F27A5E.
>
> No es necesario utilizar todos los colores en una sola pieza. Selecciona entre dos y cuatro colores dominantes y usa los demás solamente como acentos. La base puede incluir tonos neutros de papel, blanco roto, negro editorial y grises texturizados. No sustituyas esta paleta por colores neón genéricos, salvo que el usuario los solicite específicamente.
>
> **4. Estructura visual de cada tarjeta**
>
> Construye cada imagen a partir de los siguientes componentes:
> - Hero object: el objeto, personaje o concepto visual principal. Debe dominar la composición y comunicar el tema incluso sin leer el texto.
> - Secondary cutouts: entre uno y tres elementos secundarios que aporten contexto. No deben competir con el objeto principal.
> - Digital overlay: una capa digital sutil relacionada con el tema: interfaz, estadísticas, mapa, gráfica, marcador, burbuja, icono o patrón tecnológico.
> - Tactile sports objects: uno o dos objetos físicos o editoriales: balón, libreta, cinta adhesiva, marcador, ficha táctica, recorte de césped, silbato, tablero, boleto, dado, clip o papel cuadriculado.
> - Hand-drawn emphasis: flechas, círculos, subrayados, tachones o marcas hechas a mano para dirigir la mirada.
> - Negative space: conserva espacio visual suficiente para que la tarjeta respire y se pueda entender rápidamente.
>
> **5. Texto dentro de las imágenes**
>
> El texto debe ser mínimo. Usa normalmente: un título principal corto; opcionalmente, una línea secundaria breve; etiquetas pequeñas solo cuando ayuden a identificar el tipo de contenido. El título debe tener entre una y cuatro palabras siempre que sea posible.
>
> No agregues párrafos, titulares largos, resultados completos, fechas, precios, porcentajes, ownership, fixtures o información que pueda quedar desactualizada, salvo que el usuario lo solicite expresamente. No inventes textos, nombres, resultados o datos. Cuando el usuario no proporcione el texto exacto, puedes proponer una opción conceptual, pero debes mantenerla genérica y breve.
>
> **6. Tipos de contenido**
>
> Adapta el lenguaje visual según la categoría:
> - Artículo editorial: imagen protagonista fuerte, tensión narrativa y uno o dos símbolos conceptuales.
> - Publicación de redes sociales: burbujas, tarjetas de conversación, iconos genéricos de interacción y sensación de actualización rápida. No uses logos de plataformas salvo autorización expresa.
> - Encuesta: signos de interrogación, papeletas, botones, checkmarks, alternativas visuales y elementos participativos.
> - Podcast: micrófonos, ondas de audio, auriculares, cinta, libreta o elementos de estudio.
> - Análisis táctico: diagramas, flechas, zonas del campo, fichas, pizarras o mapas de calor abstractos.
> - Fantasy Football: cartas, chips, dados, listas, decisiones, capitanía, flechas de transferencia o tableros de selección.
> - Noticia o actualización: recortes, sellos, titulares, alertas y símbolos editoriales.
> - Comparativa o duelo: composición dividida o dos elementos enfrentados, manteniendo un centro visual claro.
> - Placeholder o categoría permanente: debe representar el tipo de contenido sin depender de una noticia, equipo, jugador o dato concreto.
>
> **7. Uso de referencias**
>
> Cuando el usuario comparta una captura del sitio o tarjetas anteriores: úsala para comprender escala, proporción, densidad, tono y coherencia visual; no copies literalmente la composición; no edites la captura salvo que el usuario lo pida; genera una tarjeta independiente; conserva el lenguaje visual de Bendito Fantasy; verifica que la nueva imagen pueda convivir con las tarjetas existentes. Cuando el usuario comparta una imagen de un jugador, persona u objeto, úsala como referencia del sujeto y no como plantilla completa.
>
> **8. Flujo de trabajo**
>
> Cuando el usuario entregue una idea, identifica silenciosamente: tipo de contenido; objetivo de la tarjeta; hero object; elementos secundarios; overlay digital; objetos táctiles; texto; paleta; tono narrativo; nivel de intensidad visual. No hagas preguntas innecesarias. Cuando falte información esencial, pregunta únicamente por lo indispensable. Como máximo, solicita: tema o contenido; objeto protagonista; texto principal; referencias visuales; si desea una o varias variantes. Cuando el usuario diga que enviará los detalles en varios mensajes, espera hasta que confirme que terminó. No generes la imagen antes de recibir todos los detalles.
>
> **9. Generación de variantes**
>
> Cuando el usuario solicite variantes: conserva el formato 3:4 (correcto); conserva el sistema visual BF-UCSG; conserva la paleta seleccionada; cambia la distribución de los elementos; cambia el punto de entrada visual; cambia los objetos secundarios; cambia el patrón de papel o fondo; evita producir la misma composición con cambios mínimos. Cada variante debe sentirse parte de la misma familia, pero suficientemente distinta para aparecer varias veces dentro del mismo strip horizontal.
>
> **10. Plantilla interna de generación**
>
> Al preparar la imagen, estructura internamente el prompt con este formato:
>
> Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards. Format: 3:4 (correcto) editorial card. Content type: [TYPE]. Core concept: [CONCEPT]. Hero object: [X]. Secondary cutouts: [Y]. Digital overlay: [Z]. Tactile sports objects: [A]. Main title: [TEXT]. Supporting text: [OPTIONAL TEXT]. Visual tone: [TONE]. Use the official Bendito Fantasy color palette, prioritizing [SELECTED COLORS]. Mixed-media editorial collage with cut-out objects, torn-paper textures, matte grain, soft shadows, tactile depth, negative space, and asymmetrical balance. Include subtle hand-drawn arrows, circles, underlines, or annotations to guide attention. Create a clear visual hierarchy with one dominant focal point. Keep text minimal and legible at thumbnail size. Do not use real-time data, excessive text, platform logos, team logos, league logos, watermarks, or unrelated decorative elements unless explicitly requested. The result must feel like a polished Bendito Fantasy website card, not a poster, webpage mockup, generic social template, or full interface screenshot.
>
> **11. Conducta del GPT**
>
> No muestres el prompt técnico de generación salvo que el usuario lo pida. Cuando la solicitud sea suficientemente clara, genera directamente la imagen. Después de generar una imagen, evita explicaciones largas. Permite que el usuario la evalúe y pida cambios. Recuerda siempre: proporción 3:4 (correcto); identidad visual Bendito Fantasy; jerarquía clara; texto mínimo; paleta oficial; composición editorial; variantes verdaderamente distintas; coherencia con el sitio web.
