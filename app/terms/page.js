import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Terms of Use — TumaCV" };

const SECTIONS = [
  {
    "heading": "Who can use TumaCV",
    "body": "You must be at least 18 years old, or the age of majority in your country, to create an account. You're responsible for keeping your password secure and for activity on your account."
  },
  {
    "heading": "What TumaCV generates",
    "body": "TumaCV uses AI to draft a tailored CV and cover letter based on your real experience and a job description you provide. It is a drafting tool, not a guarantee of a job or interview. Review every generated document before sending it — check facts, dates, and figures for accuracy. You are responsible for what you submit to an employer, not TumaCV."
  },
  {
    "heading": "Be honest with your input",
    "body": "Don't ask TumaCV to fabricate employers, qualifications, or experience you don't have. Our system prompts are built to avoid inventing details, but the responsibility for accuracy in what you submit to employers is ultimately yours."
  },
  {
    "heading": "Credits and payment",
    "body": "Paid plans give you a number of application credits or a time-limited unlimited pass, shown clearly at purchase. None of the plans expire — a bundle stays on your account until you use it. Payments are processed by our payment partners (currently Paddle for card payments); we don't store your card or mobile money details. If you're charged but a payment error means your credits never arrive, contact us with your payment reference and we'll resolve it — refund or credit, whichever is faster to sort out."
  },
  {
    "heading": "The jobs board",
    "body": "Job listings are posted directly by employers or recruiters using the platform and are not independently verified by TumaCV. Use normal caution: never pay anyone to \"secure\" a job, be wary of postings that ask for money upfront, and verify a company independently before sharing sensitive personal documents. We reserve the right to remove any listing that looks fraudulent or violates these terms."
  },
  {
    "heading": "Acceptable use",
    "body": "Don't use TumaCV to generate content for someone else's identity without their permission, to scrape or resell generated content at scale, or to attempt to disrupt or abuse the service (including automated signups to farm free credits). We may suspend accounts that violate this."
  },
  {
    "heading": "Changes and contact",
    "body": "We may update these terms as the product evolves; the date at the top will reflect the latest version. Questions? Reach us via the support contact listed in your dashboard."
  }
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="Last updated: August 2026. By creating an account, you agree to these terms."
      sections={SECTIONS}
    />
  );
}
