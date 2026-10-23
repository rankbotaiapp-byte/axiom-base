import { HERO_VIDEO_MAX_BYTES, shopIdFromHeroPath } from "./hero-video.ts";

export async function handleHeroVideoRequest(request: Request): Promise<Response> {
  const shopId = shopIdFromHeroPath(new URL(request.url).pathname);
  const method = request.method.toUpperCase();
  if (!shopId) {
    return method === "GET"
      ? new Response("Not found", { status: 404 })
      : Response.json({ error: "Shop not found" }, { status: 404 });
  }
  if (method === "GET") {
    const { readHeroVideo, heroVideoResponse } = await import("./hero-video.server");
    const bytes = await readHeroVideo(shopId);
    if (!bytes) return new Response("Not found", { status: 404 });
    return heroVideoResponse(bytes, request);
  }
  if (method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > HERO_VIDEO_MAX_BYTES) {
    return Response.json({ error: "Video must be 12 MB or smaller" }, { status: 413 });
  }
  try {
    const { storeHeroVideo, userIdFromUpload } = await import("./hero-video.server");
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
}
