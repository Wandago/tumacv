"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { INDUSTRIES, EXPERIENCE_LEVELS } from "../lib/gamification";
import SkillPicker from "./SkillPicker";

const MAX_EXPERIENCE = 5;
const MAX_EDUCATION = 3;

function suggestedFields(profile, latestGeneration) {
  const cv = latestGeneration?.result?.cv;
  return {
    displayName: cv?.name ? `${cv.name.split(" ")[0]} ${cv.name.split(" ").slice(-1)[0]?.[0] || ""}.` : "",
    title: cv?.title || "",
    industry: profile?.industry || "",
    experienceLevel: profile?.experience_level || "",
    skills: (cv?.skills || []).slice(0, 6),
    blurb: "",
    experience: (cv?.experience || []).slice(0, MAX_EXPERIENCE).map((e) => ({
      role: e.role || "", company: e.company || "", dates: e.dates || "",
    })),
    education: (cv?.education || []).slice(0, MAX_EDUCATION).map((e) => ({
      degree: e.degree || "", school: e.school || "", dates: e.dates || "",
    })),
  };
}

function fromHubProfile(hubProfile) {
  return {
    displayName: hubProfile.display_name,
    title: hubProfile.title,
    industry: hubProfile.industry || "",
    experienceLevel: hubProfile.experience_level || "",
    skills: hubProfile.skills || [],
    blurb: hubProfile.blurb || "",
    experience: hubProfile.experience || [],
    education: hubProfile.education || [],
  };
}

