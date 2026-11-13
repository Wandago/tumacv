/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  turbopack: {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              // Company logos on the jobs page: Himalayas, Remotive, and Google
              // Jobs' logo CDN (JSearch). Anything else falls back to initials.
              "img-src 'self' data: blob: https://cdn-images.himalayas.app https://remotive.com https://encrypted-tbn0.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://sandbox.intasend.com https://payment.intasend.com https://challenges.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
