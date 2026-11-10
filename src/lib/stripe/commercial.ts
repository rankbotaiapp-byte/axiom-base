/**
 * Axiom commercial billing tiers (platform SaaS — not Connect booking fees).
 * Stripe Checkout is created in `payments.server.ts` from these constants.
 */

export const NAME_YOUR_PRICE_MIN_CENTS = 100; // $1.00 floor
export const STANDARD_MONTHLY_CENTS = 15_000; // $150 / month after day 31
export const FOUNDER_LIFETIME_CENTS = 150_000; // $1,500 one-time

export const FOUNDER_OFFER_VIDEO_PATH = "/media/welcome-to-axiom.mp4";
export const FOUNDER_OFFER_THUMB_PATH = "/media/eric.jpg";

export type CommercialTierId = "trial" | "lifetime";

/** Clamp a Name Your Price bid to the $1 floor (whole cents). */
export function clampNamedPriceCents(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return NAME_YOUR_PRICE_MIN_CENTS;
  return Math.max(NAME_YOUR_PRICE_MIN_CENTS, Math.round(n));
}

/** Parse a dollar string from the pitch UI into cents. */
export function dollarsToNamedPriceCents(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return NAME_YOUR_PRICE_MIN_CENTS;
  return clampNamedPriceCents(Math.round(dollars * 100));
}

export function founderOfferMedia(origin: string): { videoUrl: string; thumbUrl: string } {
  const base = origin.replace(/\/$/, "");
  return {
    videoUrl: `${base}${FOUNDER_OFFER_VIDEO_PATH}`,
    thumbUrl: `${base}${FOUNDER_OFFER_THUMB_PATH}`,
  };
}

/**
 * Absolute personalized pitch URL that opens the pre-built tenant preview
 * with the Name Your Price offer in context.
 */
export function founderOfferPitchUrl(
  origin: string,
  lead: { leadSlug: string; county?: string },
): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams({
    b: lead.leadSlug,
    pitch: "1",
    greet: "1",
    offer: "1",
  });
  if (lead.county) params.set("county", lead.county);
  return `${base}/?${params.toString()}`;
}

/** Append founder video + offer line if the draft does not already mention them. */
export function appendFounderOfferAssets(
  body: string,
  assets: { videoUrl: string; thumbUrl: string; previewUrl: string },
): string {
  const hasVideo = body.includes(assets.videoUrl) || body.includes("{video}");
  const hasPreview = body.includes(assets.previewUrl) || body.includes(assets.previewUrl.split("?")[0] ?? "");
  const blocks: string[] = [];
  if (!hasVideo) {
    blocks.push(
      `Watch Eric explain Name Your Price (Month 1 from $1, then $150/mo on day 31):\n${assets.videoUrl}\nThumbnail: ${assets.thumbUrl}`,
    );
  }
  if (!hasPreview && !body.includes(assets.previewUrl)) {
    blocks.push(`Your pre-built storefront preview:\n${assets.previewUrl}`);
  }
  if (blocks.length === 0) return body;
  return `${body.trim()}\n\n${blocks.join("\n\n")}`;
}
