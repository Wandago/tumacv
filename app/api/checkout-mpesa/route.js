import { requireUser } from "../../../lib/supabaseAdmin";
import { PLANS } from "../../../lib/plans";
import { initiateStkPush, normalizeKenyanPhone } from "../../../lib/daraja";

export const maxDuration = 20;

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

    const { planId, phone } = await req.json();
    const plan = PLANS[planId];
    if (!plan) return Response.json({ error: "Unknown plan." }, { status: 400 });

    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      return Response.json({ error: "Enter a valid Safaricom number, e.g. 07XX XXX XXX." }, { status: 400 });
    }

    if (!process.env.DARAJA_SHORTCODE) {
      return Response.json({ error: "M-Pesa isn't set up yet." }, { status: 500 });
    }

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .insert({ user_id: user.id, plan_id: plan.id, amount: plan.priceKes, status: "pending" })
      .select()
      .single();
    if (payErr) return Response.json({ error: "Could not start the payment. Try again." }, { status: 500 });

    try {
      const stk = await initiateStkPush({
        phone: normalized,
        amountKes: plan.priceKes,
        accountRef: payment.id.slice(0, 12),
        description: `TumaCV ${plan.name}`,
      });
      // Store the CheckoutRequestID so the callback can match this exact push
      // back to this exact payment row.
      await admin.from("payments").update({ provider_ref: stk.CheckoutRequestID }).eq("id", payment.id);
      return Response.json({ ok: true, message: "Check your phone and enter your M-Pesa PIN." });
    } catch (e) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return Response.json({ error: e.message || "Could not send the M-Pesa prompt." }, { status: 502 });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong starting the payment." }, { status: 500 });
  }
}
