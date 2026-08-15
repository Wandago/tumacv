import { requireUser, supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";
import { runMarketingCron } from "../../../../lib/marketingEngine";
import { CHANNEL_STATUS, CHANNEL_LABELS, UNSUPPORTED_REASON } from "../../../../lib/marketingChannels";

export const maxDuration = 60;

// Consolidated under a single dynamic route to stay within Vercel's
// serverless function count — /api/admin/action (POST) and /api/admin/data
// (GET) are both still live at their original URLs, just dispatched from
// one function based on [action].

async function assertAdmin(req) {
  const authed = await requireUser(req);
  if (!authed) return null;
  const { data: profile } = await authed.admin
    .from("profiles")
    .select("is_admin")
    .eq("id", authed.user.id)
    .single();
  if (!profile?.is_admin) return null;
  return authed;
}

async function handleData(req, admin) {
  const type = new URL(req.url).searchParams.get("type");

  if (type === "users") {
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, credits, plan, plan_expires, industry, experience_level, referral_source, streak_count, hired, is_admin, banned, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ users: data });
  }

  if (type === "jobs") {
    const { data, error } = await admin
      .from("jobs")
      .select("id, title, company, location, job_type, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ jobs: data });
  }

  if (type === "payments") {
    const { data, error } = await admin
      .from("payments")
      .select("id, user_id, plan_id, amount, status, provider_ref, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ payments: data });
  }

  if (type === "stats") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const [
      { count: totalUsers },
      { count: signupsWeek },
      { count: totalGenerations },
      { count: hiredCount },
      { count: activeStreaks },
      { count: generatedUsers },
      { count: openTickets },
      { count: pendingPayments },
      { count: underpaidPayments },
      { data: signupRows },
      { data: generationRows },
      { data: completedPayments },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      admin.from("generations").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("hired", true),
      admin.from("profiles").select("*", { count: "exact", head: true }).gte("streak_count", 3),
      admin.from("profiles").select("*", { count: "exact", head: true }).not("last_generation_date", "is", null),
      admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      admin.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("payments").select("*", { count: "exact", head: true }).eq("status", "underpaid"),
      admin.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).limit(20000),
      admin.from("generations").select("created_at").gte("created_at", thirtyDaysAgo).limit(20000),
      admin.from("payments").select("user_id, amount, plan_id, created_at").eq("status", "complete").limit(20000),
    ]);

    const totalRevenue = (completedPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidUsers = new Set((completedPayments || []).map((p) => p.user_id)).size;

    // Bucket a set of rows into daily counts (or summed amounts) over the trailing 30 days,
    // so "no activity that day" still shows as a real zero rather than a gap.
    function dailyBuckets(rows, valueKey) {
      const counts = {};
      for (const row of rows || []) {
        const day = row.created_at.slice(0, 10);
        counts[day] = (counts[day] || 0) + (valueKey ? row[valueKey] || 0 : 1);
      }
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        days.push({ date: d, value: counts[d] || 0 });
      }
      return days;
    }

    const planCounts = {};
    for (const p of completedPayments || []) {
      planCounts[p.plan_id] = (planCounts[p.plan_id] || 0) + 1;
    }
    const planBreakdown = Object.entries(planCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([planId, count]) => ({ label: PLANS[planId] ? `${PLANS[planId].name} — KES ${PLANS[planId].priceKes}` : planId, count }));

    return Response.json({
      stats: {
        totalUsers,
        signupsWeek,
        totalGenerations,
        hiredCount,
        activeStreaks,
        totalRevenue,
        needsAttention: { openTickets, pendingPayments, underpaidPayments },
        funnel: { signups: totalUsers, generated: generatedUsers, paid: paidUsers, hired: hiredCount },
        trends: {
          signups: dailyBuckets(signupRows),
          generations: dailyBuckets(generationRows),
          revenue: dailyBuckets(completedPayments, "amount"),
        },
        planBreakdown,
      },
    });
  }

  if (type === "articles") {
    const { data, error } = await admin
      .from("articles")
      .select("id, industry, title, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ articles: data });
  }

  if (type === "hub_profiles") {
    const { data, error } = await admin
      .from("hub_profiles")
      .select("id, display_name, title, industry, experience_level, skills, blurb, experience, education, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ hubProfiles: data });
  }

  if (type === "user_generations") {
    const userId = new URL(req.url).searchParams.get("userId");
    const { data, error } = await admin
      .from("generations")
      .select("id, job_title, template, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ generations: data });
  }

  if (type === "referral_stats") {
    const { data } = await admin.from("profiles").select("referral_source").limit(5000);
    const counts = {};
    for (const row of data || []) {
      const key = row.referral_source || "Not specified";
      counts[key] = (counts[key] || 0) + 1;
    }
    const stats = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    return Response.json({ stats });
  }

  if (type === "industry_stats") {
    const { data } = await admin.from("profiles").select("industry").limit(5000);
    const counts = {};
    for (const row of data || []) {
      const key = row.industry || "Not specified";
      counts[key] = (counts[key] || 0) + 1;
    }
    const stats = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    return Response.json({ stats });
  }

  if (type === "page_stats") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await admin.from("page_views").select("path").gte("created_at", thirtyDaysAgo).limit(20000);
    const counts = {};
    for (const row of data || []) {
      counts[row.path] = (counts[row.path] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const FRIENDLY_PATHS = {
      "/": "Home",
      "/dashboard": "Dashboard",
      "/admin": "Admin",
      "/login": "Sign in / Sign up",
      "/pricing": "Pricing",
      "/support": "Support",
      "/news": "News",
      "/jobs": "Jobs board",
      "/onboarding": "Onboarding",
      "/privacy": "Privacy policy",
      "/terms": "Terms",
    };
    const jobIds = [], articleIds = [];
    for (const [path] of top) {
      const jobMatch = path.match(/^\/jobs\/([^/]+)$/);
      const newsMatch = path.match(/^\/news\/([^/]+)$/);
      if (jobMatch) jobIds.push(jobMatch[1]);
      if (newsMatch) articleIds.push(newsMatch[1]);
    }
    const [jobTitles, articleTitles] = await Promise.all([
      jobIds.length
        ? admin.from("jobs").select("id, title, company").in("id", jobIds).then(({ data }) => data || [])
        : [],
      articleIds.length
        ? admin.from("articles").select("id, title").in("id", articleIds).then(({ data }) => data || [])
        : [],
    ]);
    const jobById = Object.fromEntries(jobTitles.map((j) => [j.id, j]));
    const articleById = Object.fromEntries(articleTitles.map((a) => [a.id, a]));

    const stats = top.map(([path, count]) => {
      if (FRIENDLY_PATHS[path]) return { label: FRIENDLY_PATHS[path], count };
      const jobMatch = path.match(/^\/jobs\/([^/]+)$/);
      if (jobMatch) {
        const job = jobById[jobMatch[1]];
        return { label: job ? `Job: ${job.title} — ${job.company}` : `Job posting (${path})`, count };
      }
      const newsMatch = path.match(/^\/news\/([^/]+)$/);
      if (newsMatch) {
        const article = articleById[newsMatch[1]];
        return { label: article ? `Article: ${article.title}` : `News article (${path})`, count };
      }
      return { label: path, count };
    });
    return Response.json({ stats, totalViews: (data || []).length });
  }

  if (type === "marketing_content") {
    const { data, error } = await admin
      .from("marketing_content")
      .select("id, kind, channel, segment, subject, body, cta_url, status, error, recipient_user_id, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const channels = Object.keys(CHANNEL_STATUS).map((key) => ({
      key,
      label: CHANNEL_LABELS[key] || key,
      enabled: CHANNEL_STATUS[key],
      note: UNSUPPORTED_REASON[key] || null,
    }));
    return Response.json({ content: data, channels });
  }

  if (type === "promo_codes") {
    const { data, error } = await admin
      .from("promo_codes")
      .select("id, code, credits, max_redemptions, redemptions_count, active, expires_at, note, created_at")
      .order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ codes: data });
  }

  if (type === "support_messages") {
    const { data, error } = await admin
      .from("support_tickets")
      .select("*, support_ticket_messages(*)")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const tickets = (data || []).map((t) => ({
      ...t,
      support_ticket_messages: (t.support_ticket_messages || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    }));
    return Response.json({ tickets });
  }

  return Response.json({ error: "Unknown type." }, { status: 400 });
}

