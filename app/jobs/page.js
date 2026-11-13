import JobsClient from "./JobsClient";

export const metadata = {
  title: "Jobs in Kenya and remote — TumaCV",
  description:
    "Live jobs in Kenya and remote roles open to Kenyans, pulled from across the web. Tap one and TumaCV tailors your CV and cover letter to it in about a minute.",
  openGraph: {
    title: "TumaCV Jobs — find it, tailor it, apply",
    description: "Live jobs in Kenya and remote roles open to Kenyans — apply with a CV tailored to each one.",
    type: "website",
  },
};

export default function Page() {
  return <JobsClient />;
}
