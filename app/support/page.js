import SupportClient from "./SupportClient";

export const metadata = {
  title: "Help & Feedback — TumaCV",
  description:
    "Hit a bug, have an idea, or need help with your account? Reach the TumaCV team directly — we read every message.",
  openGraph: {
    title: "TumaCV Help & Feedback",
    description: "Reach the TumaCV team directly.",
    type: "website",
  },
};

export default function Page() {
  return <SupportClient />;
}
