import PricingClient from "./PricingClient";
import { PLANS, FREE_SIGNUP_CREDITS } from "../../lib/plans";

const cheapest = Math.min(...Object.values(PLANS).map((p) => p.priceKes));

export const metadata = {
  title: "Pricing — TumaCV",
  description:
    `No subscriptions — pay only for the applications you send. Plans from KES ${cheapest}, with ${FREE_SIGNUP_CREDITS} free applications when you sign up. Pay by M-Pesa, Airtel Money, or card.`,
  openGraph: {
    title: "TumaCV Pricing — pay only for the applications you send",
    description: `Top up once, nothing renews. Plans from KES ${cheapest} with ${FREE_SIGNUP_CREDITS} free applications to start.`,
    type: "website",
  },
};

export default function Page() {
  return <PricingClient />;
}
