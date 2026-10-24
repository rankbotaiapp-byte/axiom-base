import { HERO_ANIMATOR_IMAGE_MAX_BYTES, clipHeroTagline } from "./hero-animator";

function statusFor(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden" || message === "Showcase shops are read-only") return 403;
  if (message === "Shop not found") return 404;
  if (message === "AI is not available in this environment") return 503;
  return 400;
}

export async function handleHeroIntro(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > HERO_ANIMATOR_IMAGE_MAX_BYTES + 256 * 1024) {
    return Response.json({ success: false, error: "Use a photo 8 MB or smaller" }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const shopId = String(form.get("shopId") ?? "");
    if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) {
      return Response.json({ success: false, error: "Shop not found" }, { status: 404 });
    }
    const { finishHeroIntro, startHeroIntro, userFromHeroRequest } = await import("./hero-animator.server");
    const userId = await userFromHeroRequest(request);
    const requestId = String(form.get("requestId") ?? "");
    const niche = String(form.get("niche") ?? "");
    const preset = String(form.get("preset") ?? "");
    const tagline = clipHeroTagline(form.get("tagline"));
    if (requestId) {
      const result = await finishHeroIntro(userId, shopId, requestId, { nicheId: niche, preset, tagline });
      if (result.pending) return Response.json({ success: true, pending: true, requestId: result.requestId });
      return Response.json({
        success: true,
        heroVideoUrl: result.heroVideoUrl,
        previewUrl: result.previewUrl,
        niche: result.niche,
        substance: result.substance,
        tagline: result.tagline,
      });
    }
    const file = form.get("image");
    if (!(file instanceof File)) return Response.json({ success: false, error: "Choose a photo" }, { status: 400 });
    if (file.size > HERO_ANIMATOR_IMAGE_MAX_BYTES) {
      return Response.json({ success: false, error: "Use a photo 8 MB or smaller" }, { status: 413 });
    }
    const started = await startHeroIntro(userId, shopId, preset, new Uint8Array(await file.arrayBuffer()), niche);
    return Response.json({
      success: true,
      pending: true,
      requestId: started.requestId,
      niche: started.plan.niche,
      substance: started.plan.substance,
      tagline: started.plan.tagline || tagline,
      previewUrl: started.plan.previewUrl,
      durationSec: started.plan.durationSec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The intro could not be made";
    return Response.json({ success: false, error: message }, { status: statusFor(message) });
  }
}
