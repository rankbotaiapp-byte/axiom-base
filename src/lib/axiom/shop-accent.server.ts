import "server-only";
import { getSql } from "@/lib/db";
import { normalizeAccent } from "./accent-color";

export type PublicShopRow = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  tagline: string;
  description: string;
  address: string;
  accent: string;
};

/** Shop row addressed by public slug or internal id (`shop_dg`). */
export async function readPublicShop(key: string): Promise<PublicShopRow | null> {
  const value = key.trim();
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(value)) return null;
  try {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      slug: string;
      name: string;
      niche: string;
      tagline: string | null;
      description: string | null;
      address: string | null;
      neon_accent: string | null;
      ring_color: string | null;
    }>`
      select id, slug, name, niche, tagline, description, address, neon_accent, ring_color
      from shops
      where lower(slug) = lower(${value}) or id = ${value}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      niche: row.niche,
      tagline: row.tagline ?? "",
      description: row.description ?? "",
      address: row.address ?? "",
      accent: normalizeAccent(row.neon_accent) || normalizeAccent(row.ring_color),
    };
  } catch (err) {
    console.error("[storefront] shop read failed", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Accent saved when a storefront is launched from Axiom Studio. */
export async function readShopAccent(slug: string): Promise<string> {
  const key = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(key)) return "";
  try {
    const sql = await getSql();
    const rows = await sql<{ neon_accent: string | null; ring_color: string | null }>`
      select neon_accent, ring_color from shops where slug = ${key} limit 1
    `;
    return normalizeAccent(rows[0]?.neon_accent) || normalizeAccent(rows[0]?.ring_color);
  } catch (err) {
    console.error("[storefront] accent read failed", err instanceof Error ? err.message : err);
    return "";
  }
}
