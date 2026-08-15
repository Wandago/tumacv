"use client";
import { motion, useReducedMotion } from "motion/react";

// Next.js re-mounts template.js on every navigation (unlike layout.js), so
// this gives every route a consistent soft entrance without touching each
// page individually. No exit animation — Next.js App Router doesn't support
// awaiting one before swapping routes, so an enter-only transition is the
// honest choice here rather than a half-implemented exit that never plays.
export default function Template({ children }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return children;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
