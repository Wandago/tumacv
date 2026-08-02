"use client";
import Nav from "../../components/Nav";

export default function Terms() {
  return (
    <main className="shell">
      <Nav />
      <section className="hero" style={{ paddingBottom: 6 }}>
        <h1>Terms of Use</h1>
        <p>Last updated: August 2026. By creating an account, you agree to these terms.</p>
      </section>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Who can use TumaCV</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          You must be at least 18 years old, or the age of majority in your country, to create an
          account. You're responsible for keeping your password secure and for activity on your account.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>What TumaCV generates</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          TumaCV uses AI to draft a tailored CV and cover letter based on your real experience and a
          job description you provide. It is a drafting tool, not a guarantee of a job or interview.
          Review every generated document before sending it — check facts, dates, and figures for
          accuracy. You are responsible for what you submit to an employer, not TumaCV.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Be honest with your input</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Don't ask TumaCV to fabricate employers, qualifications, or experience you don't have. Our
          system prompts are built to avoid inventing details, but the responsibility for accuracy in
          what you submit to employers is ultimately yours.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Credits and payment</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Paid plans give you a number of application credits or a time-limited unlimited pass, shown
          clearly at purchase. Credits don't expire unless stated otherwise (the Unlimited pass runs
          for 30 days). Payments are processed by IntaSend; we don't store your card or mobile money
          details. If you're charged but a payment error means your credits never arrive, contact us
          with your payment reference and we'll resolve it — refund or credit, whichever is faster to sort out.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>The jobs board</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Job listings are posted directly by employers or recruiters using the platform and are not
          independently verified by TumaCV. Use normal caution: never pay anyone to "secure" a job, be
          wary of postings that ask for money upfront, and verify a company independently before
          sharing sensitive personal documents. We reserve the right to remove any listing that looks
          fraudulent or violates these terms.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Acceptable use</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Don't use TumaCV to generate content for someone else's identity without their permission,
          to scrape or resell generated content at scale, or to attempt to disrupt or abuse the
          service (including automated signups to farm free credits). We may suspend accounts that
          violate this.
        </p>
      </div>

      <div className="step" style={{ marginBottom: 30 }}>
        <h2 style={{ marginBottom: 8 }}>Changes and contact</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          We may update these terms as the product evolves; the date at the top will reflect the
          latest version. Questions? Reach us via the support contact listed in your dashboard.
        </p>
      </div>
    </main>
  );
}
