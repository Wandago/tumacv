"use client";
import { useEffect } from "react";
import { storeReferralCodeIfNew } from "../lib/referral";

// Invisible — just remembers ?ref=<code> from the URL (if any) so it can be
// applied once the visitor creates an account, even if they land on a job
// posting or article rather than the homepage.
export default function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) storeReferralCodeIfNew(code);
  }, []);
  return null;
}
