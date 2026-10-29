import { catalogFilmUrl, isCatalogNiche, resolveCatalogNiche } from "@/config/catalog";
import { filmMatchingText, UNIVERSAL_FALLBACK } from "./hero-films.ts";
import { NICHE_MEDIA } from "./media.ts";
import type { ShopNiche } from "./types.ts";

export const DEMO_TRAINER_FILM = catalogFilmUrl("tool-repair");
export const DEMO_LOCKSMITH_FILM = catalogFilmUrl("electrical");
export const DEMO_FIREWOOD_FILM = catalogFilmUrl("forestry");

/**
 * Demo-only film. Live shops keep NICHE_MEDIA.
 */
export function demoHeroFilm(niche: string, hint = ""): string {
  const text = `${niche} ${hint}`.toLowerCase();
  if (/\bplumb/.test(text)) return catalogFilmUrl("plumbing");
  if (niche === "firewood" || niche === "forestry") return DEMO_FIREWOOD_FILM;
  if (niche === "locksmith" || niche === "electrical") return DEMO_LOCKSMITH_FILM;
  const matched = filmMatchingText(`${niche} ${hint}`);
  if (matched) return matched;
  const resolved = resolveCatalogNiche(niche) as ShopNiche;
  if (isCatalogNiche(resolved)) return catalogFilmUrl(resolved);
  return NICHE_MEDIA.contractor.heroVideoUrl || UNIVERSAL_FALLBACK;
}
