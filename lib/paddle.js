import { initializePaddle } from "@paddle/paddle-js";

let paddleInstance;

// Maps our internal plan ids to Paddle Price ids, which only exist once you
// create matching products/prices in the Paddle dashboard (Catalog → Prices).
// Set these as env vars once you've done that — there's no way to invent
// working price ids ahead of time.
const PRICE_MAP = {
  basic: process.env.NEXT_PUBLIC_PADDLE_PRICE_BASIC,
  plus: process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS,
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
};

async function getPaddle() {
  if (!paddleInstance) {
    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      throw new Error("Card payments aren't set up yet.");
    }
    paddleInstance = await initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox", // "sandbox" | "production"
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    });
  }
  return paddleInstance;
}

export function paddlePriceIdFor(planId) {
  return PRICE_MAP[planId] || null;
}

// Opens Paddle's hosted checkout overlay. Crediting the account happens
// server-side via the webhook once payment actually completes — this is
// just the UI trigger, not the source of truth for whether payment succeeded.
export async function openPaddleCheckout({ planId, userId, email }) {
  const priceId = paddlePriceIdFor(planId);
  if (!priceId) throw new Error("Card payment isn't available for this plan yet.");
  const paddle = await getPaddle();
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: email ? { email } : undefined,
    customData: { userId, planId },
  });
}
