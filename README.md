# Bendito Fantasy

Blog de Fantasy Premier League en español con la gramática visual de *The Body Issue* de ESPN:
filas = jornadas, tiles = contenido mixto (pódcast, artículos, datos, gráficos, vídeos, tweets,
imágenes, citas), y un lightbox "explotado" a pantalla completa con navegación ←/→.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · MDX. Contenido = archivos en git.

## Arrancar en local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

## Dónde vive cada cosa

| Qué | Dónde |
| --- | --- |
| Tokens de marca (colores, tipografías, motion) | `styles/tokens.css` + `tailwind.config.ts` + `app/fonts.ts` — **todo PLACEHOLDER hasta que llegue el design system** |
| Jornadas y tiles | `content/gameweeks/gw-NN.json` |
| Cuerpos de artículos (MDX) | `content/articles/*.mdx` |
| Imágenes | `public/media/` |
| Textos de interfaz ES/EN | `lib/i18n.tsx` (`STRINGS`) |
| Layouts del lightbox | `components/slides/` |

## Añadir una jornada (flujo semanal — sin tocar componentes)

1. **Copia** `content/gameweeks/gameweek.template.json` → `content/gameweeks/gw-NN.json`.
   Rellena `gw`, `label`, `date` y los tiles (borra los que no uses y las claves `_comment`).
   El pódcast va **primero** con `"featured": true`. Los `id` deben ser únicos (`gwNN-…`) —
   son los deep-links (`/?item=<id>`).
2. **Artículos:** crea `content/articles/<slug>.mdx` con frontmatter
   (`title`, `description`, `date`, `gw`, `author`, `cover`) y apunta el tile
   (`payload.slug` y `link.href: /articulo/<slug>`).
3. **Medios:** añade las portadas a `public/media/` y referencia la ruta en `cover`.
   (Para maquetas rápidas: `node scripts/generate-placeholder-media.mjs` genera portadas
   placeholder para cualquier tile que exista en los JSON.)
4. **Rey de la jornada (opcional):** en cuanto se confirme el ganador, añade un tile
   `type: "mvp"` (ver ejemplo en el template) con su retrato en `public/media/players/`.
   Sin `points` no aparece el trofeo — nunca inventes una cifra sin verificar.
5. `git add -A && git commit -m "Jornada NN" && git push` → Vercel despliega solo.

La jornada nueva aparece arriba automáticamente (se ordena por `gw` descendente).

## Sustituir la marca placeholder

Cuando llegue el design system de claude.ai/design:

1. Reemplaza los valores marcados `PLACEHOLDER` en `styles/tokens.css`
   (el rojo `--color-accent` es *el* color: todo lo que hoy es rojo pasa a ser el acento real).
2. Cambia las fuentes en `app/fonts.ts` (display condensada + sans de texto).
3. Sustituye el logo en `components/Header.tsx` y `app/icon.svg`.

Nada más: ningún componente tiene valores de marca hardcodeados.

## Deploy (cuando toque)

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo (framework:
   Next.js, cero configuración).
3. Añade la variable de entorno `NEXT_PUBLIC_SITE_URL=https://tudominio.com`.
4. Conecta el dominio (hoy en Squarespace) desde **Settings → Domains**.

## Notas

- Los `youtubeId` de los datos placeholder son falsos (`PLACEHOLDER_…`): el player muestra la
  portada con el botón de play y carga el iframe al pulsar — sustitúyelos por IDs reales.
- Los tweets se renderizan como tarjeta propia (sin script de X), con enlace al post original:
  nunca rompen la página aunque el post no exista.
- ES/EN: toggle en la cabecera; español por defecto; la elección persiste en `localStorage`.
