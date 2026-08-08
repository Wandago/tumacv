import { requireUser } from "../../../../lib/supabaseAdmin";

export const maxDuration = 20;

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

export async function GET(req) {
  const authed = await assertAdmin(req);
  if (!authed) return Response.json({ error: "Not authorized." }, { status: 403 });
  const { admin } = authed;
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
    const [{ count: totalUsers }, { count: signupsWeek }, { count: totalGenerations }, { count: hiredCount }, { count: activeStreaks }] =
      await Promise.all([
        admin.from("profiles").select("*", { count: "exact", head: true }),
        admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        admin.from("generations").select("*", { count: "exact", head: true }),
        admin.from("profiles").select("*", { count: "exact", head: true }).eq("hired", true),
        admin.from("profiles").select("*", { count: "exact", head: true }).gte("streak_count", 3),
      ]);
    const { data: completedPayments } = await admin.from("payments").select("amount").eq("status", "complete").limit(5000);
    const totalRevenue = (completedPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return Response.json({ stats: { totalUsers, signupsWeek, totalGenerations, hiredCount, activeStreaks, totalRevenue } });
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
    const stats = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count }));
    return Response.json({ stats, totalViews: (data || []).length });
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
