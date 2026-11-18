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

export async function readDeployedAtmosphere(shopSlug: string): Promise<{
  atmosphereEnabled: boolean;
  cinemagraphPreset?: StorefrontLayoutConfig["cinemagraphPreset"];
}> {
  const slug = shopSlug.trim().toLowerCase();
  if (!slug) return { atmosphereEnabled: false };

  const supabase = supabaseAdmin();
  if (!supabase) return { atmosphereEnabled: false };

  const res = await fetch(
    `${supabase.url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(slug)}&select=layout_config`,
    {
      headers: {
        apikey: supabase.key,
        authorization: `Bearer ${supabase.key}`,
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!res?.ok) return { atmosphereEnabled: false };
  const rows = (await res.json().catch(() => [])) as { layout_config?: StorefrontLayoutConfig | null }[];
  const config = rows[0]?.layout_config;
  if (!config) return { atmosphereEnabled: false };
  return {
    atmosphereEnabled: Boolean(config.atmosphereEnabled),
    cinemagraphPreset: config.cinemagraphPreset,
  };
}