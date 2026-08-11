"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { EXPERIENCE_LEVELS } from "../../lib/gamification";

const LEVEL_LABEL = Object.fromEntries(EXPERIENCE_LEVELS.map((l) => [l.id, l.label]));

export default function HubClient() {
  const [profiles, setProfiles] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabaseBrowser().from("hub_profiles").select("*").order("updated_at", { ascending: false }).limit(300)
      .then(({ data }) => setProfiles(data || []));
  }, []);

  const industriesPresent = profiles ? [...new Set(profiles.map((p) => p.industry).filter(Boolean))] : [];
  const filtered = profiles ? profiles.filter((p) => filter === "all" || p.industry === filter) : null;

  return (
    <main className="shell wide">
      <Nav />
      <section className="hero" style={{ paddingBottom: 6 }}>
        <span className="eyebrow">Open to work</span>
        <h1>Talent Hub</h1>
        <p>
          Kenyan job seekers who've opted in to be discovered — browse by industry, or come back
          here after posting a job on the <a href="/jobs">jobs board</a>.
        </p>
      </section>

      {profiles && profiles.length > 0 && (
        <div className="news-filter-row">
          <button className={`news-filter-chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All</button>
          {industriesPresent.map((i) => (
            <button key={i} className={`news-filter-chip ${filter === i ? "on" : ""}`} onClick={() => setFilter(i)}>{i}</button>
          ))}
        </div>
      )}

      {filtered === null ? (
        <div className="loading"><span className="spinner" /> Loading profiles…</div>
      ) : filtered.length === 0 && profiles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <p className="step-hint">No one has joined the Talent Hub yet — be the first.</p>
          <a className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 10 }} href="/dashboard">
            Join from your dashboard
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <p className="step-hint" style={{ padding: "30px 0" }}>No one in this industry yet.</p>
      ) : (
        <div className="hub-grid">
          {filtered.map((p) => (
            <div key={p.id} className="hub-profile-card">
              <div className="hub-profile-name">{p.display_name}</div>
              <div className="hub-profile-title">{p.title}</div>
              <div className="hub-profile-meta">
                {[p.industry, p.experience_level ? LEVEL_LABEL[p.experience_level] : null].filter(Boolean).join(" · ")}
              </div>
              {p.blurb && <div className="hub-profile-blurb">{p.blurb}</div>}
              {(p.skills || []).length > 0 && (
                <div className="hub-profile-skills">
                  {p.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
