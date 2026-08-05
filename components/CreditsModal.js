"use client";
import { useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { PLANS } from "../lib/plans";

export default function CreditsModal({ onClose }) {
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");

  async function buy(planId) {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h1>You're out of applications</h1>
        <p className="step-hint" style={{ marginBottom: 16 }}>
          Nice progress — you've used up your applications. Top up to keep tailoring your CV for
          more jobs. Your work here is saved, nothing is lost.
        </p>

        <div className="plan-row" style={{ gridTemplateColumns: "1fr" }}>
          {Object.values(PLANS).map((p) => (
            <button key={p.id} className="plan-card modal-plan-card" onClick={() => buy(p.id)} disabled={!!buying}>
              <div className="modal-plan-row">
                <div>
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-blurb">{p.blurb}</div>
                </div>
                <div className="plan-price" style={{ fontSize: 20 }}>
                  {buying === p.id ? "…" : `KES ${p.priceKes}`}
                </div>
              </div>
            </button>
          ))}
        </div>
        {err && <p className="error">{err}</p>}
        <p className="field-note" style={{ marginTop: 12 }}>M-Pesa, Airtel Money, or Visa/Mastercard.</p>
        <button className="linkish" style={{ marginTop: 14 }} onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}
