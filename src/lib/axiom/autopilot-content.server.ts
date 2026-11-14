/**
 * Server: legal stock media fetch (Pixabay / Pexels / Unsplash) + branded persistence for Autopilot cron.
 */

import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import {
  composeBrandedStock,
  curatedStockImage,
  curatedStockVideo,
  daySeedFromDate,
  libraryStockAsset,
  framedSvgDataUrl,
  pickTradeKeyword,
  tradeKeywordsForNiche,
  type BrandedStockComposition,
  type StockMediaAsset,
} from "./autopilot-content.ts";
import { shopCity } from "./avatar";
import { MEDIA_ASSET_LIMIT, MEDIA_FILE_MAX_BYTES, shopMediaPath } from "./media-slots";

type TenantShop = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  address: string;
  owner_user_id: string | null;
  neon_accent?: string | null;
  ring_color?: string | null;
  hero_image_url?: string | null;
  trade_profile?: string | null;
};

export type StockBrandTickResult = {
  shopId: string;
  slug: string;
  sourced: boolean;
  stored: boolean;
  queued: boolean;
  provider: string;
  detail: string;
};

function pexelsKey(): string | undefined {
  return env("PEXELS_API_KEY") || env("PEXELS_KEY");
}

function unsplashKey(): string | undefined {
  return env("UNSPLASH_ACCESS_KEY") || env("UNSPLASH_API_KEY");
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Query Pexels for commercially free photos/videos by trade keywords. */
export async function fetchPexelsStock(
  query: string,
  kind: "image" | "video",
  page = 1,
): Promise<StockMediaAsset | null> {
  const key = pexelsKey();
  if (!key) return null;
  const q = encodeURIComponent(query.slice(0, 80));
  if (kind === "image") {
    const body = (await fetchJson(`https://api.pexels.com/v1/search?query=${q}&per_page=8&page=${page}&orientation=portrait`, {
      Authorization: key,
    })) as {
      photos?: {
        id: number;
        url: string;
        photographer?: string;
        width?: number;
        height?: number;
        src?: { large2x?: string; large?: string; medium?: string };
      }[];
    } | null;
    const photo = body?.photos?.[(page - 1) % Math.max(1, body.photos.length)] ?? body?.photos?.[0];
    const src = photo?.src?.large2x || photo?.src?.large || photo?.src?.medium;
    if (!photo || !src) return null;
    return {
      id: `pexels-img-${photo.id}`,
      kind: "image",
      src,
      previewSrc: photo.src?.medium || src,
      width: photo.width,
      height: photo.height,
      query,
      license: {
        provider: "pexels",
        license: "pexels",
        attribution: `Photo by ${photo.photographer || "Pexels"} on Pexels`,
        photographer: photo.photographer,
        pageUrl: photo.url,
      },
    };
  }

  const body = (await fetchJson(`https://api.pexels.com/videos/search?query=${q}&per_page=6&page=${page}`, {
    Authorization: key,
  })) as {
    videos?: {
      id: number;
      url: string;
      user?: { name?: string };
      image?: string;
      video_files?: { link: string; width?: number; height?: number; quality?: string }[];
    }[];
  } | null;
  const video = body?.videos?.[0];
  const files = [...(video?.video_files ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const hd =
    files.find((f) => (f.width ?? 0) >= 720 && (f.width ?? 0) <= 1280) ||
    files.find((f) => (f.quality || "").includes("hd")) ||
    files[0];
  if (!video || !hd?.link) return null;
  return {
    id: `pexels-vid-${video.id}`,
    kind: "video",
    src: hd.link,
    previewSrc: video.image,
    width: hd.width,
    height: hd.height,
    query,
    license: {
      provider: "pexels",
      license: "pexels",
      attribution: `Video by ${video.user?.name || "Pexels"} on Pexels`,
      photographer: video.user?.name,
      pageUrl: video.url,
    },
  };
}

/** Query Unsplash for commercially free photos (Unsplash License). */
export async function fetchUnsplashStock(query: string, page = 1): Promise<StockMediaAsset | null> {
  const key = unsplashKey();
  if (!key) return null;
  const q = encodeURIComponent(query.slice(0, 80));
  const body = (await fetchJson(
    `https://api.unsplash.com/search/photos?query=${q}&per_page=8&page=${page}&orientation=portrait`,
    { Authorization: `Client-ID ${key}` },
  )) as {
    results?: {
      id: string;
      links?: { html?: string };
      user?: { name?: string };
      width?: number;
      height?: number;
      urls?: { regular?: string; full?: string; small?: string };
    }[];
  } | null;
  const photo = body?.results?.[0];
  const src = photo?.urls?.regular || photo?.urls?.full || photo?.urls?.small;
  if (!photo || !src) return null;
  return {
    id: `unsplash-img-${photo.id}`,
    kind: "image",
    src,
    previewSrc: photo.urls?.small || src,
    width: photo.width,
    height: photo.height,
    query,
    license: {
      provider: "unsplash",
      license: "unsplash",
      attribution: `Photo by ${photo.user?.name || "Unsplash"} on Unsplash`,
      photographer: photo.user?.name,
      pageUrl: photo.links?.html,
    },
  };
}

/** Dynamic stock pick: Pixabay video → Pexels → Unsplash → curated niche defaults / master loop. */
export async function fetchLegalStockMedia(input: {
  niche: string | null | undefined;
  kind?: "image" | "video" | "any";
  seed?: number;
}): Promise<StockMediaAsset> {
  const seed = input.seed ?? daySeedFromDate();
  const query = pickTradeKeyword(input.niche, seed);
  const page = (seed % 5) + 1;
  const want = input.kind ?? "any";
  const preferLibrary = seed % 3 !== 1;
  const localVideo = libraryStockAsset(input.niche, "video", seed);
  const localStill = libraryStockAsset(input.niche, "image", seed + 11);

  if ((want === "video" || want === "any") && preferLibrary && localVideo) return localVideo;

  if (want === "video" || want === "any") {
    const { fetchPixabayTradeVideo } = await import("./pixabay-fetcher");
    const pixabay = await fetchPixabayTradeVideo({ niche: input.niche, query, seed, page });
    if (pixabay) return pixabay;
    const video = await fetchPexelsStock(query, "video", page);
    if (video) return video;
    if (want === "video") return localVideo ?? curatedStockVideo(input.niche);
  }

  if ((want === "image" || want === "any") && preferLibrary && localStill) return localStill;

  if (want === "image" || want === "any") {
    const pexels = await fetchPexelsStock(query, "image", page);
    if (pexels) return pexels;
    const unsplash = await fetchUnsplashStock(query, page);
    if (unsplash) return unsplash;
    return localStill ?? curatedStockImage(input.niche, seed);
  }

  return localVideo ?? curatedStockVideo(input.niche);
}

async function downloadImageBytes(src: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (src.startsWith("/media/") && !src.includes("..")) {
    try {
      const { readFileSync } = await import("node:fs");
      const { extname, join } = await import("node:path");
      const full = join(process.cwd(), "public", src.replace(/^\//, "").split("?")[0] ?? src);
      const bytes = new Uint8Array(readFileSync(full));
      if (!bytes.byteLength || bytes.byteLength > MEDIA_FILE_MAX_BYTES) return null;
      const ext = extname(full).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg";
      return { bytes, mime };
    } catch {
      return null;
    }
  }
  if (!/^https:\/\//i.test(src)) return null;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0]!.trim().toLowerCase();
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(mime)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.byteLength || buf.byteLength > MEDIA_FILE_MAX_BYTES) return null;
    return { bytes: buf, mime: mime === "image/jpg" ? "image/jpeg" : mime };
  } catch {
    return null;
  }
}

async function persistBrandedStill(
  shop: TenantShop,
  composition: BrandedStockComposition,
): Promise<{ assetId: string; url: string } | null> {
  const sql = await getSql();
  const downloaded =
    composition.base.kind === "image" ? await downloadImageBytes(composition.base.src) : null;
  const id = newId("med");
  const caption = `${composition.overlay.shopName} · ${composition.overlay.cta}`.slice(0, 80);
  const purpose = "autopilot-stock-brand";

  try {
    const counted = await sql<{ n: number }>`
      select count(*)::int as n from shop_media_assets where shop_id = ${shop.id}
    `;
    if (Number(counted[0]?.n ?? 0) >= MEDIA_ASSET_LIMIT) {
      // Rotate oldest outreach still so daily cron never stalls.
      await sql`
        delete from shop_media_assets
        where id in (
          select id from shop_media_assets
          where shop_id = ${shop.id} and purpose = ${purpose}
          order by created_at asc
          limit 1
        )
      `;
    }

    if (downloaded) {
      await sql.query(
        `insert into shop_media_assets (id, shop_id, slot, purpose, caption, mime, data, is_hero, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, false, now(), now())`,
        [id, shop.id, "outreach", purpose, caption, downloaded.mime, Buffer.from(downloaded.bytes)],
      );
    } else {
      const svgBytes = new TextEncoder().encode(composition.framedSvg);
      await sql.query(
        `insert into shop_media_assets (id, shop_id, slot, purpose, caption, mime, data, is_hero, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, false, now(), now())`,
        [id, shop.id, "outreach", purpose, caption, "image/svg+xml", Buffer.from(svgBytes)],
      );
    }
    return { assetId: id, url: shopMediaPath(id, Date.now()) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/shop_media_assets/i.test(message)) return null;
    throw err;
  }
}

async function queueBrandedSocial(
  shop: TenantShop,
  composition: BrandedStockComposition,
  assetId: string | null,
): Promise<boolean> {
  const sql = await getSql();
  const body = [
    composition.caption,
    composition.base.kind === "video" ? `Film: ${composition.base.src}` : `Still: ${composition.base.src}`,
    `Brand: ${composition.overlay.shopName} · ${composition.overlay.city} · ${composition.overlay.cta}`,
    framedSvgDataUrl(composition.posterSvg).slice(0, 120) + "…",
  ].join("\n");
  const id = newId("soc");
  try {
    await sql`
      insert into shop_social_posts (id, shop_id, asset_id, caption, channels, status, created_at)
      values (
        ${id},
        ${shop.id},
        ${assetId},
        ${body.slice(0, 4000)},
        ${JSON.stringify(["facebook", "instagram", "x"])},
        ${"queued"},
        now()
      )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/shop_social_posts/i.test(message)) return false;
    throw err;
  }
  try {
    await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (
        ${newId("evt")},
        ${shop.id},
        ${"autopilot_stock_brand"},
        ${JSON.stringify({
          composition: {
            base: composition.base,
            overlay: composition.overlay,
            caption: composition.caption,
            metadata: composition.metadata,
          },
          assetId,
        })}
      )
    `;
  } catch {
    /* shop_events optional on older snapshots */
  }
  return true;
}

async function fillProofFromStock(shop: TenantShop, imageUrl: string, caption: string): Promise<boolean> {
  if (!imageUrl) return false;
  const sql = await getSql();
  try {
    const existing = await sql<{ n: number }>`
      select count(*)::int as n from portfolio_items
      where shop_id = ${shop.id} and image_url = ${imageUrl}
    `;
    if (Number(existing[0]?.n ?? 0) > 0) return false;
    const total = await sql<{ n: number }>`
      select count(*)::int as n from portfolio_items where shop_id = ${shop.id}
    `;
    if (Number(total[0]?.n ?? 0) >= 12) return false;
    const staff = await sql<{ id: string }>`
      select id from employees where shop_id = ${shop.id} order by created_at asc limit 1
    `;
    const employeeId = staff[0]?.id;
    if (!employeeId) return false;
    await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
      values (${newId("pf")}, ${shop.id}, ${employeeId}, ${imageUrl}, ${caption.slice(0, 120)})
    `;
    return true;
  } catch {
    return false;
  }
}

function brandFromShop(shop: TenantShop): { logoUrl?: string; accent?: string } {
  let logoUrl = "";
  let accent = String(shop.neon_accent || shop.ring_color || "").trim();
  const raw = shop.trade_profile;
  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === "object") {
        const rec = parsed as Record<string, unknown>;
        if (typeof rec.logoUrl === "string") logoUrl = rec.logoUrl.trim();
      }
    } catch {
      /* trade_profile may be legacy text */
    }
  }
  if (!logoUrl) {
    const hero = String(shop.hero_image_url || "").trim();
    if (/^(\/media\/|\/api\/|https?:\/\/)/i.test(hero)) logoUrl = hero;
  }
  return {
    logoUrl: logoUrl.slice(0, 400) || undefined,
    accent: accent || undefined,
  };
}

/** Source → brand-stamp → persist for one armed tenant. */
export async function sourceBrandedContentForShop(shop: TenantShop): Promise<StockBrandTickResult> {
  const city = shopCity(shop.address);
  const seed = daySeedFromDate() + shop.slug.length;
  const brand = brandFromShop(shop);
  // Daily cycle prefers Pixabay (then Pexels) trade MP4s; stills remain a proof companion.
  const base = await fetchLegalStockMedia({ niche: shop.niche, kind: "video", seed });
  const composition = composeBrandedStock({
    base,
    shopName: shop.name,
    city,
    bookUrl: `/${shop.slug}/book`,
    niche: shop.niche,
    logoUrl: brand.logoUrl,
    accent: brand.accent,
  });

  const stored = await persistBrandedStill(shop, composition);
  const queued = await queueBrandedSocial(shop, composition, stored?.assetId ?? null);

  if (stored?.url) {
    await fillProofFromStock(
      shop,
      stored.url,
      `${composition.overlay.tradeLabel} · ${composition.overlay.shopName}`,
    );
  }

  // Companion still (Unsplash/Pexels/curated) keeps the gallery fresh alongside the video post.
  const still = await fetchLegalStockMedia({ niche: shop.niche, kind: "image", seed: seed + 1 });
  if (still.kind === "image") {
    const stillComposition = composeBrandedStock({
      base: still,
      shopName: shop.name,
      city,
      bookUrl: `/${shop.slug}/book`,
      niche: shop.niche,
      logoUrl: brand.logoUrl,
      accent: brand.accent,
    });
    const stillStored = await persistBrandedStill(shop, stillComposition);
    if (still.license.provider !== "curated" || stillStored) {
      await queueBrandedSocial(shop, stillComposition, stillStored?.assetId ?? stored?.assetId ?? null);
    }
    if (stillStored?.url) {
      await fillProofFromStock(
        shop,
        stillStored.url,
        `${stillComposition.overlay.tradeLabel} · ${stillComposition.overlay.shopName}`,
      );
    }
  }

  return {
    shopId: shop.id,
    slug: shop.slug,
    sourced: true,
    stored: Boolean(stored),
    queued,
    provider: composition.metadata.provider,
    detail: `${composition.metadata.provider} · ${tradeKeywordsForNiche(shop.niche)[0] ?? "trade"}`,
  };
}

/** Daily cron pass: fresh branded stock for every armed tenant. */
export async function tickAutopilotStockBranding(): Promise<{
  ran: number;
  results: StockBrandTickResult[];
}> {
  const sql = await getSql();
  let rows: TenantShop[] = [];
  try {
    rows = await sql<TenantShop>`
      select id, slug, name, niche, address, owner_user_id, neon_accent, ring_color,
             hero_image_url, trade_profile
      from shops
      where owner_user_id is not null
         or coalesce(autopilot_active, false) = true
         or coalesce(ai_content_autopilot, false) = true
      order by slug asc
      limit 16
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/autopilot_active|ai_content_autopilot|neon_accent|ring_color|trade_profile|hero_image_url/i.test(message)) {
      throw err;
    }
    try {
      rows = await sql<TenantShop>`
        select id, slug, name, niche, address, owner_user_id
        from shops
        where owner_user_id is not null
           or coalesce(ai_content_autopilot, false) = true
        order by slug asc
        limit 16
      `;
    } catch (inner) {
      const innerMessage = inner instanceof Error ? inner.message : "";
      if (!/ai_content_autopilot/i.test(innerMessage)) throw inner;
      return { ran: 0, results: [] };
    }
  }

  const results = await mapPool(rows, 3, async (row) => {
    try {
      return await sourceBrandedContentForShop(row);
    } catch (err) {
      return {
        shopId: row.id,
        slug: row.slug,
        sourced: false,
        stored: false,
        queued: false,
        provider: "none",
        detail: err instanceof Error ? err.message : "Stock branding failed",
      } satisfies StockBrandTickResult;
    }
  });
  return {
    ran: results.filter((r) => r.sourced && (r.stored || r.queued)).length,
    results,
  };
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item === undefined) break;
      out[index] = await fn(item, index);
    }
  });
  if (items.length) await Promise.all(workers);
  return out;
}
