"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { referralLink } from "../lib/referral";
import { REFERRAL_CREDITS } from "../lib/plans";
import ShareButtons from "./ShareButtons";

export default function ReferralCard({ user }) {
  const [count, setCount] = useState(null);
  const [statsErr, setStatsErr] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: sess } = await supabaseBrowser().auth.getSession();
        const res = await fetch("/api/account/referral-stats", {
          headers: { authorization: `Bearer ${sess?.session?.access_token}` },
        });
        if (!res.ok) { setStatsErr(true); return; }
        const data = await res.json();
        setCount(data.count);
      } catch {
        setStatsErr(true);
      }
    })();
  }, [user]);

  if (!user) return null;
  const link = referralLink(user.id);
  const message = `Get ${REFERRAL_CREDITS} free bonus applications on TumaCV — tailored CVs + cover letters in minutes:`;

  return (
    <section className="hub-card-section">
      <div className="step-head"><span className="step-no">GROW</span><h2>Invite friends, earn credits</h2></div>
      <div className="hub-optin-prompt">
        <p className="step-hint">
          Share your link. Each friend who signs up gets {REFERRAL_CREDITS} bonus applications on top of
          their free ones, and you get {REFERRAL_CREDITS} more too — no limit on how many times.
        </p>
        <p className="field-note" style={{ wordBreak: "break-all", marginBottom: 10 }}>{link}</p>
        <ShareButtons url={link} message={message} />
        {statsErr ? (
          <p className="field-note" style={{ marginTop: 10 }}>
            Couldn't load your referral count just now — your link still works.
          </p>
        ) : count !== null ? (
          <p className="field-note" style={{ marginTop: 10 }}>
            {count === 0
              ? "No referrals yet — share your link to start earning."
              : `${count} friend${count === 1 ? "" : "s"} joined through your link so far.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
