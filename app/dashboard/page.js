"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Icon } from "@astryxdesign/core/Icon";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Link } from "@astryxdesign/core/Link";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { FREE_MODE, isUnlimited } from "../../lib/plans";
import { gamificationStats, streakState, nextBadge } from "../../lib/gamification";
import { clearLegacySharedDraft } from "../../lib/storage";
import CountUp from "../../components/CountUp";
import TrendChart from "../../components/TrendChart";
import OverviewCard from "../../components/OverviewCard";
import TalentHubCard from "../../components/TalentHubCard";
import ReferralCard from "../../components/ReferralCard";
import InAppMarketingBanner from "../../components/InAppMarketingBanner";
import ResultView from "../../components/home/ResultView";
import ApplicationsCard from "../../components/dashboard/ApplicationsCard";
import BadgesCard from "../../components/dashboard/BadgesCard";
import TopUpCard from "../../components/dashboard/TopUpCard";
import { FlameIcon, LogOutIcon, PlusIcon, SettingsIcon, SparklesIcon, WalletIcon } from "../../lib/icons";

function StatCard({ label, value, caption, icon, variant }) {
  return (
    <Card padding={5} variant={variant}>
      <VStack gap={1}>
        <HStack gap={2} align="center">
          {icon && <Icon icon={icon} color="accent" size="sm" />}
          <Text type="supporting" color="secondary" weight="medium">{label}</Text>
        </HStack>
        <Heading level={3} type="display-2">{value}</Heading>
        {caption && <Text type="supporting" color="secondary">{caption}</Text>}
      </VStack>
    </Card>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewTemplate, setViewTemplate] = useState("modern");
  const [paidBanner, setPaidBanner] = useState(false);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [hiredBusy, setHiredBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("paid=1")) {
      setPaidBanner(true);
    }
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (!data?.user) router.replace("/login");
      else setUser(data.user);
    });
  }, [router]);

  async function loadData(u) {
    const sb = supabaseBrowser();
    const [{ data: p }, { data: h }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", u.id).single(),
      sb.from("generations").select("id, job_title, template, created_at, result")
        .eq("user_id", u.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setProfile(p);
    setHistory(h || []);
  }

  useEffect(() => {
    if (user) loadData(user);
  }, [user]);

  // After a payment, credits land via webhook — poll for up to 40s.
  useEffect(() => {
    if (!paidBanner || !user) return;
    const t = setInterval(() => loadData(user), 4000);
    const stop = setTimeout(() => clearInterval(t), 40000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [paidBanner, user]);

  useEffect(() => {
    if (!user || !profile?.industry) return;
    setInsightLoading(true);
    (async () => {
      try {
        const { data: sess } = await supabaseBrowser().auth.getSession();
        const res = await fetch("/api/insight", { headers: { authorization: `Bearer ${sess?.session?.access_token}` } });
        const data = await res.json();
        setInsight(data.insight || null);
      } catch {
        setInsight(null);
      } finally {
        setInsightLoading(false);
      }
    })();
  }, [user, profile?.industry]);

  async function toggleHired(value) {
    setHiredBusy(true);
    await supabaseBrowser().from("profiles").update({ hired: value, hired_at: value ? new Date().toISOString() : null }).eq("id", user.id);
    setProfile((p) => ({ ...p, hired: value }));
    setHiredBusy(false);
  }

  async function signOut() {
    clearLegacySharedDraft();
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  if (!user || history === null) {
    return (
      <Center minHeight="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (viewing) {
    return (
      <ResultView
        result={{ ...viewing.result, jobTitle: viewing.job_title || viewing.result?.jobTitle }}
        template={viewTemplate}
        setTemplate={setViewTemplate}
        backLabel="Back to dashboard"
        onBack={() => setViewing(null)}
        isFresh={false}
      />
    );
  }

  const unlimited = isUnlimited(profile);
  const weekCount = history.filter((h) => Date.now() - new Date(h.created_at).getTime() < 7 * 86400000).length;
  const gStats = gamificationStats(history, profile);
  const streak = streakState(profile);
  const upcoming = nextBadge(gStats);
  const firstName = (profile?.full_name || history[0]?.result?.cv?.name || "").split(" ")[0];

  // Which CV templates this user leans on — the donut breakdown.
  const templateSegments = Object.entries(
    history.reduce((acc, h) => {
      const t = h.template || "modern";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Applications per day over the last 30 days, for the sparkline.
  const activitySeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, value: history.filter((h) => h.created_at?.slice(0, 10) === key).length };
  });

  const outOfCredits = !FREE_MODE && !unlimited && profile?.credits === 0;

  return (
    <Layout
      height="auto"
      contentWidth={1120}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <HStack justify="between" align="center" gap={3} wrap="wrap">
              <VStack gap={1}>
                <Heading level={1}>{firstName ? `Hi, ${firstName}` : "Your dashboard"}</Heading>
                <Text color="secondary">Your applications, credits and progress in one place.</Text>
              </VStack>
              <HStack gap={2} wrap="wrap">
                <Button label="Edit profile" variant="ghost" icon={<Icon icon={SettingsIcon} />} onClick={() => router.push("/onboarding")} />
                <Button label="Sign out" variant="ghost" icon={<Icon icon={LogOutIcon} />} onClick={signOut} />
                <Button label="New application" variant="primary" icon={<Icon icon={PlusIcon} />} onClick={() => router.push("/")} />
              </HStack>
            </HStack>

            <InAppMarketingBanner />
            {paidBanner && (
              <Banner status="success" title="Payment received" description="Your balance updates within a minute of M-Pesa or card confirmation." isDismissable onDismiss={() => setPaidBanner(false)} />
            )}
            {outOfCredits && (
              <Banner
                status="warning"
                title="You're out of applications"
                description="Top up below to keep tailoring your CV — everything you've made is saved."
              />
            )}
            {streak.status === "at-risk" && (
              <Banner
                status="warning"
                title={`Your ${streak.streak}-day streak ends tonight`}
                description="Generate one application today to keep it going."
                endContent={<Button size="sm" label="Apply now" onClick={() => router.push("/")} />}
              />
            )}
            {profile?.hired ? (
              <Banner
                status="success"
                title="🎉 Congratulations on landing the job!"
                description="Come back any time you need TumaCV again."
                endContent={<Button size="sm" variant="ghost" label="Not hired anymore? Undo" isLoading={hiredBusy} onClick={() => toggleHired(false)} />}
              />
            ) : (
              history.length > 0 && (
                <Banner
                  status="info"
                  title="Got the job?"
                  description="Tell us and we'll celebrate with you — it also unlocks the “Hired!” badge."
                  endContent={<Button size="sm" label="🎉 I got hired" isLoading={hiredBusy} onClick={() => toggleHired(true)} />}
                />
              )
            )}

            <Grid columns={{ minWidth: 220 }} gap={4}>
              <StatCard
                label="Balance"
                icon={WalletIcon}
                variant="green"
                value={FREE_MODE || unlimited ? "∞" : profile?.credits != null ? <CountUp value={profile.credits} /> : "…"}
                caption={
                  FREE_MODE
                    ? "Free during beta"
                    : unlimited
                    ? `Unlimited until ${new Date(profile.plan_expires).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
                    : "applications remaining"
                }
              />
              <StatCard
                label="Streak"
                icon={FlameIcon}
                value={streak.streak > 0 ? <CountUp value={streak.streak} /> : "—"}
                caption={
                  (streak.status === "at-risk"
                    ? `day${streak.streak === 1 ? "" : "s"} in a row — ends tonight`
                    : streak.status === "safe"
                    ? `day${streak.streak === 1 ? "" : "s"} in a row`
                    : streak.status === "lapsed"
                    ? `${streak.lost}-day streak ended — start a new one`
                    : "Start a streak today") + (gStats.longestStreak > 0 ? ` · best ${gStats.longestStreak}` : "")
                }
              />
              <StatCard label="Applications" icon={SparklesIcon} value={<CountUp value={history.length} />} caption={`${weekCount} this week`} />
              <StatCard
                label="Average match"
                value={gStats.averageScore !== null ? `${gStats.averageScore}%` : "—"}
                caption={gStats.bestScore !== null && gStats.bestScore !== undefined ? `best ${gStats.bestScore}%` : "Generate one to see it"}
              />
            </Grid>

            <ApplicationsCard history={history} onOpen={(h) => { setViewing(h); setViewTemplate(h.template || "modern"); window.scrollTo({ top: 0 }); }} onNew={() => router.push("/")} />

            <Grid columns={{ minWidth: 420 }} gap={4}>
              <OverviewCard
                title="Styles you use"
                segments={templateSegments}
                centerValue={history.length}
                centerLabel="total"
                empty="Generate your first CV and this fills in."
                stats={[
                  { label: "this week", value: weekCount },
                  { label: "templates used", value: templateSegments.length },
                  { label: "day streak", value: streak.streak },
                ]}
              />
              <TrendChart title="Activity, last 30 days" series={activitySeries} />
            </Grid>

            <Card padding={5} variant="muted">
              <VStack gap={2}>
                <Text weight="semibold">
                  💡 {profile?.industry
                    ? `Tip for ${profile.industry}, ${new Date().toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
                    : "Want a daily job-hunting tip?"}
                </Text>
                {!profile?.industry ? (
                  <Text color="secondary">
                    <Link href="/onboarding">Tell us your industry</Link> to unlock a daily tip made for your field.
                  </Text>
                ) : insightLoading ? (
                  <Skeleton height={40} />
                ) : (
                  <Text>{insight || "Check back after your next generation for a fresh tip."}</Text>
                )}
              </VStack>
            </Card>

            {!FREE_MODE && (
              <TopUpCard user={user} onPaymentStarted={() => setPaidBanner(true)} onCreditsChanged={() => loadData(user)} />
            )}

            <BadgesCard stats={gStats} upcoming={upcoming} />

            <Grid columns={{ minWidth: 360 }} gap={4} align="start">
              <TalentHubCard user={user} profile={profile} latestGeneration={history[0]} />
              <ReferralCard user={user} />
            </Grid>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
