import {
  MASTER_CATEGORY_IDS,
  MASTER_HERO_DEFAULTS,
  MASTER_LOOP_TAIL_TRIM_SEC,
  type MasterCategoryId,
} from "./MasterHeroDefaults.ts";
import { nichesInCategory, type RegisteredNiche } from "./NicheRegistry.ts";
import {
  CATALOG_BY_ID,
  catalogCardSrc,
  catalogCardStill,
  tradeLoopUrl,
  type CatalogNiche,
} from "./catalog.ts";

export {
  MASTER_CATEGORY_IDS,
  MASTER_DEFAULT_SRC,
  MASTER_HERO_DEFAULTS,
  MASTER_LOOP_TAIL_TRIM_SEC,
  isMasterDefaultSrc,
  masterHeroSrc,
  type MasterCategoryId,
  type MasterHeroDefault,
} from "./MasterHeroDefaults.ts";

/** Active service module nested under a master category card. */
export type MasterCategoryModule = {
  niche: RegisteredNiche;
  label: string;
  blurb: string;
  /** Cinematic loop under /media/*.mp4 */
  loopSrc: string;
  /** Trade still under /media/heroes/* when available */
  stillSrc: string;
  /** Preferred public-card asset (still or loop) */
  cardSrc: string;
};

export type MasterCategoryCard = {
  id: MasterCategoryId;
  title: string;
  blurb: string;
  src: string;
  /** Still used as video poster so the grid never shows blank dark frames. */
  poster: string;
  /** First shop trade used when a landing card opens demo / onboard. */
  seedNiche: "auto" | "contractor" | "plumbing" | "barber" | "taxidermy";
  /** Registered niches filed under this parent category. */
  modules: readonly MasterCategoryModule[];
};

const BLURB: Record<MasterCategoryId, string> = {
  "automotive-mobile": "The bay, the van, and the book after dark.",
  "residential-outdoor": "Yards, roofs, timber, and the job on the ground.",
  "urgent-response": "The call that cannot wait. Power, water, air, and the line.",
  "personal-lifestyle": "The chair, the suite, the hour, the pane.",
  "specialty-local": "Craft shops, mounts, watch, and the local bench.",
};

const SEED: Record<MasterCategoryId, MasterCategoryCard["seedNiche"]> = {
  "automotive-mobile": "auto",
  "residential-outdoor": "contractor",
  "urgent-response": "plumbing",
  "personal-lifestyle": "barber",
  "specialty-local": "taxidermy",
};

function moduleFor(niche: RegisteredNiche): MasterCategoryModule {
  const row = CATALOG_BY_ID[niche as CatalogNiche];
  const loopSrc = tradeLoopUrl(niche as CatalogNiche);
  const stillSrc = catalogCardStill(niche as CatalogNiche);
  return {
    niche,
    label: row?.label ?? niche,
    blurb: row?.blurb ?? "",
    loopSrc,
    stillSrc,
    cardSrc: catalogCardSrc(niche as CatalogNiche),
  };
}

function posterFor(category: MasterCategoryId, seed: MasterCategoryCard["seedNiche"]): string {
  const fromSeed = catalogCardStill(seed);
  if (fromSeed) return fromSeed;
  const first = nichesInCategory(category)
    .map((niche) => catalogCardStill(niche as CatalogNiche))
    .find(Boolean);
  return first || "";
}

/**
 * Public landing catalog — five parent categories.
 * Each card only surfaces its core seed niche (legacy child niches stay hidden).
 */
export const MASTER_CATEGORY_CARDS: readonly MasterCategoryCard[] = MASTER_CATEGORY_IDS.map((id) => {
  const row = MASTER_HERO_DEFAULTS[id];
  const seedNiche = SEED[id];
  return {
    id,
    title: row.title,
    src: row.src,
    poster: posterFor(id, seedNiche),
    blurb: BLURB[id],
    seedNiche,
    modules: [moduleFor(seedNiche as RegisteredNiche)],
  };
});

export function masterCategoryCard(id: MasterCategoryId): MasterCategoryCard {
  return MASTER_CATEGORY_CARDS.find((row) => row.id === id)!;
}
