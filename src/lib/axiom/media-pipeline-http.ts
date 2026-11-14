import { MEDIA_FILE_MAX_BYTES, parseMediaSlot, clipMediaPurpose, assetIdFromMediaPath } from "./media-slots";

function statusFor(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden" || message === "Showcase shops are read-only") return 403;
  if (message === "Shop not found" || message === "That still was not found") return 404;
  if (message === "AI is not available in this environment") return 503;
  return 400;
}

export async function handleShopMediaGet(request: Request): Promise<Response> {
  const assetId = assetIdFromMediaPath(new URL(request.url).pathname);
  if (!assetId) return new Response("Not found", { status: 404 });
  const { readShopMediaBytes, mediaResponse } = await import("./media-pipeline.server");
  const found = await readShopMediaBytes(assetId);
  if (!found) return new Response("Not found", { status: 404 });
  return mediaResponse(found.bytes, found.mime);
}

export async function handleShopMediaUpload(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MEDIA_FILE_MAX_BYTES + 256 * 1024) {
    return Response.json({ error: "Use a photo 8 MB or smaller" }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const shopId = String(form.get("shopId") ?? "");
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }
    const file = form.get("image");
    if (!(file instanceof File)) return Response.json({ error: "Choose a photo" }, { status: 400 });
    if (file.size > MEDIA_FILE_MAX_BYTES) {
      return Response.json({ error: "Use a photo 8 MB or smaller" }, { status: 413 });
    }
    const { userIdFromUpload } = await import("./hero-video.server");
    const { storeShopMedia } = await import("./media-pipeline.server");
    const userId = await userIdFromUpload(request);
    const saved = await storeShopMedia(userId, shopId, new Uint8Array(await file.arrayBuffer()), {
      slot: parseMediaSlot(form.get("slot"), "gallery"),
      purpose: clipMediaPurpose(form.get("purpose")),
      caption: clipMediaPurpose(form.get("caption")),
      isHero: form.get("isHero") === "1" || form.get("isHero") === "true",
    });
    return Response.json({ ok: true, asset: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "That photo could not be saved";
    return Response.json({ error: message }, { status: statusFor(message) });
  }
}
