"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function News() {
  const [articles, setArticles] = useState(null);
  const [filter, setFilter] = useState("all");
  const [reading, setReading] = useState(null);

  useEffect(() => {
    supabaseBrowser().from("articles").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setArticles(data || []));
  }, []);

  const industriesPresent = articles ? [...new Set(articles.map((a) => a.industry))] : [];
  const filtered = articles ? articles.filter((a) => filter === "all" || a.industry === filter) : null;

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>News & insights</h2>
      </div>
      <p className="step-hint">
        Fresh, specific career guidance for the Kenyan job market — written daily, one article at a time.
      </p>

      {articles && articles.length > 0 && (
        <div className="news-filter-row">
          <button className={`news-filter-chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All</button>
          {industriesPresent.map((i) => (
            <button key={i} className={`news-filter-chip ${filter === i ? "on" : ""}`} onClick={() => setFilter(i)}>{i}</button>
          ))}
        </div>
      )}

      {filtered === null ? (
        <div className="loading"><span className="spinner" /> Loading articles…</div>
      ) : filtered.length === 0 ? (
        <p className="step-hint" style={{ padding: "30px 0" }}>
          No articles yet — check back soon, new ones are published daily.
        </p>
      ) : (
        <div className="news-grid">
          {filtered.map((a) => (
            <button key={a.id} className="news-card" onClick={() => setReading(a)}>
              <span className="news-industry">{a.industry}</span>
              <h3>{a.title}</h3>
              <div className="news-meta">
                {new Date(a.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="news-preview">{a.content?.slice(0, 160)}…</div>
              <span className="news-read-more">Read full article →</span>
            </button>
          ))}
        </div>
      )}

      {reading && (
        <div className="modal-overlay" onClick={() => setReading(null)}>
          <div className="modal-panel news-reader-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReading(null)} aria-label="Close">✕</button>
            <span className="news-industry">{reading.industry}</span>
            <h1 className="news-reader-title">{reading.title}</h1>
            <div className="news-meta" style={{ marginBottom: 18 }}>
              {new Date(reading.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div className="news-reader-body">{reading.content}</div>
          </div>
        </div>
      )}
    </main>
  );
}
