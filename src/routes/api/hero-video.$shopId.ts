import { createFileRoute } from "@tanstack/react-router";
import { HERO_VIDEO_MAX_BYTES, shopIdFromHeroPath } from "@/lib/axiom/hero-video";

async function shopIdOf(request: Request): Promise<string | null> {
  return shopIdFromHeroPath(new URL(request.url).pathname);
}

export const Route = createFileRoute("/api/hero-video/$shopId")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const shopId = await shopIdOf(request);
        if (!shopId) return new Response("Not found", { status: 404 });
        const { readHeroVideo, heroVideoResponse } = await import("@/lib/axiom/hero-video.server");
        const bytes = await readHeroVideo(shopId);
        if (!bytes) return new Response("Not found", { status: 404 });
        return heroVideoResponse(bytes, request);
      },
      POST: async ({ request }) => {
        const shopId = await shopIdOf(request);
        if (!shopId) return Response.json({ error: "Shop not found" }, { status: 404 });
        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > HERO_VIDEO_MAX_BYTES) {
          return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
        }
        try {
          const { storeHeroVideo, userIdFromUpload } = await import("@/lib/axiom/hero-video.server");
          const userId = await userIdFromUpload(request);
          const bytes = new Uint8Array(await request.arrayBuffer());
          if (bytes.byteLength > HERO_VIDEO_MAX_BYTES) {
            return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
          }
          const heroVideoUrl = await storeHeroVideo(userId, shopId, bytes);
          return Response.json({ heroVideoUrl });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
          return Response.json({ error: message }, { status: message === "Forbidden" ? 403 : status });
        }
      },
    },
  },
});
