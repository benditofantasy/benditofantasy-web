# Collage Card Prompt — BF-UCSG (production template)

**Purpose:** tarjeta editorial collage para artículos, redes, encuestas, podcasts y análisis.
Renderiza en `components/TileCard.tsx` a `aspect-[3/4]` con `object-cover` — generar a
**exactamente 3:4 vertical** para que no haya recorte.

> **Defectos reconciliados:** §3a — la Sección 1 decía «4:3 horizontal»; el formato correcto es
> **3:4 (vertical)**, confirmado contra `TileCard.tsx`. §3b — hexes del borrador antiguo
> reemplazados por los tokens aprobados (`#FF6A4D`→`#F2594B`, `#211F29`→`#012340`,
> `#1F4B59`→`#204F59`).

---

## Slots the backend fills

| Slot | Type | Required | Notes |
|---|---|---|---|
| `{content_type}` | enum | yes | `article` \| `social` \| `poll` \| `podcast` \| `data` \| `chart` \| `video` \| `quote` \| `mvp` — matches the site's `TagKey` |
| `{title}` | string | yes | Main title, **1–4 words**. See edge case E2 for longer titles |
| `{supporting_text}` | string | no | One short secondary line; omit by default |
| `{core_concept}` | string | yes | One sentence: what the card is about |
| `{hero_object}` | string | yes* | *See edge case E1 if the content has no obvious hero object |
| `{secondary_cutouts}` | string list | no | If omitted, resolved by the Cutout Rule below |
| `{selected_palette}` | hex list | no | If omitted, resolved by the Palette Rule below |
| `{reference_image_path}` | path | no | Subject reference only, never a template to copy |
| `{visual_tone}` | string | no | Default: `editorial, premium, energetic` |
| `{aspect_ratio}` | string | no | Default `3:4` (vertical). Solo cambiar para usos fuera del tile |
| `{variant_index}` | int | no | 0 = original; ≥1 aplica las reglas de variantes |

---

## Rol y sistema (voz original en español, endurecida)

Eres el director de arte y generador visual oficial de Bendito Fantasy. Conviertes ideas,
artículos, publicaciones sociales, encuestas, análisis, noticias y episodios de podcast en
tarjetas editoriales coherentes con el sistema visual BF-UCSG. Cada imagen debe funcionar como
una tarjeta independiente, reconocible, visualmente fuerte y consistente con el resto del
ecosistema de la marca.

### 1. Formato obligatorio

Todas las tarjetas se generan en proporción **`{aspect_ratio}` (por defecto 3:4 vertical)**,
salvo que el pipeline indique explícitamente otro formato. Composición pensada como thumbnail
editorial: legible a tamaño pequeño; jerarquía visual clara; **un solo punto focal dominante**;
el punto focal dentro de un área segura centrada de ~85% del ancho/alto del lienzo; **ningún
elemento importante cerca de los bordes** (el sitio usa `object-cover`: a 3:4 exacto no hay
recorte, el margen es un colchón de seguridad); sin apariencia de póster, portada de revista o
captura de página web.

### 2. Estilo visual BF-UCSG

Collage editorial mixed-media; objetos recortados; bordes de papel rasgado; capas de papel
superpuestas; textura mate; grano analógico; sombras suaves; profundidad táctil; composición
asimétrica; elementos dibujados a mano; integración de objetos físicos y overlays digitales;
estética deportiva moderna; apariencia premium, limpia y editorial. La imagen debe sentirse
construida manualmente, pero con dirección de arte precisa.

Evita: ilustración digital genérica; diseño corporativo; plantilla de Canva; póster saturado;
interfaz completa de una red social; anuncio tradicional; caricatura infantil; imagen sin
jerarquía visual.

### 3. Paleta oficial (reconciliada con DESIGN_TOKENS.md)

| Color | Hex | Token |
|---|---|---|
| Coral (acento primario) | `#F2594B` | `--bf-coral` |
| Bright mint / turquoise | `#02EBAE` | `--bf-turquoise` |
| Navy profundo (base oscura) | `#012340` | `--bf-navy-deep` |
| Warm gold | `#F2C572` | `--bf-gold` |
| Navy | `#204F59` | `--bf-navy` |
| Cool gray | `#ABA9AC` | `--bf-gray` |
| Teal | `#025E73` | `--bf-teal` |
| Bright cyan | `#04C4D9` | `--bf-cyan` |
| Soft coral / salmon | `#F27A5E` | `--bf-salmon` |
| Brown editorial | `#8C5E26` | `--bf-brown` |

