import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/build-search-index";

/**
 * The site-wide search index, consumed lazily by the search overlay. Content
 * only changes via commits (Vercel rebuilds on every push), so the index is
 * baked at build time.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(buildSearchIndex());
}
