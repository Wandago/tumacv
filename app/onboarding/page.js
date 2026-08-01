"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { extractPdfText } from "../../lib/pdfText";
import { INDUSTRIES } from "../../lib/gamification";

const LEVELS = [
  { id: "graduate", label: "Entry-level / recent graduate" },
  { id: "junior", label: "1–3 years experience" },
  { id: "mid", label: "3–7 years experience" },
  { id: "senior", label: "7+ years / senior" },
];

export default function Onboarding() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [industry, setIndustry] = useState("");
  const [level, setLevel] = useState("");
  const [profileText, setProfileText] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      if (!data?.user) router.replace("/login");
      else {
        setReady(true);
        const saved = localStorage.getItem("tumacv-profile");
        if (saved) setProfileText(saved);
      }
    });
  }, [router]);

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
      if (text.length < 80) setPdfErr("Couldn't read much text from that PDF — try pasting instead.");
      else setProfileText(text);
    } catch {
      setPdfErr("Couldn't read that PDF. Try re-saving it, or paste your details instead.");
    } finally {
      setPdfBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save(skip) {
    setErr("");
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      const { error } = await sb
        .from("profiles")
        .update({
          industry: skip ? null : industry || null,
          experience_level: skip ? null : level || null,
          profile_text: skip ? null : profileText || null,
          onboarded: true,
        })
        .eq("id", userData.user.id);
      if (error) throw error;
      if (!skip && profileText) localStorage.setItem("tumacv-profile", profileText);
      router.push("/dashboard");
    } catch (e) {
      setErr("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="shell">
      <Nav />
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <p className="step-indicator">Step 2 of 2</p>
        <h1>A little about you</h1>
        <p className="step-hint">
          Optional, but it helps every generated CV sound right for your field from the start.
          Takes about a minute.
        </p>

        <label className="field-label" htmlFor="industry">Industry</label>
        <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="">Select…</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>

        <label className="field-label">Experience level</label>
        <div className="level-grid">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`level-card ${level === l.id ? "on" : ""}`}
              onClick={() => setLevel(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="field-label">Your CV or LinkedIn profile</label>
        <div className="upload-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handlePdfUpload}
          />
          <button type="button" className="btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={pdfBusy}>
            {pdfBusy ? "Reading PDF…" : "📄 Upload PDF"}
          </button>
          <span className="field-note" style={{ marginTop: 0 }}>or paste below</span>
        </div>
        {pdfErr && <p className="error">{pdfErr}</p>}
        <textarea
          style={{ minHeight: 160 }}
          placeholder="Paste your CV or LinkedIn export text here…"
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />

        {err && <p className="error">{err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => save(true)} disabled={busy}>
            Skip for now
          </button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={() => save(false)} disabled={busy}>
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
