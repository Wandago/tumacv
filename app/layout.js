import "./globals.css";

export const metadata = {
  title: "TumaCV — Tailored CV + cover letter in minutes",
  description:
    "Paste a job description, get a CV and cover letter tailored to it. Built for Kenyan job seekers. Pay per application via M-Pesa.",
};

// Runs before paint to avoid a flash of the wrong theme. Reads a saved
// preference; falls back to the OS setting if the person hasn't chosen one.
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
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0b7a3b" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <footer style={{
          textAlign: "center", padding: "20px 18px 30px", fontSize: 11.5,
          color: "var(--soil)", fontFamily: "var(--mono)",
        }}>
          <a href="/privacy" style={{ color: "inherit", marginRight: 14 }}>Privacy</a>
          <a href="/terms" style={{ color: "inherit" }}>Terms</a>
        </footer>
      </body>
    </html>
  );
}
