import { requireUser } from "../../../lib/supabaseAdmin";
import { REFERRAL_CREDITS } from "../../../lib/plans";

export const maxDuration = 20;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

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

    // Claim atomically: only succeeds if referred_by is still unset, so a
    // race between duplicate requests can't double-credit this account.
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
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
