const PUBLIC_SHOP_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Static / corporate paths that must never resolve as `/$shopSlug` tenants.
 * Includes `index` so a mistaken slug can never shadow the root landing.
 */
export const RESERVED_SHOP_SLUGS = new Set([
  "index",
  "login",
  "onboard",
  "welcome",
  "shops",
  "admin",
  "master",
  "master-admin",
  "api",
  "demo",
  "terms",
  "privacy",
  "security",
  "invite",
  "aether",
  "drone-hub",
  "apex-moto-gt3",
  "otter-adventures",
  "land-clearing",
  "cyber-augment",
  "abyssal-sanctuary",
  "moto-elite",
  "hyper-moto",
  "obsidian-core",
  "cyber-stinger",
  "apex-launch-control",
  "assistant-studio",
  "tent-chase",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/** Rejects path tricks, reserved corporate routes, and oversized slugs before SQL. */
export function publicShopSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  if (slug.length < 1 || slug.length > 80 || !PUBLIC_SHOP_SLUG.test(slug)) return null;
  if (RESERVED_SHOP_SLUGS.has(slug)) return null;
  return slug;
}
