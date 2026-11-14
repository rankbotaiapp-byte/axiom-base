import { resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";

export const BLENDER_EFFECTS = ["hydro-splash", "frost-crystals", "embers-sparks"] as const;
export type BlenderEffect = (typeof BLENDER_EFFECTS)[number];

const NICHE_EFFECT: Partial<Record<CatalogNiche, BlenderEffect>> = {
  plumbing: "hydro-splash",
  "water-systems": "hydro-splash",
  hvac: "frost-crystals",
  auto: "embers-sparks",
  electrical: "embers-sparks",
  machining: "embers-sparks",
  fabrication: "embers-sparks",
};

export function blenderEffectForNiche(niche?: string | null, seed = 0): BlenderEffect {
  const id = resolveCatalogNiche(niche);
  const pinned = NICHE_EFFECT[id];
  if (pinned) return pinned;
  return BLENDER_EFFECTS[Math.abs(seed) % BLENDER_EFFECTS.length]!;
}

export function blenderEffectLabel(effect: BlenderEffect): string {
  if (effect === "hydro-splash") return "Hydro-Splash";
  if (effect === "frost-crystals") return "Frost Crystals";
  return "Embers & Sparks";
}

/** Shader / director index: 0 hydro, 1 frost, 2 embers. */
export function blenderEffectIndex(effect: BlenderEffect): number {
  return BLENDER_EFFECTS.indexOf(effect);
}
