import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
          value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com https://pay.gocardless.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube.com https://player.vimeo.com https://checkout.stripe.com",
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
