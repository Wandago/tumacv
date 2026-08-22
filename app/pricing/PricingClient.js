"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import GlobalPayHelp from "../../components/GlobalPayHelp";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, FREE_MODE, FREE_SIGNUP_CREDITS, MPESA_ENABLED, PADDLE_ENABLED, toUsd } from "../../lib/plans";
import { openPaddleCheckout, paddlePriceIdFor } from "../../lib/paddle";

const FAQ = [
  {
    q: "Why per-application instead of a subscription?",
    a: "Job hunting has a natural end — the day you get hired, you stop needing this. A subscription would keep charging you anyway. Pay only for what you use.",
  },
  {
    q: "How do I pay?",
    a: MPESA_ENABLED
      ? "M-Pesa (STK push straight to your phone), Airtel Money, or Visa/Mastercard — pick whichever's easiest at checkout."
      : PADDLE_ENABLED
      ? "Visa/Mastercard right now. Only have M-Pesa? See the GlobalPay guide below the plans — it lets you pay with a virtual card funded from your M-Pesa balance. Direct M-Pesa and Airtel Money are coming back soon."
      : "We're finishing M-Pesa payment approval so everyone can pay directly — paid plans launch very soon. Your free applications work in the meantime.",
  },
  {
    q: "Do unused applications expire?",
    a: "No. None of the plans expire — buy a bundle and use it whenever you need it.",
  },
  {
    q: "What counts as one application?",
    a: "One tailored CV + cover letter for one job posting. Regenerating the same job with edits doesn't cost extra credits within the same session.",
  },
];

export default function PricingClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const [showGlobalPay, setShowGlobalPay] = useState(false);
  const paymentsLive = MPESA_ENABLED || PADDLE_ENABLED;

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function buy(planId) {
    if (!user) {
      router.push("/login");
      return;
    }
    setErr("");
    setBuying(planId);
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
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
    if (!user) {
      router.push("/login");
      return;
    }
    setErr("");
    setBuying(planId);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      await openPaddleCheckout({ planId, userId: user.id, email: sess?.session?.user?.email });
    } catch (e) {
      setErr(e.message || "Could not open card checkout.");
    } finally {
      setBuying("");
    }
  }

  return (
    <main className="shell wide">
      <Nav />

      <section className="hero hero-band">
        <span className="eyebrow">No subscriptions, ever</span>
        <h1>Pay only for the <em>applications</em> you send</h1>
        <p>
          Top up once and the credits are yours — nothing renews, nothing expires. Every plan
          works out to roughly KES 2 or less per tailored CV and cover letter, and you start
          with {FREE_SIGNUP_CREDITS} free the moment you sign up.
        </p>
        {!FREE_MODE && paymentsLive && (
          <p className="price">{FREE_SIGNUP_CREDITS} free to try · then pay as you go</p>
        )}
      </section>

      {FREE_MODE ? (
        <div className="banner" style={{ textAlign: "center" }}>
          TumaCV is completely free during beta — every signed-in account gets unlimited applications.
          Pricing below is what kicks in after beta.
        </div>
      ) : !paymentsLive ? (
        <div className="banner" style={{ textAlign: "center" }}>
          Paid plans are launching very soon — we're finishing M-Pesa payment approval so everyone
          can top up directly. Your {FREE_SIGNUP_CREDITS} free applications work right now.
        </div>
      ) : null}

      <div className="plan-row" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 6 }}>
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className="dash-card" style={{ textAlign: "left" }}>
            <h3>{p.name.toUpperCase()}</h3>
            <div className="plan-price" style={{ fontSize: 26, marginTop: 8 }}>KES {p.priceKes}</div>
            {PADDLE_ENABLED && !MPESA_ENABLED && (
              <div className="field-note" style={{ marginTop: 0 }}>≈ ${toUsd(p.priceKes)}</div>
            )}
            <p style={{ marginBottom: 14, marginTop: 6 }}>{p.blurb}</p>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => (MPESA_ENABLED ? buy(p.id) : PADDLE_ENABLED ? payWithCard(p.id) : undefined)}
              disabled={FREE_MODE || !paymentsLive || buying === p.id || (PADDLE_ENABLED && !MPESA_ENABLED && !paddlePriceIdFor(p.id))}
            >
              {FREE_MODE
                ? "Free right now"
                : !paymentsLive
                ? "Coming soon"
                : buying === p.id
                ? "Opening checkout…"
                : user
                ? "Buy now"
                : "Sign in to buy"}
            </button>
          </div>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      <p className="field-note" style={{ marginBottom: paymentsLive ? 30 : 10 }}>
        {MPESA_ENABLED
          ? "Pay with M-Pesa or Airtel Money. None of the plans expire."
          : PADDLE_ENABLED
          ? "Pay by Visa/Mastercard. None of the plans expire."
          : "None of the plans will expire once payments are live."}
      </p>
      {PADDLE_ENABLED && !MPESA_ENABLED && (
        <p className="field-note" style={{ marginBottom: 30 }}>
          <button className="linkish" onClick={() => setShowGlobalPay(!showGlobalPay)}>
            Only have M-Pesa? Here's how to pay anyway →
          </button>
        </p>
      )}
      {showGlobalPay && <GlobalPayHelp />}

      <section>
        <div className="step-head"><span className="step-no">FAQ</span><h2>Common questions</h2></div>
        {FAQ.map((f) => (
          <div className="step" key={f.q}>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>{f.q}</h2>
            <p className="step-hint" style={{ marginBottom: 0 }}>{f.a}</p>
          </div>
        ))}
      </section>

      <div style={{ textAlign: "center", padding: "10px 0 40px" }}>
        <a href={user ? "/" : "/login"} className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
          {user ? "Generate your first CV →" : `Create a free account — ${FREE_SIGNUP_CREDITS} applications free`}
        </a>
      </div>
    </main>
  );
}
