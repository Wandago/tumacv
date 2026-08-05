"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { extractPdfText } from "../../lib/pdfText";
import { extractImagesToText } from "../../lib/imageExtract";
import { INDUSTRIES } from "../../lib/gamification";
import { getSavedProfile, setSavedProfile } from "../../lib/storage";

const LEVELS = [
  { id: "graduate", label: "Entry-level / recent graduate" },
  { id: "junior", label: "1–3 years experience" },
  { id: "mid", label: "3–7 years experience" },
  { id: "senior", label: "7+ years / senior" },
];

export default function Onboarding() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [industry, setIndustry] = useState("");
  const [level, setLevel] = useState("");
  const [profileText, setProfileText] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { router.replace("/login"); return; }
      const { data: profile } = await sb
        .from("profiles")
        .select("industry, experience_level, profile_text, onboarded")
        .eq("id", data.user.id)
        .single();

      setIsEditing(!!profile?.onboarded);
      if (profile?.industry) setIndustry(profile.industry);
      if (profile?.experience_level) setLevel(profile.experience_level);
      if (profile?.profile_text) {
        setProfileText(profile.profile_text);
      } else {
        // Scoped to this account's id — never a different person's leftover draft.
        const draft = getSavedProfile(data.user.id);
        if (draft) setProfileText(draft);
      }
      setReady(true);
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

  async function save() {
    setErr("");
    setBusy(true);
    setSaved(false);
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      const { error } = await sb
        .from("profiles")
        .update({
          industry: industry || null,
          experience_level: level || null,
          profile_text: profileText || null,
          onboarded: true,
        })
        .eq("id", userData.user.id);
      if (error) throw error;
      if (profileText) setSavedProfile(userData.user.id, profileText);
      if (isEditing) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setErr("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function skipOrCancel() {
    if (isEditing) {
      router.push("/dashboard");
      return;
    }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      await sb.from("profiles").update({ onboarded: true }).eq("id", userData.user.id);
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="shell">
      <Nav />
      <div className="auth-card" style={{ maxWidth: 520 }}>
        {!isEditing && <p className="step-indicator">Step 2 of 2</p>}
        <h1>{isEditing ? "Your profile" : "A little about you"}</h1>
        <p className="step-hint">
          {isEditing
            ? "Update this any time — new job, new skills, new CV. Every generated application uses what's saved here."
            : "Optional, but it helps every generated CV sound right for your field from the start. Takes about a minute."}
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
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handlePhotoUpload}
          />
          <button type="button" className="btn-ghost" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}>
            {photoBusy ? "Reading photo…" : "📷 Or upload a photo"}
          </button>
        </div>
        {pdfErr && <p className="error">{pdfErr}</p>}
        {photoErr && <p className="error">{photoErr}</p>}
        <p className="field-note" style={{ marginBottom: 10 }}>
          On iPhone, can't find your saved PDF? Try the photo option instead — a picture of a printed
          CV or a few LinkedIn screenshots works well, straight from Camera or Photos.
        </p>
        <textarea
          style={{ minHeight: 160 }}
          placeholder="Paste your CV or LinkedIn export text here…"
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />

        {err && <p className="error">{err}</p>}
        {saved && <p className="success">Saved.</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={skipOrCancel} disabled={busy}>
            {isEditing ? "Cancel" : "Skip for now"}
          </button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={save} disabled={busy}>
            {busy ? "Saving…" : isEditing ? "Save changes" : "Save and continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
