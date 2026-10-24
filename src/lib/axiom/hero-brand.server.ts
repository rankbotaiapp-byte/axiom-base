import { getSql } from "@/lib/db";
import {
  HERO_STILL_FALLBACK_CHARS,
  heroAssetTooLarge,
  isHeroEffect,
  isPublishableHeroStill,
  shopHeroStillPath,
  sniffHeroAsset,
  parseMorphDuration,
  withHeroBrandFallback,
  type HeroEffect,
} from "./hero-brand";
import { assertCanModifyShopById } from "./shop-server.server";
import { isMp4, shopHeroVideoPath } from "./hero-video";

function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
  if (typeof value === "string" && value.startsWith("\\x")) {
    return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
  }
  return null;
}

function withHeroMarked(raw: string): string {
  let parsed: Partial<{ hero: boolean; service: boolean; employee: boolean; testBooked: boolean }> = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = {};
  }
  return JSON.stringify({
    hero: true,
    service: Boolean(parsed.service),
    employee: Boolean(parsed.employee),
    testBooked: Boolean(parsed.testBooked),
  });
}

function mimeFor(kind: "jpeg" | "png" | "webp") {
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  return "image/jpeg";
}

export async function readHeroStill(shopId: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const sql = await getSql();
  let rows: { data: unknown; mime: string }[];
  try {
    rows = await sql<{ data: unknown; mime: string }>`
      select data, mime from shop_hero_stills where shop_id = ${shopId} limit 1
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/shop_hero_stills/i.test(message)) return null;
    throw err;
  }
  const row = rows[0];
  const bytes = row ? asBytes(row.data) : null;
  if (!row || !bytes) return null;
  return { bytes, mime: row.mime || "image/jpeg" };
}

export function heroStillResponse(bytes: Uint8Array, mime: string): Response {
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": mime,
      "content-length": String(bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

/** Persist a composited still, or a shop film, and point the tenant hero at it. */
export async function storeHeroBrandAsset(userId: string, shopId: string, bytes: Uint8Array): Promise<{
  heroImageUrl?: string;
  heroVideoUrl?: string;
}> {
  if (heroAssetTooLarge(bytes.byteLength)) throw new Error("Upload a photo or video, 12 MB or smaller");
  const kind = sniffHeroAsset(bytes);
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp" && kind !== "mp4") {
    throw new Error("Upload a JPEG, PNG, WebP, or MP4, 12 MB or smaller");
  }
  const row = await assertCanModifyShopById(shopId, userId);
  const sql = await getSql();
  if (kind === "mp4") {
    if (!isMp4(bytes)) throw new Error("Upload an .mp4 video, 12 MB or smaller");
    await sql.query(
      `insert into shop_hero_videos (shop_id, mime, data, updated_at)
       values ($1, 'video/mp4', $2, now())
       on conflict (shop_id) do update
         set mime = 'video/mp4', data = excluded.data, updated_at = now()`,
      [shopId, Buffer.from(bytes)],
    );
    const heroVideoUrl = shopHeroVideoPath(shopId, Date.now());
    await sql`
      update shops
      set hero_video_url = ${heroVideoUrl},
          onboarding_json = ${withHeroMarked(row.onboarding_json)}
      where id = ${shopId}
    `;
    return { heroVideoUrl };
  }
  const mime = mimeFor(kind);
  let heroImageUrl = "";
  try {
    await sql.query(
      `insert into shop_hero_stills (shop_id, mime, data, updated_at)
       values ($1, $2, $3, now())
       on conflict (shop_id) do update
         set mime = excluded.mime, data = excluded.data, updated_at = now()`,
      [shopId, mime, Buffer.from(bytes)],
    );
    heroImageUrl = shopHeroStillPath(shopId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/shop_hero_stills/i.test(message)) throw err;
    const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    if (dataUrl.length > HERO_STILL_FALLBACK_CHARS) {
      throw new Error("That photo is too large to store until hero stills are ready. Try a smaller image.");
    }
    heroImageUrl = dataUrl;
  }
  await sql`
    update shops
    set hero_image_url = ${heroImageUrl},
        onboarding_json = ${withHeroMarked(row.onboarding_json)}
    where id = ${shopId}
  `;
  return { heroImageUrl };
}

export async function saveHeroAtmosphere(
  userId: string,
  input: {
    shopId: string;
    effect: unknown;
    tagline: unknown;
    heroImageUrl?: unknown;
    heroVideoUrl?: unknown;
    heroPrompt?: unknown;
    morphDurationSec?: unknown;
  },
) {
  if (!isHeroEffect(input.effect)) throw new Error("Choose smoke, rain, water, snow, or the liquid orb");
  const tagline = typeof input.tagline === "string" ? input.tagline.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const prompt = typeof input.heroPrompt === "string" ? input.heroPrompt.trim().replace(/\s+/g, " ").slice(0, 180) : "";
  const duration = parseMorphDuration(input.morphDurationSec);
  const image = typeof input.heroImageUrl === "string" ? input.heroImageUrl.trim() : "";
  const video = typeof input.heroVideoUrl === "string" ? input.heroVideoUrl.trim() : "";
  if (image && !isPublishableHeroStill(input.shopId, image)) {
    throw new Error("The still has to belong to this shop");
  }
  if (video && !video.startsWith(`/api/hero-video/${input.shopId}`)) {
    throw new Error("The film has to belong to this shop");
  }
  const row = await assertCanModifyShopById(input.shopId, userId);
  const sql = await getSql();
  const effect: HeroEffect = input.effect;
  let stored: "columns" | "profile" | "asset" = "columns";
  try {
    await sql`
      update shops set
        hero_effect_type = ${effect},
        hero_branding_tagline = ${tagline},
        hero_prompt = ${prompt},
        morph_duration_sec = ${duration}
      where id = ${row.id}
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/hero_effect_type|hero_branding_tagline|hero_prompt|morph_duration_sec/i.test(message)) throw err;
    try {
      await sql`
        update shops
        set trade_profile = ${withHeroBrandFallback(row.trade_profile, {
          effect,
          tagline,
          prompt,
          morphDurationSec: duration,
        })}
        where id = ${row.id}
      `;
      stored = "profile";
    } catch (profileErr) {
      const profileMessage = profileErr instanceof Error ? profileErr.message : "";
      if (!/trade_profile/i.test(profileMessage)) throw profileErr;
      stored = "asset";
    }
  }
  if (image) {
    await sql`update shops set hero_image_url = ${image} where id = ${row.id}`;
  }
  if (video) {
    await sql`update shops set hero_video_url = ${video} where id = ${row.id}`;
  }
  return {
    ok: true as const,
    stored,
    heroEffectType: effect,
    heroBrandingTagline: tagline,
    heroPrompt: prompt,
    morphDurationSec: duration,
    heroImageUrl: image || row.hero_image_url,
    heroVideoUrl: video || row.hero_video_url,
  };
}
