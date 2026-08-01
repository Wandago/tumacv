"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import CvView from "../../components/CvView";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, FREE_MODE } from "../../lib/plans";
import { earnedBadges, nextBadge, BADGES } from "../../lib/gamification";
import ShareButtons from "../../components/ShareButtons";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewing, setViewing] = useState(null); // {result, template}
  const [tab, setTab] = useState("cv");
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const [paidBanner, setPaidBanner] = useState(false);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [hiredBusy, setHiredBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("paid=1")) {
      setPaidBanner(true);
    }
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      if (!data?.user) router.replace("/login");
      else setUser(data.user);
    });
  }, [router]);

  async function loadData(u) {
    const sb = supabaseBrowser();
    const [{ data: p }, { data: h }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", u.id).single(),
      sb.from("generations").select("id, job_title, template, created_at, result")
        .eq("user_id", u.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setProfile(p);
    setHistory(h || []);
  }

  useEffect(() => {
    if (user) loadData(user);
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.industry) return;
    setInsightLoading(true);
    supabaseBrowser().auth.getSession().then(async ({ data: sess }) => {
      try {
        const res = await fetch("/api/insight", {
          headers: { authorization: `Bearer ${sess?.session?.access_token}` },
        });
        const data = await res.json();
        setInsight(data.insight || null);
      } catch {
        setInsight(null);
      } finally {
        setInsightLoading(false);
      }
    });
  }, [user, profile?.industry]);

  async function toggleHired(value) {
    setHiredBusy(true);
    const sb = supabaseBrowser();
    await sb.from("profiles").update({ hired: value, hired_at: value ? new Date().toISOString() : null }).eq("id", user.id);
    setProfile((p) => ({ ...p, hired: value }));
    setHiredBusy(false);
  }

  // After returning from payment, poll a few times while the webhook lands.
  useEffect(() => {
    if (!paidBanner || !user) return;
    const t = setInterval(() => loadData(user), 4000);
    const stop = setTimeout(() => clearInterval(t), 40000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [paidBanner, user]);

  async function buy(planId) {
    setErr("");
    setBuying(planId);
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess?.session?.access_token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not start the payment.");
      else window.location.href = data.url;
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBuying("");
    }
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  const unlimited =
    profile?.plan === "unlimited" && profile?.plan_expires && new Date(profile.plan_expires) > new Date();

  if (viewing) {
    return (
      <main className="shell wide">
        <Nav />
        <div className="results-head">
          <h2>{viewing.job_title || "Application"}</h2>
          <button className="btn-ghost" onClick={() => setViewing(null)}>← Back to dashboard</button>
          <button className="btn-primary" onClick={() => window.print()}>
            {tab === "cv" ? "Save CV as PDF" : "Save letter as PDF"}
          </button>
        </div>
        <div className="doc-tabs">
          <button className={tab === "cv" ? "on" : "btn-ghost"} onClick={() => setTab("cv")}>CV</button>
          <button className={tab === "letter" ? "on" : "btn-ghost"} onClick={() => setTab("letter")}>Cover letter</button>
        </div>
        <div className="sheet-wrap">
          <div className="sheet">
            {tab === "cv"
              ? <CvView data={viewing.result?.cv} template={viewing.template || "modern"} />
              : <div className="letter">{viewing.result?.coverLetter}</div>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell wide">
      <Nav />
      <div className="results-head">
        <h2>Your dashboard</h2>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </div>

      {paidBanner && (
        <div className="banner">
          Payment received — your account updates within a minute of M-Pesa/card confirmation.
        </div>
      )}

      {profile?.hired ? (
        <div className="banner hired-banner">
          🎉 Congratulations on landing the job! Come back any time you need TumaCV again.
          <button className="linkish" style={{ marginLeft: 10 }} onClick={() => toggleHired(false)} disabled={hiredBusy}>
            Not hired anymore? Undo
          </button>
        </div>
      ) : (
        history.length > 0 && (
          <button className="hired-prompt" onClick={() => toggleHired(true)} disabled={hiredBusy}>
            🎉 Got the job? Tap to celebrate
          </button>
        )
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <h3>BALANCE</h3>
          <div className="big-number">{FREE_MODE || unlimited ? "∞" : profile?.credits ?? "…"}</div>
          <p>
            {FREE_MODE
              ? "Free during beta — generate as many as you like"
              : unlimited
              ? `Unlimited until ${new Date(profile.plan_expires).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
              : "applications remaining"}
          </p>
        </div>

        <div className="dash-card">
          <h3>STREAK</h3>
          <div className="big-number streak-number">
            {profile?.streak_count > 0 ? `🔥 ${profile.streak_count}` : "—"}
          </div>
          <p>{profile?.streak_count > 0 ? `day${profile.streak_count === 1 ? "" : "s"} in a row` : "Generate today to start a streak"}</p>
        </div>

        {!FREE_MODE && (
          <div className="dash-card span2">
            <h3>TOP UP</h3>
            <div className="plan-row">
              {Object.values(PLANS).map((p) => (
                <button key={p.id} className="plan-card" onClick={() => buy(p.id)} disabled={!!buying}>
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-price">KES {p.priceKes}</div>
                  <div className="plan-blurb">{buying === p.id ? "Opening checkout…" : p.blurb}</div>
                </button>
              ))}
            </div>
            <p className="field-note">Pay with M-Pesa, Airtel Money, or Visa/Mastercard. Passes don't auto-renew.</p>
            {err && <p className="error">{err}</p>}
          </div>
        )}
      </div>

      {profile?.industry && (
        <div className="insight-card">
          <span className="insight-label">💡 Tip for {profile.industry}, {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
          {insightLoading ? (
            <p className="step-hint" style={{ margin: 0 }}>Loading today's tip…</p>
          ) : insight ? (
            <p className="insight-text">{insight}</p>
          ) : (
            <p className="step-hint" style={{ margin: 0 }}>Check back after your next generation for a fresh tip.</p>
          )}
        </div>
      )}
      {!profile?.industry && (
        <div className="insight-card muted">
          <span className="insight-label">💡 Want personalized tips?</span>
          <p className="step-hint" style={{ margin: 0 }}>
            <a href="/onboarding">Tell us your industry</a> to unlock a daily job-hunting tip made for your field.
          </p>
        </div>
      )}

      <section className="badges-section">
        <div className="step-head"><span className="step-no">PROGRESS</span><h2>Your badges</h2></div>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const on = history.length >= b.threshold;
            return (
              <div key={b.id} className={`badge-item ${on ? "on" : ""}`}>
                <span className="badge-emoji">{b.emoji}</span>
                <span className="badge-label">{b.label}</span>
                <span className="badge-threshold">{b.threshold} application{b.threshold === 1 ? "" : "s"}</span>
              </div>
            );
          })}
        </div>
        {nextBadge(history.length) && (
          <p className="field-note">
            {nextBadge(history.length).threshold - history.length} more to unlock "{nextBadge(history.length).label}" {nextBadge(history.length).emoji}
          </p>
        )}
      </section>

      <section style={{ marginTop: 34 }}>
        <div className="step-head">
          <span className="step-no">HISTORY</span>
          <h2>Past applications</h2>
          {history.length > 0 && (
            <span className="week-stat">
              {history.filter((h) => Date.now() - new Date(h.created_at).getTime() < 7 * 86400000).length} this week
            </span>
          )}
        </div>
        {history.length === 0 ? (
          <p className="step-hint">Nothing yet. <a href="/">Generate your first tailored CV →</a></p>
        ) : (
          <div className="history-list">
            {history.map((h) => (
              <button key={h.id} className="history-item" onClick={() => { setViewing(h); setTab("cv"); }}>
                <span className="hi-title">{h.job_title || "Application"}</span>
                <span className="hi-meta">
                  {h.template} · {new Date(h.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
