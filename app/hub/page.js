import HubClient from "./HubClient";

export const metadata = {
  title: "Talent Hub — TumaCV",
  description:
    "Browse Kenyan job seekers open to work — name, role, industry, and top skills. Opt in from your TumaCV dashboard to be discovered.",
  openGraph: {
    title: "TumaCV Talent Hub",
    description: "Kenyan job seekers open to work, opted in to be discovered.",
    type: "website",
  },
};

export default function Page() {
  return <HubClient />;
}
