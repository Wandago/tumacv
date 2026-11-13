"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { supabaseBrowser } from "../lib/supabaseClient";
import { FREE_MODE, isUnlimited } from "../lib/plans";
import { trackPageView } from "../lib/track";
import { useThemeMode } from "./AppProviders";
import { BrandMark, MonitorIcon, MoonIcon, SunIcon, PlusIcon } from "../lib/icons";

const EXPLORE_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/hub", label: "Talent Hub" },
  { href: "/news", label: "News" },
  { href: "/support", label: "Support" },
];

const MODE_CYCLE = { system: "light", light: "dark", dark: "system" };
const MODE_ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };
const MODE_LABEL = { system: "Theme: match device", light: "Theme: light", dark: "Theme: dark" };

function ThemeModeButton() {
  const { mode, setMode } = useThemeMode();
  return (
    <IconButton
      label={`${MODE_LABEL[mode]} (tap to change)`}
      tooltip={MODE_LABEL[mode]}
      variant="ghost"
      icon={<Icon icon={MODE_ICON[mode]} />}
      onClick={() => setMode(MODE_CYCLE[mode])}
    />
  );
}

// Signed-in state for the nav: the user, and the bits of their profile the
// nav shows (credit balance, admin link).
function useAccount() {
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
      .select("credits, plan, plan_expires, is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  return { user, profile };
}

function SiteFooter() {
  return (
    <VStack as="footer" gap={3} paddingBlock={8} paddingInline={4} hAlign="center" className="no-print">
      <Divider />
      <HStack gap={4} wrap="wrap" justify="center">
        <Link href="/pricing">Pricing</Link>
        <Link href="/support">Support</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </HStack>
      <Text type="supporting" color="secondary" justify="center">
        TumaCV · Tailored CVs and cover letters for Kenyan job seekers
      </Text>
    </VStack>
  );
}

export default function AppFrame({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, profile } = useAccount();
  const lastTracked = useRef(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  const unlimited = isUnlimited(profile);
  const creditsLabel = FREE_MODE ? "Free" : unlimited ? "Unlimited" : `${profile?.credits ?? "…"} credits`;
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const topNav = (
    <TopNav
      label="Main navigation"
      heading={<TopNavHeading heading="TumaCV" headingHref="/" logo={<BrandMark size={26} />} />}
      startContent={
        <>
          {user && <TopNavItem label="Dashboard" href="/dashboard" isSelected={isActive("/dashboard")} />}
          {EXPLORE_LINKS.map((l) => (
            <TopNavItem key={l.href} label={l.label} href={l.href} isSelected={isActive(l.href)} />
          ))}
          {profile?.is_admin && <TopNavItem label="Admin" href="/admin" isSelected={isActive("/admin")} />}
        </>
      }
      endContent={
        <HStack gap={2} align="center">
          <ThemeModeButton />
          {user ? (
            <>
              <Badge variant={unlimited || FREE_MODE ? "success" : "neutral"} label={creditsLabel} />
              <Button
                label="New CV"
                variant="primary"
                size="sm"
                icon={<Icon icon={PlusIcon} />}
                onClick={() => router.push("/")}
              />
            </>
          ) : (
            <Button label="Sign in" variant="primary" size="sm" onClick={() => router.push("/login")} />
          )}
        </HStack>
      }
    />
  );

  return (
    <AppShell height="auto" variant="wash" topNav={topNav}>
      {children}
      <SiteFooter />
    </AppShell>
  );
}
