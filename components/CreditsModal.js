"use client";
import { useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { PLANS, MPESA_ENABLED, PADDLE_ENABLED, toUsd } from "../lib/plans";
import { openPaddleCheckout, paddlePriceIdFor } from "../lib/paddle";

export default function CreditsModal({ onClose, user }) {
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const paymentsLive = MPESA_ENABLED || PADDLE_ENABLED;

  async function buy(planId) {
    setErr("");
    setBuying(planId);
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      if (MPESA_ENABLED) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok) setErr(data.error || "Could not start the payment.");
        else window.location.href = data.url;
      } else if (PADDLE_ENABLED) {
        await openPaddleCheckout({ planId, userId: user?.id, email: sess?.session?.user?.email });
      }
    } catch (e) {
      setErr(e.message || "Network error. Try again.");
    } finally {
      setBuying("");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h1>You're out of applications</h1>
        <p className="step-hint" style={{ marginBottom: 16 }}>
          {paymentsLive
            ? "Nice progress — you've used up your applications. Top up to keep tailoring your CV for more jobs. Your work here is saved, nothing is lost."
            : "Nice progress — you've used up your free applications. We're finishing M-Pesa payment approval so everyone can top up directly; paid plans launch very soon. Your work here is saved, nothing is lost."}
        </p>

        {paymentsLive && (
          <div className="plan-row" style={{ gridTemplateColumns: "1fr" }}>
            {Object.values(PLANS).map((p) => (
              <button
                key={p.id}
                className="plan-card modal-plan-card"
                onClick={() => buy(p.id)}
                disabled={!!buying || (PADDLE_ENABLED && !MPESA_ENABLED && !paddlePriceIdFor(p.id))}
              >
                <div className="modal-plan-row">
                  <div>
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-blurb">{p.blurb}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="plan-price" style={{ fontSize: 20 }}>
                      {buying === p.id ? "…" : `KES ${p.priceKes}`}
                    </div>
                    {PADDLE_ENABLED && !MPESA_ENABLED && <div className="field-note" style={{ marginTop: 0 }}>≈ ${toUsd(p.priceKes)}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {err && <p className="error">{err}</p>}
        {paymentsLive && (
          <p className="field-note" style={{ marginTop: 12 }}>
            {MPESA_ENABLED ? "M-Pesa or Airtel Money." : "Pay by Visa/Mastercard. Only have M-Pesa? Visit your dashboard for the GlobalPay card guide."}
          </p>
        )}
        <button className="linkish" style={{ marginTop: 14 }} onClick={onClose}>
          {paymentsLive ? "Maybe later" : "Got it"}
        </button>
      </div>
    </div>
  );
}
