import { isCatalogHeroUrl } from "./hero-films.ts";
import { NICHE_MEDIA } from "./media.ts";
import { isShopNiche, type ShopNiche } from "./types.ts";

/** Fitness demo uses the trainer file on disk. The catalog still points at tiger-deer. */
export const DEMO_TRAINER_FILM = "/media/heroes/physical-trainer-hero.mp4.mp4";

/** Locksmith demo stays on the locksmith loop. A desk pin cannot swap in another trade. */
export const DEMO_LOCKSMITH_FILM = "/media/heroes/mobile-locksmith.mp4";

/** Forestry, firewood, and defensible-space demos use the chainsaw logging loop. */
export const DEMO_FIREWOOD_FILM = "/media/heroes/firewood-hero.mp4";

const DEMO_FILMS: Partial<Record<ShopNiche, string>> = {
  fitness: DEMO_TRAINER_FILM,
  wellness: "/media/heroes/wellness.mp4",
  lessons: "/media/heroes/lessons.mp4",
  salon: "/media/heroes/salon.mp4",
  beauty: "/media/heroes/nails-lashes.mp4",
  tattoo: "/media/heroes/tattoo-hero.mp4",
  photo: "/media/heroes/photographer.mp4",
  pets: "/media/heroes/petgroom.mp4",
  landscaper: "/media/heroes/landscaper.mp4",
  dogwalk: "/media/heroes/dogwalking.mp4",
  detailer: "/media/heroes/mobile-detailer.mp4",
  therapy: "/media/heroes/wellness.mp4",
  contractor: "/media/heroes/contractors-hero.mp4",
  clean: "/media/heroes/clean.mp4",
  field: "/media/heroes/auto-repair.mp4",
  locksmith: DEMO_LOCKSMITH_FILM,
  firewood: DEMO_FIREWOOD_FILM,
  security: "/media/heroes/private-security.mp4",
  location: "/media/heroes/barber-hero.mp4",
  hunting: "/media/heroes/hunting-guide.mp4",
  creator: "/media/heroes/social-media-content-creator.mp4",
  guide: "/media/heroes/guide.mp4",
  events: "/media/heroes/events.mp4",
};

function firstReady(paths: readonly string[]): string {
  for (const path of paths) {
    if (isCatalogHeroUrl(path)) return path;
  }
  return "";
}

/**
 * Demo-only film. Live shops keep NICHE_MEDIA.
 * Plumbing is classified as contractor, so a plumbing hint wins the plumber loop.
 */
export function demoHeroFilm(niche: string, hint = ""): string {
  const text = `${niche} ${hint}`.toLowerCase();
  if (/\bplumb/.test(text)) {
    return firstReady(["/media/heroes/plumbers-hero.mp4.mp4", "/media/heroes/plumbers-hero.mp4"]) ||
      "/media/heroes/plumbers-hero.mp4.mp4";
  }
  if (niche === "firewood") {
    return firstReady([DEMO_FIREWOOD_FILM, "/media/heroes/firewood-hero.mp4.mp4"]) || DEMO_FIREWOOD_FILM;
  }
  if (niche === "locksmith") {
    return (
      firstReady([
        "/media/heroes/locksmith-hero.mp4.mp4",
        "/media/heroes/locksmith-hero.mp4",
        "/media/heroes/vault-lock.mp4",
        DEMO_LOCKSMITH_FILM,
      ]) || DEMO_LOCKSMITH_FILM
    );
  }
  const pinned = isShopNiche(niche) ? DEMO_FILMS[niche] : "";
  if (pinned) return pinned;
  if (isShopNiche(niche) && NICHE_MEDIA[niche].heroVideoUrl) return NICHE_MEDIA[niche].heroVideoUrl;
  return NICHE_MEDIA.trade.heroVideoUrl;
}
