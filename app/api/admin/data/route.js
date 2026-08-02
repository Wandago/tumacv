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
      .select("id, email, credits, plan, plan_expires, industry, experience_level, streak_count, hired, is_admin, created_at")
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

  return Response.json({ error: "Unknown type." }, { status: 400 });
}
