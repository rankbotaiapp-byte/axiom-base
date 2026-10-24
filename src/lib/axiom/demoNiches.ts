import {
  HERO_ANIMATOR_RESOLUTION,
  HERO_ANIMATOR_SECONDS,
  canonicalHeroStyle,
  heroAnimatorPrompt,
  type HeroAnimatorPreset,
} from "./hero-animator.ts";

export const DEMO_NICHE_IDS = ["luxury-watches", "organic-skincare", "craft-bourbon"] as const;

export type DemoNicheId = (typeof DEMO_NICHE_IDS)[number];

export type DemoMotion = {
  durationSec: number;
  resolution: typeof HERO_ANIMATOR_RESOLUTION;
  camera: "orbit" | "rise" | "push-in";
};

export type DemoNiche = {
  id: DemoNicheId;
  name: string;
  tagline: string;
  substance: HeroAnimatorPreset;
  imageUrl: string;
  prompt: string;
  motion: DemoMotion;
};

export const DEMO_NICHES: readonly DemoNiche[] = [
  {
    id: "luxury-watches",
    name: "Luxury watches",
    tagline: "Time, held in liquid metal.",
    substance: "liquid_chrome",
    imageUrl: "/media/demo-niches/luxury-watches.png",
    prompt:
      "The watch in the photo emerges from liquid chrome. The case catches a slow orbit as the metal settles into the bracelet. No words, no logo type, no watermark.",
    motion: { durationSec: 5, resolution: "480p", camera: "orbit" },
  },
  {
    id: "organic-skincare",
    name: "Organic skincare",
    tagline: "Light, caught in frost.",
    substance: "frosted_glass",
    imageUrl: "/media/demo-niches/organic-skincare.png",
    prompt:
      "The jar in the photo forms inside frosted glass. Light rises through the frost and rests on the lid. No words, no logo type, no watermark.",
    motion: { durationSec: 5, resolution: "480p", camera: "rise" },
  },
  {
    id: "craft-bourbon",
    name: "Craft bourbon",
    tagline: "Dark grain, cut from carbon.",
    substance: "obsidian_carbon",
    imageUrl: "/media/demo-niches/craft-bourbon.png",
    prompt:
      "The bottle in the photo is cut from obsidian carbon. A slow push-in, amber held in the dark glass. No words, no logo type, no watermark.",
    motion: { durationSec: 5, resolution: "480p", camera: "push-in" },
  },
];

export function demoNicheById(id: unknown): DemoNiche | null {
  if (typeof id !== "string" || !id) return null;
  return DEMO_NICHES.find((niche) => niche.id === id) ?? null;
}

export type HeroIntroPlan = {
  niche: DemoNicheId | "";
  substance: HeroAnimatorPreset;
  prompt: string;
  tagline: string;
  previewUrl: string;
  durationSec: number;
  resolution: typeof HERO_ANIMATOR_RESOLUTION;
  camera: DemoMotion["camera"] | "push-in";
};

/** Niche wins over a loose style pick. Duration stays inside the short-clip cap. */
export function heroIntroPlan(preset: unknown, nicheId: unknown): HeroIntroPlan | null {
  const niche = demoNicheById(nicheId);
  if (typeof nicheId === "string" && nicheId && !niche) return null;
  const substance = niche?.substance ?? canonicalHeroStyle(preset);
  if (!substance) return null;
  const durationSec = Math.min(
    HERO_ANIMATOR_SECONDS,
    Math.max(1, niche?.motion.durationSec ?? HERO_ANIMATOR_SECONDS),
  );
  return {
    niche: niche?.id ?? "",
    substance,
    prompt: niche?.prompt ?? heroAnimatorPrompt(substance),
    tagline: niche?.tagline ?? "",
    previewUrl: niche?.imageUrl ?? "",
    durationSec,
    resolution: HERO_ANIMATOR_RESOLUTION,
    camera: niche?.motion.camera ?? "push-in",
  };
}
