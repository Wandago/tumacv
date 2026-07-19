// Single source of truth for pricing. Server routes import this — the client
// never decides prices. Change numbers here and both UI and billing follow.
export const PLANS = {
  payg: { id: "payg", name: "Single", priceKes: 50, credits: 1, blurb: "One tailored application" },
  starter: { id: "starter", name: "Starter", priceKes: 200, credits: 30, blurb: "30 applications" },
  pro: { id: "pro", name: "Pro", priceKes: 500, credits: 100, blurb: "100 applications" },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    priceKes: 1500,
    credits: 0,
    unlimitedDays: 30,
    blurb: "Unlimited applications for 30 days",
  },
};

export const FREE_SIGNUP_CREDITS = 2;

export function isUnlimited(profile) {
  return (
    profile?.plan === "unlimited" &&
    profile?.plan_expires &&
    new Date(profile.plan_expires) > new Date()
  );
}
