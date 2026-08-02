"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Admin() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null); // null = checking
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [payments, setPayments] = useState(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState("");
  const [linkResult, setLinkResult] = useState(null);
  const [err, setErr] = useState("");

  async function authHeader() {
    const { data } = await supabaseBrowser().auth.getSession();
    return { authorization: `Bearer ${data?.session?.access_token}` };
  }

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u?.user) { router.replace("/login"); return; }
      const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", u.user.id).single();
      if (!profile?.is_admin) { setAuthorized(false); return; }
      setAuthorized(true);
    })();
  }, [router]);

  async function load(type) {
    setErr("");
    const res = await fetch(`/api/admin/data?type=${type}`, { headers: await authHeader() });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Could not load data."); return; }
    if (type === "users") setUsers(data.users);
    if (type === "jobs") setJobs(data.jobs);
    if (type === "payments") setPayments(data.payments);
  }

  useEffect(() => {
    if (!authorized) return;
    if (tab === "users" && users === null) load("users");
    if (tab === "jobs" && jobs === null) load("jobs");
    if (tab === "payments" && payments === null) load("payments");
  }, [authorized, tab]); // eslint-disable-line

  async function act(action, payload) {
    setErr("");
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "content-type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Action failed."); return null; }
    return data;
  }

  async function adjustCredits(userId, delta) {
    setBusyId(userId);
    const data = await act("adjust_credits", { userId, delta });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, credits: data.credits } : x)));
    setBusyId("");
  }

  async function getResetLink(email, userId) {
    setBusyId(userId);
    setLinkResult(null);
    const data = await act("reset_link", { email });
    if (data) setLinkResult({ email, link: data.link });
    setBusyId("");
  }

  async function deleteJob(jobId) {
    if (!confirm("Delete this job posting? This can't be undone.")) return;
    setBusyId(jobId);
    const data = await act("delete_job", { jobId });
    if (data) setJobs((j) => j.filter((x) => x.id !== jobId));
    setBusyId("");
  }

  async function copyLink(link) {
    await navigator.clipboard.writeText(link);
    alert("Link copied — share it with the user directly (WhatsApp, SMS, call).");
  }

  if (authorized === null) return null;
  if (authorized === false) {
    return (
      <main className="shell">
        <Nav />
        <div className="auth-card">
          <h1>Not authorized</h1>
          <p className="step-hint">This area is restricted to TumaCV admins.</p>
        </div>
      </main>
    );
  }

  const filteredUsers = users ? users.filter((u) => !q || u.email?.toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>Admin</h2>
      </div>

      <div className="doc-tabs">
        <button className={tab === "users" ? "on" : "btn-ghost"} onClick={() => setTab("users")}>Users</button>
        <button className={tab === "jobs" ? "on" : "btn-ghost"} onClick={() => setTab("jobs")}>Jobs board</button>
        <button className={tab === "payments" ? "on" : "btn-ghost"} onClick={() => setTab("payments")}>Payments</button>
      </div>

      {err && <p className="error">{err}</p>}

      {linkResult && (
        <div className="banner">
          Reset link for <b>{linkResult.email}</b>:
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ fontSize: 11, wordBreak: "break-all", flex: 1 }}>{linkResult.link}</code>
            <button className="btn-ghost" onClick={() => copyLink(linkResult.link)}>Copy</button>
            <button className="btn-ghost" onClick={() => setLinkResult(null)}>Dismiss</button>
          </div>
          <p className="field-note">One-time use, expires soon. Share it directly with the person — don't post it anywhere public.</p>
        </div>
      )}

      {tab === "users" && (
        <>
          <input type="text" placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
          {filteredUsers === null ? (
            <div className="loading"><span className="spinner" /> Loading users…</div>
          ) : (
            <div className="history-list">
              {filteredUsers.map((u) => (
                <div key={u.id} className="history-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span className="hi-title">
                      {u.email} {u.is_admin && <span className="credits-pill" style={{ marginLeft: 6 }}>admin</span>}
                      {u.hired && <span className="credits-pill" style={{ marginLeft: 6 }}>hired</span>}
                    </span>
                    <span className="hi-meta">
                      {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{u.industry || "no industry set"}{" · "}🔥{u.streak_count || 0}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="field-note" style={{ marginTop: 0 }}>
                      {u.plan === "unlimited" ? "Unlimited" : `${u.credits} credits`} · plan: {u.plan}
                    </span>
                    <button className="btn-ghost" disabled={busyId === u.id} onClick={() => adjustCredits(u.id, 5)}>+5 credits</button>
                    <button className="btn-ghost" disabled={busyId === u.id} onClick={() => adjustCredits(u.id, -5)}>-5 credits</button>
                    <button className="btn-ghost" disabled={busyId === u.id} onClick={() => getResetLink(u.email, u.id)}>
                      {busyId === u.id ? "…" : "Get reset link"}
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="step-hint">No users match "{q}".</p>}
            </div>
          )}
        </>
      )}

      {tab === "jobs" && (
        jobs === null ? (
          <div className="loading"><span className="spinner" /> Loading jobs…</div>
        ) : (
          <div className="history-list">
            {jobs.map((j) => (
              <div key={j.id} className="history-item">
                <div>
                  <span className="hi-title">{j.title} — {j.company}</span>
                  <div className="field-note" style={{ marginTop: 2 }}>{j.location} · {j.job_type}</div>
                </div>
                <button className="btn-ghost" disabled={busyId === j.id} onClick={() => deleteJob(j.id)}>
                  {busyId === j.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
            {jobs.length === 0 && <p className="step-hint">No jobs posted yet.</p>}
          </div>
        )
      )}

      {tab === "payments" && (
        payments === null ? (
          <div className="loading"><span className="spinner" /> Loading payments…</div>
        ) : (
          <div className="history-list">
            {payments.map((p) => (
              <div key={p.id} className="history-item">
                <span className="hi-title">{p.plan_id} — KES {p.amount}</span>
                <span className="hi-meta">
                  <span className="credits-pill" style={{ marginRight: 8 }}>{p.status}</span>
                  {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
            {payments.length === 0 && <p className="step-hint">No payments yet.</p>}
          </div>
        )
      )}
    </main>
  );
}
