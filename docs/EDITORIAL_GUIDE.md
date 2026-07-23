# Bendito Fantasy — Guía Editorial Multi‑Autor v1.1

## Propósito

Esta guía define el marco editorial común para los artículos de Bendito Fantasy y establece cómo trabajar con múltiples autores sin borrar sus diferencias de voz.

La marca debe conservar una identidad reconocible, pero no todos los textos deben sonar como si hubieran sido escritos por la misma persona.

---

## Principio central

**Bendito Fantasy comparte una identidad editorial, no una sola voz.**

La edición debe proteger dos cosas al mismo tiempo:

1. La claridad, calidad y presentación de la publicación.
2. La visión, personalidad y manera de escribir de cada autor.

No se debe convertir el texto de un colaborador en un artículo de Leo Darutto ni homogeneizar las voces del equipo.

---

## Reglas de marca

Estas reglas aplican a todos los autores:

- El artículo debe tener una idea central identificable.
- El lector debe entender qué ocurrió, qué significa o por qué vale la pena contarlo.
- La información factual debe ser correcta.
- La ortografía, gramática, puntuación y concordancia deben estar revisadas.
- El artículo debe incluir título, descripción, autor, fecha, sección e imagen.
- La versión en inglés debe conservar la intención y personalidad del original.
- Los pull quotes deben representar fielmente la idea del autor.
- El preview de Vercel debe revisarse antes del merge.
- La autoría debe mostrarse exactamente como haya sido acordada con el colaborador.

---

## Reglas de voz

### Artículos de Leo Darutto

Los artículos de Leo pueden recibir una edición profunda de:

- estructura;
- ritmo;
- orden de argumentos;
- claridad;
- desarrollo táctico;
- transiciones;
- apertura y cierre;
- reducción o refuerzo de repeticiones;
- intensidad narrativa.

En estos textos sí aplica plenamente el estilo editorial desarrollado para sus artículos.

### Artículos de colaboradores

En los textos de colaboradores se debe preservar:

- la visión del autor;
- su estructura;
- su ritmo;
- su humor;
- su vocabulario;
- sus expresiones coloquiales;
- su nivel de formalidad;
- la forma en que organiza la información.

La edición normal debe limitarse a:

- ortografía y acentuación;
- gramática;
- puntuación;
- concordancia;
- nombres propios;
- erratas evidentes;
- ambigüedades producidas por un error, no por una decisión estilística.

No se debe:

- reorganizar el texto para acercarlo a la voz de Leo;
- suavizar lenguaje por preferencia editorial;
- eliminar humor, vulgaridad o regionalismos que formen parte de la voz;
- convertir una narración personal en análisis táctico;
- añadir conclusiones o secciones que el autor no escribió;
- reducir repeticiones deliberadas;
- imponer frases aisladas, subtítulos o estructuras habituales de otros autores.

Una edición más profunda solo se realiza cuando el autor o el editor responsable la solicita expresamente.

---

## Perfiles de autor

Cada colaborador debe tener una ficha editorial propia. Como mínimo debe registrar:

- nombre público;
- alias, si aplica;
- forma exacta de la firma;
- tono habitual;
- temas que suele cubrir;
- nivel de edición autorizado;
- uso de lenguaje coloquial o explícito;
- secciones propias;
- criterios particulares para traducción;
- cualquier preferencia acordada con el autor.

### Perfil inicial: Rafa Enciso, El Ñil

- **Firma:** Rafa Enciso, El Ñil.
- **Tipo de voz:** personal, coloquial, humorística, emocional y directa.
- **Nivel de edición:** corrección puntual de ortografía, gramática, puntuación y erratas.
- **Preservar:** lenguaje explícito, mexicanismos, humor, referencias personales y estructura narrativa.
- **No añadir:** Espantapájaros, análisis Fantasy o estructura táctica cuando no formen parte del texto original.

Los siguientes colaboradores deberán añadirse a esta sección conforme publiquen.

---

## Espantapájaros

**Espantapájaros es una sección exclusiva de Leo Darutto.**

No es una sección general de Bendito Fantasy y no debe añadirse a artículos de colaboradores.

En inglés, su equivalente editorial puede aparecer como **Final Whistle**, también únicamente en textos de Leo cuando corresponda.

Los colaboradores pueden tener sus propias secciones recurrentes, pero deben definirse y documentarse por separado.

---

## Estructura

### Para artículos de Leo

La estructura recomendada continúa siendo:

1. Apertura con una idea fuerte.
2. Contexto.
3. Desarrollo.
4. Momentos decisivos.
5. Implicaciones Fantasy, cuando existan.
6. Próximo escenario.
7. Espantapájaros.

Esta estructura es una guía, no una obligación mecánica.

### Para colaboradores

La estructura original del autor tiene prioridad.

Solo debe intervenirse cuando:

- exista un error que impida entender el texto;
- haya información duplicada accidentalmente;
- un párrafo esté incompleto;
- el autor haya pedido ayuda estructural.

---

## Ritmo y formato

El formato visual puede adaptarse para facilitar la lectura sin alterar la voz.

Se permite:

