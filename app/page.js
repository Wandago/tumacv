"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import CvView from "../components/CvView";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE, FREE_SIGNUP_CREDITS } from "../lib/plans";
import { matchScore } from "../lib/gamification";
import { extractPdfText } from "../lib/pdfText";
import { generateCvDocx, downloadBlob } from "../lib/generateDocx";
import CreditsModal from "../components/CreditsModal";
import { extractImagesToText } from "../lib/imageExtract";
import { getSavedProfile, setSavedProfile, clearLegacySharedDraft, setPendingJob, takePendingJob } from "../lib/storage";
import ShareButtons from "../components/ShareButtons";
import LinkedInGuide from "../components/LinkedInGuide";
import { isLinkedInUrl, looksLikeBareLinkedInUrl } from "../lib/linkedin";
import GrowthLine from "../components/GrowthLine";
import CountUp from "../components/CountUp";
import { SAMPLE_CV } from "../lib/sampleCv";
import { motion } from "motion/react";
import LandingPage from "../components/LandingPage";

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
const IconArrowUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "Serif, formal. Banks, gov, NGOs." },
  { id: "modern", name: "Modern", desc: "Green sidebar. Startups, media, tech." },
  { id: "compact", name: "Compact", desc: "Dense. Lots of experience, 1 page." },
  { id: "minimal", name: "Minimal", desc: "Clean and understated. Design, product." },
  { id: "executive", name: "Executive", desc: "Formal and bold. Senior, leadership roles." },
];

// Columns: one generic CV · hiring a CV writer · TumaCV. Kept deliberately
// even-handed — a good CV writer genuinely beats us on human judgement.
const COMPARISON = [
  { label: "Rewritten for the specific job", cells: [false, true, true] },
  { label: "Ready in", cells: ["—", "2–5 days", "About a minute"] },
  { label: "Matching cover letter", cells: [false, "Usually extra", true] },
  { label: "Shows what the job wants that you're missing", cells: [false, false, true] },
  // Basic works out at KES 2.00/application, Pro at KES 0.71 — so "2 or less".
  { label: "Typical cost per application", cells: ["Free", "~KES 2,000+", "KES 2 or less"] },
  { label: "Uses only your real experience", cells: [true, true, true] },
  { label: "Human judgement on your career story", cells: [false, true, false] },
];

const FAQS = [
  {
    q: "Does it make up experience I don't have?",
    a: "No. TumaCV only reorders, rewords and re-emphasises what you already gave it. If the job asks for something you haven't done, it tells you it's missing rather than inventing it — that's what the match score is for.",
  },
  {
    q: "Will employers be able to tell I used AI?",
    a: "There's nothing to tell. The words describe your real jobs and your real results — the same facts you'd have written yourself, arranged to answer this particular posting. You can edit everything before you send it.",
  },
  {
    q: "Why can't it read LinkedIn job links?",
    a: "LinkedIn blocks automated reading for every outside tool, not just us. Open the posting, copy the description text, and paste it in — it works exactly the same from there.",
  },
  {
    q: "What do I get for free?",
    a: `${FREE_SIGNUP_CREDITS} full applications when you sign up — CV and cover letter both — with no card required. You only pay if you want more.`,
  },
  {
    q: "How do I pay?",
    a: "M-Pesa, Airtel Money, or card. Top-ups are one-off — there's no subscription and nothing renews on you.",
  },
  {
    q: "Who can see my CV?",
    a: "Only you. Your applications are private to your account. Nothing is shared publicly unless you deliberately opt in to the Talent Hub.",
  },
  {
    q: "What can I download?",
    a: "PDF for anything you're emailing or uploading, and .docx if you want to keep editing in Word. Both keep the template's formatting.",
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [heroInput, setHeroInput] = useState("");
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

    // Picks up whatever a visitor pasted into the hero's glass search pill
    // before they had an account, so signing up doesn't lose that context.
    const pending = takePendingJob();
    if (pending?.url) setJobUrl(pending.url);
    if (pending?.text) setJobText(pending.text);

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
    return (
      <main className="shell landing-shell">
        <Nav />
        <LandingPage publicStats={publicStats} />
      </main>
    );
  }

  if (result) {
    return (
      <main className="shell wide">
        <Nav />
        <section className="hero hero-band hero-band-compact">
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
        </section>

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
              <p>
                Red items are asked for in the job but aren't in your profile. If you do have
                them, add them and generate again. If you don't, prepare an answer for the
                interview — nothing here was invented to cover the gap.
              </p>
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

      <section className="hero hero-band">
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
          for every outside tool), so copy the description text from the listing instead.
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
