"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import NextLink from "next/link";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { tumacvTheme } from "../theme/tumacv.js";

// The saved preference uses the app's existing localStorage values
// ("auto" | "light" | "dark") so nobody's choice resets with the redesign.
const STORAGE_KEY = "tumacv-theme";
const toMode = (saved) => (saved === "light" || saved === "dark" ? saved : "system");

const ThemeModeContext = createContext({ mode: "system", setMode: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);

export default function AppProviders({ children }) {
  const [mode, setModeState] = useState("system");

  useEffect(() => {
    try {
      setModeState(toMode(localStorage.getItem(STORAGE_KEY)));
    } catch {}
  }, []);

  const setMode = useCallback((next) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next === "system" ? "auto" : next);
    } catch {}
  }, []);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
      <Theme theme={tumacvTheme} mode={mode}>
        <LinkProvider component={NextLink}>{children}</LinkProvider>
      </Theme>
    </ThemeModeContext.Provider>
  );
}