- separar párrafos demasiado extensos;
- aplicar negritas a ideas clave;
- incorporar pull quotes;
- corregir comillas, guiones y signos;
- usar subtítulos cuando ya estén presentes o cuando el autor los apruebe.

No se deben introducir recursos de ritmo propios de otro autor sin autorización.

---

## Pull quotes

Los pull quotes pueden ser:

- citas textuales;
- fragmentos ligeramente condensados;
- síntesis fieles de una idea central.

En artículos de colaboradores deben respetar especialmente el vocabulario y la intención del autor.

No deben hacer que el texto parezca más analítico, solemne o polémico de lo que realmente es.

Cantidad recomendada: entre uno y cuatro, según la longitud y naturaleza del artículo.

---

## Extracto y descripción

Cada artículo debe incluir:

### Extracto de portada

Debe invitar a leer y representar el corazón del texto sin revelar demasiado.

### Descripción para buscadores y redes

Debe identificar:

- autor o protagonista, cuando sea relevante;
- tema central;
- contexto;
- principal promesa del artículo.

Ambos textos pueden ser redactados por el editor, pero no deben atribuir al autor una postura que no aparece en el artículo.

---

## Traducción al inglés

La traducción no debe neutralizar la voz.

Debe conservar, en la medida de lo posible:

- el nivel de informalidad;
- el humor;
- la crudeza;
- el ritmo;
- las referencias culturales;
- la intensidad emocional.

Los mexicanismos o juegos de palabras pueden:

1. traducirse por una expresión equivalente;
2. conservarse con contexto;
3. adaptarse cuando una traducción literal pierda el sentido.

El objetivo no es traducir palabra por palabra, sino reproducir la experiencia del texto.

La versión inglesa debe publicarse en:

`content/articles/<slug>.en.mdx`

La versión española debe publicarse en:

`content/articles/<slug>.mdx`

---

## Metadatos y autoría

El front matter debe incluir:

```yaml
---
title: "Título"
description: "Descripción"
date: "AAAA-MM-DD"
section: "Mundial 2026"
author: "Firma pública exacta"
cover: "/media/players/archivo.png"
---
```

La tarjeta correspondiente debe usar la misma autoría en el campo `credit`.

No se debe sustituir el nombre del autor por “Bendito Fantasy” cuando exista una firma individual.

---

## Imágenes

Las imágenes principales se almacenan actualmente en:

`public/media/players/`

La referencia dentro del artículo y de la tarjeta debe comenzar en:

`/media/players/`

Ejemplo:

`public/media/players/aspe-mexico.png`

se referencia como:

`/media/players/aspe-mexico.png`

Antes del merge se debe confirmar:

- que el archivo existe;
- que el nombre está completamente en minúsculas;
- que la extensión coincide;
- que la ruta es idéntica en el artículo y en la tarjeta;
- que aparece en portada y dentro del artículo;
- que funciona como imagen social cuando corresponda.

---

## Flujo de trabajo

### Artículo de Leo Darutto

1. Investigación.
2. Primer borrador.
3. Edición estructural.
4. Revisión de voz.
5. Formato.
6. Pull quotes.
7. Espantapájaros.
8. Revisión Fantasy.
9. Traducción.
10. Revisión del preview.
11. PR.
12. Merge después de aprobación.

### Artículo de colaborador

1. Recepción del texto original.
2. Confirmación de autoría y firma pública.
3. Definición del nivel de edición autorizado.
4. Corrección ortográfica y gramatical.
5. Revisión y aprobación del texto en español.
6. Extracto, descripción y pull quotes.
7. Selección de imagen.
8. Traducción conservando la voz.
9. Aprobación de la traducción.
10. Preparación técnica.
11. Revisión del preview.
12. PR.
13. Merge después de aprobación.

---

## Checklist GitHub

- Rama: `article/<slug>`
- Archivos habituales:
  - `content/articles/<slug>.mdx`
  - `content/articles/<slug>.en.mdx`
  - `content/specials/m2026.json`
- La imagen puede estar previamente en `main` o incluirse en el PR.
- Confirmar que el `slug` coincide en:
  - nombre de archivo;
  - `payload.slug`;
  - enlace de la tarjeta.
- Confirmar que la autoría coincide en:
  - front matter español;
  - front matter inglés;
  - `credit` de la tarjeta.
- Confirmar que la fecha del especial se actualiza cuando corresponde.
- Revisar el diff antes de abrir el PR.
- Revisar el preview de Vercel antes del merge.
- No hacer merge con una imagen rota o una ruta incorrecta.

---

## Criterio de aprobación

Un artículo multi‑autor está listo cuando:

- se entiende con claridad;
- no contiene errores evitables;
- conserva la voz de quien lo escribió;
- cumple con los requisitos técnicos del sitio;
- la autoría es visible y correcta;
- la traducción se siente escrita por la misma persona en otro idioma;
- el preview funciona en español e inglés;
- la imagen aparece correctamente.

---

## Filosofía editorial

Queremos que un lector reconozca que está leyendo Bendito Fantasy por la calidad, el cuidado y la presentación.

También queremos que pueda reconocer quién escribió cada artículo.

La consistencia de la marca no debe borrar la personalidad de sus autores.
