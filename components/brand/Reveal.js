"use client";
import { useEffect, useRef, useState } from "react";
import { VStack } from "@astryxdesign/core/Stack";

// Fades and lifts its content in the first time it scrolls into view.
// Content is visible by default and only hidden once JS is running (so it
// never stays invisible without it), and the motion is skipped entirely for
// people who prefer reduced motion (app/app.css).
export default function Reveal({ children, delay = 0, gap = 0, ...props }) {
  const ref = useRef(null);
  const [state, setState] = useState("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already on screen: no animation
    setState("waiting");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <VStack
      ref={ref}
      gap={gap}
      className="reveal"
      data-reveal={state}
      style={delay ? { "--reveal-delay": `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </VStack>
  );
}
