// Single source of truth for pricing. Server routes import this — the client
// never decides prices. Change numbers here and both UI and billing follow.
// FREE_MODE: when true, every signed-in user can generate unlimited applications
// and credits/payments are ignored entirely. Flip to false (and redeploy) to turn
// the paywall back on — nothing else needs to change.
export const FREE_MODE = false;

// Pricing is built around Gemini Flash-Lite at roughly KES 0.20-0.30 per generation
// (see app/api/generate/route.js MODEL_CANDIDATES). At these prices contribution
// margin is roughly 70-85% even before bundle discounts.
export const PLANS = {
  basic: { id: "basic", name: "Basic", priceKes: 50, credits: 50, blurb: "50 applications" },
  plus: { id: "plus", name: "Plus", priceKes: 150, credits: 200, blurb: "200 applications" },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    priceKes: 500,
    credits: 0,
    unlimitedDays: 30,
    blurb: "Unlimited applications for 30 days",
  },
};

export const FREE_SIGNUP_CREDITS = 5;

export function isUnlimited(profile) {
  return (
    profile?.plan === "unlimited" &&
    profile?.plan_expires &&
    new Date(profile.plan_expires) > new Date()
  );
}