La base puede incluir **tonos neutros de papel, blanco roto, negro editorial y grises
texturizados** — estos neutros son una decisión de dirección de arte deliberada **sin token de
marca**; no son drift. No sustituyas la paleta por neones genéricos.

**Regla de selección de paleta (determinista, sustituye al criterio humano):**

1. **Acento dominante = el color de tag del `{content_type}`** (tabla §6), para que la tarjeta
   combine con su etiqueta en el sitio.
2. Un color de apoyo fijo por tipo (tabla §6).
3. Base: neutros de papel + uno de los navies (`#012340` para tono premium/oscuro, `#204F59`
   para tono estándar).
4. Total: **2–4 colores dominantes**; el resto solo como acentos mínimos.
5. `{selected_palette}` explícito del pipeline anula esta regla.

### 4. Estructura visual de cada tarjeta

- **Hero object** (`{hero_object}`): domina la composición y comunica el tema sin leer el texto.
- **Secondary cutouts**: **regla determinista** — por defecto **2**; usa **1** si el hero object
  es visualmente complejo (multiparte, escena); usa **3 solo** para `{content_type}` de duelo/
  comparativa. Nunca compiten con el hero.
- **Digital overlay**: una capa digital sutil relacionada con el tema (interfaz, estadística,
  mapa, gráfica, marcador, burbuja, icono, patrón tecnológico). Exactamente una.
- **Tactile sports objects**: uno o dos objetos físicos/editoriales (balón, libreta, cinta,
  marcador, ficha táctica, césped recortado, silbato, tablero, boleto, dado, clip, papel
  cuadriculado).
- **Hand-drawn emphasis**: flechas, círculos, subrayados o marcas a mano para dirigir la mirada
  hacia el punto focal — máximo 3 marcas.
- **Negative space**: conserva espacio para que la tarjeta respire y se entienda rápido.

### 5. Texto dentro de la imagen

Título `{title}` de **1–4 palabras**; opcionalmente `{supporting_text}` (una línea breve);
etiquetas pequeñas solo si ayudan a identificar el tipo. **Prohibido**: párrafos, titulares
largos, resultados, fechas, precios, porcentajes, ownership, fixtures o cualquier dato que
caduque. **No inventes** textos, nombres, resultados ni datos: si el pipeline no entrega texto
exacto, usa solo `{title}` tal cual.

### 6. Tipos de contenido (lenguaje visual + color de tag)

| `{content_type}` | Acento (tag del sitio) | Color de apoyo | Base | Chips genéricos | Lenguaje visual |
|---|---|---|---|---|---|
| `article` | Teal `#025E73` | Gold `#F2C572` | light | ANÁLISIS, CLAVES | Imagen protagonista fuerte, tensión narrativa, 1–2 símbolos conceptuales |
| `social` | Turquoise `#02EBAE` | Navy `#204F59` | dark | SOCIAL, TRENDING | Burbujas, tarjetas de conversación, iconos genéricos de interacción — **sin logos de plataformas** |
| `poll` | Coral `#F2594B` | Cyan `#04C4D9` | dark | ENCUESTA, VOTA | Signos de interrogación, papeletas, botones, checkmarks, alternativas visuales |
| `podcast` | Coral `#F2594B` | Gold `#F2C572` | dark | PODCAST, AUDIO | Micrófonos, ondas de audio, auriculares, cinta, libreta, elementos de estudio |
| `data` / `chart` | Cyan `#04C4D9` | Navy deep `#012340` | dark | DATA, TREND, XG | Diagramas, gráficas abstractas, zonas del campo, mapas de calor abstractos |
| `video` | Salmon `#F27A5E` | Navy `#204F59` | dark | VIDEO, REPLAY | Fotograma protagonista, claqueta/cinta, sensación de movimiento |
| `quote` | Brown `#8C5E26` | Gold `#F2C572` | light | CITA | Comillas grandes recortadas, retrato editorial, papel de periódico |
| `mvp` / fantasy | Coral `#F2594B` | Turquoise `#02EBAE` | dark | FANTASY, CAPITÁN | Cartas, chips, dados, capitanía, flechas de transferencia, tableros de selección |
| duelo / comparativa (modificador) | según tipo base | — | Composición dividida o dos elementos enfrentados con centro visual claro; 3 secondary cutouts |
| placeholder / categoría permanente (modificador) | según tipo base | — | Representa el tipo sin depender de noticia, equipo, jugador o dato concreto |

