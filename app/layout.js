import "./globals.css";

// Guarded: a malformed NEXT_PUBLIC_SITE_URL (missing https://, stray space,
// etc.) would otherwise throw here and fail the ENTIRE build, since this
// module loads for every single page via the root layout.
function safeMetadataBase() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tumacv.vercel.app");
  } catch {
    console.error("NEXT_PUBLIC_SITE_URL is malformed — falling back to the default domain.");
    return new URL("https://tumacv.vercel.app");
  }
}

export const metadata = {
  metadataBase: safeMetadataBase(),
  title: "TumaCV — Tailored CV + cover letter in minutes",
  description:
    "Paste a job description, get a CV and cover letter tailored to it. Built for Kenyan job seekers. Pay per application via M-Pesa.",
};

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
