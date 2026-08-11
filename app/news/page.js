import NewsClient from "./NewsClient";

export const metadata = {
  title: "News & Insights — TumaCV",
  description:
    "Careers journalism for the Kenyan job market — hiring trends, interview advice, and industry-specific guidance, updated regularly.",
  openGraph: {
    title: "TumaCV News & Insights",
    description: "Careers journalism for the Kenyan job market.",
    type: "website",
  },
};

export default function Page() {
  return <NewsClient />;
}
