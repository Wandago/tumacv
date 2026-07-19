import { requireUser } from "../../../lib/supabaseAdmin";
import { PLANS } from "../../../lib/plans";

export const maxDuration = 20;

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

    const { planId } = await req.json();
    const plan = PLANS[planId];
    if (!plan) return Response.json({ error: "Unknown plan." }, { status: 400 });

    if (!process.env.INTASEND_PUBLISHABLE_KEY) {
      return Response.json(
        { error: "Payments aren't switched on yet. The owner needs to add IntaSend keys." },
        { status: 500 }
      );
    }

    // Create a pending payment row; its id becomes our reference at IntaSend.
    const { data: payment, error: payErr } = await admin
      .from("payments")
      .insert({ user_id: user.id, plan_id: plan.id, amount: plan.priceKes, status: "pending" })
      .select()
      .single();
    if (payErr) {
      console.error(payErr);
      return Response.json({ error: "Could not start the payment. Try again." }, { status: 500 });
    }

    const base = process.env.INTASEND_BASE_URL || "https://sandbox.intasend.com";
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${base}/api/v1/checkout/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        public_key: process.env.INTASEND_PUBLISHABLE_KEY,
        amount: plan.priceKes,
        currency: "KES",
        email: user.email,
        api_ref: payment.id,
        comment: `TumaCV ${plan.name}`,
        redirect_url: `${site}/dashboard?paid=1`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("IntaSend checkout error:", detail);
      return Response.json({ error: "Payment provider error. Try again shortly." }, { status: 502 });
    }

    const data = await res.json();
    if (!data.url) {
      console.error("IntaSend response missing url:", data);
      return Response.json({ error: "Payment provider error. Try again shortly." }, { status: 502 });
    }

    return Response.json({ url: data.url });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong starting the payment." }, { status: 500 });
  }
}
