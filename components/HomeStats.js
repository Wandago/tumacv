"use client";
import { motion } from "motion/react";
import CountUp from "./CountUp";

export default function HomeStats({ stats }) {
  if (!stats || !stats.totalGenerations) return null;

  const items = [
    { value: stats.totalUsers, suffix: "+", label: "Kenyan job seekers" },
    { value: stats.totalGenerations, suffix: "+", label: "tailored applications made" },
    { value: 5, suffix: "", label: "CV styles to choose from" },
  ];

  return (
    <div className="stat-row">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          className="stat-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="stat-number"><CountUp value={it.value} suffix={it.suffix} /></div>
          <div className="stat-label">{it.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