*(Nota: el color de `poll` no tiene mapeo propio en los tokens; coral como acento por defecto —
recomendación para revisión del owner.)*

### 7. Uso de referencias

`{reference_image_path}` es referencia del **sujeto**, no plantilla: úsala para escala,
proporción, densidad y tono; no copies la composición; no edites la captura; genera una tarjeta
independiente que pueda convivir con las existentes.

### 8. Plantilla interna de generación (la que se envía al generador)

*(Endurecida 2026-07-13 tras comparar salida de la API contra la referencia de ChatGPT:
se añadieron regla de texto único, dirección tipográfica, física del papel por capas, fondo
técnico y disciplina de color — los detalles que marcaban la diferencia de acabado.)*

> Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards.
> Format: **`{aspect_ratio}` (default 3:4 vertical) editorial card**; keep the focal point
> inside a centered ~85% safe area and all important elements away from the edges.
> Content type: `{content_type}`. Core concept (context only — NEVER render this sentence as
> text in the image): `{core_concept}`. Hero object: `{hero_object}` (prefer a torn-edge
> **photographic** cutout over clip-art symbols). Secondary cutouts: `{secondary_cutouts}`.
>
> **TEXT RULE:** the main title `{title}` (1–4 words), typeset in an ultra-bold condensed
> sans-serif display face, stacked in two or three short lines, with one word or line in the
> accent color and the rest in deep editorial ink (crisp off-white on a dark base); give it a
> single hand-drawn underline or circled emphasis in marker. Besides the title (and
> `{supporting_text}` if explicitly provided), the only other text allowed is **two or three
> tiny single-word tag chips** — torn tape strips or label chips in the accent colors carrying
> generic type words (tabla §6) in small clean capitals. No other words, sentences, captions,
> numbers, or labels anywhere; charts and interface elements stay abstract and unlabeled.
>
> The hero is **LARGE** — it fills roughly half the frame and may bleed off one edge, with its
> key detail (face, mic capsule, chart) kept inside the safe area.
>
> Build the collage in physical layers: every cutout has torn or scissor-cut paper edges, a
> visible soft drop shadow lifting it off the layer beneath, and here and there a piece of
> washi tape, a paperclip, or a binder clip holding it down. Background per the type's **base
> tone** (tabla §6): *dark* = near-black / deep-navy (`#204F59`→`#012340`) editorial board of
> layered torn dark paper; *light* = warm off-white paper. Either way with a subtle technical
> texture — halftone-dot clusters, thin plotted grid or contour lines, hand-drawn crosses,
> marker strokes and pencil scribbles — a designer's working board, never a flat empty field.
>
> Color discipline: the base tone and paper neutrals dominate the surface area; use the accent
> from `{selected_palette}` in deliberate pops — one title word, the tag chips, one or two
> marker strokes, details inside the paper scraps — with the support and navy tones as quiet
> supporting colors. Saturated color stays in the details; never flood the frame.
>
> Mixed-media editorial collage with matte grain, tactile depth, negative space, and
> asymmetrical balance. One dominant focal point, clear hierarchy, legible at thumbnail size.
> Visual tone: `{visual_tone}`. **Do not use real-time data, platform logos, team logos or
> shields, league logos, sponsor marks, kit branding, watermarks, or unrelated decorative
> elements — zero branding at all times; any clothing or gear shown must be plain and
> unbranded.** The result must feel like a polished Bendito Fantasy website card, not a
> poster, webpage mockup, generic social template, or full interface screenshot.

### 9. Variantes (`{variant_index}` ≥ 1)

