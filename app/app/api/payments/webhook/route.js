import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLANS } from "../../../../lib/plans";

export const maxDuration = 20;

// IntaSend POSTs invoice updates here. Configure the webhook in the IntaSend
// dashboard pointing to https://YOUR-DOMAIN/api/payments/webhook and set a
// challenge string; put the same string in the INTASEND_WEBHOOK_CHALLENGE env var.
export async function POST(req) {
  try {
    const body = await req.json();

    // Authenticate the webhook via the shared challenge string.
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

    if (!apiRef) return Response.json({ ok: true }); // nothing to do

    const admin = supabaseAdmin();
    const { data: payment } = await admin.from("payments").select("*").eq("id", apiRef).single();
    if (!payment) return Response.json({ ok: true });

    // Idempotency: only fulfill a payment once.
    if (payment.status === "complete") return Response.json({ ok: true });

    if (state === "FAILED") {
      await admin.from("payments").update({ status: "failed", provider_ref: providerRef }).eq("id", payment.id);
      return Response.json({ ok: true });
    }

    if (state !== "COMPLETE" && state !== "COMPLETED") {
      return Response.json({ ok: true }); // PENDING / PROCESSING — wait for the next event
    }

    const plan = PLANS[payment.plan_id];
    if (!plan) return Response.json({ ok: true });

    // Guard against underpayment (allow small rounding differences).
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

    if (plan.unlimitedDays) {
      // Extend from current expiry if still active, else from now.
      const from =
        profile.plan === "unlimited" && profile.plan_expires && new Date(profile.plan_expires) > new Date()
          ? new Date(profile.plan_expires)
          : new Date();
      const expires = new Date(from.getTime() + plan.unlimitedDays * 24 * 60 * 60 * 1000);
      await admin
        .from("profiles")
        .update({ plan: "unlimited", plan_expires: expires.toISOString() })
        .eq("id", payment.user_id);
    } else {
      await admin
        .from("profiles")
        .update({ credits: profile.credits + plan.credits })
        .eq("id", payment.user_id);
    }

    await admin.from("payments").update({ status: "complete", provider_ref: providerRef }).eq("id", payment.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
