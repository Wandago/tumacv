import { createClient } from "@supabase/supabase-js";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";
import ArticleBody from "../../../components/ArticleBody";
import { safeJsonLd } from "../../../lib/jsonLd";

// Read-only, unauthenticated client is fine here — articles are publicly
// readable by design (RLS: "articles are public"), and this runs server-side
// at request time, so the HTML Google sees already has the real content in it.
function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getArticle(id) {
  const { data } = await supabasePublic().from("articles").select("*").eq("id", id).single();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Article not found — TumaCV" };
  const description = article.content?.slice(0, 155).replace(/\s+/g, " ").trim() + "…";
  return {
    title: `${article.title} — TumaCV`,
    description,
    openGraph: { title: article.title, description, type: "article", publishedTime: article.created_at },
    twitter: { card: "summary", title: article.title, description },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return (
      <Layout
        height="auto"
        contentWidth={680}
        content={
          <LayoutContent padding={6} isScrollable={false}>
            <VStack gap={2}>
              <Heading level={1}>Article not found</Heading>
              <Text color="secondary">It may have been removed. <Link href="/news">Browse all articles →</Link></Text>
            </VStack>
          </LayoutContent>
        }
      />
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.created_at,
    dateModified: article.created_at,
    articleSection: article.industry,
    author: { "@type": "Organization", name: "TumaCV" },
    publisher: { "@type": "Organization", name: "TumaCV" },
  };

  return (
    <Layout
      height="auto"
      contentWidth={720}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          {/* eslint-disable-next-line react/no-danger */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
          <VStack gap={6}>
            <Link href="/news">← All articles</Link>
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <Token label={article.industry} size="sm" color="pink" />
                <Text type="supporting" color="secondary">
                  {new Date(article.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </HStack>
              <Heading level={1} type="display-3" textWrap="balance">{article.title}</Heading>
            </VStack>
            <ArticleBody content={article.content} />
            <Card variant="muted" padding={5}>
              <VStack gap={2}>
                <Heading level={3}>Put it into practice</Heading>
                <Text>Tailor your CV and cover letter to a real job posting in about a minute.</Text>
                <Link href="/">Try TumaCV free →</Link>
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
