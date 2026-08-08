"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE } from "../lib/plans";
import { trackPageView } from "../lib/track";
import ThemeToggle from "./ThemeToggle";

const EXPLORE_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/jobs", label: "Jobs board" },
  { href: "/news", label: "News" },
  { href: "/support", label: "Support" },
];

export default function Nav() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const pathname = usePathname();
  const lastTracked = useRef(null);
  const exploreRef = useRef(null);

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

  // Close the "Explore" dropdown on outside click.
  useEffect(() => {
    if (!exploreOpen) return;
    const onClick = (e) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exploreOpen]);

  const unlimited =
    profile?.plan === "unlimited" && profile?.plan_expires && new Date(profile.plan_expires) > new Date();

  // Mobile panel: everything, stacked, one per line — plenty of room there.
  const mobileLinks = (
    <>
      {EXPLORE_LINKS.map((l) => (
        <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
      ))}
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

        {/* Desktop: content links grouped under one dropdown, keeping the bar short
            regardless of how many pages get added later. */}
        <nav className="nav-links desktop-only">
          <div className="nav-explore" ref={exploreRef}>
            <button className="nav-explore-btn" onClick={() => setExploreOpen((o) => !o)} aria-expanded={exploreOpen}>
              Explore {exploreOpen ? "▴" : "▾"}
            </button>
            {exploreOpen && (
              <div className="nav-explore-panel">
                {EXPLORE_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setExploreOpen(false)}>{l.label}</Link>
                ))}
              </div>
            )}
          </div>
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              {profile?.is_admin && <Link href="/admin">Admin</Link>}
              <span className="credits-pill">
                {FREE_MODE ? "Free" : unlimited ? "Unlimited" : `${profile?.credits ?? "…"} credits`}
              </span>
              <Link href="/" className="nav-generate-btn">Generate CV</Link>
            </>
          ) : (
            <Link href="/login" className="nav-cta">Sign in</Link>
          )}
        </nav>

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
        <nav className="nav-mobile-panel mobile-only">{mobileLinks}</nav>
      )}
    </header>
  );
}
