"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import CvView from "../../components/CvView";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, FREE_MODE, MPESA_ENABLED, PADDLE_ENABLED, DARAJA_ENABLED, FREE_SIGNUP_CREDITS, toUsd } from "../../lib/plans";
import { earnedBadges, nextBadge, BADGES } from "../../lib/gamification";
import { clearLegacySharedDraft } from "../../lib/storage";
import { generateCvDocx, downloadBlob } from "../../lib/generateDocx";
import { openPaddleCheckout, paddlePriceIdFor } from "../../lib/paddle";
import GlobalPayHelp from "../../components/GlobalPayHelp";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [docxBusy, setDocxBusy] = useState(false);
  const [tab, setTab] = useState("cv");
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const [showGlobalPay, setShowGlobalPay] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaBusy, setMpesaBusy] = useState(false);
  const [mpesaMsg, setMpesaMsg] = useState("");
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
    if (!paidBanner || !user) return;
    const t = setInterval(() => loadData(user), 4000);
    const stop = setTimeout(() => clearInterval(t), 40000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [paidBanner, user]);

  useEffect(() => {
    if (!user || !profile?.industry) return;
    setInsightLoading(true);
    (async () => {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/insight", {
        headers: { authorization: `Bearer ${sess?.session?.access_token}` },
      });
      const data = await res.json();
      setInsight(data.insight || null);
      setInsightLoading(false);
    })();
  }, [user, profile?.industry]);

  async function toggleHired(value) {
    setHiredBusy(true);
    const sb = supabaseBrowser();
    await sb.from("profiles").update({ hired: value, hired_at: value ? new Date().toISOString() : null }).eq("id", user.id);
    setProfile((p) => ({ ...p, hired: value }));
    setHiredBusy(false);
  }

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

  async function payWithCard(planId) {
    setErr("");
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      await openPaddleCheckout({ planId, userId: user.id, email: sess?.session?.user?.email });
      // Card payment confirms via webhook, not a redirect — reuse the same
      // polling used after an M-Pesa redirect to pick up credits once they land.
      setPaidBanner(true);
    } catch (e) {
      setErr(e.message || "Could not open card checkout.");
    }
  }

  async function payWithMpesa(planId) {
    setErr("");
    setMpesaMsg("");
    if (!mpesaPhone.trim()) {
      setErr("Enter your M-Pesa phone number first.");
      return;
    }
    setMpesaBusy(true);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/checkout-mpesa", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ planId, phone: mpesaPhone }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not send the M-Pesa prompt.");
      else {
        setMpesaMsg(data.message);
        setPaidBanner(true); // start polling for credits, same as card/redirect flows
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setMpesaBusy(false);
    }
  }

  async function signOut() {
    clearLegacySharedDraft();
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  async function downloadDocx() {
    if (!viewing?.result?.cv) return;
    setDocxBusy(true);
    try {
      const blob = await generateCvDocx(viewing.result.cv);
      const safeName = (viewing.result.cv.name || "CV").replace(/[^a-z0-9]+/gi, "_");
      downloadBlob(blob, `${safeName}_CV.docx`);
    } catch (e) {
      console.error(e);
    } finally {
      setDocxBusy(false);
    }
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
          {tab === "cv" && (
            <button className="btn-ghost" onClick={downloadDocx} disabled={docxBusy}>
              {docxBusy ? "Preparing…" : "Download .docx"}
            </button>
          )}
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
        <a href="/onboarding" className="btn-ghost" style={{ textDecoration: "none" }}>Edit profile</a>
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
            {MPESA_ENABLED ? (
              <>
                <div className="plan-row">
                  {Object.values(PLANS).map((p) => (
                    <button key={p.id} className="plan-card" onClick={() => buy(p.id)} disabled={!!buying}>
                      <div className="plan-name">{p.name}</div>
                      <div className="plan-price">KES {p.priceKes}</div>
                      <div className="plan-blurb">{buying === p.id ? "Opening checkout…" : p.blurb}</div>
                    </button>
                  ))}
                </div>
                <p className="field-note">Pay with M-Pesa or Airtel Money.</p>
              </>
            ) : PADDLE_ENABLED ? (
              <>
                <div className="plan-row">
                  {Object.values(PLANS).map((p) => (
                    <button key={p.id} className="plan-card" onClick={() => payWithCard(p.id)} disabled={!paddlePriceIdFor(p.id)}>
                      <div className="plan-name">{p.name}</div>
                      <div className="plan-price">KES {p.priceKes}</div>
                      <div className="field-note" style={{ marginTop: 2 }}>≈ ${toUsd(p.priceKes)}</div>
                      <div className="plan-blurb">{p.blurb}</div>
                    </button>
                  ))}
                </div>
                <p className="field-note">
                  Pay by Visa/Mastercard. M-Pesa and Airtel Money are coming back soon —{" "}
                  <button className="linkish" onClick={() => setShowGlobalPay(!showGlobalPay)}>
                    only have M-Pesa? Here's how to pay anyway →
                  </button>
                </p>
                {showGlobalPay && <GlobalPayHelp />}
              </>
            ) : (
              <div className="launching-soon">
                <p className="step-hint" style={{ marginBottom: 0 }}>
                  Paid plans are launching very soon — we're finishing M-Pesa payment approval so
                  everyone can top up directly. Your {FREE_SIGNUP_CREDITS} free applications still work
                  in the meantime, and nothing you've generated is affected.
                </p>
              </div>
            )}
            {DARAJA_ENABLED && (
              <div className="mpesa-direct-box">
                <p className="field-note" style={{ marginTop: 0 }}>Or pay directly with M-Pesa:</p>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  style={{ marginBottom: 8, maxWidth: 220 }}
                />
                <div className="card-pay-buttons">
                  {Object.values(PLANS).map((p) => (
                    <button key={p.id} className="btn-ghost" disabled={mpesaBusy} onClick={() => payWithMpesa(p.id)}>
                      {p.name} — KES {p.priceKes}
                    </button>
                  ))}
                </div>
                {mpesaMsg && <p className="success">{mpesaMsg}</p>}
              </div>
            )}
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
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p className="step-hint">Nothing yet — let's fix that.</p>
            <a href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", padding: "12px 28px" }}>
              Generate your first CV
            </a>
          </div>
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
