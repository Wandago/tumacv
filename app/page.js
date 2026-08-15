"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import CvView from "../components/CvView";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE } from "../lib/plans";
import { extractPdfText } from "../lib/pdfText";
import { generateCvDocx, downloadBlob } from "../lib/generateDocx";
import CreditsModal from "../components/CreditsModal";
import { extractImagesToText } from "../lib/imageExtract";
import { getSavedProfile, setSavedProfile, clearLegacySharedDraft } from "../lib/storage";
import ShareButtons from "../components/ShareButtons";
import LinkedInGuide from "../components/LinkedInGuide";
import { isLinkedInUrl, looksLikeBareLinkedInUrl } from "../lib/linkedin";
import TemplateFan from "../components/TemplateFan";
import HomeStats from "../components/HomeStats";
import { SAMPLE_CV } from "../lib/sampleCv";
import { motion } from "framer-motion";

const IconPaste = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);
const IconSparkle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "Serif, formal. Banks, gov, NGOs." },
  { id: "modern", name: "Modern", desc: "Green sidebar. Startups, media, tech." },
  { id: "compact", name: "Compact", desc: "Dense. Lots of experience, 1 page." },
  { id: "minimal", name: "Minimal", desc: "Clean and understated. Design, product." },
  { id: "executive", name: "Executive", desc: "Formal and bold. Senior, leadership roles." },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
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
  const [docxBusy, setDocxBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Profile drafts are scoped per-account (lib/storage.js) so a different
  // person signing into a shared browser never sees someone else's saved CV.
  useEffect(() => {
    clearLegacySharedDraft();
    supabaseBrowser().auth.getUser().then(({ data }) => {
      const u = data?.user || null;
      setUser(u);
      setAuthChecked(true);
      if (u) {
        const draft = getSavedProfile(u.id);
        if (draft) setProfileText(draft);
        supabaseBrowser()
          .from("profiles")
          .select("profile_text")
          .eq("id", u.id)
          .single()
          .then(({ data: p }) => {
            if (p?.profile_text && !draft) {
              setProfileText(p.profile_text);
              setSavedProfile(u.id, p.profile_text);
            }
          });
      }
    });

    const params = new URLSearchParams(window.location.search);
    const jobid = params.get("jobid");
    if (jobid) {
      supabaseBrowser().from("jobs").select("*").eq("id", jobid).single().then(({ data }) => {
        if (data) {
          setJobText(`${data.title} at ${data.company}${data.location ? ` (${data.location})` : ""}\n\n${data.description}\n\nHow to apply: ${data.how_to_apply}`);
        }
      });
    }

    // Real trust stat for the logged-out homepage — fails silently since
    // it's a nice-to-have, never something that should block the page.
    fetch("/api/admin/public-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPublicStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => setSavedProfile(user.id, profileText), 400);
    return () => clearTimeout(t);
  }, [profileText, user]);

  async function fetchJd() {
    setFetchErr("");
    if (isLinkedInUrl(jobUrl)) {
      setFetchErr(
        "LinkedIn blocks outside tools from reading job posts. Open the listing on LinkedIn, copy the job description text, and paste it into the box below instead."
      );
      return;
    }
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

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotoErr("");
    if (files.length > 4) {
      setPhotoErr("Please choose up to 4 photos at a time.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    setPhotoBusy(true);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const text = await extractImagesToText(files, sess?.session?.access_token);
      setProfileText(text);
    } catch (err) {
      setPhotoErr(err.message || "Couldn't read those photos. Try again, or type your details instead.");
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
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

  async function copyLetter() {
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadDocx() {
    if (!result?.cv) return;
    setDocxBusy(true);
    try {
      const blob = await generateCvDocx(result.cv);
      const safeName = (result.cv.name || "CV").replace(/[^a-z0-9]+/gi, "_");
      downloadBlob(blob, `${safeName}_CV.docx`);
    } catch (e) {
      console.error(e);
      setGenErr("Could not create the Word file. Try again, or use Save as PDF instead.");
    } finally {
      setDocxBusy(false);
    }
  }

  function matchScore(fit) {
    if (!fit) return null;
    const matched = (fit.matched || []).length;
    const missing = (fit.missing || []).length;
    const total = matched + missing;
    if (total === 0) return null;
    return Math.round((matched / total) * 100);
  }

  // Starts a fresh application: clears the job details but keeps the saved
  // profile and template choice, since that's the part people don't want to
  // re-enter every time they apply to a new posting.
  function newApplication() {
    setResult(null);
    setJobText("");
    setJobUrl("");
    setFetchErr("");
    setGenErr("");
    setNeedCredits(false);
    window.scrollTo({ top: 0 });
  }

  const ready = jobText.trim().length >= 80 && profileText.trim().length >= 80;

  if (!authChecked) return null;

  if (!user) {
    return (
      <main className="shell">
        <Nav />
        <section className="hero hero-split">
          <div className="hero-copy">
            <span className="eyebrow">Built for Kenyan job seekers</span>
            <h1>One job. One <em>tailored</em> CV. Five minutes.</h1>
            <p>
              Paste any job posting. TumaCV rewrites your CV and cover letter to match it —
              keywords, ordering, emphasis — using only your real experience. Nothing invented.
            </p>
            <p className="price">
              {FREE_MODE
                ? "Free during beta — create an account and generate as many as you like"
                : "5 free applications when you sign up — no card required"}
            </p>
          </div>
          <TemplateFan />
        </section>

        <HomeStats stats={publicStats} />

        <motion.section
          className="step-flow"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="step-flow-item">
            <div className="step-flow-marker"><IconPaste /></div>
            <div className="step-flow-body">
              <span className="step-flow-no">01</span>
              <h2>Paste a job</h2>
              <p className="step-hint">
                A link from BrighterMonday, Fuzu, MyJobMag, a company careers page, or just the
                description text. Pick one straight from our <a href="/jobs">jobs board</a> if you'd rather.
              </p>
            </div>
          </div>
          <div className="step-flow-item">
            <div className="step-flow-marker"><IconUser /></div>
            <div className="step-flow-body">
              <span className="step-flow-no">02</span>
              <h2>Add your CV</h2>
              <p className="step-hint">
                Upload your LinkedIn PDF export or paste your CV — saved to your account so you only do it once.
              </p>
            </div>
          </div>
          <div className="step-flow-item">
            <div className="step-flow-marker"><IconSparkle /></div>
            <div className="step-flow-body">
              <span className="step-flow-no">03</span>
              <h2>Get your documents</h2>
              <p className="step-hint">
                A tailored CV in your choice of layout, plus a matching cover letter, ready in under a minute.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="example-showcase"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="eyebrow">Real output, not a mockup</span>
          <h2>See what you get</h2>
          <p className="step-hint">
            This is the actual "Modern" template, rendered live by TumaCV with example data —
            the same component every real CV goes through.
          </p>
          <div className="example-frame">
            <div className="sheet example-sheet">
              <CvView data={SAMPLE_CV} template="modern" />
            </div>
            <div className="example-fade" />
          </div>
        </motion.section>

        <div style={{ textAlign: "center", padding: "22px 0 40px" }}>
          <motion.a
            href="/login?mode=signup"
            className="btn-pill"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            Generate CV — create your free account
            <span className="btn-pill-icon"><IconArrow /></span>
          </motion.a>
          <p className="field-note" style={{ marginTop: 12 }}>
            5 free applications, no card required. Already have an account?{" "}
            <a href="/login" style={{ color: "var(--kijani-dark)" }}>Sign in</a>.
          </p>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="shell wide">
        <Nav />
        <div className="results-head">
          <h2>Your documents are ready</h2>
          <button className="btn-ghost" onClick={() => setResult(null)}>← Edit inputs</button>
          <button className="btn-ghost" onClick={newApplication}>+ Generate another CV</button>
          {tab === "cv" && (
            <>
              <button className="btn-ghost" onClick={downloadDocx} disabled={docxBusy}>
                {docxBusy ? "Preparing…" : "Download .docx"}
              </button>
              <button className="btn-primary" onClick={() => window.print()}>Save CV as PDF</button>
            </>
          )}
          {tab === "letter" && (
            <>
              <button className="btn-ghost" onClick={copyLetter}>{copied ? "Copied" : "Copy letter"}</button>
              <button className="btn-primary" onClick={() => window.print()}>Save letter as PDF</button>
            </>
          )}
        </div>

        {result.fit && (
          <div className="fit">
            <div className="fit-top">
              <h3>FIT CHECK</h3>
              {matchScore(result.fit) !== null && (
                <span className={`match-score ${matchScore(result.fit) >= 70 ? "good" : matchScore(result.fit) >= 40 ? "okay" : "low"}`}>
                  {matchScore(result.fit)}% match
                </span>
              )}
            </div>
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
        <p className="field-note no-print" style={{ textAlign: "center", paddingBottom: 10 }}>
          Saved to your <a href="/dashboard">dashboard</a>
          {!FREE_MODE && typeof result.creditsLeft === "number" ? ` · ${result.creditsLeft} applications left` : ""}
        </p>
        <div className="share-prompt">
          <span className="field-note" style={{ marginTop: 0 }}>Know someone else job hunting?</span>
          <ShareButtons compact />
        </div>
        <div className="no-print" style={{ textAlign: "center", padding: "18px 0 30px" }}>
          <button className="btn-primary" onClick={newApplication} style={{ padding: "12px 28px" }}>
            Apply to another job →
          </button>
        </div>
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
          Upload your LinkedIn profile as a PDF, or a photo of your CV, and we'll read it automatically
          — or paste your CV text below. Saved on this device so you only do it once.
        </p>
        <LinkedInGuide />
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
            {pdfBusy ? "Reading PDF…" : "📄 Upload PDF"}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            id="photo-upload"
            style={{ display: "none" }}
            onChange={handlePhotoUpload}
          />
          <button className="btn-ghost" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}>
            {photoBusy ? "Reading photo…" : "📷 Upload a photo instead"}
          </button>
        </div>
        {pdfErr && <p className="error">{pdfErr}</p>}
        {photoErr && <p className="error">{photoErr}</p>}
        <p className="field-note" style={{ marginBottom: 10 }}>
          On iPhone, can't find your saved PDF? The photo option is usually easier — snap a picture of
          a printed CV, or a few screenshots of your LinkedIn profile, straight from your Camera or
          Photos. No need to dig through the Files app.
        </p>
        <textarea
          style={{ minHeight: 220 }}
          placeholder={"Jane Wanjiku\nNairobi · jane@email.com · +254 7...\n\nSales Assistant, Naivas — 2023 to now\n- Served 100+ customers daily...\n\nEducation: ..."}
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />
        {looksLikeBareLinkedInUrl(profileText) && (
          <p className="error">
            That's a LinkedIn profile link, not your profile content — LinkedIn doesn't let other
            sites read it directly. Export it as a PDF instead (steps above) and upload that.
          </p>
        )}
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

      {needCredits && <CreditsModal onClose={() => setNeedCredits(false)} user={user} />}
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
