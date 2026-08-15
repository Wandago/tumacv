"use client";
import { motion, useReducedMotion } from "framer-motion";
import CvView from "./CvView";
import { SAMPLE_CV } from "../lib/sampleCv";

// Real rendered output, not stock-photo mockups — the same CvView component
// every generated CV goes through, just fanned out and scaled down.
const CARDS = [
  { template: "classic", rotate: -9, x: -66, y: 14, z: 1 },
  { template: "modern", rotate: 0, x: 0, y: -10, z: 3 },
  { template: "minimal", rotate: 9, x: 66, y: 14, z: 2 },
];

export default function TemplateFan() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="template-fan">
      {CARDS.map((c, i) => (
        <motion.div
          key={c.template}
          className="template-fan-card"
          style={{ zIndex: c.z }}
          initial={reduceMotion ? false : { opacity: 0, y: 36, rotate: 0, scale: 0.92 }}
          animate={{ opacity: 1, x: c.x, y: c.y, rotate: c.rotate, scale: 1 }}
          transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          whileHover={reduceMotion ? undefined : { y: c.y - 10, rotate: c.rotate * 0.4, scale: 1.04, zIndex: 5 }}
        >
          <div className="template-fan-inner">
            <CvView data={SAMPLE_CV} template={c.template} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
