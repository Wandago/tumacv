"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, FREE_MODE, FREE_SIGNUP_CREDITS } from "../../lib/plans";

const FAQ = [
  {
    q: "Why per-application instead of a subscription?",
    a: "Job hunting has a natural end — the day you get hired, you stop needing this. A subscription would keep charging you anyway. Pay only for what you use.",
  },
  {
    q: "How do I pay?",
    a: "M-Pesa (STK push straight to your phone), Airtel Money, or Visa/Mastercard — pick whichever's easiest at checkout.",
  },
  {
    q: "Do unused applications expire?",
    a: "No. Basic and Plus credits stay on your account until you use them. Only the Unlimited pass has a time limit, since it's priced for a 30-day sprint.",
  },
  {
    q: "What counts as one application?",
    a: "One tailored CV + cover letter for one job posting. Regenerating the same job with edits doesn't cost extra credits within the same session.",
  },
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function buy(planId) {
    if (!user) {
      window.location.href = "/login";
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

  return (
    <main className="shell wide">
      <Nav />

      <section className="hero">
        <h1>Pay only for the <em>applications</em> you send</h1>
        <p>
          No subscription, no lock-in. Every plan works out to roughly KES 2 or less per
          tailored CV and cover letter — start with {FREE_SIGNUP_CREDITS} free the moment you sign up.
        </p>
      </section>

      {FREE_MODE ? (
        <div className="banner" style={{ textAlign: "center" }}>
          TumaCV is completely free during beta — every signed-in account gets unlimited applications.
          Pricing below is what kicks in after beta.
        </div>
      ) : (
        <div className="hero" style={{ paddingTop: 4 }}>
          <p className="price">{FREE_SIGNUP_CREDITS} free to try · then pay as you go</p>
        </div>
      )}

      <div className="plan-row" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 6 }}>
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className="dash-card" style={{ textAlign: "left" }}>
            <h3>{p.name.toUpperCase()}</h3>
            <div className="plan-price" style={{ fontSize: 26, marginTop: 8 }}>KES {p.priceKes}</div>
            <p style={{ marginBottom: 14 }}>{p.blurb}</p>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => buy(p.id)}
              disabled={FREE_MODE || buying === p.id}
            >
              {FREE_MODE ? "Free right now" : buying === p.id ? "Opening checkout…" : user ? "Buy now" : "Sign in to buy"}
            </button>
          </div>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      <p className="field-note" style={{ marginBottom: 30 }}>
        Pay with M-Pesa, Airtel Money, or Visa/Mastercard. Basic and Plus credits never expire — the Unlimited pass runs for 30 days.
      </p>

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
