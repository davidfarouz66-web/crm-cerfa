import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
