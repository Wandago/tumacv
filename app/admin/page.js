"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Banner } from "@astryxdesign/core/Banner";
import { Badge } from "@astryxdesign/core/Badge";
import { Token } from "@astryxdesign/core/Token";
import { List, ListItem } from "@astryxdesign/core/List";
import { Table } from "@astryxdesign/core/Table";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Icon } from "@astryxdesign/core/Icon";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import TrendChart from "../../components/TrendChart";
import OverviewCard from "../../components/OverviewCard";
import { supabaseBrowser } from "../../lib/supabaseClient";
import {
  BriefcaseIcon, ChartIcon, DashboardIcon, FileTextIcon, GiftIcon, LifeBuoyIcon, MegaphoneIcon, NewspaperIcon, UsersIcon, WalletIcon,
} from "../../lib/icons";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: DashboardIcon },
  { key: "users", label: "Users", icon: UsersIcon },
  { key: "payments", label: "Payments", icon: WalletIcon },
  { key: "support", label: "Support", icon: LifeBuoyIcon },
  { key: "promo", label: "Promo codes", icon: GiftIcon },
  { key: "hub", label: "Talent Hub", icon: BriefcaseIcon },
  { key: "articles", label: "News articles", icon: NewspaperIcon },
  { key: "jobs", label: "Jobs board", icon: FileTextIcon },
  { key: "marketing", label: "Marketing", icon: MegaphoneIcon },
  { key: "traffic", label: "Traffic", icon: ChartIcon },
];

const fmtDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) => new Date(d).toLocaleDateString("en-KE", opts);
const fmtDateTime = (d) => new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const STATUS_BADGE = { complete: "success", pending: "warning", failed: "error", underpaid: "error", open: "success", resolved: "neutral" };

function Loading() {
  return <Center minHeight={160}><Spinner /></Center>;
}

function StatCard({ label, value, variant }) {
  return (
    <Card padding={5} variant={variant}>
      <VStack gap={1}>
        <Text type="supporting" color="secondary" weight="medium">{label}</Text>
        <Heading level={3} type="display-3">{value}</Heading>
      </VStack>
    </Card>
  );
}

