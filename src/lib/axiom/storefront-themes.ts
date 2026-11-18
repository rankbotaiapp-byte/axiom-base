/**
 * Eight high-contrast obsidian storefront themes + slot-generation prompts.
 * Serializable for layout config (SSR-safe).
 */

import { composeNeuralPrompt } from "@/lib/axiom/studio-engine";

export const STOREFRONT_OBSIDIAN = "#050507";
export const STOREFRONT_THEME_STORAGE_KEY = "axiom.storefront.theme.v1";

export const STOREFRONT_THEME_IDS = [
  "cyber_cyan",
  "nebula_magenta",
  "abyssal_ocean",
  "sparta_gold",
  "volt_pulse",
  "apex_crimson",
  "forge_orange",
  "kaelon_alpine",
] as const;

export type StorefrontThemeId = (typeof STOREFRONT_THEME_IDS)[number];

export type StorefrontTheme = {
  id: StorefrontThemeId;
  label: string;
  brandPrimary: string;
  brandSecondary: string;
  brandGlow: string;
  tagline: string;
};

export const STOREFRONT_THEMES: Record<StorefrontThemeId, StorefrontTheme> = {
  cyber_cyan: {
    id: "cyber_cyan",
    label: "Cyber Cyan",
    brandPrimary: "#00f2fe",
    brandSecondary: "#7ec8e3",
    brandGlow: "#b8f8ff",
    tagline: "HUD cyan crosshairs on obsidian glass.",
  },
  nebula_magenta: {
    id: "nebula_magenta",
    label: "Nebula Magenta",
    brandPrimary: "#ff2a8a",
    brandSecondary: "#b967ff",
    brandGlow: "#ffb8e8",
    tagline: "Violet nebula rim on deep field noir.",
  },
  abyssal_ocean: {
    id: "abyssal_ocean",
    label: "Abyssal Ocean",
    brandPrimary: "#1a8cff",
    brandSecondary: "#00e5c0",
    brandGlow: "#7ec8ff",
    tagline: "Pressure-depth blues with bioluminescent edge.",
  },
  sparta_gold: {
    id: "sparta_gold",
    label: "Sparta Gold",
    brandPrimary: "#d4af37",
    brandSecondary: "#f5e6b8",
    brandGlow: "#fff4cc",
    tagline: "Champagne tactical gold on matte obsidian.",
  },
  volt_pulse: {
    id: "volt_pulse",
    label: "Volt Pulse",
    brandPrimary: "#c6ff00",
    brandSecondary: "#9dff00",
    brandGlow: "#e8ffb3",
    tagline: "High-voltage lime telemetry strokes.",
  },
  apex_crimson: {
    id: "apex_crimson",
    label: "Apex Crimson",
    brandPrimary: "#ff2a3d",
    brandSecondary: "#ff6b6b",
    brandGlow: "#ffb8c0",
    tagline: "Crimson structural edge light on carbon HUD.",
  },
  forge_orange: {
    id: "forge_orange",
    label: "Forge Orange",
    brandPrimary: "#ff4d1a",
    brandSecondary: "#ffb020",
    brandGlow: "#ffb899",
    tagline: "Industrial forge heat on field-ready obsidian.",
  },
  kaelon_alpine: {
    id: "kaelon_alpine",
    label: "Kaelon Alpine",
    brandPrimary: "#f59e0b",
    brandSecondary: "#fff7ed",
    brandGlow: "#fde68a",
    tagline: "Warm alpine amber trust lighting.",
  },
};

/** Legacy 4-skin ids → canonical theme ids. */
const LEGACY_THEME_ALIASES: Record<string, StorefrontThemeId> = {
  luxora: "sparta_gold",
  zenith: "volt_pulse",
  kaelon: "kaelon_alpine",
  axis: "forge_orange",
};

export const TEMPLATE_SKIN_IDS = STOREFRONT_THEME_IDS;
export type TemplateSkinId = StorefrontThemeId;
export type StorefrontArchetypeSkin = StorefrontTheme;
export const STOREFRONT_ARCHETYPE_SKINS = STOREFRONT_THEMES;

const HEX_6 = /^#?[0-9a-fA-F]{6}$/;

export function normalizeBrandHex(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (!HEX_6.test(raw)) return "";
  return `#${raw.replace(/^#/, "").toLowerCase()}`;
}

export function isStorefrontThemeId(value: string | null | undefined): value is StorefrontThemeId {
  if (!value) return false;
  return (STOREFRONT_THEME_IDS as readonly string[]).includes(value.trim().toLowerCase());
}

export function isTemplateSkinId(value: string | null | undefined): boolean {
  const id = value?.trim().toLowerCase();
  if (!id) return false;
  return isStorefrontThemeId(id) || id in LEGACY_THEME_ALIASES;
}

export function resolveStorefrontTheme(value: string | null | undefined): StorefrontTheme {
  const id = value?.trim().toLowerCase();
  if (isStorefrontThemeId(id)) return STOREFRONT_THEMES[id];
  if (id && LEGACY_THEME_ALIASES[id]) return STOREFRONT_THEMES[LEGACY_THEME_ALIASES[id]];
  return STOREFRONT_THEMES.cyber_cyan;
}

export function resolveTemplateSkin(value: string | null | undefined): StorefrontTheme {
  return resolveStorefrontTheme(value);
}

export type BrandCssVars = {
  "--brand-primary": string;
  "--brand-secondary": string;
  "--brand-glow": string;
};

