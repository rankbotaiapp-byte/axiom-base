import { isCatalogNiche, resolveCatalogNiche, tradeLoopUrl } from "../../config/catalog.ts";
import { filmMatchingText, UNIVERSAL_FALLBACK } from "./hero-films.ts";
import { NICHE_MEDIA } from "./media.ts";
import type { ShopNiche } from "./types.ts";

export const DEMO_TRAINER_FILM = tradeLoopUrl("personal-trainer");
export const DEMO_LOCKSMITH_FILM = tradeLoopUrl("electrical");
export const DEMO_FIREWOOD_FILM = tradeLoopUrl("forestry");

/**
 * Demo-only film. Live shops keep NICHE_MEDIA.
 */
export function demoHeroFilm(niche: string, hint = ""): string {
  const text = `${niche} ${hint}`.toLowerCase();
  if (/\bplumb/.test(text)) return tradeLoopUrl("plumbing");
  if (niche === "firewood" || niche === "forestry") return DEMO_FIREWOOD_FILM;
  if (niche === "locksmith" || niche === "electrical") return DEMO_LOCKSMITH_FILM;
  const matched = filmMatchingText(`${niche} ${hint}`);
  if (matched) return matched;
  const resolved = resolveCatalogNiche(niche) as ShopNiche;
  if (isCatalogNiche(resolved)) return tradeLoopUrl(resolved);
  return NICHE_MEDIA.contractor.heroVideoUrl || UNIVERSAL_FALLBACK;
}
