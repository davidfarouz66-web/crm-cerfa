import type { NextConfig } from "next";

const scriptSources = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com https://pay.gocardless.com; ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube.com https://player.vimeo.com https://checkout.stripe.com`,
        },
      ],
    }];
  },
  async redirects() {
    return [
      {
        source: "/gala",
        destination: "/campagnes",
        permanent: true,
      },
      {
        source: "/gala/:path*",
        destination: "/campagnes/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
