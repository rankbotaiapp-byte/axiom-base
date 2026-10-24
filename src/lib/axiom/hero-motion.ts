import { isBrandedHeroStill } from "./hero-brand.ts";
import { isCatalogHeroUrl } from "./hero-films.ts";
import { isCustomHeroVideo } from "./hero-video.ts";
import { twoWordBrand, type TwoWordBrand } from "./particle-brand.ts";

export const HERO_MOTIONS = [
  { id: "pan", label: "3D Cinematic Pan" },
  { id: "ripple", label: "Water Ripple Lake Glass" },
  { id: "neon", label: "Neon Edge Glow" },
  { id: "particle", label: "Particle Swipe Reveal" },
] as const;

export type HeroMotionId = (typeof HERO_MOTIONS)[number]["id"];

export type HeroMotionState = Record<HeroMotionId, boolean>;

export const EMPTY_HERO_MOTION: HeroMotionState = {
  pan: false,
  ripple: false,
  neon: false,
  particle: false,
};

const PRESET_LABELS: Record<string, string> = {
  field: "Auto Repair",
  landscaper: "Landscaping",
  contractor: "Trades",
  fitness: "Fitness",
  wellness: "Wellness",
  lessons: "Lessons",
  salon: "Salon",
  beauty: "Beauty",
  tattoo: "Tattoo",
  photo: "Photo",
  pets: "Pets",
  dogwalk: "Dog walking",
  detailer: "Auto detail",
  therapy: "Therapy",
  clean: "Cleaning",
  locksmith: "Locksmith",
  firewood: "Firewood",
  security: "Security",
  practice: "Practice",
  counsel: "Counsel",
  events: "Events",
  location: "Barber",
  hunting: "Hunting",
  creator: "Cinema",
};

export function heroPresetLabel(niche: string, fallback: string): string {
  const label = PRESET_LABELS[niche];
  return label || fallback.trim() || niche;
}

/** Missing motion stays empty. A saved object only keeps the four switches. */
export function parseHeroMotion(raw: unknown): HeroMotionState {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    pan: record.pan === true,
    ripple: record.ripple === true,
    neon: record.neon === true,
    particle: record.particle === true,
  };
}

export type HeroMotionPreview = TwoWordBrand & {
  mediaUrl: string;
  kind: "video" | "image";
};

/** The overlay mark and the niche film that can actually play from public/media/heroes. */
export function heroMotionPreview(business: string, fallback: string, video: string, image: string): HeroMotionPreview {
  const brand = twoWordBrand(business, fallback);
  const film = isCatalogHeroUrl(video) ? video : "";
  const still = image.startsWith("/media/heroes/") && !image.includes("..") ? image : "";
  return {
    ...brand,
    mediaUrl: film || still,
    kind: film ? "video" : "image",
  };
}

export type LiveHeroDraft = {
  upload: "video" | "image" | null;
  catalogVideo: string;
  catalogImage: string;
};

export type LiveHeroPlan = {
  uploadVideo: boolean;
  catalogFilm?: string;
  /** "upload" means the caller still has to encode the photo. A heroes path is stored as-is. */
  heroImageUrl?: string;
  introPreset?: "cinematic-pan";
  glowEnabled: boolean;
  motion: HeroMotionState;
  mediaPath: string;
};

/** A shop-owned film or still. Catalog paths stay on the niche hero. */
export function ownerHeroMedia(
  video: string | readonly string[] | null | undefined,
  image: string | null | undefined,
): { video: string; image: string } | null {
  const list = Array.isArray(video) ? video : typeof video === "string" && video ? [video] : [];
  const film = list.find((url) => isCustomHeroVideo(url)) ?? "";
  const still =
    typeof image === "string" && (image.startsWith("data:image/") || isBrandedHeroStill(image)) ? image : "";
  if (!film && !still) return null;
  return { video: film, image: still };
}

/** What Set as Live Hero writes. An upload wins over a niche preset. Unknown films are dropped. */
export function planLiveHero(draft: LiveHeroDraft, motion: HeroMotionState): LiveHeroPlan {
  const clean = parseHeroMotion(motion);
  const plan: LiveHeroPlan = {
    uploadVideo: draft.upload === "video",
    glowEnabled: clean.neon,
    motion: clean,
    mediaPath: "",
  };
  if (clean.pan) plan.introPreset = "cinematic-pan";
  if (draft.upload === "video") {
    plan.mediaPath = "upload";
    return plan;
  }
  if (draft.upload === "image") {
    plan.heroImageUrl = "upload";
    plan.mediaPath = "upload";
    return plan;
  }
  const video = draft.catalogVideo.trim();
  if (isCatalogHeroUrl(video)) {
    plan.catalogFilm = video;
    plan.mediaPath = video;
    return plan;
  }
  const image = draft.catalogImage.trim();
  if (image.startsWith("/media/heroes/") && !image.includes("..")) {
    plan.heroImageUrl = image;
    plan.mediaPath = image;
  }
  return plan;
}
