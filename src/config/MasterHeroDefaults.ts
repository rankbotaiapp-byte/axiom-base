import { LOOP_TAIL_TRIM_SEC } from "../lib/axiom/loop-trim.ts";

export const MASTER_LOOP_TAIL_TRIM_SEC = LOOP_TAIL_TRIM_SEC;

export const MASTER_CATEGORY_IDS = [
  "automotive-mobile",
  "residential-outdoor",
  "urgent-response",
  "personal-lifestyle",
  "specialty-local",
] as const;

export type MasterCategoryId = (typeof MASTER_CATEGORY_IDS)[number];

export type MasterHeroDefault = {
  id: MasterCategoryId;
  title: string;
  src: string;
  loopTailTrimSec: typeof LOOP_TAIL_TRIM_SEC;
};

/** 1:1 parent category → premium cinematic loop. */
export const MASTER_HERO_DEFAULTS: Record<MasterCategoryId, MasterHeroDefault> = {
  "automotive-mobile": {
    id: "automotive-mobile",
    title: "Automotive & Mobile Services",
    src: "/media/apex-launch-hero-animation.mp4",
    loopTailTrimSec: LOOP_TAIL_TRIM_SEC,
  },
  "residential-outdoor": {
    id: "residential-outdoor",
    title: "Residential & Outdoor Services",
    src: "/media/leopard-hero-path.mp4",
    loopTailTrimSec: LOOP_TAIL_TRIM_SEC,
  },
  "urgent-response": {
    id: "urgent-response",
    title: "Urgent Response Trades",
    src: "/media/otter-hero-animation.mp4",
    loopTailTrimSec: LOOP_TAIL_TRIM_SEC,
  },
  "personal-lifestyle": {
    id: "personal-lifestyle",
    title: "Personal, Appointment & Lifestyle Services",
    src: "/media/polar-bear-hero-animation.mp4",
    loopTailTrimSec: LOOP_TAIL_TRIM_SEC,
  },
  "specialty-local": {
    id: "specialty-local",
    title: "Specialty & Local Niche Markets",
    src: "/media/shark-hero-animation.mp4",
    loopTailTrimSec: LOOP_TAIL_TRIM_SEC,
  },
};

export const MASTER_DEFAULT_SRC = Object.fromEntries(
  MASTER_CATEGORY_IDS.map((id) => [id, MASTER_HERO_DEFAULTS[id].src]),
) as Record<MasterCategoryId, string>;

export function isMasterDefaultSrc(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0] ?? "";
  return MASTER_CATEGORY_IDS.some((id) => MASTER_HERO_DEFAULTS[id].src === path);
}

export function masterHeroSrc(category: MasterCategoryId): string {
  return MASTER_HERO_DEFAULTS[category].src;
}