async function handleAction(req, admin) {
  const body = await req.json();

  if (body.action === "adjust_credits") {
    const { userId, delta } = body;
    const { data: profile, error: pErr } = await admin.from("profiles").select("credits").eq("id", userId).single();
    if (pErr || !profile) return Response.json({ error: "User not found." }, { status: 404 });
    const newCredits = Math.max(0, profile.credits + Number(delta));
    const { error } = await admin.from("profiles").update({ credits: newCredits }).eq("id", userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, credits: newCredits });
  }

  if (body.action === "reset_link") {
    const { email } = body;
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tumacv.vercel.app";
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${site}/reset` },
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, link: data?.properties?.action_link || null });
  }

  if (body.action === "delete_job") {
    const { error } = await admin.from("jobs").delete().eq("id", body.jobId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "toggle_admin") {
    const { userId, value } = body;
    const { error } = await admin.from("profiles").update({ is_admin: value }).eq("id", userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "delete_article") {
    const { error } = await admin.from("articles").delete().eq("id", body.articleId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "delete_hub_profile") {
    const { error } = await admin.from("hub_profiles").delete().eq("id", body.hubProfileId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "resolve_payment") {
    const { paymentId, newStatus } = body;
    const { data: payment, error: payErr } = await admin.from("payments").select("*").eq("id", paymentId).single();
    if (payErr || !payment) return Response.json({ error: "Payment not found." }, { status: 404 });
    if (payment.status === "complete") return Response.json({ ok: true, note: "Already complete — no change." });

    if (newStatus === "failed") {
      await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
      return Response.json({ ok: true });
    }

    const plan = PLANS[payment.plan_id];
    if (!plan) return Response.json({ error: "Unknown plan on this payment." }, { status: 400 });

    const { data: profile } = await admin.from("profiles").select("credits, plan, plan_expires").eq("id", payment.user_id).single();
    if (!profile) return Response.json({ error: "User not found." }, { status: 404 });

    if (plan.unlimitedDays) {
      const from = profile.plan === "unlimited" && profile.plan_expires && new Date(profile.plan_expires) > new Date()
        ? new Date(profile.plan_expires) : new Date();
      const expires = new Date(from.getTime() + plan.unlimitedDays * 24 * 60 * 60 * 1000);
      await admin.from("profiles").update({ plan: "unlimited", plan_expires: expires.toISOString() }).eq("id", payment.user_id);
    } else {
      await admin.from("profiles").update({ credits: profile.credits + plan.credits }).eq("id", payment.user_id);
    }
    await admin.from("payments").update({ status: "complete", provider_ref: "admin-resolved" }).eq("id", paymentId);
    return Response.json({ ok: true });
  }

  if (body.action === "reset_account") {
    // Support tool for a genuinely fresh start: wipes generation history and
    // reverts the profile to a just-signed-up state. Does NOT touch the auth
    // account itself (email/password) or delete the person's login.
    const { userId } = body;
    const { FREE_SIGNUP_CREDITS } = await import("../../../../lib/plans");
    await admin.from("generations").delete().eq("user_id", userId);
    const { error } = await admin
      .from("profiles")
      .update({
        credits: FREE_SIGNUP_CREDITS,
        plan: "free",
        plan_expires: null,
        streak_count: 0,
        longest_streak: 0,
        last_generation_date: null,
        hired: false,
        hired_at: null,
        cached_insight: null,
        insight_date: null,
      })
      .eq("id", userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "update_user") {
    const { userId, email, industry, experience_level } = body;
    const updates = {};
    if (industry !== undefined) updates.industry = industry || null;
    if (experience_level !== undefined) updates.experience_level = experience_level || null;

    if (email) {
      const { error: authErr } = await admin.auth.admin.updateUserById(userId, { email });
      if (authErr) return Response.json({ error: `Could not update email: ${authErr.message}` }, { status: 500 });
      updates.email = email;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from("profiles").update(updates).eq("id", userId);
      if (error) return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  if (body.action === "create_promo_code") {
    const { code, credits, maxRedemptions, expiresAt, note } = body;
    const normalized = (code || "").trim().toUpperCase();
    if (!normalized || !credits) return Response.json({ error: "Code and credits are required." }, { status: 400 });
    const { data, error } = await admin
      .from("promo_codes")
      .insert({
        code: normalized,
        credits: Number(credits),
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expires_at: expiresAt || null,
        note: note || null,
      })
      .select()
      .single();
    if (error) return Response.json({ error: error.message.includes("duplicate") ? "That code already exists." : error.message }, { status: 500 });
    return Response.json({ ok: true, code: data });
  }

  if (body.action === "toggle_promo_code") {
    const { codeId, active } = body;
    const { error } = await admin.from("promo_codes").update({ active }).eq("id", codeId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "toggle_ban") {
    const { userId, value } = body;
    const { error } = await admin.from("profiles").update({ banned: value }).eq("id", userId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "resolve_support_message") {
    const { messageId, status } = body;
    const { error } = await admin.from("support_tickets").update({ status }).eq("id", messageId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "run_marketing_now") {
    const result = await runMarketingCron(admin);
    return Response.json({ ok: true, result });
  }

  if (body.action === "admin_reply_ticket") {
    const { ticketId, message } = body;
    const trimmed = (message || "").trim();
    if (!trimmed) return Response.json({ error: "Write a reply first." }, { status: 400 });
    const { error: msgErr } = await admin
      .from("support_ticket_messages")
      .insert({ ticket_id: ticketId, sender: "admin", message: trimmed });
    if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 });
    await admin.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}

// Deliberately unauthenticated — used by the public homepage to show a real
// trust stat. Returns only two harmless aggregate counts, nothing per-user
// or financial. Kept in this file (rather than a new route) to avoid adding
// another function to the Vercel Hobby plan's serverless function count.
async function handlePublicStats(admin) {
  const [{ count: totalUsers }, { count: totalGenerations }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("generations").select("*", { count: "exact", head: true }),
  ]);
  return Response.json({ totalUsers: totalUsers || 0, totalGenerations: totalGenerations || 0 });
}

function cronAuthorized(req) {
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  return (
    !!process.env.CRON_SECRET &&
    (provided === process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`)
  );
}

export async function GET(req, { params }) {
  const { action } = await params;
  if (action === "public-stats") return handlePublicStats(supabaseAdmin());
  if (action === "cron-marketing") {
    if (!cronAuthorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const result = await runMarketingCron(supabaseAdmin());
    return Response.json({ ok: true, result });
  }
  if (action !== "data") return Response.json({ error: "Not found" }, { status: 404 });
  const authed = await assertAdmin(req);
  if (!authed) return Response.json({ error: "Not authorized." }, { status: 403 });
  return handleData(req, authed.admin);
}

export async function POST(req, { params }) {
  const { action } = await params;
  if (action !== "action") return Response.json({ error: "Not found" }, { status: 404 });
  const authed = await assertAdmin(req);
  if (!authed) return Response.json({ error: "Not authorized." }, { status: 403 });
  return handleAction(req, authed.admin);
}
