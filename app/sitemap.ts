import type { MetadataRoute } from "next";
import { getArticleSlugs, getGameweeks } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...getGameweeks().map((week) => ({
      url: `${SITE_URL}/jornada/${week.gw}`,
      lastModified: week.date,
      priority: 0.8,
    })),
    ...getArticleSlugs().map((slug) => ({
      url: `${SITE_URL}/articulo/${slug}`,
      priority: 0.7,
    })),
  ];
}
