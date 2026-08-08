"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

// Cloudflare Turnstile — free, generally invisible for real users (no image
// puzzles for most visitors), and natively supported by Supabase's own
// "captcha protection" setting, which verifies the token server-side.
//
// Important: privacy-focused browsers (Brave Shields) and some ad/tracker
// blockers commonly block this script outright. This component never blocks
// form submission on its own — it just tries its best, and shows a plain
// explanation if it clearly isn't going to load, so a real user is never
// silently stuck with no idea why.
const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    const timeout = setTimeout(() => {
      if (!window.turnstile) setBlocked(true);
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!scriptReady || !boxRef.current || widgetId.current !== null) return;
    if (!window.turnstile) return;
    widgetId.current = window.turnstile.render(boxRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [scriptReady, onToken]);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null; // not configured yet — render nothing

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={boxRef} style={{ margin: "12px 0" }} />
      {blocked && (
        <p className="field-note" style={{ marginBottom: 8 }}>
          Security check didn't load — this happens with some privacy browsers or ad blockers.
          You can still continue; if signup is rejected, try disabling them for this site.
        </p>
      )}
    </>
  );
});

export default Turnstile;
