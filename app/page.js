"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import CvView from "../components/CvView";
import { supabaseBrowser } from "../lib/supabaseClient";
import { PLANS, FREE_MODE } from "../lib/plans";
import { extractPdfText } from "../lib/pdfText";
import ShareButtons from "../components/ShareButtons";

const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "Serif, formal. Banks, gov, NGOs." },
  { id: "modern", name: "Modern", desc: "Green sidebar. Startups, media, tech." },
  { id: "compact", name: "Compact", desc: "Dense. Lots of experience, 1 page." },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [template, setTemplate] = useState("modern");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [genErr, setGenErr] = useState("");
  const [needCredits, setNeedCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("cv");
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("tumacv-profile");
    if (saved) setProfileText(saved);
    supabaseBrowser().auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      if (data?.user && !saved) {
        supabaseBrowser()
          .from("profiles")
          .select("profile_text")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p?.profile_text) {
              setProfileText(p.profile_text);
              localStorage.setItem("tumacv-profile", p.profile_text);
            }
          });
      }
    });

    // Prefill from the jobs board (?jobid=...)
    const params = new URLSearchParams(window.location.search);
    const jobid = params.get("jobid");
    if (jobid) {
      supabaseBrowser().from("jobs").select("*").eq("id", jobid).single().then(({ data }) => {
        if (data) {
          setJobText(`${data.title} at ${data.company}${data.location ? ` (${data.location})` : ""}\n\n${data.description}\n\nHow to apply: ${data.how_to_apply}`);
        }
      });
    }
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
    setNeedCredits(false);
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess?.session?.access_token}`,
        },
        body: JSON.stringify({ jobText, profileText, template }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "credits") setNeedCredits(true);
        else if (data.code === "auth") window.location.href = "/login";
        else setGenErr(data.error || "Generation failed. Try again.");
      } else {
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

  async function handlePdfUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfErr("");
    if (file.type !== "application/pdf") {
      setPdfErr("Please upload a PDF file.");
      return;
    }
    setPdfBusy(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 80) {
        setPdfErr("Couldn't read much text from that PDF — it may be a scanned image. Paste your details instead.");
      } else {
        setProfileText(text);
      }
    } catch {
      setPdfErr("Couldn't read that PDF. Try re-saving it from LinkedIn, or paste your details instead.");
    } finally {
      setPdfBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <Nav />
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
            {tab === "cv" ? <CvView data={result.cv} template={template} /> : <div className="letter">{result.coverLetter}</div>}
          </div>
        </div>
        <p className="field-note" style={{ textAlign: "center", paddingBottom: 10 }}>
          Saved to your <a href="/dashboard">dashboard</a>
          {!FREE_MODE && typeof result.creditsLeft === "number" ? ` · ${result.creditsLeft} applications left` : ""}
        </p>
        <div className="share-prompt">
          <span className="field-note" style={{ marginTop: 0 }}>Know someone else job hunting?</span>
          <ShareButtons compact />
        </div>
        <div style={{ paddingBottom: 30 }} />
      </main>
    );
  }

  return (
    <main className="shell">
      <Nav />

      <section className="hero">
        <h1>One job. One <em>tailored</em> CV. Five minutes.</h1>
        <p>
          Paste any job posting. TumaCV rewrites your CV and cover letter to match it —
          keywords, ordering, emphasis — using only your real experience. Nothing invented.
        </p>
        <p className="price">
          {FREE_MODE ? "Free during beta — sign in and generate as many as you like" : "5 free to try · then as low as KES 1 per application · M-Pesa, Airtel & card"}
        </p>
      </section>

      <section className="step">
        <div className="step-head"><span className="step-no">01</span><h2>The job</h2></div>
        <p className="step-hint">
          Paste a link from BrighterMonday, Fuzu, MyJobMag or a company careers page — or paste the
          description itself. LinkedIn job links can't be read automatically (LinkedIn blocks this
          for all outside tools) — copy the description text from the listing instead. You can also
          pick a job straight from our <a href="/jobs">jobs board</a>.
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
          Upload your LinkedIn profile as a PDF (on LinkedIn: open your profile → the "More" button →
          Save to PDF) and we'll read it automatically — or paste your CV text below. Saved on this
          device so you only do it once.
        </p>
        <div className="upload-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            id="pdf-upload"
            style={{ display: "none" }}
            onChange={handlePdfUpload}
          />
          <button className="btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={pdfBusy}>
            {pdfBusy ? "Reading PDF…" : "📄 Upload LinkedIn / CV PDF"}
          </button>
          <span className="field-note" style={{ marginTop: 0 }}>auto-fills the box below</span>
        </div>
        {pdfErr && <p className="error">{pdfErr}</p>}
        <textarea
          style={{ minHeight: 220 }}
          placeholder={"Jane Wanjiku\nNairobi · jane@email.com · +254 7...\n\nSales Assistant, Naivas — 2023 to now\n- Served 100+ customers daily...\n\nEducation: ..."}
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />
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
              <div className="tpl-name">{t.name}</div>
              <div className="tpl-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {needCredits && (
        <div className="banner warn">
          You're out of applications. <a href="/dashboard">Top up from KES 50 →</a>
        </div>
      )}
      {genErr && <p className="error">{genErr}</p>}
      {loading && <div className="loading"><span className="spinner" /> Tailoring your CV to this job…</div>}

      {!FREE_MODE && !user && (
        <section className="step" style={{ borderTop: "1px solid var(--stone)" }}>
          <div className="step-head"><span className="step-no">PRICING</span><h2>Simple, in shillings</h2></div>
          <div className="plan-row">
            {Object.values(PLANS).map((p) => (
              <a key={p.id} href="/login" className="plan-card" style={{ textDecoration: "none" }}>
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">KES {p.priceKes}</div>
                <div className="plan-blurb">{p.blurb}</div>
              </a>
            ))}
          </div>
          <p className="field-note">Start with 5 free applications — no payment needed to try it.</p>
        </section>
      )}

      <div className="gen-bar">
        <div className="gen-bar-in">
          <span className="sum">
            {!user
              ? FREE_MODE ? "Sign in to generate — free during beta" : "Sign in to generate — new accounts get 5 free"
              : ready
              ? "Ready — takes ~30 seconds"
              : "Fill in the job and your profile to continue"}
          </span>
          <button className="btn-primary" onClick={generate} disabled={(user && !ready) || loading}>
            {loading ? "Generating…" : user ? "Generate CV + letter" : "Sign in to start"}
          </button>
        </div>
      </div>
    </main>
  );
}
