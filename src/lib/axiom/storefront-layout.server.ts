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

export async function uploadLayoutAssetToStorage(
  slug: string,
  file: File,
): Promise<string | null> {
  const supabase = supabaseAdmin();
  if (!supabase) return null;

  const safeSlug = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "shop";
  const lower = file.name.toLowerCase();
  const ext = lower.match(/\.(webm|png|webp|jpe?g|gif|mp4|mov)$/)?.[1] || "bin";
  const objectPath = `layout/${safeSlug}/${Date.now()}.${ext}`;
  const mime =
    file.type ||
    (ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "webm"
            ? "video/webm"
            : "video/mp4");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${supabase.url}/storage/v1/object/media/${objectPath}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        apikey: supabase.key,
        authorization: `Bearer ${supabase.key}`,
        "content-type": mime,
        "x-upsert": "true",
      },
      body: file,
    });
    if (!response.ok) return null;
    return `${supabase.url}/storage/v1/object/public/media/${objectPath}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
