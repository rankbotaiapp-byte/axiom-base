import { HERO_BRAND_MAX_BYTES, shopIdFromBrandPath } from "./hero-brand";

const FORM_SLACK = 256 * 1024;

function statusFor(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden" || message === "Showcase shops are read-only") return 403;
  if (message === "Shop not found") return 404;
  return 400;
}

export async function handleHeroBrandGet(request: Request): Promise<Response> {
  const shopId = shopIdFromBrandPath(new URL(request.url).pathname);
  if (!shopId) return new Response("Not found", { status: 404 });
  const { readHeroStill, heroStillResponse } = await import("./hero-brand.server");
  const still = await readHeroStill(shopId);
  if (!still) return new Response("Not found", { status: 404 });
  return heroStillResponse(still.bytes, still.mime);
}

export async function handleHeroBrandPost(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > HERO_BRAND_MAX_BYTES + FORM_SLACK) {
    return Response.json({ error: "Upload a photo or video, 12 MB or smaller" }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const shopId = String(form.get("shopId") ?? "");
    const file = form.get("file");
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }
    if (!(file instanceof File)) {
      return Response.json({ error: "Choose a photo or video" }, { status: 400 });
    }
    if (file.size > HERO_BRAND_MAX_BYTES) {
      return Response.json({ error: "Upload a photo or video, 12 MB or smaller" }, { status: 413 });
    }
    const { userIdFromUpload } = await import("./hero-video.server");
    const { storeHeroBrandAsset } = await import("./hero-brand.server");
    const userId = await userIdFromUpload(request);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await storeHeroBrandAsset(userId, shopId, bytes);
    return Response.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: statusFor(message) });
  }
}

export async function handleHeroAnimate(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      shopId?: unknown;
      effect?: unknown;
      tagline?: unknown;
      heroImageUrl?: unknown;
      heroVideoUrl?: unknown;
    };
    const shopId = typeof body.shopId === "string" ? body.shopId : "";
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) {
      return Response.json({ error: "Shop not found" }, { status: 404 });
    }
    const { userIdFromUpload } = await import("./hero-video.server");
    const { saveHeroAtmosphere } = await import("./hero-brand.server");
    const userId = await userIdFromUpload(request);
    const saved = await saveHeroAtmosphere(userId, { ...body, shopId });
    return Response.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not publish the hero";
    return Response.json({ error: message }, { status: statusFor(message) });
  }
}
