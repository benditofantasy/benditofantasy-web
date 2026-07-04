import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticle, getArticleSlugs } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/articulo/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      authors: [article.author],
    },
  };
}

/** Full article page (SPEC §3): MDX body with editorial styling. */
export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-8 sm:pt-36">
      <p className="text-xs font-semibold uppercase tracking-kicker text-ink-soft">
        {article.section ?? `Jornada ${article.gw}`} · {article.author}
      </p>
      <h1 className="mt-4 font-display uppercase leading-[0.9] tracking-display text-accent [font-size:clamp(2.5rem,7vw,5.5rem)]">
        {article.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-mid">{article.description}</p>
      {article.cover && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-tile bg-line">
          <Image
            src={article.cover}
            alt={article.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      )}
      <article className="prose-editorial mt-10">
        <MDXRemote source={article.body} />
      </article>
      <Link
        href="/"
        className="mt-14 inline-block text-sm font-semibold uppercase tracking-kicker text-ink-mid underline underline-offset-4 hover:text-accent"
      >
        ← Bendito Fantasy
      </Link>
    </main>
  );
}
