import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "@tanstack/react-start": path.resolve("./src/lib/tanstack-start-shim.ts"),
      "@tanstack/react-start/server": path.resolve("./src/lib/tanstack-start-server-shim.ts"),
    },
  },
  webpack: (config) => {
    const start = path.resolve("./node_modules/@tanstack/react-start/index.js");
    const startServer = path.resolve("./node_modules/@tanstack/react-start/server/index.js");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@tanstack/react-start/server$": startServer,
      "@tanstack/react-start/server": startServer,
      "@tanstack/react-start$": start,
      "@tanstack/react-start": start,
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
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
