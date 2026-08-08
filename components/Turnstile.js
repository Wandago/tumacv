"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

// Cloudflare Turnstile — free, generally invisible for real users (no image
// puzzles for most visitors), and natively supported by Supabase's own
// "captcha protection" setting, which verifies the token server-side.
const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
      }
    },
  }));

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
    </>
  );
});

export default Turnstile;
