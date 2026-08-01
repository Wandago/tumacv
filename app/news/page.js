"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function News() {
  const [articles, setArticles] = useState(null);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    supabaseBrowser()
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => setArticles(data || []));
  }, []);

  const industries = ["All", ...new Set((articles || []).map((a) => a.industry))];
  const shown = filter === "All" ? articles : (articles || []).filter((a) => a.industry === filter);

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>Kenya job market news</h2>
      </div>
      <p className="step-hint">
        Fresh, AI-written insights on hiring trends and in-demand skills by industry — refreshed daily.
      </p>

      {articles && articles.length > 0 && (
        <div className="news-filter-row">
          {industries.map((i) => (
            <button key={i} className={`news-filter-chip ${filter === i ? "on" : ""}`} onClick={() => setFilter(i)}>
              {i}
            </button>
          ))}
        </div>
      )}

      {articles === null ? (
        <div className="loading"><span className="spinner" /> Loading articles…</div>
      ) : shown.length === 0 ? (
        <p className="step-hint" style={{ padding: "30px 0" }}>
          No articles yet — check back soon, new ones are published daily.
        </p>
      ) : (
        <div className="news-grid">
          {shown.map((a) => (
            <button key={a.id} className="news-card" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <span className="news-industry">{a.industry}</span>
              <h3>{a.title}</h3>
              <p className="news-meta">
                {new Date(a.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {open === a.id && <p className="news-body">{a.content}</p>}
              {open !== a.id && <p className="news-preview">{a.content.slice(0, 140)}…</p>}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
