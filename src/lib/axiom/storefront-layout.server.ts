import "server-only";

import type { StorefrontLayoutConfig } from "@/lib/axiom/storefront-layout";

function supabaseAdmin(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  return { url, key };
}

function headers(key: string, prefer: string): HeadersInit {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    prefer,
  };
}

export type LayoutPersistResult =
  | { ok: true; target: "tenants" | "client_storefronts" | "local" }
  | { ok: false; error: string };

/** Best-effort sync of layout config into tenants / client_storefronts. */
export async function persistLayoutToSupabase(
  config: StorefrontLayoutConfig,
): Promise<LayoutPersistResult> {
  const supabase = supabaseAdmin();
  if (!supabase) {
    return { ok: true, target: "local" };
  }

  const slug = config.shopSlug.trim().toLowerCase();
  if (!slug) return { ok: false, error: "Missing shop slug." };

  const heroAsset =
    config.slots.find((s) => s.id === "slot-hero")?.assignedAsset || config.backgroundUrl;

  const tenantBodies: Record<string, unknown>[] = [
    {
      layout_config: config,
      hero_video_url: heroAsset,
      background_video_url: config.backgroundUrl,
      active_trade: config.activeTradeId,
    },
    {
      settings: { layout_config: config },
      hero_video_url: heroAsset,
    },
    { layout_config: config },
  ];

  const tenantUrl = `${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`;
  for (const body of tenantBodies) {
    const res = await fetch(tenantUrl, {
      method: "PATCH",
      headers: headers(supabase.key, "return=minimal"),
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res?.ok) return { ok: true, target: "tenants" };
  }

  const storefrontPayload = {
    shop_slug: slug,
    hero_video_url: heroAsset,
    background_video_url: config.backgroundUrl,
    hero_background_loop: heroAsset,
    layout_config: config,
    tagline: `Axiom layout · ${config.activeTradeId}`,
  };

  const upsert = await fetch(`${supabase.url}/rest/v1/client_storefronts?on_conflict=shop_slug`, {
    method: "POST",
    headers: headers(supabase.key, "resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify(storefrontPayload),
  }).catch(() => null);
  if (upsert?.ok) return { ok: true, target: "client_storefronts" };

  const patch = await fetch(
    `${supabase.url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: headers(supabase.key, "return=minimal"),
      body: JSON.stringify({
        hero_video_url: heroAsset,
        background_video_url: config.backgroundUrl,
        layout_config: config,
      }),
    },
  ).catch(() => null);
  if (patch?.ok) return { ok: true, target: "client_storefronts" };

  // Schema may not have layout_config — still treat local+hero sync attempt as soft success
  return { ok: true, target: "local" };
}

export type StoredLayoutAsset = {
  url: string;
  thumbnailUrl?: string;
};

function asFetchBody(body: BodyInit | Buffer | Uint8Array, mime: string): Blob | BodyInit {
  if (body instanceof Blob) return body;
  if (typeof body === "string") return body;
  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body as ArrayBuffer);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: mime });
}

async function uploadObjectToAxiomMedia(
  objectPath: string,
  body: BodyInit | Buffer | Uint8Array,
  mime: string,
): Promise<string | null> {
  const supabase = supabaseAdmin();
  if (!supabase) return null;

  const buckets = ["axiom-media", "media", "app-uploads"] as const;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    for (const bucket of buckets) {
      const response = await fetch(`${supabase.url}/storage/v1/object/${bucket}/${objectPath}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          apikey: supabase.key,
          authorization: `Bearer ${supabase.key}`,
          "content-type": mime,
          "x-upsert": "true",
        },
        body: asFetchBody(body, mime),
      });
      if (response.ok) {
        return `${supabase.url}/storage/v1/object/public/${bucket}/${objectPath}`;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function safeShopSlug(slug: string): string {
  return (
    slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "shop"
  );
}

export async function uploadEnhancedImageToStorage(
  slug: string,
  bytes: Buffer | Uint8Array,
  kind: "hero" | "proof" | "mms" = "proof",
): Promise<StoredLayoutAsset | null> {
  const { enhanceJobPhoto } = await import("./cinematic-enhance.server");
  const enhanced = await enhanceJobPhoto(bytes);
  const stamp = Date.now();
  const prefix = `layout/${safeShopSlug(slug)}/${kind}-${stamp}`;
  const url = await uploadObjectToAxiomMedia(`${prefix}.webp`, enhanced.webp, "image/webp");
  if (!url) return null;
  const thumbnailUrl =
    (await uploadObjectToAxiomMedia(`${prefix}-thumb.webp`, enhanced.thumb, "image/webp")) || undefined;
  return { url, thumbnailUrl };
}

export async function uploadLayoutAssetToStorage(
  slug: string,
  file: File,
  kind: "hero" | "proof" = "proof",
): Promise<string | null> {
  const stored = await uploadLayoutAssetBundle(slug, file, kind);
  return stored?.url ?? null;
}

export async function uploadLayoutAssetBundle(
  slug: string,
  file: File,
  kind: "hero" | "proof" = "proof",
): Promise<StoredLayoutAsset | null> {
  const { isRasterJobPhoto } = await import("./cinematic-enhance.server");
  const lower = file.name.toLowerCase();
  if (isRasterJobPhoto(file.type, file.name)) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return uploadEnhancedImageToStorage(slug, bytes, kind);
  }

  const ext = lower.match(/\.(webm|mp4|mov)$/)?.[1] || "bin";
  const objectPath = `layout/${safeShopSlug(slug)}/${Date.now()}.${ext}`;
  const mime = file.type || (ext === "webm" ? "video/webm" : "video/mp4");
  const url = await uploadObjectToAxiomMedia(objectPath, file, mime);
  return url ? { url } : null;
}
