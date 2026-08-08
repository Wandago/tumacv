"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE } from "../lib/plans";
import { trackPageView } from "../lib/track";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const lastTracked = useRef(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (!session?.user) setProfile(null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabaseBrowser()
      .from("profiles")
      .select("credits, plan, plan_expires, is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  // Close the mobile menu automatically if the viewport grows past the
  // mobile breakpoint (e.g. rotating a tablet), so it can't get stuck open.
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 680) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const unlimited =
    profile?.plan === "unlimited" && profile?.plan_expires && new Date(profile.plan_expires) > new Date();

  const links = (
    <>
      <Link href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
      <Link href="/jobs" onClick={() => setMenuOpen(false)}>Jobs board</Link>
      <Link href="/news" onClick={() => setMenuOpen(false)}>News</Link>
      <Link href="/support" onClick={() => setMenuOpen(false)}>Support</Link>
      <div className="nav-theme-row">
        <span>Theme</span>
        <ThemeToggle />
      </div>
      {user ? (
        <>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          {profile?.is_admin && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
          <span className="credits-pill">
            {FREE_MODE ? "Free" : unlimited ? "Unlimited" : `${profile?.credits ?? "…"} credits`}
          </span>
          <Link href="/" className="nav-generate-btn" onClick={() => setMenuOpen(false)}>Generate CV</Link>
        </>
      ) : (
        <Link href="/login" className="nav-cta" onClick={() => setMenuOpen(false)}>Sign in</Link>
      )}
    </>
  );

  return (
    <header className="top">
      <div className="nav-bar-row">
        <Link href="/" className="wordmark" style={{ textDecoration: "none", color: "inherit" }} onClick={() => setMenuOpen(false)}>
          Tuma<span>CV</span>
        </Link>
        <nav className="nav-links desktop-only">{links}</nav>
        <button
          className="nav-hamburger mobile-only"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <nav className="nav-mobile-panel mobile-only">{links}</nav>
      )}
    </header>
  );
}
