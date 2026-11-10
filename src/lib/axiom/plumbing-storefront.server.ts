import { getSql, isDatabaseUnavailable } from "@/lib/db";
import {
  DEFAULT_PLUMBING_STOREFRONT,
  PLUMBING_STOREFRONT_SLUG,
  parsePlumbingStorefront,
  type PlumbingStorefront,
} from "./plumbing-storefront";

export type StorefrontRead = {
  config: PlumbingStorefront;
  updatedAt: string | null;
  source: "saved" | "default";
};

/** Public read. A missing row or an offline database serves the defaults — never a broken page. */
export async function readPlumbingStorefront(): Promise<StorefrontRead> {
  try {
    const sql = await getSql();
    const rows = await sql<{ config: unknown; updated_at: string | Date }>`
      select config, updated_at from storefront_configs where slug = ${PLUMBING_STOREFRONT_SLUG} limit 1
    `;
    const row = rows[0];
    if (!row) return { config: DEFAULT_PLUMBING_STOREFRONT, updatedAt: null, source: "default" };
    return {
      config: parsePlumbingStorefront(row.config),
      updatedAt: new Date(row.updated_at).toISOString(),
      source: "saved",
    };
  } catch (err) {
    if (!isDatabaseUnavailable(err)) console.error("[plumbing-storefront] read failed", err);
    return { config: DEFAULT_PLUMBING_STOREFRONT, updatedAt: null, source: "default" };
  }
}

/**
 * Who may save: the master-owner cookie, a platform owner session, or — only in
 * local development with no owner key configured — anyone on localhost.
 */
export async function canEditStorefront(bearerToken?: string): Promise<{ ok: boolean; reason: string }> {
  const bypass = await import("./master-bypass.server");
  if (bypass.hasValidMasterCookie()) {
    bypass.refreshMasterCookie();
    return { ok: true, reason: "master-key" };
  }
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser(bearerToken);
    if (user) {
      const { isPlatformOwner } = await import("./platform-owner.server");
      if (await isPlatformOwner(user.id)) return { ok: true, reason: "owner-session" };
    }
  } catch {
    // Fall through to the dev rule / locked.
  }
  if (process.env.NODE_ENV !== "production" && !bypass.bypassConfigured()) {
    return { ok: true, reason: "local-dev" };
  }
  return { ok: false, reason: bypass.bypassConfigured() ? "locked" : "no-key-configured" };
}

export async function savePlumbingStorefront(input: unknown, bearerToken?: string): Promise<StorefrontRead> {
  const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
  assertSameSiteRequest();
  const access = await canEditStorefront(bearerToken);
  if (!access.ok) throw new Error("Unlock the studio with the owner key to publish.");
  const config = parsePlumbingStorefront(input);
  const sql = await getSql();
  const rows = await sql<{ updated_at: string | Date }>`
    insert into storefront_configs (slug, config, updated_at)
    values (${PLUMBING_STOREFRONT_SLUG}, ${JSON.stringify(config)}::jsonb, now())
    on conflict (slug) do update set config = excluded.config, updated_at = now()
    returning updated_at
  `;
  return { config, updatedAt: new Date(rows[0]?.updated_at ?? Date.now()).toISOString(), source: "saved" };
}
