import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";

export const maxDuration = 20;

// Note on security: unlike IntaSend/Paddle, Daraja's STK callback isn't
// signed — Safaricom's model relies on the callback URL itself being
// effectively secret (not linked or guessable) plus HTTPS. This is standard
// for Daraja integrations, but worth knowing if you want extra hardening
// later (e.g. checking the source IP against Safaricom's published ranges).
export async function POST(req) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) return Response.json({ ok: true });

    const { CheckoutRequestID, ResultCode } = callback;
    const admin = supabaseAdmin();

    const { data: payment } = await admin.from("payments").select("*").eq("provider_ref", CheckoutRequestID).single();
    if (!payment || payment.status === "complete") return Response.json({ ok: true }); // unknown or already handled

    if (ResultCode !== 0) {
      // User cancelled, entered wrong PIN, insufficient funds, timed out, etc.
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return Response.json({ ok: true });
    }

    const plan = PLANS[payment.plan_id];
    if (!plan) return Response.json({ ok: true });

    const { data: profile } = await admin.from("profiles").select("credits, plan, plan_expires").eq("id", payment.user_id).single();
    if (!profile) return Response.json({ ok: true });

    if (plan.unlimitedDays) {
      const from = profile.plan === "unlimited" && profile.plan_expires && new Date(profile.plan_expires) > new Date()
        ? new Date(profile.plan_expires) : new Date();
      const expires = new Date(from.getTime() + plan.unlimitedDays * 24 * 60 * 60 * 1000);
      await admin.from("profiles").update({ plan: "unlimited", plan_expires: expires.toISOString() }).eq("id", payment.user_id);
    } else {
      await admin.from("profiles").update({ credits: profile.credits + plan.credits }).eq("id", payment.user_id);
    }

    await admin.from("payments").update({ status: "complete" }).eq("id", payment.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Daraja callback error:", err);
    // Always return 200 to Safaricom even on our own error, or they'll retry
    // aggressively — log it and investigate via Vercel logs instead.
    return Response.json({ ok: true });
  }
}
