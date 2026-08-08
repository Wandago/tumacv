import { requireUser } from "../../../lib/supabaseAdmin";

export const maxDuration = 20;

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

    const { code } = await req.json();
    const normalized = (code || "").trim().toUpperCase();
    if (!normalized) return Response.json({ error: "Enter a code." }, { status: 400 });

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

    const { data: profile } = await admin.from("profiles").select("credits").eq("id", user.id).single();
    await admin.from("profiles").update({ credits: (profile?.credits || 0) + promo.credits }).eq("id", user.id);
    await admin.from("promo_codes").update({ redemptions_count: promo.redemptions_count + 1 }).eq("id", promo.id);

    return Response.json({ ok: true, credits: promo.credits });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
