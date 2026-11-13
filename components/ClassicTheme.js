"use client";
import { Theme } from "@astryxdesign/core/theme";
import { tumacvClassicTheme } from "../theme/tumacv-classic.js";
import { useThemeMode } from "./AppProviders";

// The dashboard and admin panel keep TumaCV's original green look while the
// rest of the site uses Kijani Pop. Astryx themes are scoped, so this nested
// theme wins inside it and nowhere else.
export default function ClassicTheme({ children }) {
  const { mode } = useThemeMode();
  return (
    <Theme theme={tumacvClassicTheme} mode={mode}>
      {children}
    </Theme>
  );
}
