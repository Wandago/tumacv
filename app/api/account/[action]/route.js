import { requireUser } from "../../../../lib/supabaseAdmin";
import { REFERRAL_CREDITS } from "../../../../lib/plans";

export const maxDuration = 20;

// Consolidated under one dynamic route (same pattern as /api/admin/[action])
// to stay within Vercel's serverless function count — /api/account/redeem-code,
// /api/account/apply-referral and /api/account/referral-stats are all served
// from this one function, dispatched on [action].

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handleRedeemCode(req, user, admin) {
  const { code } = await req.json();
  const normalized = (code || "").trim().toUpperCase();
  if (!normalized) return Response.json({ error: "Enter a code." }, { status: 400 });

  const { data: profile } = await admin.from("profiles").select("banned, credits").eq("id", user.id).single();
  if (profile?.banned) {
    return Response.json({ error: "This account has been suspended." }, { status: 403 });
  }

  const { data: promo } = await admin.from("promo_codes").select("*").eq("code", normalized).single();
  if (!promo || !promo.active) {
    return Response.json({ error: "That code isn't valid." }, { status: 404 });
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return Response.json({ error: "That code has expired." }, { status: 410 });
  }
  if (promo.max_redemptions !== null && promo.redemptions_count >= promo.max_redemptions) {
    return Response.json({ error: "That code has reached its limit." }, { status: 410 });
  }

  const { data: existing } = await admin
    .from("promo_redemptions")
    .select("id")
    .eq("code_id", promo.id)
    .eq("user_id", user.id)
    .single();
  if (existing) {
    return Response.json({ error: "You've already used this code." }, { status: 409 });
  }

  // Insert the redemption first — the unique (code_id, user_id) constraint
  // means a race (someone double-clicking, or two tabs) can't double-credit.
  const { error: insertErr } = await admin.from("promo_redemptions").insert({ code_id: promo.id, user_id: user.id });
  if (insertErr) {
    return Response.json({ error: "You've already used this code." }, { status: 409 });
  }

  await admin.from("profiles").update({ credits: (profile?.credits || 0) + promo.credits }).eq("id", user.id);
  await admin.from("promo_codes").update({ redemptions_count: promo.redemptions_count + 1 }).eq("id", promo.id);

  return Response.json({ ok: true, credits: promo.credits });
}

async function handleApplyReferral(req, user, admin) {
  const { code } = await req.json();
  const referrerId = (code || "").trim();
  if (!UUID_RE.test(referrerId)) {
    return Response.json({ error: "Invalid referral code." }, { status: 400 });
  }
  if (referrerId === user.id) {
    return Response.json({ error: "You can't refer yourself." }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by, referral_credited, credits")
    .eq("id", user.id)
    .single();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });
  if (profile.referred_by || profile.referral_credited) {
    return Response.json({ error: "Referral already applied to this account." }, { status: 409 });
  }

  const { data: referrer } = await admin.from("profiles").select("id, credits").eq("id", referrerId).single();
  if (!referrer) return Response.json({ error: "That referral link isn't valid." }, { status: 404 });

  // Claim atomically: only succeeds if referred_by is still unset, so a race
  // between duplicate requests can't double-credit this account.
  const { data: claimed, error: claimErr } = await admin
    .from("profiles")
    .update({ referred_by: referrerId, referral_credited: true, credits: profile.credits + REFERRAL_CREDITS })
    .eq("id", user.id)
    .is("referred_by", null)
    .select("id")
    .single();
  if (claimErr || !claimed) {
    return Response.json({ error: "Referral already applied to this account." }, { status: 409 });
  }

  await admin.from("profiles").update({ credits: referrer.credits + REFERRAL_CREDITS }).eq("id", referrerId);

  return Response.json({ ok: true, credits: REFERRAL_CREDITS });
}

async function handleReferralStats(user, admin) {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.id)
    .eq("referral_credited", true);
  return Response.json({ count: count || 0 });
}

export async function GET(req, { params }) {
  const { action } = await params;
  const authed = await requireUser(req);
  if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (action === "referral-stats") return handleReferralStats(authed.user, authed.admin);
  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req, { params }) {
  const { action } = await params;
  const authed = await requireUser(req);
  if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (action === "redeem-code") return handleRedeemCode(req, authed.user, authed.admin);
  if (action === "apply-referral") return handleApplyReferral(req, authed.user, authed.admin);
  return Response.json({ error: "Not found" }, { status: 404 });
}
