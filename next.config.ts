import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/demo/auto-repair.mp4",
        destination: "/demo/auto-repair",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
