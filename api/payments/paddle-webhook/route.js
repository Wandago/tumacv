import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";

export const maxDuration = 20;

// Paddle signs webhooks as "ts=<unix>;h1=<hmac>" in the Paddle-Signature
// header, computed over "<ts>:<raw body>" using your webhook secret. Must
// use the RAW request body (not the parsed JSON) or the signature won't match.
function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(signatureHeader.split(";").map((p) => p.split("=")));
  if (!parts.ts || !parts.h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.h1));
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature");

    if (!verifySignature(rawBody, signature, process.env.PADDLE_WEBHOOK_SECRET)) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    const event = JSON.parse(rawBody);
    if (event.event_type !== "transaction.completed") {
      return Response.json({ ok: true }); // ignore everything else
    }

    const customData = event.data?.custom_data || {};
    const userId = customData.userId;
    const planId = customData.planId;
    const transactionId = event.data?.id;

    if (!userId || !planId || !transactionId) {
      return Response.json({ ok: true });
    }

    const plan = PLANS[planId];
    if (!plan) return Response.json({ ok: true });

    const admin = supabaseAdmin();

    // Idempotency: Paddle can retry webhook delivery, so check this exact
    // transaction hasn't already been credited before.
    const { data: existing } = await admin.from("payments").select("id").eq("provider_ref", transactionId).single();
    if (existing) return Response.json({ ok: true });

    const { data: profile } = await admin.from("profiles").select("credits, plan, plan_expires").eq("id", userId).single();
    if (!profile) return Response.json({ ok: true });

    if (plan.unlimitedDays) {
      const from = profile.plan === "unlimited" && profile.plan_expires && new Date(profile.plan_expires) > new Date()
        ? new Date(profile.plan_expires) : new Date();
      const expires = new Date(from.getTime() + plan.unlimitedDays * 24 * 60 * 60 * 1000);
      await admin.from("profiles").update({ plan: "unlimited", plan_expires: expires.toISOString() }).eq("id", userId);
    } else {
      await admin.from("profiles").update({ credits: profile.credits + plan.credits }).eq("id", userId);
    }

    await admin.from("payments").insert({
      user_id: userId,
      plan_id: planId,
      amount: plan.priceKes, // recorded as the KES-equivalent list price for consistent admin reporting; Paddle actually settles in USD
      status: "complete",
      provider_ref: transactionId,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Paddle webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
