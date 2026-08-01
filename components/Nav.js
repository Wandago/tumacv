"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE } from "../lib/plans";

export default function Nav() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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
      .select("credits, plan, plan_expires")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const unlimited =
    profile?.plan === "unlimited" && profile?.plan_expires && new Date(profile.plan_expires) > new Date();

  return (
    <header className="top">
      <Link href="/" className="wordmark" style={{ textDecoration: "none", color: "inherit" }}>
        Tuma<span>CV</span>
      </Link>
      <nav className="nav-links">
        <Link href="/jobs">Jobs board</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <span className="credits-pill">
              {FREE_MODE ? "Free" : unlimited ? "Unlimited" : `${profile?.credits ?? "…"} credits`}
            </span>
          </>
        ) : (
          <Link href="/login" className="nav-cta">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
