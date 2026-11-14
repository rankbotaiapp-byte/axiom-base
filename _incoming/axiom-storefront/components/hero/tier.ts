/** Performance tiers for the hero. Decided once on the client, before three.js loads. */
export type HeroTier = "off" | "low" | "medium" | "high";

export interface TierBudget {
  shards: number;
  particles: number;
  transmission: boolean;
  bokeh: boolean;
  segments: [number, number];
  pixelRatio: number;
}

export const budgets: Record<Exclude<HeroTier, "off">, TierBudget> = {
  low: { shards: 36, particles: 350, transmission: false, bokeh: false, segments: [96, 54], pixelRatio: 1 },
  medium: { shards: 90, particles: 900, transmission: true, bokeh: false, segments: [128, 72], pixelRatio: 1.5 },
  high: { shards: 170, particles: 1800, transmission: true, bokeh: true, segments: [192, 108], pixelRatio: 2 },
};

export function detectTier(): HeroTier {
  if (typeof window === "undefined") return "off";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return "off";

  // WebGL2 is required (transmission + instancing).
  try {
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2")) return "off";
  } catch {
    return "off";
  }

  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const slowNet = nav.connection?.effectiveType && /(^|-)2g|3g/.test(nav.connection.effectiveType);

  if (mem <= 2 || cores <= 4 || slowNet) return "low";
  if (coarse) return "medium";
  return cores >= 8 && mem >= 8 ? "high" : "medium";
}
