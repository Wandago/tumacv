"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Jobs() {
  const [jobs, setJobs] = useState(null);
  const [user, setUser] = useState(null);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", job_type: "Full-time", description: "", how_to_apply: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
    sb.from("jobs").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setJobs(data || []));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function post() {
    setErr("");
    if (!form.title || !form.company || form.description.length < 60 || !form.how_to_apply) {
      setErr("Fill in the title, company, a real description (60+ characters), and how to apply.");
      return;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.from("jobs")
      .insert({ ...form, user_id: user.id })
      .select().single();
    setBusy(false);
    if (error) { setErr("Could not post. Try again."); return; }
    setJobs((j) => [data, ...(j || [])]);
    setPosting(false);
    setForm({ title: "", company: "", location: "", job_type: "Full-time", description: "", how_to_apply: "" });
  }

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>Jobs board</h2>
        {user ? (
          <button className="btn-primary" onClick={() => setPosting(!posting)}>
            {posting ? "Close" : "Post a job — free"}
          </button>
        ) : (
          <a className="btn-primary" style={{ textDecoration: "none" }} href="/login">Sign in to post a job — free</a>
        )}
      </div>
      <p className="step-hint">
        Hiring? Post here for free and reach job seekers who apply with properly tailored CVs.
        Job seekers: tap any job to read it, then generate a CV matched to it in one click.
      </p>

      {posting && (
        <div className="post-card">
          <div className="two-col">
            <div>
              <label className="field-label">Job title</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sales Executive" />
            </div>
            <div>
              <label className="field-label">Company</label>
              <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Acme Ltd" />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Nairobi / Remote" />
            </div>
            <div>
              <label className="field-label">Type</label>
              <input type="text" value={form.job_type} onChange={(e) => set("job_type", e.target.value)} placeholder="Full-time / Part-time / Gig" />
            </div>
          </div>
          <label className="field-label">Description & requirements</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Responsibilities, requirements, salary range if you can share it…" />
          <label className="field-label">How to apply</label>
          <input type="text" value={form.how_to_apply} onChange={(e) => set("how_to_apply", e.target.value)}
            placeholder="Email, phone, or application link" />
          {err && <p className="error">{err}</p>}
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={post} disabled={busy}>
            {busy ? "Posting…" : "Publish job"}
          </button>
        </div>
      )}

      {jobs === null ? (
        <div className="loading"><span className="spinner" /> Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <p className="step-hint" style={{ padding: "30px 0" }}>
          No jobs posted yet — be the first. Posting is free.
        </p>
      ) : (
        <div className="job-list">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="job-card">
              <div className="job-head">
                <div>
                  <div className="job-title">{j.title}</div>
                  <div className="job-meta">
                    {j.company}{j.location ? ` · ${j.location}` : ""}{j.job_type ? ` · ${j.job_type}` : ""} ·{" "}
                    {new Date(j.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <span className="job-chev">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
