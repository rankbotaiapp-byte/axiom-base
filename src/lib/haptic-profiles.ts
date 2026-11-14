/**
 * LRA vibration signatures for cinematic hero loops.
 * Patterns are [vibrate, pause, vibrate, ...] milliseconds for navigator.vibrate.
 */

export const HAPTIC_CTA_CLICK = [25] as const;

export const HAPTIC_PROFILES = {
  mistSpray: [8, 16, 7, 18, 9, 14, 8, 20, 6, 22, 8],
  waterTrickle: [14, 240, 12, 260, 16, 230, 12, 280, 14],
  waterBurst: [80, 28, 48, 36, 28, 50, 16, 70, 10, 90, 8],
  heavySplash: [55, 22, 70, 30, 40, 45, 22, 60, 12],
  kineticBurst: [22, 18, 40, 16, 18, 22, 30],
  ambientEmbers: [10, 90, 8, 110, 12, 80, 9, 120],
  neonSpark: [16, 38, 11, 42, 20, 28, 9],
} as const;

export type HapticProfileId = keyof typeof HAPTIC_PROFILES;

export type CinematicEffectId =
  | "waterTrickle"
  | "atmosphericMist"
  | "waterBurst"
  | "heavySplash"
  | "kineticBurst"
  | "ambientEmbers"
  | "neonSpark";

export type BrandMarkStyle = "frost" | "etch" | "decal";

export type EffectFamily = "water" | "energy";

export type TimeCue = { at: number; pattern: readonly number[] };

export type CinematicEffect = {
  id: CinematicEffectId;
  family: EffectFamily;
  label: string;
  detail: string;
  haptic: HapticProfileId;
  loopUrl: string;
  cues: readonly TimeCue[];
};

export const CINEMATIC_EFFECTS: readonly CinematicEffect[] = [
  {
    id: "waterTrickle",
    family: "water",
    label: "Water Trickle",
    detail: "Steady drip cadence over a plumber loop.",
    haptic: "waterTrickle",
    loopUrl: "/media/axio-plumber-hero.mp4",
    cues: [
      { at: 0.9, pattern: [12] },
      { at: 2.4, pattern: [14] },
      { at: 4.1, pattern: [12] },
    ],
  },
  {
    id: "atmosphericMist",
    family: "water",
    label: "Atmospheric Mist",
    detail: "Volumetric fog field. Light fluttering pulses.",
    haptic: "mistSpray",
    loopUrl: "/media/infrastructure-hero-animation.mp4",
    cues: [
      { at: 0.4, pattern: [8, 16, 8] },
      { at: 2.8, pattern: [7, 18, 7] },
    ],
  },
  {
    id: "waterBurst",
    family: "water",
    label: "High-Impact Water Burst",
    detail: "Shockwave spike, then a decaying ripple.",
    haptic: "waterBurst",
    loopUrl: "/media/abyssal-hero-loop.mp4",
    cues: [
      { at: 0.15, pattern: [70, 24, 36] },
      { at: 1.8, pattern: [28, 40, 12] },
    ],
  },
  {
    id: "heavySplash",
    family: "water",
    label: "Heavy Splashing Wave",
    detail: "Mass water hit with a long wash-out.",
    haptic: "heavySplash",
    loopUrl: "/media/otter-hero-animation.mp4",
    cues: [
      { at: 0.55, pattern: [60, 20, 40] },
      { at: 3.2, pattern: [36] },
    ],
  },
  {
    id: "kineticBurst",
    family: "energy",
    label: "Kinetic Particle Burst",
    detail: "Metallic sparks without in-browser physics.",
    haptic: "kineticBurst",
    loopUrl: "/media/auto-hero-animation.mp4",
    cues: [
      { at: 0.3, pattern: [22, 16, 36] },
      { at: 2.1, pattern: [18, 14, 28] },
    ],
  },
  {
    id: "ambientEmbers",
    family: "energy",
    label: "Ambient Embers",
    detail: "Slow heat motes over carbon film.",
    haptic: "ambientEmbers",
    loopUrl: "/media/polar-bear-hero-animation.mp4",
    cues: [{ at: 1.2, pattern: [10, 80, 8] }],
  },
  {
    id: "neonSpark",
    family: "energy",
    label: "Neon Spark Trace",
    detail: "Cyan edge snaps. HUD lock #00f2fe.",
    haptic: "neonSpark",
    loopUrl: "/media/electrician-hero-animation.mp4",
    cues: [
      { at: 0.2, pattern: [16, 30, 12] },
      { at: 1.6, pattern: [18] },
      { at: 3.4, pattern: [11, 36, 16] },
    ],
  },
] as const;

export const EFFECT_TREE: { family: EffectFamily; label: string; ids: CinematicEffectId[] }[] = [
  {
    family: "water",
    label: "Water Physics",
    ids: ["waterTrickle", "atmosphericMist", "waterBurst", "heavySplash"],
  },
  {
    family: "energy",
    label: "Particle & Energy",
    ids: ["kineticBurst", "ambientEmbers", "neonSpark"],
  },
];

export function cinematicEffect(id: string | null | undefined): CinematicEffect {
  return CINEMATIC_EFFECTS.find((item) => item.id === id) ?? CINEMATIC_EFFECTS[1]!;
}

export function parseCinematicEffect(value: unknown): CinematicEffectId {
  return CINEMATIC_EFFECTS.some((item) => item.id === value) ? (value as CinematicEffectId) : "atmosphericMist";
}

export function parseBrandMark(value: unknown): BrandMarkStyle {
  return value === "etch" || value === "decal" ? value : "frost";
}

export function autopilotEffectForNiche(niche: string): CinematicEffectId {
  const hay = niche.toLowerCase();
  if (/plumb|water|drain/.test(hay)) return "waterTrickle";
  if (/electric|spark/.test(hay)) return "neonSpark";
  if (/auto|detail|moto/.test(hay)) return "kineticBurst";
  if (/landscape|garden|lawn/.test(hay)) return "atmosphericMist";
  if (/weld|fab|forge|fire/.test(hay)) return "ambientEmbers";
  return "atmosphericMist";
}

function motionQuiet() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobileHapticViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}

/** Intersection ratio that counts as "hero in view" — lower on phones so scroll still arms LRA. */
export function heroInViewThreshold(mobile = isMobileHapticViewport()): number {
  return mobile ? 0.2 : 0.45;
}

export function unlockHaptics() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(0);
  } catch {
    /* iOS has no vibrate; Android unlocks the motor on a user gesture. */
  }
}

export function vibratePattern(pattern: number | readonly number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (motionQuiet()) return false;
  try {
    const pulse: number | number[] = typeof pattern === "number" ? pattern : [...pattern];
    return navigator.vibrate(pulse);
  } catch {
    return false;
  }
}

export function fireCtaHaptic() {
  return vibratePattern(HAPTIC_CTA_CLICK);
}

export function fireProfileHaptic(id: HapticProfileId) {
  return vibratePattern(HAPTIC_PROFILES[id]);
}

/** Fire each cue once per loop. Returns the updated set of consumed cue indexes. */
export function consumeTimeCues(
  cues: readonly TimeCue[],
  currentTime: number,
  previousTime: number,
  fired: ReadonlySet<number>,
): Set<number> {
  const next = new Set(fired);
  if (currentTime + 0.05 < previousTime) next.clear();
  cues.forEach((cue, index) => {
    if (next.has(index)) return;
    if (previousTime < cue.at && currentTime >= cue.at) {
      vibratePattern(cue.pattern);
      next.add(index);
    }
  });
  return next;
}
