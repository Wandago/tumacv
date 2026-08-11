import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing — TumaCV",
  description:
    "No subscriptions — pay only for the applications you send. Plans from KES 50, with 5 free applications when you sign up. Pay by M-Pesa, Airtel Money, or card.",
  openGraph: {
    title: "TumaCV Pricing — pay only for the applications you send",
    description: "No subscriptions, no lock-in. Plans from KES 50 with 5 free applications to start.",
    type: "website",
  },
};

export default function Page() {
  return <PricingClient />;
}
