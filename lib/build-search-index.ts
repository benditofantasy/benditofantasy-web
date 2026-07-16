import "server-only";
import {
  getArticle,
  getArticleSlugs,
  getGameweeks,
  getSeasons,
  getSpecialRows,
} from "./content";
import type { SearchRecord } from "./search";
import { getSlides, type ArticlePayload, type Row } from "./types";

/**
 * Everything published, as flat search records: MDX articles first (their
 * frontmatter is richer than the article *tiles* that point at them, which
 * are skipped), then every tile of every row — gameweeks, specials and
 * rolled-up seasons — flattened through getSlides so mvp-nested tiles are
 * reachable, same as findTile.
 */
export function buildSearchIndex(): SearchRecord[] {
  const records: SearchRecord[] = [];

  const articleSlugs = new Set(getArticleSlugs());
  for (const slug of articleSlugs) {
    const es = getArticle(slug, "es");
    if (!es) continue;
    const en = getArticle(slug, "en");
    records.push({
      id: `article:${slug}`,
      section: "article",
      title: { es: es.title, en: en?.title ?? es.title },
      description: { es: es.description, en: en?.description ?? es.description },
      date: es.date,
      url: `/articulo/${slug}`,
      cover: es.cover,
    });
  }

  const rows: Row[] = [...getGameweeks(), ...getSpecialRows(), ...getSeasons()];
  const seenTileIds = new Set<string>();
  for (const row of rows) {
    for (const { tile } of row.tiles.flatMap(getSlides)) {
      if (seenTileIds.has(tile.id)) continue;
      seenTileIds.add(tile.id);
      // an article tile is just a pointer to an MDX article already indexed above
      if (tile.type === "article" && articleSlugs.has((tile.payload as ArticlePayload).slug)) {
        continue;
      }
      records.push({
        id: tile.id,
        section: tile.tag,
        title: tile.title,
        description: tile.description,
        date: tile.date ?? row.date,
        url: `/?item=${tile.id}`,
        cover: tile.cover,
      });
    }
  }

  return records;
}
