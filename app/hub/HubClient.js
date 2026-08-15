"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { EXPERIENCE_LEVELS } from "../../lib/gamification";
import { SERVICE_CATEGORIES } from "../../lib/serviceCategories";

const LEVEL_LABEL = Object.fromEntries(EXPERIENCE_LEVELS.map((l) => [l.id, l.label]));

export default function HubClient() {
  const [view, setView] = useState("people");

  const [profiles, setProfiles] = useState(null);
  const [filter, setFilter] = useState("all");

  const [services, setServices] = useState(null);
  const [serviceCategory, setServiceCategory] = useState("all");
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceSort, setServiceSort] = useState("newest");

  useEffect(() => {
    supabaseBrowser().from("hub_profiles").select("*").order("updated_at", { ascending: false }).limit(300)
      .then(({ data }) => setProfiles(data || []));
  }, []);

  useEffect(() => {
    if (view !== "services" || services !== null) return;
    supabaseBrowser()
      .from("hub_services")
      .select("*, hub_profiles(display_name, title)")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => setServices(data || []));
  }, [view, services]);

  const industriesPresent = profiles ? [...new Set(profiles.map((p) => p.industry).filter(Boolean))] : [];
  const filtered = profiles ? profiles.filter((p) => filter === "all" || p.industry === filter) : null;

  const categoriesPresent = services ? SERVICE_CATEGORIES.filter((c) => services.some((s) => s.category === c)) : [];
  let filteredServices = services
    ? services.filter((s) => {
        if (serviceCategory !== "all" && s.category !== serviceCategory) return false;
        if (!serviceQuery.trim()) return true;
        const q = serviceQuery.trim().toLowerCase();
        return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      })
    : null;
  if (filteredServices) {
    filteredServices = [...filteredServices].sort((a, b) => {
      if (serviceSort === "price-low") return a.price_kes - b.price_kes;
      if (serviceSort === "price-high") return b.price_kes - a.price_kes;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  return (
    <main className="shell wide">
      <Nav />
      <section className="hero" style={{ paddingBottom: 6 }}>
        <span className="eyebrow">Open to work</span>
        <h1>Talent Hub</h1>
        <p>
          Kenyan job seekers who've opted in to be discovered — browse people by industry, or
          browse specific services they offer. Come back here after posting a job on the{" "}
          <a href="/jobs">jobs board</a>.
        </p>
      </section>

      <div className="doc-tabs">
        <button className={view === "people" ? "on" : "btn-ghost"} onClick={() => setView("people")}>People</button>
        <button className={view === "services" ? "on" : "btn-ghost"} onClick={() => setView("services")}>Services</button>
      </div>

      {view === "people" && (
        <>
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
                  {(p.experience || []).length > 0 && (
                    <div className="hub-profile-section">
                      <span className="hub-profile-section-label">Experience</span>
                      {p.experience.map((e, i) => (
                        <div className="hub-profile-line" key={i}>
                          <b>{e.role}</b>{e.company ? ` · ${e.company}` : ""}
                          {e.dates ? <span className="hub-profile-dates"> — {e.dates}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {(p.education || []).length > 0 && (
                    <div className="hub-profile-section">
                      <span className="hub-profile-section-label">Education</span>
                      {p.education.map((e, i) => (
                        <div className="hub-profile-line" key={i}>
                          <b>{e.degree}</b>{e.school ? ` · ${e.school}` : ""}
                          {e.dates ? <span className="hub-profile-dates"> — {e.dates}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "services" && (
        <>
          {services && services.length > 0 && (
            <>
              <div className="service-controls">
                <input
                  type="text"
                  placeholder="Search services…"
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  className="service-search"
                />
                <select value={serviceSort} onChange={(e) => setServiceSort(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>
              <div className="news-filter-row">
                <button className={`news-filter-chip ${serviceCategory === "all" ? "on" : ""}`} onClick={() => setServiceCategory("all")}>All</button>
                {categoriesPresent.map((c) => (
                  <button key={c} className={`news-filter-chip ${serviceCategory === c ? "on" : ""}`} onClick={() => setServiceCategory(c)}>{c}</button>
                ))}
              </div>
            </>
          )}

          {filteredServices === null ? (
            <div className="loading"><span className="spinner" /> Loading services…</div>
          ) : filteredServices.length === 0 && services.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <p className="step-hint">No services listed yet — be the first to offer one.</p>
              <a className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 10 }} href="/dashboard">
                List a service from your dashboard
              </a>
            </div>
          ) : filteredServices.length === 0 ? (
            <p className="step-hint" style={{ padding: "30px 0" }}>No services match that search.</p>
          ) : (
            <div className="service-grid">
              {filteredServices.map((s) => (
                <div key={s.id} className="service-card">
                  <span className="service-category-pill">{s.category}</span>
                  <div className="service-title">{s.title}</div>
                  <p className="service-desc">{s.description}</p>
                  <div className="service-foot">
                    <div>
                      <div className="service-provider">{s.hub_profiles?.display_name || "TumaCV member"}</div>
                      {s.delivery_days && <div className="service-delivery">{s.delivery_days}-day delivery</div>}
                    </div>
                    <div className="service-price">KES {s.price_kes.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
