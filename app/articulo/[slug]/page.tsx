import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import ArticleLanguageView from "@/components/ArticleLanguageView";
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

  // Prefer the article tile cover for share previews; fall back to the default brand card.
  const shareImage: string =
    article.cover && /\.(jpe?g|png|webp|gif|avif)$/i.test(article.cover)
      ? article.cover
      : "/brand/social-share.jpg";

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/articulo/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: `/articulo/${article.slug}`,
      images: [{ url: shareImage, alt: article.title }],
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [shareImage],
    },
  };
}

/** Full article page (SPEC section 3): MDX body with editorial styling. */
export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  const englishArticle = getArticle(slug, "en");
  if (!article) notFound();

  return (
    <ArticleLanguageView
      es={article}
      en={englishArticle}
      esBody={<MDXRemote source={article.body} />}
      enBody={englishArticle ? <MDXRemote source={englishArticle.body} /> : undefined}
    />
  );
}
