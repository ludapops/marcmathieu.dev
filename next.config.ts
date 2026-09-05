import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    inlineCss: true,
  },
  poweredByHeader: false,
  redirects: async () => [
    { source: "/worlds", destination: "/", permanent: true },
  ],
};

export default nextConfig;
