export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tumacv.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboarding", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
