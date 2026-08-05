"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Admin() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [industryStats, setIndustryStats] = useState(null);
  const [pageStats, setPageStats] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [users, setUsers] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [payments, setPayments] = useState(null);
  const [articles, setArticles] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userGens, setUserGens] = useState({});
  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState("all");
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
    if (type === "stats") setStats(data.stats);
    if (type === "referral_stats") setReferralStats(data.stats);
    if (type === "industry_stats") setIndustryStats(data.stats);
    if (type === "page_stats") setPageStats(data);
    if (type === "users") setUsers(data.users);
    if (type === "jobs") setJobs(data.jobs);
    if (type === "payments") setPayments(data.payments);
    if (type === "articles") setArticles(data.articles);
  }

  useEffect(() => {
    if (!authorized) return;
    if (tab === "overview" && stats === null) load("stats");
    if (tab === "overview" && referralStats === null) load("referral_stats");
    if (tab === "overview" && industryStats === null) load("industry_stats");
    if (tab === "overview" && pageStats === null) load("page_stats");
    if (tab === "users" && users === null) load("users");
    if (tab === "jobs" && jobs === null) load("jobs");
    if (tab === "payments" && payments === null) load("payments");
    if (tab === "articles" && articles === null) load("articles");
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

  async function toggleAdmin(userId, value) {
    if (!confirm(value ? "Make this user an admin? They'll get full access to this panel." : "Remove admin access from this user?")) return;
    setBusyId(userId);
    const data = await act("toggle_admin", { userId, value });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, is_admin: value } : x)));
    setBusyId("");
  }

  async function resetAccount(userId, email) {
    if (!confirm(`Reset ${email}'s account? This deletes their application history and reverts credits, streak, and hired status to a fresh signup. Their login (email/password) is not affected. This can't be undone.`)) return;
    setBusyId(userId);
    const data = await act("reset_account", { userId });
    if (data) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, streak_count: 0, hired: false, plan: "free" } : x)));
      setUserGens((g) => ({ ...g, [userId]: [] }));
    }
    setBusyId("");
  }

  function openEdit(u) {
    setEditingUser(editingUser === u.id ? null : u.id);
    setEditForm({ email: u.email || "", industry: u.industry || "", experience_level: u.experience_level || "" });
  }

  async function saveUserEdit(userId) {
    setBusyId(userId);
    const data = await act("update_user", { userId, ...editForm });
    if (data) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, ...editForm } : x)));
      setEditingUser(null);
    }
    setBusyId("");
  }

  async function getResetLink(email, userId) {
    setBusyId(userId);
    setLinkResult(null);
    const data = await act("reset_link", { email });
    if (data) setLinkResult({ email, link: data.link });
    setBusyId("");
  }

  async function viewActivity(userId) {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (!userGens[userId]) {
      const res = await fetch(`/api/admin/data?type=user_generations&userId=${userId}`, { headers: await authHeader() });
      const data = await res.json();
      if (res.ok) setUserGens((g) => ({ ...g, [userId]: data.generations }));
    }
  }

  async function deleteJob(jobId) {
    if (!confirm("Delete this job posting? This can't be undone.")) return;
    setBusyId(jobId);
    const data = await act("delete_job", { jobId });
    if (data) setJobs((j) => j.filter((x) => x.id !== jobId));
    setBusyId("");
  }

  async function deleteArticle(articleId) {
    if (!confirm("Delete this article?")) return;
    setBusyId(articleId);
    const data = await act("delete_article", { articleId });
    if (data) setArticles((a) => a.filter((x) => x.id !== articleId));
    setBusyId("");
  }

  async function resolvePayment(paymentId, newStatus) {
    const label = newStatus === "complete" ? "mark this payment COMPLETE and credit the user's account" : "mark this payment FAILED";
    if (!confirm(`Are you sure you want to ${label}? This is meant for fixing a payment where the automatic webhook missed it.`)) return;
    setBusyId(paymentId);
    const data = await act("resolve_payment", { paymentId, newStatus });
    if (data) setPayments((p) => p.map((x) => (x.id === paymentId ? { ...x, status: newStatus } : x)));
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
  const filteredJobs = jobs ? jobs.filter((j) => !q || `${j.title} ${j.company}`.toLowerCase().includes(q.toLowerCase())) : null;
  const filteredPayments = payments ? payments.filter((p) => payFilter === "all" || p.status === payFilter) : null;

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>Admin</h2>
      </div>

      <div className="doc-tabs" style={{ flexWrap: "wrap" }}>
        <button className={tab === "overview" ? "on" : "btn-ghost"} onClick={() => { setTab("overview"); setQ(""); }}>Overview</button>
        <button className={tab === "users" ? "on" : "btn-ghost"} onClick={() => { setTab("users"); setQ(""); }}>Users</button>
        <button className={tab === "jobs" ? "on" : "btn-ghost"} onClick={() => { setTab("jobs"); setQ(""); }}>Jobs board</button>
        <button className={tab === "payments" ? "on" : "btn-ghost"} onClick={() => setTab("payments")}>Payments</button>
        <button className={tab === "articles" ? "on" : "btn-ghost"} onClick={() => setTab("articles")}>News articles</button>
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

      {tab === "overview" && (
        stats === null ? (
          <div className="loading"><span className="spinner" /> Loading stats…</div>
        ) : (
          <>
            <div className="dash-grid">
              <div className="dash-card"><h3>TOTAL USERS</h3><div className="big-number">{stats.totalUsers}</div></div>
              <div className="dash-card"><h3>SIGNUPS · 7 DAYS</h3><div className="big-number">{stats.signupsWeek}</div></div>
              <div className="dash-card"><h3>TOTAL APPLICATIONS</h3><div className="big-number">{stats.totalGenerations}</div></div>
              <div className="dash-card"><h3>REVENUE (COMPLETE)</h3><div className="big-number">KES {stats.totalRevenue}</div></div>
              <div className="dash-card"><h3>USERS HIRED</h3><div className="big-number">{stats.hiredCount}</div></div>
              <div className="dash-card"><h3>ACTIVE STREAKS (3+ DAYS)</h3><div className="big-number streak-number">🔥 {stats.activeStreaks}</div></div>
            </div>

            <div className="breakdown-grid">
              <BarCard title="WHERE USERS HEARD ABOUT US" data={referralStats} />
              <BarCard title="USERS BY INDUSTRY" data={industryStats} />
              <BarCard
                title={`MOST VISITED PAGES ${pageStats ? `(${pageStats.totalViews} views, 30 days)` : ""}`}
                data={pageStats?.stats}
              />
            </div>
          </>
        )
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
                      {u.referral_source ? ` · via ${u.referral_source}` : ""}
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
                    <button className="btn-ghost" disabled={busyId === u.id} onClick={() => toggleAdmin(u.id, !u.is_admin)}>
                      {u.is_admin ? "Remove admin" : "Make admin"}
                    </button>
                    <button className="btn-ghost" onClick={() => viewActivity(u.id)}>
                      {expandedUser === u.id ? "Hide activity" : "View activity"}
                    </button>
                    <button className="btn-ghost" onClick={() => openEdit(u)}>
                      {editingUser === u.id ? "Cancel edit" : "Edit details"}
                    </button>
                    <button className="btn-ghost danger-btn" disabled={busyId === u.id} onClick={() => resetAccount(u.id, u.email)}>
                      {busyId === u.id ? "…" : "Reset account"}
                    </button>
                  </div>
                  {editingUser === u.id && (
                    <div className="edit-user-form">
                      <label className="field-label">Email</label>
                      <input type="text" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                      <label className="field-label">Industry</label>
                      <input type="text" value={editForm.industry} onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))} />
                      <label className="field-label">Experience level</label>
                      <input type="text" value={editForm.experience_level} onChange={(e) => setEditForm((f) => ({ ...f, experience_level: e.target.value }))} placeholder="e.g. mid, senior, graduate" />
                      <button className="btn-primary" style={{ marginTop: 10 }} disabled={busyId === u.id} onClick={() => saveUserEdit(u.id)}>
                        {busyId === u.id ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}
                  {expandedUser === u.id && (
                    <div style={{ borderTop: "1px solid var(--stone)", paddingTop: 8, marginTop: 2 }}>
                      {!userGens[u.id] ? (
                        <span className="field-note">Loading…</span>
                      ) : userGens[u.id].length === 0 ? (
                        <span className="field-note">No applications generated yet.</span>
                      ) : (
                        userGens[u.id].map((g) => (
                          <div key={g.id} className="field-note" style={{ display: "flex", justifyContent: "space-between", marginTop: 0, marginBottom: 4 }}>
                            <span>{g.job_title || "Application"} ({g.template})</span>
                            <span>{new Date(g.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="step-hint">No users match "{q}".</p>}
            </div>
          )}
        </>
      )}

      {tab === "jobs" && (
        <>
          <input type="text" placeholder="Search by title or company…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
          {filteredJobs === null ? (
            <div className="loading"><span className="spinner" /> Loading jobs…</div>
          ) : (
            <div className="history-list">
              {filteredJobs.map((j) => (
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
              {filteredJobs.length === 0 && <p className="step-hint">No jobs match.</p>}
            </div>
          )}
        </>
      )}

      {tab === "payments" && (
        <>
          <div className="news-filter-row">
            {["all", "pending", "complete", "failed", "underpaid"].map((s) => (
              <button key={s} className={`news-filter-chip ${payFilter === s ? "on" : ""}`} onClick={() => setPayFilter(s)}>{s}</button>
            ))}
          </div>
          {filteredPayments === null ? (
            <div className="loading"><span className="spinner" /> Loading payments…</div>
          ) : (
            <div className="history-list">
              {filteredPayments.map((p) => (
                <div key={p.id} className="history-item">
                  <div>
                    <span className="hi-title">{p.plan_id} — KES {p.amount}</span>
                    <div className="field-note" style={{ marginTop: 2 }}>
                      {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })} · {p.provider_ref || "no ref"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="credits-pill">{p.status}</span>
                    {p.status !== "complete" && (
                      <>
                        <button className="btn-ghost" disabled={busyId === p.id} onClick={() => resolvePayment(p.id, "complete")}>
                          {busyId === p.id ? "…" : "Mark complete"}
                        </button>
                        {p.status !== "failed" && (
                          <button className="btn-ghost" disabled={busyId === p.id} onClick={() => resolvePayment(p.id, "failed")}>Mark failed</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filteredPayments.length === 0 && <p className="step-hint">No payments match.</p>}
            </div>
          )}
        </>
      )}

      {tab === "articles" && (
        articles === null ? (
          <div className="loading"><span className="spinner" /> Loading articles…</div>
        ) : (
          <div className="history-list">
            {articles.map((a) => (
              <div key={a.id} className="history-item">
                <div>
                  <span className="hi-title">{a.title}</span>
                  <div className="field-note" style={{ marginTop: 2 }}>{a.industry} · {new Date(a.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</div>
                </div>
                <button className="btn-ghost" disabled={busyId === a.id} onClick={() => deleteArticle(a.id)}>
                  {busyId === a.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
            {articles.length === 0 && <p className="step-hint">No articles generated yet.</p>}
          </div>
        )
      )}
    </main>
  );
}

function BarCard({ title, data }) {
  if (!data) {
    return (
      <div className="dash-card bar-card">
        <h3>{title}</h3>
        <div className="loading" style={{ padding: "16px 0" }}><span className="spinner" /></div>
      </div>
    );
  }
  const top = data.slice(0, 8);
  const max = top.length ? Math.max(...top.map((d) => d.count)) : 1;
  return (
    <div className="dash-card bar-card">
      <h3>{title}</h3>
      {top.length === 0 ? (
        <p className="field-note">No data yet.</p>
      ) : (
        <div className="bar-list">
          {top.map((d) => (
            <div className="bar-row" key={d.label}>
              <span className="bar-label">{d.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="bar-count">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
