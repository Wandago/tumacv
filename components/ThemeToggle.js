"use client";
import { useEffect, useState } from "react";

const ICONS = { light: "☀️", dark: "🌙", auto: "⚙️" };
const NEXT = { light: "dark", dark: "auto", auto: "light" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState("auto");

  useEffect(() => {
    setTheme(localStorage.getItem("tumacv-theme") || "auto");
  }, []);

  function apply(t) {
    setTheme(t);
    localStorage.setItem("tumacv-theme", t);
    const dark = t === "dark" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }

  return (
    <button
      className="theme-toggle"
      onClick={() => apply(NEXT[theme])}
      title={`Theme: ${theme} (tap to change)`}
      aria-label="Toggle theme"
    >
      {ICONS[theme]}
    </button>
  );
}
