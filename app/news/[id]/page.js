import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Nav from "../../../components/Nav";
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
      <main className="shell">
        <Nav />
        <div className="step">
          <h1>Article not found</h1>
          <p className="step-hint">It may have been removed. <Link href="/news">Browse all articles →</Link></p>
        </div>
      </main>
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
    <main className="shell">
      <Nav />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="hero hero-band hero-band-compact">
        <div className="results-head">
          <Link href="/news" className="btn-ghost" style={{ textDecoration: "none" }}>← All articles</Link>
        </div>
        <span className="news-industry">{article.industry}</span>
        <h1 className="news-reader-title">{article.title}</h1>
        <div className="news-meta">
          {new Date(article.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </section>
      <div className="step">
        <div className="news-reader-body">{article.content}</div>
      </div>
    </main>
  );
}
