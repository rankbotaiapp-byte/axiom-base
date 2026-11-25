import { LOOP_TAIL_TRIM_SEC } from "../lib/axiom/loop-trim.ts";

export const HERO_LIBRARY_CATEGORIES = ["Auto", "Urgent", "Residential", "Personal", "Specialty"] as const;
export type HeroLibraryCategory = (typeof HERO_LIBRARY_CATEGORIES)[number];

export const HERO_LIBRARY_COLLECTIONS = ["Auto", "Wildlife", "Orbs", "Abstract", "Water"] as const;
export type HeroLibraryCollection = (typeof HERO_LIBRARY_COLLECTIONS)[number];

export type HeroLibraryEntry = {
  id: string;
  name: string;
  category: HeroLibraryCategory;
  collection: HeroLibraryCollection;
  videoUrl: string;
  thumbnail: string;
  loopTailTrimSec: typeof LOOP_TAIL_TRIM_SEC;
};

export const HERO_LIBRARY: readonly HeroLibraryEntry[] = [
  { id: "auto-hero-animation", name: "Auto", category: "Auto", collection: "Auto", videoUrl: "/media/auto-hero-animation.mp4", thumbnail: "/media/auto-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "cleaner-hero-animation", name: "Cleaner", category: "Urgent", collection: "Abstract", videoUrl: "/media/cleaner-hero-animation.mp4", thumbnail: "/media/heroes/hvac.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "electrician-hero-animation", name: "Electrician", category: "Urgent", collection: "Abstract", videoUrl: "/media/electrician-hero-animation.mp4", thumbnail: "/media/heroes/electrical.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "infrastructure-hero-animation", name: "Infrastructure", category: "Residential", collection: "Abstract", videoUrl: "/media/infrastructure-hero-animation.mp4", thumbnail: "/media/heroes/contractor.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "locksmith-hero-animation", name: "Locksmith", category: "Urgent", collection: "Abstract", videoUrl: "/media/locksmith-hero-animation.mp4", thumbnail: "/media/heroes/electrical.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axio-plumber-hero", name: "Axio Plumber Hero", category: "Urgent", collection: "Water", videoUrl: "/media/axio-plumber-hero.mp4", thumbnail: "/media/axio-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axio-plumber-hero-mobile", name: "Axio Plumber Hero Mobile", category: "Urgent", collection: "Water", videoUrl: "/media/axio-plumber-hero-mobile.mp4", thumbnail: "/media/axio-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbing-emergency-hero", name: "Emergency Plumbing", category: "Urgent", collection: "Water", videoUrl: "/media/plumbing-emergency-hero.mp4", thumbnail: "/media/plumbing-emergency-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbing-emergency-hero-mobile", name: "Emergency Plumbing Mobile", category: "Urgent", collection: "Water", videoUrl: "/media/plumbing-emergency-hero-mobile.mp4", thumbnail: "/media/plumbing-emergency-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbers-hero-animation", name: "Plumbers", category: "Urgent", collection: "Abstract", videoUrl: "/media/plumbers-hero-animation.mp4", thumbnail: "/media/heroes/plumbing.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumber-field-operations", name: "Field Operations", category: "Urgent", collection: "Water", videoUrl: "/media/plumber-field-operations.mp4", thumbnail: "/media/van.png", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "welcome-to-axiom", name: "Welcome To Axiom", category: "Specialty", collection: "Abstract", videoUrl: "/media/welcome-to-axiom.mp4", thumbnail: "/media/eric.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
];

export function heroLibraryEntryByUrl(url: string | null | undefined): HeroLibraryEntry | undefined {
  if (!url) return undefined;
  const path = url.split("?")[0] ?? "";
  return HERO_LIBRARY.find((item) => item.videoUrl === path);
}
