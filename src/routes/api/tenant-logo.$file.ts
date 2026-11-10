import { createFileRoute } from "@tanstack/react-router";
import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_LOGO_DIR } from "@/lib/axiom-landing/tenants/store";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export const Route = createFileRoute("/api/tenant-logo/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const m = /^[a-z0-9-]+\.(png|jpg|webp|svg)$/.exec(params.file);
        if (!m) return new Response("Not found", { status: 404 });
        try {
          const bytes = await fs.readFile(path.join(LOCAL_LOGO_DIR, params.file));
          return new Response(new Uint8Array(bytes), {
            headers: {
              "Content-Type": TYPES[m[1]!] ?? "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Security-Policy": "script-src 'none'",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
