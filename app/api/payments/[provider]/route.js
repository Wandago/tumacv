import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";

export const maxDuration = 20;

// Consolidated under a single dynamic route to stay within Vercel's
// serverless function count — /api/payments/daraja-callback,
// /api/payments/paddle-webhook and /api/payments/webhook are all still
// live at their original URLs (each provider's callback config needs no
// changes), just dispatched from one function based on [provider].

async function creditPlan(admin, { userId, planId, currentPlan, currentPlanExpires, currentCredits }) {
  const plan = PLANS[planId];
  if (!plan) return null;
  if (plan.unlimitedDays) {
    const from =
      currentPlan === "unlimited" && currentPlanExpires && new Date(currentPlanExpires) > new Date()
        ? new Date(currentPlanExpires)
        : new Date();
    const expires = new Date(from.getTime() + plan.unlimitedDays * 24 * 60 * 60 * 1000);
    await admin.from("profiles").update({ plan: "unlimited", plan_expires: expires.toISOString() }).eq("id", userId);
  } else {
    await admin.from("profiles").update({ credits: currentCredits + plan.credits }).eq("id", userId);
  }
  return plan;
}

// Note on security: unlike IntaSend/Paddle, Daraja's STK callback isn't
// signed — Safaricom's model relies on the callback URL itself being
// effectively secret (not linked or guessable) plus HTTPS. This is standard
// for Daraja integrations, but worth knowing if you want extra hardening
// later (e.g. checking the source IP against Safaricom's published ranges).
async function handleDarajaCallback(req) {
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

    const { data: profile } = await admin.from("profiles").select("credits, plan, plan_expires").eq("id", payment.user_id).single();
    if (!profile) return Response.json({ ok: true });

    const plan = await creditPlan(admin, {
      userId: payment.user_id,
      planId: payment.plan_id,
      currentPlan: profile.plan,
      currentPlanExpires: profile.plan_expires,
      currentCredits: profile.credits,
    });
    if (!plan) return Response.json({ ok: true });

    await admin.from("payments").update({ status: "complete" }).eq("id", payment.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Daraja callback error:", err);
    // Always return 200 to Safaricom even on our own error, or they'll retry
    // aggressively — log it and investigate via Vercel logs instead.
    return Response.json({ ok: true });
  }
}

// Paddle signs webhooks as "ts=<unix>;h1=<hmac>" in the Paddle-Signature
// header, computed over "<ts>:<raw body>" using your webhook secret. Must
// use the RAW request body (not the parsed JSON) or the signature won't match.
function verifyPaddleSignature(rawBody, signatureHeader, secret) {
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

async function handlePaddleWebhook(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature");

    if (!verifyPaddleSignature(rawBody, signature, process.env.PADDLE_WEBHOOK_SECRET)) {
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

    await creditPlan(admin, {
      userId,
      planId,
      currentPlan: profile.plan,
      currentPlanExpires: profile.plan_expires,
      currentCredits: profile.credits,
    });

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

async function handleIntasendWebhook(req) {
  try {
    const body = await req.json();

    if (
      !process.env.INTASEND_WEBHOOK_CHALLENGE ||
      body.challenge !== process.env.INTASEND_WEBHOOK_CHALLENGE
    ) {
      return Response.json({ error: "Invalid challenge" }, { status: 403 });
    }

    const state = body.state || body.invoice?.state;
    const apiRef = body.api_ref || body.invoice?.api_ref;
    const paidValue = Number(body.value ?? body.net_amount ?? body.invoice?.value ?? 0);
    const providerRef = body.invoice_id || body.invoice?.invoice_id || null;

    if (!apiRef) return Response.json({ ok: true });

    const admin = supabaseAdmin();
    const { data: payment } = await admin.from("payments").select("*").eq("id", apiRef).single();
    if (!payment) return Response.json({ ok: true });

    if (payment.status === "complete") return Response.json({ ok: true });

    if (state === "FAILED") {
      await admin.from("payments").update({ status: "failed", provider_ref: providerRef }).eq("id", payment.id);
      return Response.json({ ok: true });
    }

    if (state !== "COMPLETE" && state !== "COMPLETED") {
      return Response.json({ ok: true });
    }

    const plan = PLANS[payment.plan_id];
    if (!plan) return Response.json({ ok: true });

    if (paidValue && paidValue < payment.amount - 1) {
      await admin.from("payments").update({ status: "underpaid", provider_ref: providerRef }).eq("id", payment.id);
      return Response.json({ ok: true });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("credits, plan, plan_expires")
      .eq("id", payment.user_id)
      .single();
    if (!profile) return Response.json({ ok: true });

    await creditPlan(admin, {
      userId: payment.user_id,
      planId: payment.plan_id,
      currentPlan: profile.plan,
      currentPlanExpires: profile.plan_expires,
      currentCredits: profile.credits,
    });

    await admin.from("payments").update({ status: "complete", provider_ref: providerRef }).eq("id", payment.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { provider } = await params;
  if (provider === "daraja-callback") return handleDarajaCallback(req);
  if (provider === "paddle-webhook") return handlePaddleWebhook(req);
  if (provider === "webhook") return handleIntasendWebhook(req);
  return Response.json({ error: "Not found" }, { status: 404 });
}
