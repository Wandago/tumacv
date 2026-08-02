"use client";
import Nav from "../../components/Nav";

export default function Privacy() {
  return (
    <main className="shell">
      <Nav />
      <section className="hero" style={{ paddingBottom: 6 }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: August 2026. Plain-language version — no legal jargon where we can avoid it.</p>
      </section>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>What we collect</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Your email and password (handled by our authentication provider, Supabase — we never see
          or store your raw password). If you fill in your profile: your industry, experience level,
          and CV/LinkedIn text you paste or upload. Job descriptions you paste in to generate an
          application. Basic usage data like when you generated an application, to show your history
          and streak. If you pay, IntaSend (our payment processor) handles your card or M-Pesa details
          directly — we only ever see that a payment succeeded and its amount, never your card number
          or PIN.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>How your CV data is used</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          When you generate a CV or cover letter, your profile text and the job description are sent
          to Google's Gemini AI to produce the tailored documents. This is processing, not training —
          your personal CV content is not used to train Google's models. Your generated documents and
          profile are stored in our database so your history and saved profile are there next time you
          log in, from any device.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>What we don't do</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          We don't sell your data to anyone. We don't show ads. We don't share your CV or job search
          activity with employers, recruiters, or third parties without your action (for example,
          nothing is shared unless you choose to post a job or apply somewhere yourself). We don't
          scrape or pull data from LinkedIn on your behalf — any LinkedIn content you provide, you
          upload yourself as a PDF you exported.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Local storage on your device</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          We keep a draft copy of your profile text in your browser's local storage so the form
          doesn't lose your work. This stays on your device and isn't a tracking cookie — we don't
          use advertising or cross-site tracking cookies at all.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Your rights</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          You can update or clear your saved profile at any time from your dashboard's "Edit profile"
          page. To delete your account and associated data entirely, contact us at the email below —
          we'll remove your account, profile, and generation history within a reasonable time.
        </p>
      </div>

      <div className="step">
        <h2 style={{ marginBottom: 8 }}>Who to contact</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          Questions about your data or this policy: reach us via the support contact listed in your
          dashboard, or the email associated with this app.
        </p>
      </div>

      <div className="step" style={{ marginBottom: 30 }}>
        <h2 style={{ marginBottom: 8 }}>Changes to this policy</h2>
        <p className="step-hint" style={{ marginBottom: 0 }}>
          If this policy changes in a meaningful way, we'll update the date at the top of this page.
          Continued use of TumaCV after a change means you accept the update.
        </p>
      </div>
    </main>
  );
}
