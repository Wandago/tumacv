// Single source of truth for pricing. Server routes import this — the client
// never decides prices. Change numbers here and both UI and billing follow.
// TEMPORARY: on while IntaSend's KYC review is pending (expected 1-2 days).
// This hides every "buy" button across the app (including Paddle, which was
// rejected) and lets people use TumaCV free in the meantime rather than
// launching to a broken payment screen. Flip to false the moment IntaSend
// approves, alongside setting MPESA_ENABLED = true below.
export const FREE_MODE = false;

// M-Pesa/Airtel Money (via IntaSend) are temporarily hidden from the UI while
// live KYC is still pending — flip this back to true once that's resolved.
// The underlying checkout/webhook code is untouched, so re-enabling is a
// one-line change, not a rebuild.
export const MPESA_ENABLED = true;

// Paddle rejected TumaCV outright — "Resume/CV Builders" falls outside their
// Acceptable Use Policy, a category-level decision, not a pending review.
// Set this true only if a future appeal succeeds or a different MoR is added.
export const PADDLE_ENABLED = false;

// Direct Safaricom Daraja STK Push (separate from IntaSend). Test freely
// against sandbox once you've set DARAJA_* env vars — flip this to true when
// you're ready to show the M-Pesa button built on your own Paybill/Till.
export const DARAJA_ENABLED = false;

// Approximate rate for showing Paddle's USD price in KES terms, since Paddle
// bills in USD but the rest of the app prices in KES. Update periodically —
// this is a display estimate, not what Paddle actually charges (Paddle does
// its own real-time conversion at checkout).
export const KES_PER_USD = 130;
export function toUsd(kes) {
  return (kes / KES_PER_USD).toFixed(2);
}

// Pricing is built around Gemini Flash-Lite at roughly KES 0.20-0.30 per generation
// (see app/api/generate/route.js MODEL_CANDIDATES). At these prices contribution
// margin is roughly 80-90% even before bundle discounts.
export const PLANS = {
  basic: { id: "basic", name: "Basic", priceKes: 50, credits: 25, blurb: "25 applications" },
  plus: { id: "plus", name: "Plus", priceKes: 120, credits: 150, blurb: "150 applications" },
  pro: { id: "pro", name: "Pro", priceKes: 250, credits: 350, blurb: "350 applications" },
};

export const FREE_SIGNUP_CREDITS = 5;

// Referral program: whoever shares their link earns REFERRAL_CREDITS when a
// new signup lands through it, and the new signup gets the same bonus on top
// of their free credits. Kept equal so "invite a friend" is a clean, simple
// pitch — see /api/apply-referral for the crediting logic.
export const REFERRAL_CREDITS = 5;

export function isUnlimited(profile) {
  return (
    profile?.plan === "unlimited" &&
    profile?.plan_expires &&
    new Date(profile.plan_expires) > new Date()
  );
}
