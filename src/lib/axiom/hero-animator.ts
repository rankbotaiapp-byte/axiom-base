/** One-click hero intros. A short, cheap clip so a single click does not run a long render. */

export const HERO_ANIMATOR_PRESETS = ["liquid_chrome", "frosted_glass", "obsidian_carbon"] as const;

export type HeroAnimatorPreset = (typeof HERO_ANIMATOR_PRESETS)[number];

const LEGACY_PRESETS = {
  liquid_chrome_orb: "liquid_chrome",
  crystal_glass_shatter: "frosted_glass",
  neon_metallic_genesis: "obsidian_carbon",
} as const;

export type HeroAnimatorStyle = HeroAnimatorPreset | keyof typeof LEGACY_PRESETS;

export const HERO_ANIMATOR_LABEL: Record<HeroAnimatorPreset, string> = {
  liquid_chrome: "Liquid chrome",
  frosted_glass: "Frosted glass",
  obsidian_carbon: "Obsidian carbon",
};

export const HERO_ANIMATOR_MODEL = "grok-imagine-video-1.5-lite";
export const HERO_ANIMATOR_SECONDS = 5;
export const HERO_ANIMATOR_RESOLUTION = "480p";
export const HERO_ANIMATOR_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const PROMPTS: Record<HeroAnimatorPreset, string> = {
  liquid_chrome:
    "A liquid chrome orb opens and becomes the product in the photo. Heavy metal ripples, then a slow orbit. No words, no logo type, no watermark.",
  frosted_glass:
    "Frosted glass gathers light and becomes the product in the photo. Soft refraction, a quiet rise. No words, no logo type, no watermark.",
  obsidian_carbon:
    "Obsidian carbon splits and reveals the product in the photo. Dark facets, a slow push-in. No words, no logo type, no watermark.",
};

export function canonicalHeroStyle(value: unknown): HeroAnimatorPreset | null {
  if (typeof value !== "string") return null;
  if ((HERO_ANIMATOR_PRESETS as readonly string[]).includes(value)) return value as HeroAnimatorPreset;
  return LEGACY_PRESETS[value as keyof typeof LEGACY_PRESETS] ?? null;
}

export function isHeroAnimatorPreset(value: unknown): value is HeroAnimatorStyle {
  return canonicalHeroStyle(value) !== null;
}

export function heroAnimatorPrompt(preset: HeroAnimatorStyle): string {
  const style = canonicalHeroStyle(preset);
  return style ? PROMPTS[style] : PROMPTS.liquid_chrome;
}

export function clipHeroTagline(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}