// Horizontal bars for a ranked breakdown, [{ label, count }].
function BarCard({ title, data }) {
  const top = (data || []).slice(0, 8);
  const max = top.length ? Math.max(...top.map((d) => d.count)) : 1;
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <Heading level={3}>{title}</Heading>
        {!data ? (
          <Loading />
        ) : top.length === 0 ? (
          <Text color="secondary">No data yet.</Text>
        ) : (
          <VStack gap={3}>
            {top.map((d) => (
              <ProgressBar key={d.label} label={d.label} value={d.count} max={max} hasValueLabel formatValueLabel={(v) => String(v)} />
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

function FunnelCard({ funnel }) {
  const stages = funnel
    ? [
        { label: "Signed up", value: funnel.signups },
        { label: "Generated a CV", value: funnel.generated },
        { label: "Paid", value: funnel.paid },
        { label: "Hired", value: funnel.hired },
      ]
    : [];
  const max = stages[0]?.value || 1;
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <Heading level={3}>User journey</Heading>
        {!funnel ? (
          <Loading />
        ) : (
          <VStack gap={3}>
            {stages.map((s) => (
              <ProgressBar
                key={s.label}
                label={s.label}
                value={s.value}
                max={max}
                hasValueLabel
                formatValueLabel={(v) => `${v} · ${Math.round((v / max) * 100)}%`}
              />
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

export default function Admin() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [industryStats, setIndustryStats] = useState(null);
  const [pageStats, setPageStats] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [users, setUsers] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [payments, setPayments] = useState(null);
  const [articles, setArticles] = useState(null);
  const [hubProfiles, setHubProfiles] = useState(null);
  const [hubServices, setHubServices] = useState(null);
  const [promoCodes, setPromoCodes] = useState(null);
  const [supportMessages, setSupportMessages] = useState(null);
  const [marketingContent, setMarketingContent] = useState(null);
  const [marketingChannels, setMarketingChannels] = useState(null);
  const [runningMarketing, setRunningMarketing] = useState(false);
  const [marketingRunResult, setMarketingRunResult] = useState(null);
  const [dailyTraffic, setDailyTraffic] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [dayDetail, setDayDetail] = useState({});
  const [dayDetailLoading, setDayDetailLoading] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminReplyBusy, setAdminReplyBusy] = useState(false);
  const [supportFilter, setSupportFilter] = useState("open");
  const [newCode, setNewCode] = useState({ code: "", credits: "5", maxRedemptions: "", expiresAt: "", note: "" });
  const [creatingCode, setCreatingCode] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userGens, setUserGens] = useState({});
  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [linkResult, setLinkResult] = useState(null);
  const [err, setErr] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmReq, setConfirmReq] = useState(null);
  const [isNarrow, setIsNarrow] = useState(false);

  // Asks "are you sure?" through the AlertDialog at the bottom of the page
  // and resolves to the answer, so destructive actions can simply await it.
  const confirmAction = (message) => new Promise((resolve) => setConfirmReq({ message, resolve }));
  function answerConfirm(ok) {
    confirmReq?.resolve(ok);
    setConfirmReq(null);
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  async function authHeader() {
    const { data } = await supabaseBrowser().auth.getSession();
    return { authorization: `Bearer ${data?.session?.access_token}` };
  }

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u?.user) { router.replace("/login"); return; }
      const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", u.user.id).single();
      if (!profile?.is_admin) { setAuthorized(false); return; }
      setAuthorized(true);
    })();
  }, [router]);

  async function load(type) {
    setErr("");
    const res = await fetch(`/api/admin/data?type=${type}`, { headers: await authHeader() });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Could not load data."); return; }
    if (type === "stats") setStats(data.stats);
    if (type === "referral_stats") setReferralStats(data.stats);
    if (type === "industry_stats") setIndustryStats(data.stats);
    if (type === "page_stats") setPageStats(data);
    if (type === "users") setUsers(data.users);
    if (type === "jobs") setJobs(data.jobs);
    if (type === "payments") setPayments(data.payments);
    if (type === "articles") setArticles(data.articles);
    if (type === "hub_profiles") setHubProfiles(data.hubProfiles);
    if (type === "hub_services") setHubServices(data.hubServices);
    if (type === "promo_codes") setPromoCodes(data.codes);
    if (type === "support_messages") setSupportMessages(data.tickets);
    if (type === "marketing_content") { setMarketingContent(data.content); setMarketingChannels(data.channels); }
    if (type === "daily_traffic") setDailyTraffic(data.days);
  }

  async function toggleDay(date) {
    if (expandedDay === date) { setExpandedDay(null); return; }
    setExpandedDay(date);
    if (dayDetail[date]) return;
    setDayDetailLoading(date);
    const res = await fetch(`/api/admin/data?type=day_detail&date=${date}`, { headers: await authHeader() });
    const data = await res.json();
    setDayDetailLoading(null);
    if (res.ok) setDayDetail((d) => ({ ...d, [date]: data }));
  }

  useEffect(() => {
    if (!authorized) return;
    if (tab === "overview" && stats === null) load("stats");
    if (tab === "overview" && referralStats === null) load("referral_stats");
    if (tab === "overview" && industryStats === null) load("industry_stats");
    if (tab === "overview" && pageStats === null) load("page_stats");
    // Recent signups also feed the overview's right-hand activity rail.
    if (tab === "overview" && users === null) load("users");
    if (tab === "users" && users === null) load("users");
    if (tab === "jobs" && jobs === null) load("jobs");
    if (tab === "payments" && payments === null) load("payments");
    if (tab === "articles" && articles === null) load("articles");
    if (tab === "hub" && hubProfiles === null) load("hub_profiles");
    if (tab === "hub" && hubServices === null) load("hub_services");
    if (tab === "promo" && promoCodes === null) load("promo_codes");
    if (tab === "support" && supportMessages === null) load("support_messages");
    if (tab === "marketing" && marketingContent === null) load("marketing_content");
    if (tab === "traffic" && dailyTraffic === null) load("daily_traffic");
  }, [authorized, tab]); // eslint-disable-line

  async function runMarketingNow() {
    setRunningMarketing(true);
    setMarketingRunResult(null);
    const data = await act("run_marketing_now");
    setRunningMarketing(false);
    if (data) {
      setMarketingRunResult(data.result);
      load("marketing_content");
    }
  }

  async function act(action, payload) {
    setErr("");
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "content-type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Action failed."); return null; }
    return data;
  }

  async function adjustCredits(userId, delta) {
    setBusyId(userId);
    const data = await act("adjust_credits", { userId, delta });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, credits: data.credits } : x)));
    setBusyId("");
  }

  async function toggleAdmin(userId, value) {
    if (!(await confirmAction(value ? "Make this user an admin? They'll get full access to this panel." : "Remove admin access from this user?"))) return;
    setBusyId(userId);
    const data = await act("toggle_admin", { userId, value });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, is_admin: value } : x)));
    setBusyId("");
  }

  async function toggleBan(userId, value) {
    if (!(await confirmAction(value ? "Suspend this account? They won't be able to generate, pay, or redeem codes until unbanned." : "Unban this account?"))) return;
    setBusyId(userId);
    const data = await act("toggle_ban", { userId, value });
    if (data) setUsers((u) => u.map((x) => (x.id === userId ? { ...x, banned: value } : x)));
    setBusyId("");
  }

  async function resetAccount(userId, email) {
    if (!(await confirmAction(`Reset ${email}'s account? This deletes their application history and reverts credits, streak, and hired status to a fresh signup. Their login (email/password) is not affected. This can't be undone.`))) return;
    setBusyId(userId);
    const data = await act("reset_account", { userId });
    if (data) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, streak_count: 0, hired: false, plan: "free" } : x)));
      setUserGens((g) => ({ ...g, [userId]: [] }));
    }
    setBusyId("");
  }

  function openEdit(u) {
    setEditingUser(editingUser === u.id ? null : u.id);
    setEditForm({ email: u.email || "", industry: u.industry || "", experience_level: u.experience_level || "" });
  }

  async function saveUserEdit(userId) {
    setBusyId(userId);
    const data = await act("update_user", { userId, ...editForm });
    if (data) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, ...editForm } : x)));
      setEditingUser(null);
    }
    setBusyId("");
  }

  async function getResetLink(email, userId) {
    setBusyId(userId);
    setLinkResult(null);
    const data = await act("reset_link", { email });
    if (data) { setLinkResult({ email, link: data.link }); setLinkCopied(false); }
    setBusyId("");
  }

  async function viewActivity(userId) {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (!userGens[userId]) {
      const res = await fetch(`/api/admin/data?type=user_generations&userId=${userId}`, { headers: await authHeader() });
      const data = await res.json();
      if (res.ok) setUserGens((g) => ({ ...g, [userId]: data.generations }));
    }
  }

  async function deleteJob(jobId) {
    if (!(await confirmAction("Delete this job posting? This can't be undone."))) return;
    setBusyId(jobId);
    const data = await act("delete_job", { jobId });
    if (data) setJobs((j) => j.filter((x) => x.id !== jobId));
    setBusyId("");
  }

  async function deleteArticle(articleId) {
    if (!(await confirmAction("Delete this article?"))) return;
    setBusyId(articleId);
    const data = await act("delete_article", { articleId });
    if (data) setArticles((a) => a.filter((x) => x.id !== articleId));
    setBusyId("");
  }

  async function deleteHubProfile(hubProfileId) {
    if (!(await confirmAction("Remove this profile from the public Talent Hub? The user can rejoin themselves anytime."))) return;
    setBusyId(hubProfileId);
    const data = await act("delete_hub_profile", { hubProfileId });
    if (data) setHubProfiles((h) => h.filter((x) => x.id !== hubProfileId));
    setBusyId("");
  }

  async function deleteHubService(hubServiceId) {
    if (!(await confirmAction("Remove this service listing?"))) return;
    setBusyId(hubServiceId);
    const data = await act("delete_hub_service", { hubServiceId });
    if (data) setHubServices((s) => s.filter((x) => x.id !== hubServiceId));
    setBusyId("");
  }

  async function createPromoCode() {
    setErr("");
    if (!newCode.code.trim() || !newCode.credits) {
      setErr("Code and credits are required.");
      return;
    }
    setCreatingCode(true);
    const data = await act("create_promo_code", {
      code: newCode.code,
      credits: newCode.credits,
      maxRedemptions: newCode.maxRedemptions,
      expiresAt: newCode.expiresAt,
      note: newCode.note,
    });
    if (data) {
      setPromoCodes((c) => [data.code, ...(c || [])]);
      setNewCode({ code: "", credits: "5", maxRedemptions: "", expiresAt: "", note: "" });
    }
    setCreatingCode(false);
  }

  async function togglePromoCode(codeId, active) {
    setBusyId(codeId);
    const data = await act("toggle_promo_code", { codeId, active });
    if (data) setPromoCodes((c) => c.map((x) => (x.id === codeId ? { ...x, active } : x)));
    setBusyId("");
  }

  async function resolveSupportMessage(messageId, status) {
    setBusyId(messageId);
    const data = await act("resolve_support_message", { messageId, status });
    if (data) setSupportMessages((m) => m.map((x) => (x.id === messageId ? { ...x, status } : x)));
    setBusyId("");
  }

  async function sendAdminReply(ticketId) {
    if (!adminReplyText.trim()) return;
    setAdminReplyBusy(true);
    const data = await act("admin_reply_ticket", { ticketId, message: adminReplyText });
    if (data) {
      setSupportMessages((list) =>
        list.map((t) =>
          t.id === ticketId
            ? { ...t, support_ticket_messages: [...t.support_ticket_messages, { id: `temp-${Date.now()}`, sender: "admin", message: adminReplyText, created_at: new Date().toISOString() }] }
            : t
        )
      );
      setAdminReplyText("");
    }
    setAdminReplyBusy(false);
  }

  async function resolvePayment(paymentId, newStatus) {
    const label = newStatus === "complete" ? "mark this payment COMPLETE and credit the user's account" : "mark this payment FAILED";
    if (!(await confirmAction(`Are you sure you want to ${label}? This is meant for fixing a payment where the automatic webhook missed it.`))) return;
    setBusyId(paymentId);
    const data = await act("resolve_payment", { paymentId, newStatus });
    if (data) setPayments((p) => p.map((x) => (x.id === paymentId ? { ...x, status: newStatus } : x)));
    setBusyId("");
  }

  async function copyLink(link) {
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
  }

  if (authorized === null) {
    return <Center minHeight="60vh"><Spinner size="lg" /></Center>;
  }
  if (authorized === false) {
    return (
      <Center minHeight="60vh" padding={6}>
        <EmptyState title="Not authorized" description="This area is restricted to TumaCV admins." />
      </Center>
    );
  }

  const filteredUsers = users ? users.filter((u) => !q || u.email?.toLowerCase().includes(q.toLowerCase())) : null;
  const filteredJobs = jobs ? jobs.filter((j) => !q || `${j.title} ${j.company}`.toLowerCase().includes(q.toLowerCase())) : null;
  const filteredPayments = payments ? payments.filter((p) => payFilter === "all" || p.status === payFilter) : null;
  const filteredTickets = supportMessages ? supportMessages.filter((m) => supportFilter === "all" || m.status === supportFilter) : null;
  const attention = stats?.needsAttention;
  const paymentAlerts = (attention?.pendingPayments || 0) + (attention?.underpaidPayments || 0);
  const goTo = (key) => { setTab(key); setQ(""); window.scrollTo({ top: 0 }); };
  const current = SECTIONS.find((s) => s.key === tab);

  const nav = (
    <SideNav>
      <SideNavSection title="Admin">
        {SECTIONS.map((s) => (
          <SideNavItem
            key={s.key}
            label={s.label}
            icon={s.icon}
            isSelected={tab === s.key}
            onClick={() => goTo(s.key)}
            endContent={
              s.key === "support" && attention?.openTickets > 0 ? <Badge label={String(attention.openTickets)} variant="warning" />
              : s.key === "payments" && paymentAlerts > 0 ? <Badge label={String(paymentAlerts)} variant="warning" />
              : undefined
            }
          />
        ))}
      </SideNavSection>
    </SideNav>
  );

  const content = (
    <VStack gap={5}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <VStack gap={0}>
          <Text color="accent" weight="semibold">Admin</Text>
          <Heading level={1}>{current?.label}</Heading>
        </VStack>
        {isNarrow && (
          <Selector label="Section" isLabelHidden width={220} value={tab} onChange={goTo} options={SECTIONS.map((s) => ({ value: s.key, label: s.label }))} />
        )}
      </HStack>

      {err && <Banner status="error" title={err} isDismissable onDismiss={() => setErr("")} />}

      {linkResult && (
        <Banner
          status="info"
          title={`Reset link for ${linkResult.email}`}
          description={`${linkResult.link} — one-time use and expires soon. Share it directly with the person (WhatsApp, SMS), never anywhere public.`}
          endContent={<Button size="sm" label={linkCopied ? "Copied" : "Copy"} icon={<Icon icon={linkCopied ? "check" : "copy"} />} onClick={() => copyLink(linkResult.link)} />}
          isDismissable
          onDismiss={() => setLinkResult(null)}
        />
      )}

      {tab === "overview" && (stats === null ? <Loading /> : (
        <VStack gap={5}>
          {(attention?.openTickets > 0 || paymentAlerts > 0) && (
            <Banner
              status="warning"
              title="Needs attention"
              description={[
                attention.openTickets > 0 && `${attention.openTickets} open support ticket${attention.openTickets === 1 ? "" : "s"}`,
                attention.pendingPayments > 0 && `${attention.pendingPayments} pending payment${attention.pendingPayments === 1 ? "" : "s"}`,
                attention.underpaidPayments > 0 && `${attention.underpaidPayments} underpaid payment${attention.underpaidPayments === 1 ? "" : "s"}`,
              ].filter(Boolean).join(" · ")}
              endContent={
                <HStack gap={2}>
                  {attention.openTickets > 0 && <Button size="sm" label="Support" onClick={() => goTo("support")} />}
                  {paymentAlerts > 0 && <Button size="sm" label="Payments" onClick={() => goTo("payments")} />}
                </HStack>
              }
            />
          )}
          <Grid columns={{ minWidth: 260 }} gap={4}>
            <StatCard label="Total users" value={stats.totalUsers} />
            <StatCard label="Signups · 7 days" value={stats.signupsWeek} />
            <StatCard label="Applications" value={stats.totalGenerations} />
            <StatCard label="Revenue (complete)" value={`KES ${stats.totalRevenue.toLocaleString()}`} />
            <StatCard label="Users hired" value={stats.hiredCount} />
            <StatCard label="Active streaks (3+ days)" value={`🔥 ${stats.activeStreaks}`} />
          </Grid>
          <Grid columns={{ minWidth: 280 }} gap={4}>
            <TrendChart title="Signups, 30 days" series={stats.trends?.signups} />
            <TrendChart title="Applications, 30 days" series={stats.trends?.generations} />
            <TrendChart title="Revenue, 30 days" series={stats.trends?.revenue} format={(n) => `KES ${n}`} />
          </Grid>
          <Grid columns={{ minWidth: 380 }} gap={4}>
            <OverviewCard
              title="Users by industry"
              segments={(industryStats || []).slice(0, 5).map((d) => ({ label: d.label, value: d.count }))}
              centerValue={stats.totalUsers}
              centerLabel="users"
              empty="No industries recorded yet."
              stats={[
                { label: "signups · 7d", value: stats.signupsWeek },
                { label: "hired", value: stats.hiredCount },
                { label: "signup → paid", value: stats.funnel?.signups ? `${Math.round((stats.funnel.paid / stats.funnel.signups) * 100)}%` : "—" },
              ]}
            />
            <FunnelCard funnel={stats.funnel} />
          </Grid>
          <Grid columns={{ minWidth: 280 }} gap={4}>
            <BarCard title="Revenue by plan" data={stats.planBreakdown} />
            <BarCard title="Where users heard about us" data={referralStats} />
            <BarCard title={`Most visited pages${pageStats ? ` (${pageStats.totalViews} views, 30 days)` : ""}`} data={pageStats?.stats} />
          </Grid>
          <Card padding={0}>
            <VStack gap={0}>
              <VStack padding={5}><Heading level={3}>Newest signups</Heading></VStack>
              {users === null ? <Loading /> : (
                <List hasDividers>
                  {users.slice(0, 6).map((u) => (
                    <ListItem key={u.id} label={u.email || "Unknown"} description={`${u.industry || "no industry"} · ${fmtDate(u.created_at)}`} startContent={<Avatar name={u.email || "?"} size="sm" tooltip={false} />} />
                  ))}
                </List>
              )}
            </VStack>
          </Card>
        </VStack>
      ))}

      {tab === "users" && (
        <VStack gap={4}>
          <TextInput label="Search users" isLabelHidden placeholder="Search by email…" value={q} onChange={setQ} startIcon="search" hasClear />
          {filteredUsers === null ? <Loading /> : filteredUsers.length === 0 ? <Text color="secondary">No users match “{q}”.</Text> : (
            <Card padding={0}>
              <List hasDividers>
                {filteredUsers.map((u) => (
                  <ListItem
                    key={u.id}
                    label={u.email}
                    startContent={<Avatar name={u.email || "?"} size="sm" tooltip={false} />}
                    description={
                      <VStack gap={2}>
                        <Text type="supporting" color="secondary">
                          {fmtDate(u.created_at)} · {u.industry || "no industry"} · 🔥{u.streak_count || 0}
                          {u.referral_source ? ` · via ${u.referral_source}` : ""} · {u.plan === "unlimited" ? "Unlimited" : `${u.credits} credits`} · plan: {u.plan}
                        </Text>
                        {(u.is_admin || u.hired || u.banned) && (
                          <HStack gap={1}>
                            {u.is_admin && <Badge label="admin" variant="info" />}
                            {u.hired && <Badge label="hired" variant="success" />}
                            {u.banned && <Badge label="suspended" variant="error" />}
                          </HStack>
                        )}
                        {editingUser === u.id && (
                          <Card variant="muted" padding={4}>
                            <VStack gap={3}>
                              <Grid columns={{ minWidth: 200 }} gap={3}>
                                <TextInput label="Email" value={editForm.email} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
                                <TextInput label="Industry" value={editForm.industry} onChange={(v) => setEditForm((f) => ({ ...f, industry: v }))} />
                                <TextInput label="Experience level" placeholder="e.g. mid, senior, graduate" value={editForm.experience_level} onChange={(v) => setEditForm((f) => ({ ...f, experience_level: v }))} />
                              </Grid>
                              <HStack gap={2}>
                                <Button label="Save changes" variant="primary" size="sm" isLoading={busyId === u.id} onClick={() => saveUserEdit(u.id)} />
                                <Button label="Cancel" variant="ghost" size="sm" onClick={() => setEditingUser(null)} />
                              </HStack>
                            </VStack>
                          </Card>
                        )}
                        {expandedUser === u.id && (
                          !userGens[u.id] ? <Spinner size="sm" /> : userGens[u.id].length === 0 ? (
                            <Text type="supporting" color="secondary">No applications generated yet.</Text>
                          ) : (
                            <VStack gap={1}>
                              {userGens[u.id].map((g) => (
                                <Text key={g.id} type="supporting">{g.job_title || "Application"} ({g.template}) · {fmtDate(g.created_at, { day: "numeric", month: "short" })}</Text>
                              ))}
                            </VStack>
                          )
                        )}
                      </VStack>
                    }
                    endContent={
                      <HStack gap={1} align="center">
                        {busyId === u.id && <Spinner size="sm" />}
                        <MoreMenu
                          label={`Actions for ${u.email}`}
                          alignment="end"
                          items={[
                            { label: "+5 credits", onClick: () => adjustCredits(u.id, 5) },
                            { label: "−5 credits", onClick: () => adjustCredits(u.id, -5) },
                            { type: "divider" },
                            { label: expandedUser === u.id ? "Hide activity" : "View activity", onClick: () => viewActivity(u.id) },
                            { label: editingUser === u.id ? "Cancel edit" : "Edit details", onClick: () => openEdit(u) },
                            { label: "Get password reset link", onClick: () => getResetLink(u.email, u.id) },
                            { label: u.is_admin ? "Remove admin" : "Make admin", onClick: () => toggleAdmin(u.id, !u.is_admin) },
                            { type: "divider" },
                            { label: u.banned ? "Unban" : "Suspend account", variant: "destructive", onClick: () => toggleBan(u.id, !u.banned) },
                            { label: "Reset account", variant: "destructive", onClick: () => resetAccount(u.id, u.email) },
                          ]}
                        />
                      </HStack>
                    }
                  />
                ))}
              </List>
            </Card>
          )}
        </VStack>
      )}

      {tab === "payments" && (
        <VStack gap={4}>
          <SegmentedControl label="Status" value={payFilter} onChange={setPayFilter}>
            {["all", "pending", "complete", "failed", "underpaid"].map((s) => (
              <SegmentedControlItem key={s} value={s} label={s.charAt(0).toUpperCase() + s.slice(1)} />
            ))}
          </SegmentedControl>
          {filteredPayments === null ? <Loading /> : filteredPayments.length === 0 ? <Text color="secondary">No payments match.</Text> : (
            <Card padding={0}>
              <Table
                idKey="id"
                data={filteredPayments}
                columns={[
                  { key: "plan_id", header: "Plan", renderCell: (p) => <Text weight="medium">{p.plan_id}</Text> },
                  { key: "amount", header: "Amount", renderCell: (p) => <Text hasTabularNumbers>KES {p.amount}</Text> },
                  { key: "created_at", header: "Date", renderCell: (p) => <Text>{fmtDate(p.created_at, { day: "numeric", month: "short" })}</Text> },
                  { key: "provider_ref", header: "Reference", renderCell: (p) => <Text type="code">{p.provider_ref || "—"}</Text> },
                  { key: "status", header: "Status", renderCell: (p) => <Badge label={p.status} variant={STATUS_BADGE[p.status] || "neutral"} /> },
                  {
                    key: "actions",
                    header: "",
                    renderCell: (p) =>
                      p.status !== "complete" ? (
                        <HStack gap={1} justify="end">
                          <Button size="sm" label="Mark complete" isLoading={busyId === p.id} onClick={() => resolvePayment(p.id, "complete")} />
                          {p.status !== "failed" && <Button size="sm" variant="ghost" label="Mark failed" isDisabled={busyId === p.id} onClick={() => resolvePayment(p.id, "failed")} />}
                        </HStack>
                      ) : null,
                  },
                ]}
              />
            </Card>
          )}
        </VStack>
      )}

      {tab === "support" && (
        <VStack gap={4}>
          <SegmentedControl label="Status" value={supportFilter} onChange={setSupportFilter}>
            <SegmentedControlItem value="open" label="Open" />
            <SegmentedControlItem value="resolved" label="Resolved" />
            <SegmentedControlItem value="all" label="All" />
          </SegmentedControl>
          {filteredTickets === null ? <Loading /> : filteredTickets.length === 0 ? (
            <Text color="secondary">No {supportFilter !== "all" ? supportFilter : ""} tickets.</Text>
          ) : (
            <Card padding={2}>
              <CollapsibleGroup hasDividers value={expandedTicket || ""} onChange={(v) => setExpandedTicket(v || null)}>
                {filteredTickets.map((t) => {
                  const last = t.support_ticket_messages[t.support_ticket_messages.length - 1];
                  return (
                    <Collapsible
                      key={t.id}
                      value={t.id}
                      trigger={
                        <VStack gap={0.5}>
                          <HStack gap={2} align="center" wrap="wrap">
                            <Badge label={t.type} />
                            <Text weight="semibold">{t.subject}</Text>
                            <Badge label={t.status} variant={STATUS_BADGE[t.status] || "neutral"} />
                          </HStack>
                          <Text type="supporting" color="secondary">
                            {t.email} · {fmtDate(t.updated_at)}
                            {last ? ` · ${last.sender === "admin" ? "You: " : ""}${last.message.slice(0, 80)}${last.message.length > 80 ? "…" : ""}` : ""}
                          </Text>
                        </VStack>
                      }
                    >
                      <VStack gap={3}>
                        {t.support_ticket_messages.map((m) => (
                          <HStack key={m.id} justify={m.sender === "admin" ? "end" : "start"}>
                            <Card padding={3} variant={m.sender === "admin" ? "green" : "muted"} maxWidth="85%">
                              <VStack gap={1}>
                                <Text type="supporting" color="secondary">{m.sender === "admin" ? "You" : "User"} · {fmtDateTime(m.created_at)}</Text>
                                <Text>{m.message}</Text>
                              </VStack>
                            </Card>
                          </HStack>
                        ))}
                        <HStack gap={2} align="end">
                          <StackItem size="fill">
                            <TextInput label="Reply" isLabelHidden placeholder="Reply…" value={adminReplyText} onChange={setAdminReplyText} />
                          </StackItem>
                          <Button label="Send" variant="primary" isLoading={adminReplyBusy} onClick={() => sendAdminReply(t.id)} />
                        </HStack>
                        <HStack gap={2} wrap="wrap">
                          <Button size="sm" variant="ghost" label="Reply by email instead" onClick={() => { window.location.href = `mailto:${t.email}`; }} />
                          {t.status === "open" ? (
                            <Button size="sm" label="Mark resolved" isLoading={busyId === t.id} onClick={() => resolveSupportMessage(t.id, "resolved")} />
                          ) : (
                            <Button size="sm" label="Reopen" isLoading={busyId === t.id} onClick={() => resolveSupportMessage(t.id, "open")} />
                          )}
                        </HStack>
                      </VStack>
                    </Collapsible>
                  );
                })}
              </CollapsibleGroup>
            </Card>
          )}
        </VStack>
      )}

      {tab === "promo" && (
        <VStack gap={4}>
          <Card padding={5}>
            <VStack gap={4}>
              <Heading level={3}>Create a code</Heading>
              <Grid columns={{ minWidth: 200 }} gap={3}>
                <TextInput label="Code" placeholder="e.g. TIKTOK5" value={newCode.code} onChange={(v) => setNewCode((f) => ({ ...f, code: v.toUpperCase() }))} />
                <NumberInput label="Credits to give" min={1} value={newCode.credits === "" ? null : Number(newCode.credits)} onChange={(v) => setNewCode((f) => ({ ...f, credits: v == null ? "" : String(v) }))} />
                <NumberInput label="Max redemptions" isOptional description="Blank = unlimited" min={1} value={newCode.maxRedemptions === "" ? null : Number(newCode.maxRedemptions)} onChange={(v) => setNewCode((f) => ({ ...f, maxRedemptions: v == null ? "" : String(v) }))} />
                <TextInput label="Expires" isOptional placeholder="YYYY-MM-DD" value={newCode.expiresAt} onChange={(v) => setNewCode((f) => ({ ...f, expiresAt: v }))} />
              </Grid>
              <TextInput label="Note" description="For you — not shown to users." placeholder="e.g. TikTok launch video, Aug 2026" value={newCode.note} onChange={(v) => setNewCode((f) => ({ ...f, note: v }))} />
              <HStack>
                <Button label="Create code" variant="primary" isLoading={creatingCode} onClick={createPromoCode} />
              </HStack>
            </VStack>
          </Card>
          {promoCodes === null ? <Loading /> : promoCodes.length === 0 ? <Text color="secondary">No promo codes yet — create one above.</Text> : (
            <Card padding={0}>
              <List hasDividers>
                {promoCodes.map((c) => (
                  <ListItem
                    key={c.id}
                    label={c.code}
                    description={`${c.redemptions_count} used${c.max_redemptions ? ` / ${c.max_redemptions} max` : " / unlimited"}${c.expires_at ? ` · expires ${fmtDate(c.expires_at)}` : ""}${c.note ? ` · ${c.note}` : ""}`}
                    endContent={
                      <HStack gap={2} align="center">
                        <Token label={`+${c.credits}`} size="sm" color="green" />
                        {!c.active && <Badge label="inactive" />}
                        <Button size="sm" label={c.active ? "Deactivate" : "Activate"} isLoading={busyId === c.id} onClick={() => togglePromoCode(c.id, !c.active)} />
                      </HStack>
                    }
                  />
                ))}
              </List>
            </Card>
          )}
        </VStack>
      )}

      {tab === "hub" && (
        <VStack gap={5}>
          <VStack gap={3}>
            <Heading level={2}>Profiles</Heading>
            {hubProfiles === null ? <Loading /> : hubProfiles.length === 0 ? <Text color="secondary">No one has joined the Talent Hub yet.</Text> : (
              <Card padding={0}>
                <List hasDividers>
                  {hubProfiles.map((p) => (
                    <ListItem
                      key={p.id}
                      label={`${p.display_name} — ${p.title}`}
                      startContent={<Avatar name={p.display_name || "?"} size="sm" tooltip={false} />}
                      description={[
                        [p.industry, p.experience_level].filter(Boolean).join(" · "),
                        (p.skills || []).join(", "),
                        p.blurb ? `“${p.blurb}”` : "",
                        (p.experience || []).length ? `Experience: ${p.experience.map((e) => `${e.role}${e.company ? ` @ ${e.company}` : ""}`).join("; ")}` : "",
                        (p.education || []).length ? `Education: ${p.education.map((e) => `${e.degree}${e.school ? ` @ ${e.school}` : ""}`).join("; ")}` : "",
                      ].filter(Boolean).join(" · ")}
                      endContent={<Button size="sm" variant="ghost" label="Remove" isLoading={busyId === p.id} onClick={() => deleteHubProfile(p.id)} />}
                    />
                  ))}
                </List>
              </Card>
            )}
          </VStack>
          <VStack gap={3}>
            <Heading level={2}>Service listings</Heading>
            {hubServices === null ? <Loading /> : hubServices.length === 0 ? <Text color="secondary">No services listed yet.</Text> : (
              <Card padding={0}>
                <List hasDividers>
                  {hubServices.map((s) => (
                    <ListItem
                      key={s.id}
                      label={`${s.title} — KES ${s.price_kes.toLocaleString()}`}
                      description={`${s.category} · ${s.hub_profiles?.display_name || "Unknown"}${s.delivery_days ? ` · ${s.delivery_days}-day delivery` : ""} · ${s.description.slice(0, 140)}`}
                      endContent={<Button size="sm" variant="ghost" label="Remove" isLoading={busyId === s.id} onClick={() => deleteHubService(s.id)} />}
                    />
                  ))}
                </List>
              </Card>
            )}
          </VStack>
        </VStack>
      )}

      {tab === "articles" && (articles === null ? <Loading /> : articles.length === 0 ? <Text color="secondary">No articles generated yet.</Text> : (
        <Card padding={0}>
          <List hasDividers>
            {articles.map((a) => (
              <ListItem
                key={a.id}
                label={a.title}
                description={`${a.industry} · ${fmtDate(a.created_at, { day: "numeric", month: "short" })}`}
                endContent={
                  <HStack gap={1}>
                    <Button size="sm" variant="ghost" label="View" onClick={() => window.open(`/news/${a.id}`, "_blank")} />
                    <Button size="sm" variant="ghost" label="Delete" isLoading={busyId === a.id} onClick={() => deleteArticle(a.id)} />
                  </HStack>
                }
              />
            ))}
          </List>
        </Card>
      ))}

      {tab === "jobs" && (
        <VStack gap={4}>
          <TextInput label="Search jobs" isLabelHidden placeholder="Search by title or company…" value={q} onChange={setQ} startIcon="search" hasClear />
          {filteredJobs === null ? <Loading /> : filteredJobs.length === 0 ? <Text color="secondary">No jobs match.</Text> : (
            <Card padding={0}>
              <List hasDividers>
                {filteredJobs.map((j) => (
                  <ListItem
                    key={j.id}
                    label={`${j.title} — ${j.company}`}
                    description={[j.location, j.job_type].filter(Boolean).join(" · ")}
                    startContent={<Avatar name={j.company || "?"} size="sm" tooltip={false} />}
                    endContent={<Button size="sm" variant="ghost" label="Delete" isLoading={busyId === j.id} onClick={() => deleteJob(j.id)} />}
                  />
                ))}
              </List>
            </Card>
          )}
        </VStack>
      )}

      {tab === "marketing" && (
        <VStack gap={4}>
          <Card padding={5}>
            <VStack gap={4}>
              <HStack justify="between" align="center" gap={3} wrap="wrap">
                <VStack gap={0}>
                  <Heading level={3}>Channels</Heading>
                  <Text type="supporting" color="secondary">Runs once a day (vercel.json cron). Channels without their env vars are skipped — see the README.</Text>
                </VStack>
                <Button label="Run now" variant="primary" isLoading={runningMarketing} onClick={runMarketingNow} />
              </HStack>
              {marketingChannels === null ? <Loading /> : (
                <List hasDividers>
                  {marketingChannels.map((c) => (
                    <ListItem key={c.key} label={c.label} description={c.note || undefined} endContent={<Badge label={c.enabled ? "Live" : "Not configured"} variant={c.enabled ? "success" : "warning"} />} />
                  ))}
                </List>
              )}
              {marketingRunResult && (
                <Banner status="info" title="Run finished" description={JSON.stringify(marketingRunResult)} isDismissable onDismiss={() => setMarketingRunResult(null)} />
              )}
            </VStack>
          </Card>
          <Heading level={2}>Recent activity</Heading>
          {marketingContent === null ? <Loading /> : marketingContent.length === 0 ? <Text color="secondary">Nothing generated yet — hit “Run now”.</Text> : (
            <Card padding={0}>
              <List hasDividers>
                {marketingContent.map((m) => (
                  <ListItem
                    key={m.id}
                    label={m.subject || m.body.slice(0, 80)}
                    description={`${m.kind}${m.segment ? ` · ${m.segment}` : ""} · ${m.status}${m.error ? ` · ${m.error.slice(0, 120)}` : ""} · ${fmtDateTime(m.created_at)}`}
                    startContent={<Badge label={m.channel} />}
                  />
                ))}
              </List>
            </Card>
          )}
        </VStack>
      )}

      {tab === "traffic" && (
        <VStack gap={4}>
          <Text color="secondary">Real visitor activity only — page views and generations from admin accounts are excluded. Open a day to see its top pages.</Text>
          {dailyTraffic === null ? <Loading /> : (
            <Card padding={2}>
              <CollapsibleGroup hasDividers value={expandedDay || ""} onChange={(v) => { if (v && v !== expandedDay) toggleDay(v); else setExpandedDay(null); }}>
                {[...dailyTraffic].reverse().map((d) => {
                  const detail = dayDetail[d.date];
                  return (
                    <Collapsible
                      key={d.date}
                      value={d.date}
                      trigger={
                        <Grid columns={5} gap={2} width="100%">
                          <Text weight="semibold">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}</Text>
                          <Text hasTabularNumbers>{d.pageViews} views</Text>
                          <Text hasTabularNumbers>{d.signups} signups</Text>
                          <Text hasTabularNumbers>{d.generations} CVs</Text>
                          <Text hasTabularNumbers>KES {d.revenueKes.toLocaleString()}</Text>
                        </Grid>
                      }
                    >
                      {dayDetailLoading === d.date ? <Spinner size="sm" /> : detail ? (
                        detail.topPages.length === 0 ? <Text color="secondary">No page views that day.</Text> : (
                          <VStack gap={1}>
                            {detail.topPages.map((p) => (
                              <HStack key={p.path} justify="between" maxWidth={420}>
                                <Text type="code">{p.path}</Text>
                                <Text hasTabularNumbers>{p.count}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        )
                      ) : null}
                    </Collapsible>
                  );
                })}
              </CollapsibleGroup>
            </Card>
          )}
        </VStack>
      )}
    </VStack>
  );

  return (
    <>
      <Layout
        height="auto"
        start={isNarrow ? undefined : <LayoutPanel width={240} hasDivider isScrollable={false}>{nav}</LayoutPanel>}
        content={<LayoutContent padding={6} isScrollable={false}>{content}</LayoutContent>}
      />
      <AlertDialog
        isOpen={!!confirmReq}
        onOpenChange={(open) => !open && answerConfirm(false)}
        title="Are you sure?"
        description={confirmReq?.message || ""}
        actionLabel="Continue"
        onAction={() => answerConfirm(true)}
      />
    </>
  );
}
