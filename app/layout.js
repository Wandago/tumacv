import "./layers.css";
import "./globals.css";
// Sunset Pop typefaces (theme/tumacv.ts), self-hosted. Each stylesheet lists
// several subsets with unicode-range, so browsers download only latin:
// Bricolage Grotesque (headlines, 41 KB), Plus Jakarta Sans (body, 27 KB),
// Instrument Serif italic (accent words, 22 KB).
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "@fontsource/instrument-serif/400-italic.css";
import ReferralCapture from "../components/ReferralCapture";
import AppProviders from "../components/AppProviders";
import AppFrame from "../components/AppFrame";

export const metadata = {
  title: "TumaCV — Tailored CV + cover letter in minutes",
  description:
    "Paste a job description, get a CV and cover letter tailored to it. Built for Kenyan job seekers. Pay per application via M-Pesa.",
};

// Applies the saved light/dark choice before React loads, so the page never
// flashes the wrong scheme. Values match components/AppProviders.js.
const themeInit = `
(function() {
  try {
    var saved = localStorage.getItem('tumacv-theme');
    var theme = saved || 'auto';
    var dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    // themeInit deliberately sets data-theme on <html> before React hydrates,
    // so server markup and client tree never match on that attribute. React 19
    // treats that as an error rather than a warning, so opt this one element
    // out — the mismatch is intended, and is what stops the page flashing the
    // wrong theme on load.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#FCF8F4" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ReferralCapture />
        <AppProviders>
          <AppFrame>{children}</AppFrame>
        </AppProviders>
      </body>
    </html>
  );
}
