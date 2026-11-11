/** Seeded auto shop used when Hero Studio is opened without a tenant slug. */
export const DEFAULT_HERO_STUDIO_SLUG = "axiom-auto";
export const HERO_STUDIO_SLUG_KEY = "axiom-hero-studio-slug";

function cleanSlug(value: string | null | undefined): string {
  const slug = (value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "";
  if (slug === "admin" || slug === "api" || slug === "login") return "";
  return slug;
}

export function rememberHeroStudioSlug(slug: string): void {
  const next = cleanSlug(slug);
  if (!next || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(HERO_STUDIO_SLUG_KEY, next);
  } catch {
    /* private mode */
  }
}

export function rememberedHeroStudioSlug(): string {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return cleanSlug(sessionStorage.getItem(HERO_STUDIO_SLUG_KEY));
  } catch {
    return "";
  }
}

export function resolveHeroStudioSlug(slug?: string | null): string {
  return cleanSlug(slug) || rememberedHeroStudioSlug() || DEFAULT_HERO_STUDIO_SLUG;
}

export function heroStudioPath(slug?: string | null): string {
  return `/${resolveHeroStudioSlug(slug)}/admin/hero-studio`;
}
