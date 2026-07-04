"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Lang, Localized, TagKey } from "./types";

/** UI chrome strings. Add a key here + both translations = done (SPEC §5). */
export const STRINGS = {
  tagline: {
    es: "Fantasy Premier League en español, cada jornada.",
    en: "Fantasy Premier League in Spanish, every gameweek.",
  },
  thisWeek: { es: "Esta semana", en: "This week" },
  entries: { es: "ENTRADAS", en: "ITEMS" },
  readMore: { es: "Leer más", en: "Read more" },
  close: { es: "Cerrar", en: "Close" },
  previous: { es: "Anterior", en: "Previous" },
  next: { es: "Siguiente", en: "Next" },
  play: { es: "Reproducir", en: "Play" },
  menu: { es: "Menú", en: "Menu" },
  search: { es: "Buscar", en: "Search" },
  copyLink: { es: "Copiar enlace", en: "Copy link" },
  copied: { es: "Copiado", en: "Copied" },
  shareOnX: { es: "Compartir en X", en: "Share on X" },
  shareOnWhatsApp: { es: "Compartir en WhatsApp", en: "Share on WhatsApp" },
  viewOnX: { es: "Ver en X", en: "View on X" },
  backHome: { es: "Volver al inicio", en: "Back to home" },
  scrollLeft: { es: "Desplazar a la izquierda", en: "Scroll left" },
  scrollRight: { es: "Desplazar a la derecha", en: "Scroll right" },
  languageToggle: { es: "Cambiar idioma", en: "Switch language" },
  featuredPodcast: { es: "Podcast de la semana", en: "Podcast of the week" },
  embedUnavailable: {
    es: "No se pudo cargar la publicación.",
    en: "The post could not be loaded.",
  },
  dataTable: { es: "Tabla de datos", en: "Data table" },
  chartFigure: { es: "Gráfico", en: "Chart" },
  season: { es: "Temporada", en: "Season" },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

/** Localized category tag names (SPEC §5). */
export const TAG_NAMES: Record<TagKey, Localized> = {
  podcast: { es: "Podcast", en: "Podcast" },
  article: { es: "Artículo", en: "Article" },
  data: { es: "Datos", en: "Data" },
  chart: { es: "Gráfico", en: "Chart" },
  video: { es: "Vídeo", en: "Video" },
  social: { es: "Social", en: "Social" },
  quote: { es: "Cita", en: "Quote" },
  mvp: { es: "MVP", en: "MVP" },
};

const STORAGE_KEY = "bendito-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** translate a UI string */
  t: (key: StringKey) => string;
  /** pick a localized field off content */
  l: (value: Localized) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Spanish is the default (SPEC §5); localStorage / ?lang override after mount.
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("lang");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = param === "en" || param === "es" ? param : stored;
    if (initial === "en" || initial === "es") setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback((key: StringKey) => STRINGS[key][lang], [lang]);
  const l = useCallback((value: Localized) => value[lang], [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, l }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

/** Format an ISO date for display in the active language. */
export function formatDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
}
