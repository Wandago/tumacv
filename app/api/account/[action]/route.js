import { requireUser, addCredits } from "../../../../lib/supabaseAdmin";
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

  const { error: creditErr } = await addCredits(admin, user.id, promo.credits);
  if (creditErr) {
    console.error("redeem-code: redemption recorded but crediting failed:", creditErr);
    return Response.json({ error: "Code accepted, but credits could not be added." }, { status: 500 });
  }
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

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("referred_by, referral_credited, credits")
    .eq("id", user.id)
    .single();
  // Separated from "profile missing" on purpose: if the referral columns
  // don't exist this errors, and reporting that as 404 sent the caller down
  // the "terminal outcome, stop retrying" path and silently dropped the
  // referral. A 500 keeps the stored code so it retries once the DB is fixed.
  if (profileErr) {
    console.error("apply-referral: could not read profile:", profileErr);
    return Response.json({ error: "Could not apply the referral right now." }, { status: 500 });
  }
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });
  if (profile.referred_by || profile.referral_credited) {
    return Response.json({ error: "Referral already applied to this account." }, { status: 409 });
  }

  const { data: referrer } = await admin.from("profiles").select("id").eq("id", referrerId).single();
  if (!referrer) return Response.json({ error: "That referral link isn't valid." }, { status: 404 });

  // Claim first, and claim only. The referred_by guard means exactly one
  // request can win, so the credit grants below happen at most once — but
  // the claim deliberately no longer writes a credits value of its own,
  // because an absolute write computed from an earlier read would clobber
  // any other grant (a payment, a promo code) that landed in between.
  const { data: claimed, error: claimErr } = await admin
    .from("profiles")
    .update({ referred_by: referrerId, referral_credited: true })
    .eq("id", user.id)
    .is("referred_by", null)
    .select("id")
    .single();
  if (claimErr || !claimed) {
    return Response.json({ error: "Referral already applied to this account." }, { status: 409 });
  }

  const { error: inviteeErr } = await addCredits(admin, user.id, REFERRAL_CREDITS);
  const { error: referrerErr } = await addCredits(admin, referrerId, REFERRAL_CREDITS);
  if (inviteeErr || referrerErr) {
    // The claim already succeeded, so this can't be retried into a double
    // credit — surface it loudly instead of reporting a silent success.
    console.error("apply-referral: claim succeeded but crediting failed:", inviteeErr || referrerErr);
    return Response.json({ error: "Referral recorded, but credits could not be added." }, { status: 500 });
  }

  return Response.json({ ok: true, credits: REFERRAL_CREDITS });
}

async function handleReferralStats(user, admin) {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.id)
    .eq("referral_credited", true);
  // This query errors outright if the referral columns are missing (i.e.
  // migration v15 was never run). Swallowing that returned a count of 0,
  // so a broken referral programme was indistinguishable from an unused
  // one — the card just said "no referrals yet" forever.
  if (error) {
    console.error("referral-stats failed:", error);
    return Response.json({ error: "Could not read referral stats." }, { status: 500 });
  }
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
