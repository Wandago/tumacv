"use client";
import { useEffect, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Link } from "@astryxdesign/core/Link";
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
    <Banner
      status="info"
      title={item.body}
      endContent={item.cta_url ? <Link href={item.cta_url}>Take a look →</Link> : undefined}
      isDismissable
      onDismiss={dismiss}
    />
  );
}
