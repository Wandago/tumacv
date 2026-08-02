import { requireUser } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";

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

  if (body.action === "delete_article") {
    const { error } = await admin.from("articles").delete().eq("id", body.articleId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (body.action === "resolve_payment") {
    // Support tool for the exact failure mode we've hit before: a real payment
    // succeeded at IntaSend but the webhook never fired (or failed), so the
    // user paid and got nothing. This mirrors the webhook's own fulfillment
    // logic exactly, and is idempotent — resolving an already-complete payment
    // does nothing twice.
    const { paymentId, newStatus } = body; // newStatus: "complete" | "failed"
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

  return Response.json({ error: "Unknown action." }, { status: 400 });
}
