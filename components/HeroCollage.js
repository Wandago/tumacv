"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
);

// Rotates through a few realistic outcomes so the collage reads as "this is
// what the product actually does" rather than one static, made-up mockup.
const SCENARIOS = [
  { score: 92, role: "Digital Marketer", skill: "SEO", ready: "58s" },
  { score: 87, role: "Product Manager", skill: "Roadmaps", ready: "51s" },
  { score: 95, role: "Sales Lead", skill: "B2B", ready: "63s" },
  { score: 89, role: "Software Engineer", skill: "React", ready: "47s" },
];

export default function HeroCollage() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SCENARIOS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const s = SCENARIOS[i];

  return (
    <div className="hero-collage">
      <div className="floater floater-1">
        <div className="floater-label">MATCH SCORE</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={s.score}
            className="floater-big"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {s.score}%
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="floater floater-2">
        <div className="floater-row"><IconTarget /><span>Tailored to this job</span></div>
        <AnimatePresence mode="wait">
          <motion.div
            key={s.role}
            className="floater-chips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="chip">{s.skill}</span>
            <span className="chip">{s.role}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="floater floater-3">
        <div className="floater-doc-line big shimmer" />
        <div className="floater-doc-line shimmer" style={{ animationDelay: "0.15s" }} />
        <div className="floater-doc-line shimmer" style={{ animationDelay: "0.3s" }} />
        <div className="floater-doc-line short shimmer" style={{ animationDelay: "0.45s" }} />
      </div>

      <div className="floater floater-4 accent">
        <div className="floater-row"><IconDoc /><span>Cover letter</span></div>
        <div className="floater-doc-line on shimmer" />
        <div className="floater-doc-line on short shimmer" style={{ animationDelay: "0.15s" }} />
      </div>

      <div className="floater floater-5">
        <div className="floater-label">READY IN</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={s.ready}
            className="floater-big small"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            ~{s.ready}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
