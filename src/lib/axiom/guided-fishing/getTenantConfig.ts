import { defaultGuidedFishingConfig } from './defaults';
import { deepMerge } from './merge';
import type { DeepPartial, GuidedFishingConfig } from './types';

type Overrides = DeepPartial<GuidedFishingConfig>;

/**
 * Local overrides, used when AXIOM_CONFIG_API_URL is not set (demos, local dev).
 * Add a slug here to spin up a rebranded storefront with zero backend.
 */
const LOCAL_TENANTS: Record<string, Overrides> = {
  // 'upper-rogue-outfitters': {
  //   business: { name: 'Upper Rogue Outfitters', phone: '(541) 555-0199' },
  // },
};

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * >>> AXIOM INTEGRATION POINT 1 of 3 <<<
 * Swap the body of this function for your real tenant-state read
 * (Supabase query, server function, etc). Contract: return the tenant's
 * partial overrides, `{}` for "use defaults", or `null` for "no such tenant".
 */
async function loadTenantOverrides(slug: string): Promise<Overrides | null> {
  const base = process.env.AXIOM_CONFIG_API_URL;
  if (!base) return LOCAL_TENANTS[slug] ?? {};

  const res = await fetch(`${base.replace(/\/$/, '')}/tenants/${slug}/modules/guided-fishing`, {
    headers: process.env.AXIOM_CONFIG_API_KEY ? { Authorization: `Bearer ${process.env.AXIOM_CONFIG_API_KEY}` } : undefined,
    // Cached for a minute; call revalidateTag(`tenant:${slug}`) from the studio save action for instant publish.
    next: { revalidate: 60, tags: [`tenant:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Axiom config API responded ${res.status} for tenant "${slug}"`);
  return (await res.json()) as Overrides;
}

export async function getGuidedFishingConfig(tenant: string): Promise<GuidedFishingConfig | null> {
  const slug = tenant.toLowerCase();
  if (!SLUG.test(slug)) return null;

  const overrides = await loadTenantOverrides(slug);
  if (overrides === null) return null;

  return { ...deepMerge(defaultGuidedFishingConfig, overrides), tenantId: slug };
}