export default function TalentHubCard({ user, profile, latestGeneration }) {
  const [hubProfile, setHubProfile] = useState(undefined); // undefined = loading, null = not opted in
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabaseBrowser().from("hub_profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setHubProfile(data || null));
  }, [user]);

  function startEdit() {
    setErr("");
    setForm(hubProfile ? fromHubProfile(hubProfile) : suggestedFields(profile, latestGeneration));
    setEditing(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addRow(key, empty, max) {
    setForm((f) => (f[key].length >= max ? f : { ...f, [key]: [...f[key], empty] }));
  }
  function updateRow(key, i, field, v) {
    setForm((f) => ({ ...f, [key]: f[key].map((row, j) => (j === i ? { ...row, [field]: v } : row)) }));
  }
  function removeRow(key, i) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, j) => j !== i) }));
  }

  async function save() {
    setErr("");
    if (!form.displayName.trim() || !form.title.trim()) {
      setErr("A display name and title are required.");
      return;
    }
    setSaving(true);
    const cleanRows = (rows, fields, max) =>
      rows
        .filter((r) => fields.some((f) => r[f]?.trim()))
        .slice(0, max)
        .map((r) => Object.fromEntries(fields.map((f) => [f, (r[f] || "").trim().slice(0, 100)])));
    const row = {
      id: user.id,
      display_name: form.displayName.trim().slice(0, 60),
      title: form.title.trim().slice(0, 80),
      industry: form.industry || null,
      experience_level: form.experienceLevel || null,
      skills: form.skills.slice(0, 15),
      blurb: form.blurb.trim().slice(0, 200) || null,
      experience: cleanRows(form.experience, ["role", "company", "dates"], MAX_EXPERIENCE),
      education: cleanRows(form.education, ["degree", "school", "dates"], MAX_EDUCATION),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseBrowser().from("hub_profiles").upsert(row).select().single();
    setSaving(false);
    if (error) { setErr("Could not save. Try again."); return; }
    setHubProfile(data);
    setEditing(false);
  }

  async function remove() {
    if (!confirm("Remove your profile from the public Talent Hub? You can rejoin anytime.")) return;
    setRemoving(true);
    const { error } = await supabaseBrowser().from("hub_profiles").delete().eq("id", user.id);
    setRemoving(false);
    if (!error) { setHubProfile(null); setEditing(false); }
  }

  if (hubProfile === undefined) return null;

  return (
    <section className="hub-card-section">
      <div className="step-head"><span className="step-no">COMMUNITY</span><h2>Talent Hub</h2></div>

      {!editing && !hubProfile && (
        <div className="hub-optin-prompt">
          <p className="step-hint">
            Publish a short, public profile card — name, title, industry, skills, and a couple of
            roles/education entries if you want — so employers browsing TumaCV's{" "}
            <a href="/hub">Talent Hub</a> can see you're out there. No contact info, email, or
            full CV is ever shown.
          </p>
          <button className="btn-primary" onClick={startEdit}>Join the Talent Hub</button>
        </div>
      )}

      {!editing && hubProfile && (
        <div className="hub-optin-prompt">
          <p className="field-note" style={{ marginBottom: 10 }}>
            Your profile is live on the <a href="/hub">public Talent Hub</a>.
          </p>
          <div className="hub-preview-card">
            <div className="hub-preview-name">{hubProfile.display_name}</div>
            <div className="hub-preview-title">{hubProfile.title}</div>
            {(hubProfile.skills || []).length > 0 && (
              <div className="hub-preview-skills">
                {hubProfile.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
              </div>
            )}
            {(hubProfile.experience || []).length > 0 && (
              <div className="hub-preview-list">
                {hubProfile.experience.map((e, i) => (
                  <div key={i}>{e.role}{e.company ? ` · ${e.company}` : ""}</div>
                ))}
              </div>
            )}
            {(hubProfile.education || []).length > 0 && (
              <div className="hub-preview-list">
                {hubProfile.education.map((e, i) => (
                  <div key={i}>{e.degree}{e.school ? ` · ${e.school}` : ""}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-ghost" onClick={startEdit}>Edit</button>
            <button className="btn-ghost danger-btn" disabled={removing} onClick={remove}>
              {removing ? "…" : "Remove from Talent Hub"}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="hub-optin-prompt">
          <p className="field-note" style={{ marginBottom: 12 }}>
            Visible to anyone on the internet, including people without a TumaCV account. Only
            what you fill in below is shown — never your email, phone, or full CV.
          </p>
          <label className="field-label">Display name</label>
          <input type="text" value={form.displayName} onChange={(e) => setField("displayName", e.target.value)}
            placeholder="e.g. Wanjiru K." />
          <label className="field-label">Title / role</label>
          <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. Digital Marketing Specialist" />
          <label className="field-label">Industry</label>
          <select value={form.industry} onChange={(e) => setField("industry", e.target.value)}>
            <option value="">Not specified</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <label className="field-label">Experience level</label>
          <select value={form.experienceLevel} onChange={(e) => setField("experienceLevel", e.target.value)}>
            <option value="">Not specified</option>
            {EXPERIENCE_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>

          <label className="field-label">Skills</label>
          <SkillPicker selected={form.skills} onChange={(skills) => setField("skills", skills)} />

          <label className="field-label">One-line blurb (optional)</label>
          <input type="text" value={form.blurb} onChange={(e) => setField("blurb", e.target.value)}
            placeholder="A short line about what you're looking for" />

          <label className="field-label">Work experience (optional)</label>
          {form.experience.map((exp, i) => (
            <div className="hub-repeat-row" key={i}>
              <input type="text" value={exp.role} onChange={(e) => updateRow("experience", i, "role", e.target.value)} placeholder="Role" />
              <input type="text" value={exp.company} onChange={(e) => updateRow("experience", i, "company", e.target.value)} placeholder="Company" />
              <input type="text" value={exp.dates} onChange={(e) => updateRow("experience", i, "dates", e.target.value)} placeholder="Dates" />
              <button type="button" className="btn-ghost hub-repeat-remove" onClick={() => removeRow("experience", i)} aria-label="Remove">✕</button>
            </div>
          ))}
          {form.experience.length < MAX_EXPERIENCE && (
            <button type="button" className="btn-ghost" onClick={() => addRow("experience", { role: "", company: "", dates: "" }, MAX_EXPERIENCE)}>
              + Add work experience
            </button>
          )}

          <label className="field-label" style={{ marginTop: 16 }}>Education (optional)</label>
          {form.education.map((edu, i) => (
            <div className="hub-repeat-row" key={i}>
              <input type="text" value={edu.degree} onChange={(e) => updateRow("education", i, "degree", e.target.value)} placeholder="Degree / qualification" />
              <input type="text" value={edu.school} onChange={(e) => updateRow("education", i, "school", e.target.value)} placeholder="School" />
              <input type="text" value={edu.dates} onChange={(e) => updateRow("education", i, "dates", e.target.value)} placeholder="Dates" />
              <button type="button" className="btn-ghost hub-repeat-remove" onClick={() => removeRow("education", i)} aria-label="Remove">✕</button>
            </div>
          ))}
          {form.education.length < MAX_EDUCATION && (
            <button type="button" className="btn-ghost" onClick={() => addRow("education", { degree: "", school: "", dates: "" }, MAX_EDUCATION)}>
              + Add education
            </button>
          )}

          {err && <p className="error">{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn-primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : hubProfile ? "Save changes" : "Publish my card"}
            </button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
