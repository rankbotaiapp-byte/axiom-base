import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: "/demo/auto-repair.mp4",
        destination: "/demo/auto-repair",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/showcase/:dir/:page", destination: "/showcase/:dir/:page/index.html" },
      { source: "/showcase/:dir", destination: "/showcase/:dir/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
