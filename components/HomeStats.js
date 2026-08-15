"use client";
import { motion } from "motion/react";
import CountUp from "./CountUp";

// Rendered inside the hero's browser-chrome mockup (always on the dark
// --onyx frame), so this is intentionally theme-invariant rather than
// following light/dark mode like the rest of the page.
export default function HomeStats({ stats }) {
  if (!stats || !stats.totalGenerations) return null;

  const items = [
    { value: stats.totalUsers, suffix: "+", label: "Kenyan job seekers" },
    { value: stats.totalGenerations, suffix: "+", label: "tailored applications" },
    { value: 5, suffix: "", label: "CV styles" },
    { value: 5, suffix: " min", label: "avg. time to done" },
  ];

  return (
    <motion.div
      className="mockup-stats"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {items.map((it) => (
        <div key={it.label} className="mockup-stat">
          <div className="mockup-stat-number"><CountUp value={it.value} suffix={it.suffix} /></div>
          <div className="mockup-stat-label">{it.label}</div>
        </div>
      ))}
    </motion.div>
  );
}