export function themeCssVars(
  theme: StorefrontThemeId | StorefrontTheme,
  overridePrimary?: string | null,
): BrandCssVars {
  const resolved = typeof theme === "string" ? resolveStorefrontTheme(theme) : theme;
  const primary = normalizeBrandHex(overridePrimary) || resolved.brandPrimary;
  return {
    "--brand-primary": primary,
    "--brand-secondary": resolved.brandSecondary,
    "--brand-glow": resolved.brandGlow,
  };
}

export function brandCssVarsFromSkin(
  skin: StorefrontThemeId | StorefrontTheme,
  overridePrimary?: string | null,
): BrandCssVars {
  return themeCssVars(skin, overridePrimary);
}

export function oneClickBrandOverride(primaryHex: string, glowHex?: string | null): BrandCssVars {
  const primary = normalizeBrandHex(primaryHex);
  if (!primary) return themeCssVars("cyber_cyan");
  return {
    "--brand-primary": primary,
    "--brand-secondary": primary,
    "--brand-glow": normalizeBrandHex(glowHex) || glowFromPrimary(primary),
  };
}

export function applyBrandColorOverride(
  target: HTMLElement | null | undefined,
  primaryHex: string,
  glowHex?: string | null,
): BrandCssVars {
  const vars = oneClickBrandOverride(primaryHex, glowHex);
  if (target) {
    target.style.setProperty("--brand-primary", vars["--brand-primary"]);
    target.style.setProperty("--brand-secondary", vars["--brand-secondary"]);
    target.style.setProperty("--brand-glow", vars["--brand-glow"]);
  }
  return vars;
}

function glowFromPrimary(primary: string): string {
  const normalized = normalizeBrandHex(primary);
  if (!normalized) return STOREFRONT_THEMES.cyber_cyan.brandGlow;
  const { r, g, b } = hexToRgb(normalized);
  const mix = (channel: number) => Math.min(255, Math.round(channel * 0.55 + 255 * 0.45));
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const body = hex.replace(/^#/, "");
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  };
}

export function buildSlotBrandedPrompt(input: {
  slotLabel: string;
  niche: string;
  brandColor?: string;
  themeId?: string;
  templateSkin?: string;
  userPrompt?: string;
  shopName?: string;
}): string {
  const theme = resolveStorefrontTheme(input.themeId || input.templateSkin);
  const accent = normalizeBrandHex(input.brandColor) || theme.brandPrimary;
  const slot = input.slotLabel.trim().slice(0, 80) || "Proof of Work";
  const extra = (input.userPrompt || "").trim().slice(0, 400);
  const scene = [
    `Storefront layout slot "${slot}" on obsidian field ${STOREFRONT_OBSIDIAN}.`,
    `Theme ${theme.label}: primary ${theme.brandPrimary}, secondary ${theme.brandSecondary}, glow ${theme.brandGlow}.`,
    `Tenant accent override ${accent} on HUD strokes and CTA rim.`,
    extra,
  ]
    .filter(Boolean)
    .join(" ");

  return composeNeuralPrompt({
    niche: input.niche,
    shopName: input.shopName,
    sceneHint: scene,
    accent,
    medium: "image",
  });
}

export function buildProofTouchupPrompt(input: {
  slotLabel?: string;
  niche?: string;
  themeId?: string;
}): string {
  const slot = (input.slotLabel || "Proof of Work").trim().slice(0, 80);
  const niche = (input.niche || "contractor").trim().slice(0, 40);
  const theme = resolveStorefrontTheme(input.themeId);
  return [
    `Enhance this real ${niche} job-site photo for storefront slot "${slot}".`,
    `Preserve composition, subjects, tools, materials, and scene geometry — structure-preserving sharpen only.`,
    `Lift exposure and local contrast; clean noise; recover detail in shadows without halos.`,
    `Subtle brand rim light ${theme.brandPrimary} and secondary ${theme.brandSecondary} on edges only.`,
    `Dissolve into obsidian mat ${STOREFRONT_OBSIDIAN} — feathered alpha, no hard rectangle, no box crop.`,
    `No extra people. No stock swap. No watermark.`,
  ].join(" ");
}

/** Reference archetype cards (maps to canonical theme ids). */
export const STUDIO_ARCHETYPE_PRESETS = [
  { themeId: "sparta_gold" as const, label: "Luxora Motors", accent: "Champagne Gold / Black" },
  { themeId: "volt_pulse" as const, label: "Zenith Electric", accent: "Volt Lime / Dark" },
  { themeId: "kaelon_alpine" as const, label: "Kaelon Outdoor", accent: "Warm White / Amber" },
  { themeId: "forge_orange" as const, label: "Axis Works", accent: "Industrial Orange / Grey" },
];

export const NICHE_HERO_LOOP_OPTIONS = [
  { id: "axiom-robot", label: "Axiom Robot Loop", url: "/media/axiom-robot-hero.mp4" },
  { id: "studio-ref", label: "Studio Reference Loop", url: "/media/studio-references/hero-loop-optimized.mp4" },
  { id: "heart-machine", label: "Heart Machine", url: "/media/heart-machine.mp4" },
  { id: "character", label: "Character Plate", url: "/media/axiom-character.mp4" },
  { id: "ai-guy", label: "AI Guy Pulse", url: "/media/ai-guy.mp4" },
  { id: "plumber", label: "Contractor 24/7", url: "/media/Axiom_24_7 Booking for Contractors_720p_caption.mp4" },
] as const;