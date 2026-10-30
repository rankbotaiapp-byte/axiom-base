const PUBLIC_SHOP_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Rejects path tricks and oversized slugs before they reach SQL. */
export function publicShopSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  if (slug.length < 1 || slug.length > 80 || !PUBLIC_SHOP_SLUG.test(slug)) return null;
  return slug;
}
