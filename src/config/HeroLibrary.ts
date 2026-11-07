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
  { id: "apex-launch-hero-animation", name: "Apex Launch", category: "Auto", collection: "Auto", videoUrl: "/media/apex-launch-hero-animation.mp4", thumbnail: "/media/apex-launch-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "apex-launch-control-hero-animation", name: "Apex Launch Control", category: "Auto", collection: "Auto", videoUrl: "/media/apex-launch-control-hero-animation.mp4", thumbnail: "/media/apex-launch-control-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "auto-hero-animation", name: "Auto", category: "Auto", collection: "Auto", videoUrl: "/media/auto-hero-animation.mp4", thumbnail: "/media/auto-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "auto-tuning-hero-animation", name: "Auto Tuning", category: "Auto", collection: "Auto", videoUrl: "/media/auto-tuning-hero-animation.mp4", thumbnail: "/media/auto-tuning-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "barber-hero-animation", name: "Barber", category: "Personal", collection: "Abstract", videoUrl: "/media/barber-hero-animation.mp4", thumbnail: "/media/barber-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "bear-charge-hero-animation", name: "Bear Charge", category: "Specialty", collection: "Wildlife", videoUrl: "/media/bear-charge-hero-animation.mp4", thumbnail: "/media/bear-charge-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "boarding-lessons-hero-animation", name: "Boarding Lessons", category: "Residential", collection: "Abstract", videoUrl: "/media/boarding-lessons-hero-animation.mp4", thumbnail: "/media/boarding-lessons-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "bow-tech-hero-animation", name: "Bow Tech", category: "Specialty", collection: "Abstract", videoUrl: "/media/bow-tech-hero-animation.mp4", thumbnail: "/media/bow-tech-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "heroes-clean", name: "Clean", category: "Specialty", collection: "Abstract", videoUrl: "/media/heroes/clean.mp4", thumbnail: "/media/heroes/clean.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "cleaner-hero-animation", name: "Cleaner", category: "Urgent", collection: "Abstract", videoUrl: "/media/cleaner-hero-animation.mp4", thumbnail: "/media/cleaner-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "content-cretion-hero-animation", name: "Content Creation", category: "Personal", collection: "Abstract", videoUrl: "/media/content-cretion-hero-animation.mp4", thumbnail: "/media/content-cretion-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "electrician-hero-animation", name: "Electrician", category: "Urgent", collection: "Abstract", videoUrl: "/media/electrician-hero-animation.mp4", thumbnail: "/media/electrician-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "eye-hero-animation", name: "Eye", category: "Personal", collection: "Orbs", videoUrl: "/media/eye-hero-animation.mp4", thumbnail: "/media/eye-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "guide-service-hero-animation", name: "Guide Service", category: "Specialty", collection: "Wildlife", videoUrl: "/media/guide-service-hero-animation.mp4", thumbnail: "/media/guide-service-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "gunsmith-hero-animation", name: "Gunsmith", category: "Auto", collection: "Abstract", videoUrl: "/media/gunsmith-hero-animation.mp4", thumbnail: "/media/gunsmith-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "infrastructure-hero-animation", name: "Infrastructure", category: "Residential", collection: "Abstract", videoUrl: "/media/infrastructure-hero-animation.mp4", thumbnail: "/media/infrastructure-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "leapard-page-hero-animation", name: "Leopard Path", category: "Residential", collection: "Wildlife", videoUrl: "/media/leapard-page-hero-animation.mp4", thumbnail: "/media/leapard-page-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "leopard-hero-animation", name: "Leopard", category: "Residential", collection: "Wildlife", videoUrl: "/media/leopard-hero-animation.mp4", thumbnail: "/media/leopard-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "leopard-hero-path", name: "Leopard Walk", category: "Residential", collection: "Wildlife", videoUrl: "/media/leopard-hero-path.mp4", thumbnail: "/media/leopard-hero-path.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "master-defaults-leopard-loop", name: "Leopard Master", category: "Residential", collection: "Wildlife", videoUrl: "/media/master-defaults/leopard-loop.mp4", thumbnail: "/media/master-defaults/leopard-loop.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "locksmith-hero-animation", name: "Locksmith", category: "Urgent", collection: "Abstract", videoUrl: "/media/locksmith-hero-animation.mp4", thumbnail: "/media/locksmith-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "master-defaults-octopus-loop", name: "Octopus", category: "Specialty", collection: "Abstract", videoUrl: "/media/master-defaults/octopus-loop.mp4", thumbnail: "/media/master-defaults/octopus-loop.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "orb-explosion-hero-animation", name: "Orb Explosion", category: "Specialty", collection: "Orbs", videoUrl: "/media/orb-explosion-hero-animation.mp4", thumbnail: "/media/orb-explosion-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "master-defaults-otter-loop", name: "Otter", category: "Urgent", collection: "Wildlife", videoUrl: "/media/master-defaults/otter-loop.mp4", thumbnail: "/media/master-defaults/otter-loop.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "otter-hero-animation", name: "Otter", category: "Urgent", collection: "Wildlife", videoUrl: "/media/otter-hero-animation.mp4", thumbnail: "/media/otter-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "owl-attack-hero-animation", name: "Owl Attack", category: "Residential", collection: "Wildlife", videoUrl: "/media/owl-attack-hero-animation.mp4", thumbnail: "/media/owl-attack-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "personal-protection-hero-animation", name: "Personal Protection", category: "Specialty", collection: "Abstract", videoUrl: "/media/personal-protection-hero-animation.mp4", thumbnail: "/media/personal-protection-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "photogaphy-hero-animation", name: "Photography", category: "Personal", collection: "Abstract", videoUrl: "/media/photogaphy-hero-animation.mp4", thumbnail: "/media/photogaphy-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "physical-trainer-hero-animation", name: "Physical Trainer", category: "Personal", collection: "Abstract", videoUrl: "/media/physical-trainer-hero-animation.mp4", thumbnail: "/media/physical-trainer-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axio-plumber-hero", name: "Axio Plumber Hero", category: "Urgent", collection: "Water", videoUrl: "/media/axio-plumber-hero.mp4", thumbnail: "/media/axio-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axio-plumber-hero-mobile", name: "Axio Plumber Hero Mobile", category: "Urgent", collection: "Water", videoUrl: "/media/axio-plumber-hero-mobile.mp4", thumbnail: "/media/axio-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axiom-plumber-hero", name: "Axiom Plumber Hero", category: "Urgent", collection: "Water", videoUrl: "/media/axiom-plumber-hero.mp4.mp4", thumbnail: "/media/axiom-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axiom-plumber-hero-clean", name: "Axiom Plumber Hero Clean", category: "Urgent", collection: "Water", videoUrl: "/media/axiom-plumber-hero.mp4", thumbnail: "/media/axiom-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "axiom-plumber-hero-mobile", name: "Axiom Plumber Hero Mobile", category: "Urgent", collection: "Water", videoUrl: "/media/axiom-plumber-hero-mobile.mp4", thumbnail: "/media/axiom-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbing-emergency-hero", name: "Emergency Plumbing", category: "Urgent", collection: "Water", videoUrl: "/media/plumbing-emergency-hero.mp4", thumbnail: "/media/plumbing-emergency-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbing-emergency-hero-mobile", name: "Emergency Plumbing Mobile", category: "Urgent", collection: "Water", videoUrl: "/media/plumbing-emergency-hero-mobile.mp4", thumbnail: "/media/plumbing-emergency-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "emergency-plumbing-web-page", name: "Emergency Plumbing Page", category: "Urgent", collection: "Water", videoUrl: "/media/emergency-plumbing-web-page.mp4", thumbnail: "/media/axiom-plumber-hero.jpg", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "plumbers-hero-animation", name: "Plumbers", category: "Urgent", collection: "Abstract", videoUrl: "/media/plumbers-hero-animation.mp4", thumbnail: "/media/plumbers-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "master-defaults-polar-bear-loop", name: "Polar Bear", category: "Personal", collection: "Wildlife", videoUrl: "/media/master-defaults/polar-bear-loop.mp4", thumbnail: "/media/master-defaults/polar-bear-loop.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "polar-bear-hero-animation", name: "Polar Bear", category: "Personal", collection: "Wildlife", videoUrl: "/media/polar-bear-hero-animation.mp4", thumbnail: "/media/polar-bear-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "raptor-hero-animation", name: "Raptor", category: "Specialty", collection: "Wildlife", videoUrl: "/media/raptor-hero-animation.mp4", thumbnail: "/media/raptor-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "shark-hero-animation", name: "Abyssal Systems", category: "Urgent", collection: "Water", videoUrl: "/media/shark-hero-animation.mp4", thumbnail: "/media/shark-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "master-defaults-sharks-loop", name: "Sharks", category: "Specialty", collection: "Wildlife", videoUrl: "/media/master-defaults/sharks-loop.mp4", thumbnail: "/media/master-defaults/sharks-loop.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "silver-orb-hero-animation", name: "Silver Orb", category: "Personal", collection: "Orbs", videoUrl: "/media/silver-orb-hero-animation.mp4", thumbnail: "/media/silver-orb-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "snowleapard-hero-animation", name: "Snow Leopard", category: "Residential", collection: "Wildlife", videoUrl: "/media/snowleapard-hero-animation.mp4", thumbnail: "/media/snowleapard-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "taxidermy-hero-animation", name: "Taxidermy", category: "Specialty", collection: "Wildlife", videoUrl: "/media/taxidermy-hero-animation.mp4", thumbnail: "/media/taxidermy-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "tiger-hero-animation", name: "Tiger", category: "Specialty", collection: "Wildlife", videoUrl: "/media/tiger-hero-animation.mp4", thumbnail: "/media/tiger-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "trout-fishin-hero-animation", name: "Trout Fishing", category: "Specialty", collection: "Wildlife", videoUrl: "/media/trout-fishin-hero-animation.mp4", thumbnail: "/media/trout-fishin-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "underwater-leapord-hero-animation", name: "Underwater Leopard", category: "Specialty", collection: "Wildlife", videoUrl: "/media/underwater-leapord-hero-animation.mp4", thumbnail: "/media/underwater-leapord-hero-animation.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
  { id: "welcome-to-axiom", name: "Welcome To Axiom", category: "Specialty", collection: "Abstract", videoUrl: "/media/welcome-to-axiom.mp4", thumbnail: "/media/welcome-to-axiom.mp4", loopTailTrimSec: LOOP_TAIL_TRIM_SEC },
];

export function heroLibraryEntryByUrl(url: string | null | undefined): HeroLibraryEntry | undefined {
  if (!url) return undefined;
  const path = url.split("?")[0] ?? "";
  return HERO_LIBRARY.find((item) => item.videoUrl === path);
}
