"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { INDUSTRIES, EXPERIENCE_LEVELS } from "../lib/gamification";

function suggestedFields(profile, latestGeneration) {
  const cv = latestGeneration?.result?.cv;
  return {
    displayName: cv?.name ? `${cv.name.split(" ")[0]} ${cv.name.split(" ").slice(-1)[0]?.[0] || ""}.` : "",
    title: cv?.title || "",
    industry: profile?.industry || "",
    experienceLevel: profile?.experience_level || "",
    skills: (cv?.skills || []).slice(0, 6).join(", "),
    blurb: "",
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
    setForm(
      hubProfile
        ? {
            displayName: hubProfile.display_name,
            title: hubProfile.title,
            industry: hubProfile.industry || "",
            experienceLevel: hubProfile.experience_level || "",
            skills: (hubProfile.skills || []).join(", "),
            blurb: hubProfile.blurb || "",
          }
        : suggestedFields(profile, latestGeneration)
    );
    setEditing(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setErr("");
    if (!form.displayName.trim() || !form.title.trim()) {
      setErr("A display name and title are required.");
      return;
    }
    setSaving(true);
    const row = {
      id: user.id,
      display_name: form.displayName.trim().slice(0, 60),
      title: form.title.trim().slice(0, 80),
      industry: form.industry || null,
      experience_level: form.experienceLevel || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
      blurb: form.blurb.trim().slice(0, 200) || null,
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
            Publish a short, public profile card — name, title, industry, and top skills — so
            employers browsing TumaCV's <a href="/hub">Talent Hub</a> can see you're out there.
            No contact info, email, or full CV is ever shown.
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
          <label className="field-label">Top skills (comma-separated)</label>
          <input type="text" value={form.skills} onChange={(e) => setField("skills", e.target.value)}
            placeholder="e.g. Paid Social, SEO, Content Strategy" />
          <label className="field-label">One-line blurb (optional)</label>
          <input type="text" value={form.blurb} onChange={(e) => setField("blurb", e.target.value)}
            placeholder="A short line about what you're looking for" />
          {err && <p className="error">{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
