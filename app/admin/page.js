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
  const [hubProfiles, setHubProfiles] = useState(null);
  const [hubServices, setHubServices] = useState(null);
  const [promoCodes, setPromoCodes] = useState(null);
  const [supportMessages, setSupportMessages] = useState(null);
  const [marketingContent, setMarketingContent] = useState(null);
  const [marketingChannels, setMarketingChannels] = useState(null);
  const [runningMarketing, setRunningMarketing] = useState(false);
  const [marketingRunResult, setMarketingRunResult] = useState(null);
  const [dailyTraffic, setDailyTraffic] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [dayDetail, setDayDetail] = useState({});
  const [dayDetailLoading, setDayDetailLoading] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminReplyBusy, setAdminReplyBusy] = useState(false);
  const [supportFilter, setSupportFilter] = useState("open");
  const [newCode, setNewCode] = useState({ code: "", credits: "5", maxRedemptions: "", expiresAt: "", note: "" });
  const [creatingCode, setCreatingCode] = useState(false);
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
    if (type === "hub_profiles") setHubProfiles(data.hubProfiles);
    if (type === "hub_services") setHubServices(data.hubServices);
    if (type === "promo_codes") setPromoCodes(data.codes);
    if (type === "support_messages") setSupportMessages(data.tickets);
    if (type === "marketing_content") { setMarketingContent(data.content); setMarketingChannels(data.channels); }
    if (type === "daily_traffic") setDailyTraffic(data.days);
  }

  async function toggleDay(date) {
    if (expandedDay === date) { setExpandedDay(null); return; }
    setExpandedDay(date);
    if (dayDetail[date]) return;
    setDayDetailLoading(date);
    const res = await fetch(`/api/admin/data?type=day_detail&date=${date}`, { headers: await authHeader() });
    const data = await res.json();
    setDayDetailLoading(null);
    if (res.ok) setDayDetail((d) => ({ ...d, [date]: data }));
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
    if (tab === "hub" && hubProfiles === null) load("hub_profiles");
    if (tab === "hub" && hubServices === null) load("hub_services");
    if (tab === "promo" && promoCodes === null) load("promo_codes");
    if (tab === "support" && supportMessages === null) load("support_messages");
    if (tab === "marketing" && marketingContent === null) load("marketing_content");
    if (tab === "traffic" && dailyTraffic === null) load("daily_traffic");
  }, [authorized, tab]); // eslint-disable-line

  async function runMarketingNow() {
    setRunningMarketing(true);
    setMarketingRunResult(null);
    const data = await act("run_marketing_now");
    setRunningMarketing(false);
    if (data) {
      setMarketingRunResult(data.result);
      load("marketing_content");
    }
  }

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

  async function toggleBan(userId, value) {
    if (!confirm(value ? "Suspend this account? They won't be able to generate, pay, or redeem codes until unbanned." : "Unban this account?")) return;
    setBusyId(userId);
    const data = await act("toggle_ban", { userId, value });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, banned: value } : x)));
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

  async function deleteHubProfile(hubProfileId) {
    if (!confirm("Remove this profile from the public Talent Hub? The user can rejoin themselves anytime.")) return;
    setBusyId(hubProfileId);
    const data = await act("delete_hub_profile", { hubProfileId });
    if (data) setHubProfiles((h) => h.filter((x) => x.id !== hubProfileId));
    setBusyId("");
  }

  async function deleteHubService(hubServiceId) {
    if (!confirm("Remove this service listing?")) return;
    setBusyId(hubServiceId);
    const data = await act("delete_hub_service", { hubServiceId });
    if (data) setHubServices((s) => s.filter((x) => x.id !== hubServiceId));
    setBusyId("");
  }

  async function createPromoCode() {
    setErr("");
    if (!newCode.code.trim() || !newCode.credits) {
      setErr("Code and credits are required.");
      return;
    }
    setCreatingCode(true);
    const data = await act("create_promo_code", {
      code: newCode.code,
      credits: newCode.credits,
      maxRedemptions: newCode.maxRedemptions,
      expiresAt: newCode.expiresAt,
      note: newCode.note,
    });
    if (data) {
      setPromoCodes((c) => [data.code, ...(c || [])]);
      setNewCode({ code: "", credits: "5", maxRedemptions: "", expiresAt: "", note: "" });
    }
    setCreatingCode(false);
  }

  async function togglePromoCode(codeId, active) {
    setBusyId(codeId);
    const data = await act("toggle_promo_code", { codeId, active });
    if (data) setPromoCodes((c) => c.map((x) => (x.id === codeId ? { ...x, active } : x)));
    setBusyId("");
  }

  async function resolveSupportMessage(messageId, status) {
    setBusyId(messageId);
    const data = await act("resolve_support_message", { messageId, status });
    if (data) setSupportMessages((m) => m.map((x) => (x.id === messageId ? { ...x, status } : x)));
    setBusyId("");
  }

  async function sendAdminReply(ticketId) {
    if (!adminReplyText.trim()) return;
    setAdminReplyBusy(true);
    const data = await act("admin_reply_ticket", { ticketId, message: adminReplyText });
    if (data) {
      setSupportMessages((list) =>
        list.map((t) =>
          t.id === ticketId
            ? { ...t, support_ticket_messages: [...t.support_ticket_messages, { id: `temp-${Date.now()}`, sender: "admin", message: adminReplyText, created_at: new Date().toISOString() }] }
            : t
        )
      );
      setAdminReplyText("");
    }
    setAdminReplyBusy(false);
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
        <button className={tab === "hub" ? "on" : "btn-ghost"} onClick={() => setTab("hub")}>Talent Hub</button>
        <button className={tab === "promo" ? "on" : "btn-ghost"} onClick={() => setTab("promo")}>Promo codes</button>
        <button className={tab === "support" ? "on" : "btn-ghost"} onClick={() => setTab("support")}>Support</button>
        <button className={tab === "marketing" ? "on" : "btn-ghost"} onClick={() => setTab("marketing")}>Marketing</button>
        <button className={tab === "traffic" ? "on" : "btn-ghost"} onClick={() => setTab("traffic")}>Traffic</button>
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
            {(stats.needsAttention?.openTickets > 0 || stats.needsAttention?.pendingPayments > 0 || stats.needsAttention?.underpaidPayments > 0) && (
              <div className="attention-row">
                {stats.needsAttention.openTickets > 0 && (
                  <button className="attention-chip" onClick={() => setTab("support")}>
                    <b>{stats.needsAttention.openTickets}</b> open support ticket{stats.needsAttention.openTickets === 1 ? "" : "s"} →
                  </button>
                )}
                {stats.needsAttention.pendingPayments > 0 && (
                  <button className="attention-chip warn" onClick={() => setTab("payments")}>
                    <b>{stats.needsAttention.pendingPayments}</b> pending payment{stats.needsAttention.pendingPayments === 1 ? "" : "s"} →
                  </button>
                )}
                {stats.needsAttention.underpaidPayments > 0 && (
                  <button className="attention-chip warn" onClick={() => setTab("payments")}>
                    <b>{stats.needsAttention.underpaidPayments}</b> underpaid payment{stats.needsAttention.underpaidPayments === 1 ? "" : "s"} →
                  </button>
                )}
              </div>
            )}

            <div className="dash-grid">
              <div className="dash-card"><h3>TOTAL USERS</h3><div className="big-number">{stats.totalUsers}</div></div>
              <div className="dash-card"><h3>SIGNUPS · 7 DAYS</h3><div className="big-number">{stats.signupsWeek}</div></div>
              <div className="dash-card"><h3>TOTAL APPLICATIONS</h3><div className="big-number">{stats.totalGenerations}</div></div>
              <div className="dash-card"><h3>REVENUE (COMPLETE)</h3><div className="big-number">KES {stats.totalRevenue}</div></div>
              <div className="dash-card"><h3>USERS HIRED</h3><div className="big-number">{stats.hiredCount}</div></div>
              <div className="dash-card"><h3>ACTIVE STREAKS (3+ DAYS)</h3><div className="big-number streak-number">🔥 {stats.activeStreaks}</div></div>
            </div>

            <div className="breakdown-grid">
              <TrendChart title="SIGNUPS (30 DAYS)" series={stats.trends?.signups} />
              <TrendChart title="APPLICATIONS GENERATED (30 DAYS)" series={stats.trends?.generations} />
              <TrendChart title="REVENUE (30 DAYS)" series={stats.trends?.revenue} format={(n) => `KES ${n}`} />
            </div>

            <div className="breakdown-grid">
              <FunnelCard funnel={stats.funnel} />
              <BarCard title="REVENUE BY PLAN" data={stats.planBreakdown} />
              <BarCard title="WHERE USERS HEARD ABOUT US" data={referralStats} />
            </div>

            <div className="breakdown-grid">
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
                      {u.banned && <span className="credits-pill danger-pill" style={{ marginLeft: 6 }}>suspended</span>}
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
                    <button className="btn-ghost danger-btn" disabled={busyId === u.id} onClick={() => toggleBan(u.id, !u.banned)}>
                      {u.banned ? "Unban" : "Suspend account"}
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

      {tab === "hub" && (
        <>
          {hubProfiles === null ? (
            <div className="loading"><span className="spinner" /> Loading Talent Hub profiles…</div>
          ) : (
            <div className="history-list">
              {hubProfiles.map((p) => (
                <div key={p.id} className="history-item">
                  <div>
                    <span className="hi-title">{p.display_name} — {p.title}</span>
                    <div className="field-note" style={{ marginTop: 2 }}>
                      {[p.industry, p.experience_level].filter(Boolean).join(" · ")}
                      {(p.skills || []).length > 0 ? ` · ${p.skills.join(", ")}` : ""}
                      {p.blurb ? ` · "${p.blurb}"` : ""}
                    </div>
                    {(p.experience || []).length > 0 && (
                      <div className="field-note" style={{ marginTop: 2 }}>
                        Experience: {p.experience.map((e) => `${e.role}${e.company ? ` @ ${e.company}` : ""}`).join("; ")}
                      </div>
                    )}
                    {(p.education || []).length > 0 && (
                      <div className="field-note" style={{ marginTop: 2 }}>
                        Education: {p.education.map((e) => `${e.degree}${e.school ? ` @ ${e.school}` : ""}`).join("; ")}
                      </div>
                    )}
                  </div>
                  <button className="btn-ghost danger-btn" disabled={busyId === p.id} onClick={() => deleteHubProfile(p.id)}>
                    {busyId === p.id ? "…" : "Remove"}
                  </button>
                </div>
              ))}
              {hubProfiles.length === 0 && <p className="step-hint">No one has joined the Talent Hub yet.</p>}
            </div>
          )}

          <h3 style={{ margin: "24px 0 10px" }}>Service listings</h3>
          {hubServices === null ? (
            <div className="loading"><span className="spinner" /> Loading service listings…</div>
          ) : (
            <div className="history-list">
              {hubServices.map((s) => (
                <div key={s.id} className="history-item">
                  <div>
                    <span className="hi-title">
                      <span className="credits-pill" style={{ marginRight: 8 }}>{s.category}</span>
                      {s.title} — KES {s.price_kes.toLocaleString()}
                    </span>
                    <div className="field-note" style={{ marginTop: 2 }}>
                      {s.hub_profiles?.display_name || "Unknown"}{s.delivery_days ? ` · ${s.delivery_days}-day delivery` : ""}
                      {" · "}{s.description.slice(0, 140)}
                    </div>
                  </div>
                  <button className="btn-ghost danger-btn" disabled={busyId === s.id} onClick={() => deleteHubService(s.id)}>
                    {busyId === s.id ? "…" : "Remove"}
                  </button>
                </div>
              ))}
              {hubServices.length === 0 && <p className="step-hint">No services listed yet.</p>}
            </div>
          )}
        </>
      )}

      {tab === "promo" && (
        <>
          <div className="post-card">
            <h3 style={{ marginBottom: 10 }}>Create a new code</h3>
            <div className="two-col">
              <div>
                <label className="field-label">Code</label>
                <input type="text" value={newCode.code} onChange={(e) => setNewCode((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. TIKTOK5" />
              </div>
              <div>
                <label className="field-label">Credits to give</label>
                <input type="number" value={newCode.credits} onChange={(e) => setNewCode((f) => ({ ...f, credits: e.target.value }))} placeholder="5" />
              </div>
              <div>
                <label className="field-label">Max redemptions (blank = unlimited)</label>
                <input type="number" value={newCode.maxRedemptions} onChange={(e) => setNewCode((f) => ({ ...f, maxRedemptions: e.target.value }))} placeholder="e.g. 200" />
              </div>
              <div>
                <label className="field-label">Expires (optional)</label>
                <input type="date" value={newCode.expiresAt} onChange={(e) => setNewCode((f) => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>
            <label className="field-label">Note (for you — not shown to users)</label>
            <input type="text" value={newCode.note} onChange={(e) => setNewCode((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. TikTok launch video, Aug 2026" />
            {err && <p className="error">{err}</p>}
            <button className="btn-primary" style={{ marginTop: 12 }} disabled={creatingCode} onClick={createPromoCode}>
              {creatingCode ? "Creating…" : "Create code"}
            </button>
          </div>

          {promoCodes === null ? (
            <div className="loading"><span className="spinner" /> Loading codes…</div>
          ) : (
            <div className="history-list">
              {promoCodes.map((c) => (
                <div key={c.id} className="history-item">
                  <div>
                    <span className="hi-title">
                      {c.code} <span className="credits-pill" style={{ marginLeft: 6 }}>+{c.credits} credits</span>
                      {!c.active && <span className="credits-pill" style={{ marginLeft: 6 }}>inactive</span>}
                    </span>
                    <div className="field-note" style={{ marginTop: 2 }}>
                      {c.redemptions_count} used{c.max_redemptions ? ` / ${c.max_redemptions} max` : " / unlimited"}
                      {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      {c.note ? ` · ${c.note}` : ""}
                    </div>
                  </div>
                  <button className="btn-ghost" disabled={busyId === c.id} onClick={() => togglePromoCode(c.id, !c.active)}>
                    {busyId === c.id ? "…" : c.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
              {promoCodes.length === 0 && <p className="step-hint">No promo codes yet — create one above.</p>}
            </div>
          )}
        </>
      )}

      {tab === "support" && (
        <>
          <div className="news-filter-row">
            {["open", "resolved", "all"].map((s) => (
              <button key={s} className={`news-filter-chip ${supportFilter === s ? "on" : ""}`} onClick={() => setSupportFilter(s)}>{s}</button>
            ))}
          </div>
          {supportMessages === null ? (
            <div className="loading"><span className="spinner" /> Loading tickets…</div>
          ) : (
            <div className="history-list">
              {supportMessages
                .filter((m) => supportFilter === "all" || m.status === supportFilter)
                .map((t) => {
                  const last = t.support_ticket_messages[t.support_ticket_messages.length - 1];
                  const isOpen = expandedTicket === t.id;
                  return (
                    <div key={t.id} className="history-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                      <button
                        style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "none", padding: 0, textAlign: "left" }}
                        onClick={() => setExpandedTicket(isOpen ? null : t.id)}
                      >
                        <span className="hi-title">
                          <span className="credits-pill" style={{ marginRight: 8 }}>{t.type}</span>
                          {t.subject} <span className="field-note" style={{ marginTop: 0 }}>— {t.email}</span>
                        </span>
                        <span className="hi-meta">
                          {new Date(t.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          {t.status === "resolved" ? " · resolved" : ""}
                        </span>
                      </button>
                      {!isOpen && last && (
                        <p className="field-note" style={{ marginTop: 0 }}>
                          {last.sender === "admin" ? "You: " : ""}{last.message.slice(0, 90)}{last.message.length > 90 ? "…" : ""}
                        </p>
                      )}
                      {isOpen && (
                        <>
                          <div className="ticket-thread" style={{ marginBottom: 10 }}>
                            {t.support_ticket_messages.map((m) => (
                              <div key={m.id} className={`ticket-bubble ${m.sender}`}>
                                <div className="ticket-bubble-meta">
                                  {m.sender === "admin" ? "You" : "User"} · {new Date(m.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="ticket-bubble-text">{m.message}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              placeholder="Reply…"
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && sendAdminReply(t.id)}
                            />
                            <button className="btn-primary" disabled={adminReplyBusy} onClick={() => sendAdminReply(t.id)}>
                              {adminReplyBusy ? "…" : "Send"}
                            </button>
                          </div>
                        </>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <a className="btn-ghost" style={{ textDecoration: "none" }} href={`mailto:${t.email}`}>Reply by email instead</a>
                        {t.status === "open" ? (
                          <button className="btn-ghost" disabled={busyId === t.id} onClick={() => resolveSupportMessage(t.id, "resolved")}>
                            {busyId === t.id ? "…" : "Mark resolved"}
                          </button>
                        ) : (
                          <button className="btn-ghost" disabled={busyId === t.id} onClick={() => resolveSupportMessage(t.id, "open")}>
                            {busyId === t.id ? "…" : "Reopen"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {supportMessages.filter((m) => supportFilter === "all" || m.status === supportFilter).length === 0 && (
                <p className="step-hint">No {supportFilter !== "all" ? supportFilter : ""} messages.</p>
              )}
            </div>
          )}
        </>
      )}

      {tab === "marketing" && (
        <>
          <div className="post-card">
            <h3 style={{ marginBottom: 10 }}>Channels</h3>
            {marketingChannels === null ? (
              <div className="loading"><span className="spinner" /> Loading…</div>
            ) : (
              <div className="history-list">
                {marketingChannels.map((c) => (
                  <div key={c.key} className="history-item">
                    <div>
                      <span className="hi-title">{c.label}</span>
                      {c.note && <div className="field-note" style={{ marginTop: 2 }}>{c.note}</div>}
                    </div>
                    <span className={`credits-pill ${c.enabled ? "" : "warn"}`}>{c.enabled ? "Live" : "Not configured"}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="field-note" style={{ marginTop: 12 }}>
              Runs automatically once a day (see vercel.json's cron-marketing entry). Disabled channels are
              skipped — set the matching env vars (see README) to turn one on.
            </p>
            <button className="btn-primary" style={{ marginTop: 10 }} disabled={runningMarketing} onClick={runMarketingNow}>
              {runningMarketing ? "Running…" : "Run now"}
            </button>
            {marketingRunResult && (
              <pre className="field-note" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(marketingRunResult, null, 2)}
              </pre>
            )}
          </div>

          <h3 style={{ margin: "20px 0 10px" }}>Recent activity</h3>
          {marketingContent === null ? (
            <div className="loading"><span className="spinner" /> Loading…</div>
          ) : (
            <div className="history-list">
              {marketingContent.map((m) => (
                <div key={m.id} className="history-item">
                  <div>
                    <span className="hi-title">
                      <span className="credits-pill" style={{ marginRight: 8 }}>{m.channel}</span>
                      {m.subject || m.body.slice(0, 80)}
                    </span>
                    <div className="field-note" style={{ marginTop: 2 }}>
                      {m.kind}{m.segment ? ` · ${m.segment}` : ""} · {m.status}
                      {m.error ? ` · ${m.error.slice(0, 120)}` : ""}
                      {" · "}{new Date(m.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {marketingContent.length === 0 && <p className="step-hint">Nothing generated yet — hit "Run now" above.</p>}
            </div>
          )}
        </>
      )}

      {tab === "traffic" && (
        <>
          <p className="field-note" style={{ marginBottom: 12 }}>
            Excludes page views and CV generations made from admin accounts — this is real visitor
            activity only. Click a day to see its most-viewed pages.
          </p>
          {dailyTraffic === null ? (
            <div className="loading"><span className="spinner" /> Loading…</div>
          ) : (
            <div className="history-list" style={{ overflowX: "auto" }}>
              <div className="history-item" style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.04em", color: "var(--soil)", fontWeight: 600 }}>
                <span style={{ flex: 1, minWidth: 100 }}>DATE</span>
                <span style={{ width: 80, textAlign: "right" }}>VIEWS</span>
                <span style={{ width: 80, textAlign: "right" }}>SIGNUPS</span>
                <span style={{ width: 100, textAlign: "right" }}>GENERATIONS</span>
                <span style={{ width: 110, textAlign: "right" }}>REVENUE KES</span>
              </div>
              {[...dailyTraffic].reverse().map((d) => {
                const isOpen = expandedDay === d.date;
                const detail = dayDetail[d.date];
                return (
                  <div key={d.date} className="history-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                    <button
                      style={{ display: "flex", background: "none", padding: 0, textAlign: "left", width: "100%" }}
                      onClick={() => toggleDay(d.date)}
                    >
                      <span className="hi-title" style={{ flex: 1, minWidth: 100 }}>
                        {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span style={{ width: 80, textAlign: "right" }}>{d.pageViews}</span>
                      <span style={{ width: 80, textAlign: "right" }}>{d.signups}</span>
                      <span style={{ width: 100, textAlign: "right" }}>{d.generations}</span>
                      <span style={{ width: 110, textAlign: "right" }}>{d.revenueKes.toLocaleString()}</span>
                    </button>
                    {isOpen && (
                      <div style={{ paddingLeft: 4 }}>
                        {dayDetailLoading === d.date ? (
                          <p className="field-note">Loading top pages…</p>
                        ) : detail ? (
                          detail.topPages.length === 0 ? (
                            <p className="field-note">No page views that day.</p>
                          ) : (
                            <div className="field-note">
                              {detail.topPages.map((p) => (
                                <div key={p.path} style={{ display: "flex", justifyContent: "space-between", maxWidth: 420 }}>
                                  <span>{p.path}</span><span>{p.count}</span>
                                </div>
                              ))}
                            </div>
                          )
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
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
              <span className="bar-label" title={d.label}>{d.label}</span>
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

function TrendChart({ title, series, format = (n) => n }) {
  if (!series) {
    return (
      <div className="dash-card trend-card">
        <h3>{title}</h3>
        <div className="loading" style={{ padding: "16px 0" }}><span className="spinner" /></div>
      </div>
    );
  }
  const values = series.map((d) => d.value);
  const max = Math.max(1, ...values);
  const w = 100, h = 34;
  const points = series
    .map((d, i) => `${(i / Math.max(1, series.length - 1)) * w},${h - (d.value / max) * h}`)
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const total = values.reduce((a, b) => a + b, 0);
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  return (
    <div className="dash-card trend-card">
      <div className="trend-head">
        <h3>{title}</h3>
        <span className="trend-total">{format(total)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="trend-svg">
        <polygon points={areaPoints} className="trend-area" />
        <polyline points={points} className="trend-line" />
      </svg>
      <div className="trend-foot">
        <span>{series[0] ? fmtDate(series[0].date) : ""}</span>
        <span>{series[series.length - 1] ? fmtDate(series[series.length - 1].date) : ""}</span>
      </div>
    </div>
  );
}

function FunnelCard({ funnel }) {
  if (!funnel) {
    return (
      <div className="dash-card funnel-card">
        <h3>USER JOURNEY</h3>
        <div className="loading" style={{ padding: "16px 0" }}><span className="spinner" /></div>
      </div>
    );
  }
  const stages = [
    { label: "Signed up", value: funnel.signups },
    { label: "Generated a CV", value: funnel.generated },
    { label: "Paid", value: funnel.paid },
    { label: "Hired", value: funnel.hired },
  ];
  const max = stages[0].value || 1;
  return (
    <div className="dash-card funnel-card">
      <h3>USER JOURNEY</h3>
      <div className="funnel-list">
        {stages.map((s) => {
          const pct = max ? Math.round((s.value / max) * 100) : 0;
          return (
            <div className="funnel-row" key={s.label}>
              <span className="funnel-label">{s.label}</span>
              <div className="funnel-track"><div className="funnel-fill" style={{ width: `${pct}%` }} /></div>
              <span className="funnel-value">{s.value} <span className="funnel-pct">{pct}%</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
