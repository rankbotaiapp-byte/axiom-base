import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static showcase exports use trailing-slash folders (…/page/ → …/page/index.html)
  async rewrites() {
    return [
      // runs after real files are matched, so assets are never rewritten
      { source: "/showcase/:dir/:page", destination: "/showcase/:dir/:page/index.html" },
      { source: "/showcase/:dir", destination: "/showcase/:dir/index.html" },
    ];
  },
  async headers() {
    return [
      {
        // Long cache for the hero + proof videos (rename the file when you swap a video)
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