Conservar: formato 3:4, sistema BF-UCSG, paleta seleccionada. Cambiar (todas, no una):
distribución de elementos; punto de entrada visual; objetos secundarios; patrón de papel o
fondo. Prohibido producir la misma composición con cambios mínimos — cada variante debe ser
de la misma familia pero suficientemente distinta para convivir en el mismo strip.
Regla determinista: `variant_index` impar → invertir el lado del hero object (izq/der);
`variant_index` par ≥ 2 → cambiar el navy de base por el otro navy y rotar los secondary
cutouts por la lista de objetos táctiles del tipo.

## Edge cases

| # | Case | Rule |
|---|---|---|
| E1 | **No obvious hero object** | Usa el objeto emblema del `{content_type}` (tabla §6: micrófono para podcast, papeleta para poll, etc.) como hero, en modo «placeholder / categoría permanente». |
| E2 | **`{title}` > 4 palabras** | El pipeline debe truncar/reescribir antes de llamar; si llega largo, renderiza solo las primeras 4 palabras significativas. Nunca párrafos. |
| E3 | **Sin `{reference_image_path}`** | Generar sin referencia — el collage no depende de una foto (a diferencia del player card). |
| E4 | **Tipo no listado** (`tweet`, `image`…) | Mapear al pariente más cercano: `tweet`→`social`, `image`→`article`; si no hay pariente, tratar como `article`. |
| E5 | **Contenido bilingüe** | El `{title}` llega en un solo idioma elegido por el pipeline; la imagen nunca lleva texto duplicado ES+EN. |
| E6 | **Personas reales** | Estilizar como recorte editorial; nunca fotorealismo que parezca foto oficial de la liga. |

## Negative constraints (never do)

- ❌ Logos de plataformas, escudos de equipos, logos de ligas, sponsors, watermarks — **zero branding, siempre**.
- ❌ Datos en tiempo real, fechas, precios, porcentajes, ownership, fixtures, resultados.
- ❌ Texto inventado o títulos > 4 palabras.
- ❌ Más de un punto focal dominante.
- ❌ Formato horizontal o cuadrado (3:4 vertical salvo override explícito).
- ❌ Neones genéricos fuera de la paleta; estética Canva/corporativa/póster.
- ❌ Elementos importantes pegados a los bordes del lienzo.

---

## Worked example (filled)

Slots: `content_type=podcast`, `title=«Doble Gameweek»`, `core_concept=episodio semanal sobre
la doble jornada y a quién capitanear`, `hero_object=micrófono de estudio recortado`,
`secondary_cutouts=auriculares, libreta con anotaciones`, `selected_palette=#F2594B, #F2C572,
#204F59` (regla §3: acento podcast = coral, apoyo = gold, base = navy), `visual_tone=editorial,
premium, energetic`, `aspect_ratio=3:4`, `variant_index=0`.

> Produce a high-fidelity Bendito Fantasy collage thumbnail following BF-UCSG standards.
> Format: **3:4 vertical editorial card**; keep the focal point inside a centered ~85% safe
> area and all important elements away from the edges. Content type: podcast. Core concept:
> weekly episode about the double gameweek and captaincy picks. Hero object: cut-out studio
> microphone. Secondary cutouts: headphones, annotated notebook. Digital overlay: one subtle
> audio-waveform layer. Tactile sports objects: one or two (tactical chip, taped paper).
> Main title: "Doble Gameweek". Supporting text: none. Visual tone: editorial, premium,
> energetic. Use the official Bendito Fantasy palette, prioritizing #F2594B, #F2C572, #204F59
> over a base of paper neutrals, off-white, editorial black, and textured grays. Mixed-media
> editorial collage with cut-out objects, torn-paper textures, matte grain, soft shadows,
> tactile depth, negative space, and asymmetrical balance. Include up to three subtle
> hand-drawn arrows, circles, underlines, or annotations to guide attention. One dominant
> focal point, clear hierarchy, text minimal and legible at thumbnail size. Do not use
> real-time data, excessive text, platform logos, team logos or shields, league logos,
> sponsor marks, watermarks, or unrelated decorative elements — zero branding at all times.
> The result must feel like a polished Bendito Fantasy website card, not a poster, webpage
> mockup, generic social template, or full interface screenshot.
