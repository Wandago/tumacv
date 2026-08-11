import JobsClient from "./JobsClient";

export const metadata = {
  title: "Jobs Board — TumaCV",
  description:
    "Kenyan job listings, free to post and free to browse. Find a role, then generate a CV and cover letter tailored to it in one click.",
  openGraph: {
    title: "TumaCV Jobs Board",
    description: "Free Kenyan job listings — apply with a CV tailored to each one.",
    type: "website",
  },
};

export default function Page() {
  return <JobsClient />;
}
