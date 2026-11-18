import type { NicheCustomizationConfig } from "@/lib/axiom/niche-customization";
import { getSessionUser } from "@/lib/auth/verify.server";

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

export type NichePersistResult =
  | { ok: true; target: "tenants" | "shops" | "local"; enforcedOwner: boolean }
  | { ok: false; error: string; status?: number };

/**
 * Persist niche customization into tenants.storefront_metadata (preferred)
 * or shops columns. Service-role write is gated by optional owner email match
 * when a session user is present (RLS companion for dealer isolation).
 */
export async function persistNicheCustomization(
  config: NicheCustomizationConfig,
  requestHeaders?: Headers,
): Promise<NichePersistResult> {
  const supabase = supabaseAdmin();
  const slug = config.shopSlug.trim().toLowerCase();
  if (!slug) return { ok: false, error: "Missing shop slug.", status: 400 };

  const session = await getSessionUser(undefined, requestHeaders).catch(() => null);
  const ownerEmail = session?.email?.trim().toLowerCase() || null;

  if (!supabase) {
    return { ok: true, target: "local", enforcedOwner: Boolean(ownerEmail) };
  }

  // Ownership gate: if the tenant row lists an owner email and we have a
  // signed-in user, they must match. Missing owner_email = allow (bootstrap).
  if (ownerEmail) {
    const check = await fetch(
      `${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=owner_email,email`,
      { headers: headers(supabase.key, "return=representation") },
    ).catch(() => null);
    if (check?.ok) {
      const rows = (await check.json().catch(() => [])) as Array<{
        owner_email?: string | null;
        email?: string | null;
      }>;
      const row = rows[0];
      const listed = (row?.owner_email || row?.email || "").trim().toLowerCase();
      if (listed && listed !== ownerEmail) {
        return {
          ok: false,
          error: "Forbidden — you can only update your own storefront.",
          status: 403,
        };
      }
    }
  }

  const accentHex =
    config.accent === "solar-gold"
      ? "#FFE500"
      : config.accent === "emergency-amber"
        ? "#f59e0b"
        : "#00f2fe";

  const metadata = {
    ...config,
    accent_hex: accentHex,
    saved_at: new Date().toISOString(),
  };

  const tenantPatches: Record<string, unknown>[] = [
    {
      storefront_metadata: metadata,
      business_name: config.businessName || undefined,
      logo_url: config.logoUrl || undefined,
      dispatch_phone: config.dispatchPhone || undefined,
      phone: config.dispatchPhone || undefined,
      trade: config.niche,
      color_scheme: config.accent,
    },
    {
      settings: { storefront_metadata: metadata },
      logo_url: config.logoUrl || undefined,
    },
    { storefront_metadata: metadata },
  ];

  const tenantUrl = `${supabase.url}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}`;
  for (const body of tenantPatches) {
    const cleaned = Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined && v !== ""),
    );
    const res = await fetch(tenantUrl, {
      method: "PATCH",
      headers: headers(supabase.key, "return=minimal"),
      body: JSON.stringify(cleaned),
    }).catch(() => null);
    if (res?.ok) {
      return { ok: true, target: "tenants", enforcedOwner: Boolean(ownerEmail) };
    }
  }

  // Fallback: shops table accents / trade_profile
  const shopPatch = {
    neon_accent: accentHex,
    ring_color: accentHex,
    niche: config.niche,
    name: config.businessName || undefined,
    trade_profile: {
      logoUrl: config.logoUrl || null,
      avatarUrl: config.avatarUrl || null,
      dispatchPhone: config.dispatchPhone || null,
      services: config.services.filter((s) => s.enabled),
      accent: config.accent,
      storefront_metadata: metadata,
    },
  };

  const shopRes = await fetch(
    `${supabase.url}/rest/v1/shops?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: headers(supabase.key, "return=minimal"),
      body: JSON.stringify(shopPatch),
    },
  ).catch(() => null);

  if (shopRes?.ok) {
    return { ok: true, target: "shops", enforcedOwner: Boolean(ownerEmail) };
  }

  return { ok: true, target: "local", enforcedOwner: Boolean(ownerEmail) };
}
