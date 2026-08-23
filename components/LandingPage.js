"use client";

import Link from "next/link";
import { motion } from "motion/react";
import CvView from "./CvView";
import CountUp from "./CountUp";
import { SAMPLE_CV } from "../lib/sampleCv";
import { FREE_MODE, FREE_SIGNUP_CREDITS } from "../lib/plans";
import { setPendingJob } from "../lib/storage";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);
const Spark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></svg>
);
function StartLink({ children, className = "landing-button landing-button-dark" }) {
  return <Link href="/login?mode=signup" className={className}>{children} <Arrow /></Link>;
}

export default function LandingPage({ publicStats }) {
  function startWithJob(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("job")?.trim();
    if (!value) return;
    if (/^https?:\/\//i.test(value)) setPendingJob({ url: value });
    else setPendingJob({ text: value });
    window.location.href = "/login?mode=signup";
  }

  return (
    <div className="landing-premium">
      <section className="landing-hero">
        <div className="landing-orb landing-orb-one" /><div className="landing-orb landing-orb-two" /><div className="landing-gridlines" />
        <motion.div className="landing-hero-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
          <span className="landing-kicker"><i /> Built for the job search you are actually in</span>
          <h1>Your experience is real.<br /><em>Your CV should feel like it.</em></h1>
          <p>Turn your existing CV into an application shaped for the role in front of you. TumaCV highlights the work you have done—clearly, honestly, and without the generic fluff.</p>
          <form className="landing-job-form" onSubmit={startWithJob}>
            <label className="sr-only" htmlFor="landing-job">Job link or description</label>
            <input id="landing-job" name="job" placeholder="Paste a job link or description" />
            <button type="submit">Start tailoring <Arrow /></button>
          </form>
          <span className="landing-form-note">{FREE_MODE ? "Free during beta. No card, no awkward commitment." : `${FREE_SIGNUP_CREDITS} free applications when you sign up. No card needed.`}</span>
          <div className="landing-proof"><span><b>01</b> Paste the role</span><span><b>02</b> Add your story</span><span><b>03</b> Apply with intent</span></div>
        </motion.div>
        <motion.div className="landing-product-stage" initial={{ opacity: 0, scale: 0.94, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
          <motion.div className="landing-float-card landing-float-score" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}><span>Role fit</span><strong>92<small>%</small></strong><div><i /><i /><i /><i /></div></motion.div>
          <motion.div className="landing-float-card landing-float-note" animate={{ y: [0, 9, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}><span className="landing-mini-avatar">M</span><p>“Finally, this sounds like <b>me</b>.”</p></motion.div>
          <div className="landing-browser">
            <div className="landing-browser-top"><span /><span /><span /><b>tumacv.co.ke / tailored</b></div>
            <div className="landing-browser-content"><aside><span className="landing-side-logo">T</span><i /><i /><i /><i /></aside><div className="landing-document"><div className="landing-document-tag">Tailored for this role</div><div className="landing-document-paper"><CvView data={SAMPLE_CV} template="modern" /></div></div></div>
          </div>
        </motion.div>
      </section>

      <section className="landing-trust">
        <p>Designed around real applications, not generic templates.</p>
        <div className="landing-trust-stats">
          <div><strong>{publicStats?.totalGenerations > 0 ? <CountUp value={publicStats.totalGenerations} suffix="+" /> : "One role"}</strong><span>{publicStats?.totalGenerations > 0 ? "applications tailored" : "at a time"}</span></div>
          <div><strong>5</strong><span>considered CV styles</span></div><div><strong>100%</strong><span>your real experience</span></div><div><strong>PDF + DOCX</strong><span>ready to send your way</span></div>
        </div>
      </section>

      <section className="landing-intro"><span className="landing-kicker landing-kicker-dark"><i /> A better way to show up</span><h2>Less “I hope this works.”<br />More <em>“this is the one.”</em></h2><p>A strong application is not about sounding bigger than you are. It is about making the right parts of your experience easy for the right employer to see.</p></section>

      <section className="landing-steps">
        <article className="landing-step landing-step-green"><span>01 / The signal</span><h3>Start with the job, not a blank page.</h3><p>Drop in a job post from any careers site, or paste the description. We find the skills, responsibilities, and language that matter.</p><div className="landing-signal-ui"><small>Customer Success Associate</small><b>Relationship building</b><b>CRM workflows</b><b>Client retention</b></div></article>
        <article className="landing-step landing-step-ink"><span>02 / Your story</span><h3>Your work stays yours.</h3><p>Upload a CV, a LinkedIn PDF, or simply write it out. TumaCV uses what you give it, never inventing experience to make a match look better.</p><div className="landing-story-ui"><div><i /> Service, empathy, results</div><div><i /> Sales Assistant · 2023—now</div><div><i /> Helped 100+ customers daily</div></div></article>
        <article className="landing-step landing-step-paper"><span>03 / Your application</span><h3>Send something that sounds considered.</h3><p>Get a tailored CV, a matching cover letter, and a clear view of what the role asks for that you may need to address.</p><div className="landing-ready-ui"><b>92% <small>match</small></b><span>Ready to review</span><i>✓</i></div></article>
      </section>

      <section className="landing-compare"><div><span className="landing-kicker landing-kicker-dark"><i /> Built with restraint</span><h2>Sharper applications.<br /><em>Still entirely you.</em></h2><p>TumaCV is an editor in your corner, not a machine that makes things up. You are always in control of the final word.</p><StartLink>Make your next CV count</StartLink></div><div className="landing-compare-stack"><motion.div className="landing-compare-card landing-compare-back" whileInView={{ rotate: -5, y: 0 }} initial={{ rotate: -1, y: 24 }} viewport={{ once: true }}><span>Before</span><p>One CV sent to every role.</p></motion.div><motion.div className="landing-compare-card landing-compare-front" whileInView={{ rotate: 3, y: 0 }} initial={{ rotate: 8, y: 42 }} viewport={{ once: true }} transition={{ delay: 0.15 }}><span>With TumaCV</span><p>One clear story, shaped for this opportunity.</p><div><b>✓</b> Keywords that fit the role</div><div><b>✓</b> A cover letter to match</div></motion.div></div></section>

      <section className="landing-cv-showcase"><div className="landing-cv-heading"><span className="landing-kicker landing-kicker-light"><i /> Not just a preview</span><h2>A CV you will be proud to open.</h2><p>This is a live TumaCV template, not a glossy placeholder. Choose the style that fits the role, then make every detail your own.</p></div><div className="landing-cv-frame"><div className="landing-document-paper"><CvView data={SAMPLE_CV} template="modern" /></div></div></section>

      <section className="landing-final"><div className="landing-final-mark">T</div><span className="landing-kicker landing-kicker-dark"><i /> Your next move</span><h2>You have done the work.<br /><em>Let it be seen.</em></h2><p>Bring the role. Bring your real experience. We will help you make the connection.</p><div className="landing-final-actions"><StartLink>Tailor my CV free</StartLink><Link href="/login" className="landing-text-link">I already have an account →</Link></div></section>
    </div>
  );
}
