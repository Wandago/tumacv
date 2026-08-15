"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";

const DISMISSED_KEY = "tumacv-marketing-banner-dismissed";

export default function InAppMarketingBanner() {
  const [item, setItem] = useState(null);

  useEffect(() => {
    supabaseBrowser()
      .from("marketing_content")
      .select("id, body, cta_url")
      .eq("kind", "in_app")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        let dismissed = "";
        try { dismissed = localStorage.getItem(DISMISSED_KEY) || ""; } catch {}
        if (dismissed !== data.id) setItem(data);
      });
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, item.id); } catch {}
    setItem(null);
  }

  if (!item) return null;
  return (
    <div className="banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span>
        {item.body}
        {item.cta_url && (
          <a href={item.cta_url} style={{ marginLeft: 8 }}>Take a look →</a>
        )}
      </span>
      <button className="linkish" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
