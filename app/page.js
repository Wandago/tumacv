"use client";
import { useEffect, useState } from "react";

const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "Serif, formal. Banks, gov, NGOs." },
  { id: "modern", name: "Modern", desc: "Green sidebar. Startups, media, tech." },
  { id: "compact", name: "Compact", desc: "Dense. Lots of experience, 1 page." },
];

export default function Home() {
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [template, setTemplate] = useState("modern");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [genErr, setGenErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("cv");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tumacv-profile");
    if (saved) setProfileText(saved);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem("tumacv-profile", profileText), 400);
    return () => clearTimeout(t);
  }, [profileText]);

  async function fetchJd() {
    setFetchErr("");
    setFetching(true);
    try {
      const res = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      if (!res.ok) setFetchErr(data.error || "Couldn't read that page.");
      else setJobText(data.text);
    } catch {
      setFetchErr("Couldn't reach that page. Paste the description instead.");
    } finally {
      setFetching(false);
    }
  }

  async function generate() {
    setGenErr("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobText, profileText, template }),
      });
      const data = await res.json();
      if (!res.ok) setGenErr(data.error || "Generation failed. Try again.");
      else {
        setResult(data);
        setTab("cv");
        window.scrollTo({ top: 0 });
      }
    } catch {
      setGenErr("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLetter() {
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const ready = jobText.trim().length >= 80 && profileText.trim().length >= 80;

  if (result) {
    return (
      <main className="shell wide">
        <header className="top">
          <div className="wordmark">Tuma<span>CV</span></div>
          <div className="top-tag">tailored for this job</div>
        </header>

        <div className="results-head">
          <h2>Your documents are ready</h2>
          <button className="btn-ghost" onClick={() => setResult(null)}>← Edit inputs</button>
          {tab === "cv" && <button className="btn-primary" onClick={() => window.print()}>Save CV as PDF</button>}
          {tab === "letter" && (
            <>
              <button className="btn-ghost" onClick={copyLetter}>{copied ? "Copied" : "Copy letter"}</button>
              <button className="btn-primary" onClick={() => window.print()}>Save letter as PDF</button>
            </>
          )}
        </div>

        {result.fit && (
          <div className="fit">
            <h3>FIT CHECK</h3>
            <div className="chips">
              {(result.fit.matched || []).map((k) => <span className="chip" key={k}>{k}</span>)}
              {(result.fit.missing || []).map((k) => <span className="chip miss" key={k}>{k}</span>)}
            </div>
            {(result.fit.missing || []).length > 0 && (
              <p>Red items are asked for in the job but missing from your profile — address them in the interview, or add them to your profile if you have them.</p>
            )}
          </div>
        )}

        <div className="doc-tabs">
          <button className={tab === "cv" ? "on" : "btn-ghost"} onClick={() => setTab("cv")}>CV</button>
          <button className={tab === "letter" ? "on" : "btn-ghost"} onClick={() => setTab("letter")}>Cover letter</button>
        </div>

        <div className="sheet-wrap">
          <div className="sheet">
            {tab === "cv" ? <Cv data={result.cv} template={template} /> : <div className="letter">{result.coverLetter}</div>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="top">
        <div className="wordmark">Tuma<span>CV</span></div>
        <div className="top-tag">Nairobi · pay per application</div>
      </header>

      <section className="hero">
        <h1>One job. One <em>tailored</em> CV. Five minutes.</h1>
        <p>
          Paste any job posting. TumaCV rewrites your CV and cover letter to match it —
          keywords, ordering, emphasis — using only your real experience. Nothing invented.
        </p>
        <p className="price">First 2 applications free · then <b>KES 50</b> per application via M-Pesa</p>
      </section>

      <section className="step">
        <div className="step-head"><span className="step-no">01</span><h2>The job</h2></div>
        <p className="step-hint">
          Paste a link from BrighterMonday, Fuzu, MyJobMag or a company careers page — or paste the
          description itself. (LinkedIn links need login, so copy the text instead.)
        </p>
        <div className="url-row">
          <input
            type="url"
            placeholder="https://www.brightermonday.co.ke/listings/..."
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <button className="btn-ghost" onClick={fetchJd} disabled={fetching || !jobUrl}>
            {fetching ? "Reading…" : "Read link"}
          </button>
        </div>
        {fetchErr && <p className="error">{fetchErr}</p>}
        <textarea
          placeholder="…or paste the full job description here"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
        />
      </section>

      <section className="step">
        <div className="step-head"><span className="step-no">02</span><h2>You</h2></div>
        <p className="step-hint">
          Paste your current CV, or your LinkedIn profile (open your profile → More → Save to PDF,
          then copy the text). Include jobs, dates, education, skills, and your phone + email.
          Saved on this device so you only do it once.
        </p>
        <textarea
          style={{ minHeight: 220 }}
          placeholder={"Jane Wanjiku\nNairobi · jane@email.com · +254 7...\n\nSales Assistant, Naivas — 2023 to now\n- Served 100+ customers daily...\n\nEducation: ..."}
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />
        <p className="field-note">Stored only in your browser — not on our servers.</p>
      </section>

      <section className="step" style={{ borderBottom: "none" }}>
        <div className="step-head"><span className="step-no">03</span><h2>Style</h2></div>
        <div className="tpl-row">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`tpl-card ${template === t.id ? "on" : ""}`}
              onClick={() => setTemplate(t.id)}
            >
              <Thumb id={t.id} />
              <div className="tpl-name">{t.name}</div>
              <div className="tpl-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {genErr && <p className="error">{genErr}</p>}
      {loading && <div className="loading"><span className="spinner" /> Tailoring your CV to this job…</div>}

      <div className="gen-bar">
        <div className="gen-bar-in">
          <span className="sum">
            {ready ? "Ready — takes ~30 seconds" : "Fill in the job and your profile to continue"}
          </span>
          <button className="btn-primary" onClick={generate} disabled={!ready || loading}>
            {loading ? "Generating…" : "Generate CV + letter"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Thumb({ id }) {
  if (id === "classic")
    return (
      <div className="tpl-thumb">
        <i style={{ top: 8, left: "30%", right: "30%", height: 5 }} />
        <i style={{ top: 18, left: 10, right: 10, height: 2 }} />
        <i style={{ top: 26, left: 10, right: 40, height: 3 }} />
        <i style={{ top: 33, left: 10, right: 20, height: 3 }} />
        <i style={{ top: 40, left: 10, right: 55, height: 3 }} />
      </div>
    );
  if (id === "modern")
    return (
      <div className="tpl-thumb">
        <i style={{ top: 8, bottom: 8, left: 10, width: 3, background: "var(--kijani)" }} />
        <i style={{ top: 8, left: 20, width: 40, height: 5 }} />
        <i style={{ top: 20, left: 20, width: 28, height: 3 }} />
        <i style={{ top: 30, left: 20, right: 12, height: 3 }} />
        <i style={{ top: 37, left: 20, right: 30, height: 3 }} />
      </div>
    );
  return (
    <div className="tpl-thumb">
      {[8, 14, 20, 26, 32, 38, 44].map((t) => (
        <i key={t} style={{ top: t, left: 10, right: t % 3 ? 14 : 34, height: 2.5 }} />
      ))}
    </div>
  );
}

function Cv({ data, template }) {
  if (!data) return null;
  const c = data.contact || {};
  const contactBits = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);

  if (template === "modern") {
    return (
      <div className="cv modern">
        <aside className="side">
          <h1>{data.name}</h1>
          <div className="cv-title">{data.title}</div>
          <div className="cv-contact">{contactBits.map((b) => <span key={b}>{b}</span>)}</div>
          <h2>Skills</h2>
          <div>{(data.skills || []).map((s) => <span className="skill-tag" key={s}>{s}</span>)}</div>
          <h2>Education</h2>
          {(data.education || []).map((e, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: "12px" }}>
              <b>{e.degree}</b><br />{e.school}<br /><span className="dates">{e.dates}</span>
            </div>
          ))}
          {(data.certifications || []).length > 0 && (
            <>
              <h2>Certifications</h2>
              <ul style={{ fontSize: "12px" }}>{data.certifications.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}
        </aside>
        <div>
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          <p>{data.summary}</p>
          <h2>Experience</h2>
          {(data.experience || []).map((e, i) => (
            <div className="exp-item" key={i}>
              <div className="role-row">{e.role} · <span className="co">{e.company}</span></div>
              <div className="dates" style={{ fontSize: "12px" }}>{e.dates}</div>
              <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (template === "compact") {
    return (
      <div className="cv compact">
        <div className="cv-head">
          <h1>{data.name}</h1><span className="cv-title">{data.title}</span>
          <div className="cv-contact">{contactBits.join(" · ")}</div>
        </div>
        <p className="summary">{data.summary}</p>
        <h2>Experience</h2>
        {(data.experience || []).map((e, i) => (
          <div className="exp-item" key={i}>
            <div className="role-row"><span>{e.role}, {e.company}</span><span className="dates">{e.dates}</span></div>
            <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
        <h2>Skills</h2>
        <p className="skills-line">{(data.skills || []).join(" · ")}</p>
        <h2>Education</h2>
        {(data.education || []).map((e, i) => (
          <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
        ))}
        {(data.certifications || []).length > 0 && (
          <><h2>Certifications</h2><p className="skills-line">{data.certifications.join(" · ")}</p></>
        )}
      </div>
    );
  }

  return (
    <div className="cv classic">
      <div className="cv-head">
        <h1>{data.name}</h1>
        <div className="cv-title">{data.title}</div>
        <div className="cv-contact">{contactBits.join("  ·  ")}</div>
      </div>
      <h2>Profile</h2>
      <p>{data.summary}</p>
      <h2>Experience</h2>
      {(data.experience || []).map((e, i) => (
        <div className="exp-item" key={i}>
          <div className="role-row"><span>{e.role}, {e.company}</span><span className="dates">{e.dates}</span></div>
          <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
        </div>
      ))}
      <h2>Skills</h2>
      <p className="skills">{(data.skills || []).join(" · ")}</p>
      <h2>Education</h2>
      {(data.education || []).map((e, i) => (
        <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
      ))}
      {(data.certifications || []).length > 0 && (
        <><h2>Certifications</h2><p>{data.certifications.join(" · ")}</p></>
      )}
    </div>
  );
}
