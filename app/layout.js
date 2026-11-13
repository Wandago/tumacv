import "./layers.css";
import "./globals.css";
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
        <meta name="theme-color" content="#0b7a3b" />
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
