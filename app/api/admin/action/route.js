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

export async function POST(req) {
  const authed = await assertAdmin(req);
  if (!authed) return Response.json({ error: "Not authorized." }, { status: 403 });
  const { admin } = authed;
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
    // Supabase cannot reveal a user's actual password — nobody, including admins,
    // should be able to. This generates a working one-time reset link instead,
    // which support can share directly (WhatsApp, phone call) without depending
    // on the user's email deliverability.
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

  return Response.json({ error: "Unknown action." }, { status: 400 });
}
