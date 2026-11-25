/**
 * Eight high-contrast obsidian storefront themes + slot-generation prompts.
 * Serializable for layout config (SSR-safe).
 */

import { CATALOG_BY_ID, CORE_PUBLIC_NICHES, type CatalogNiche } from "@/config/catalog";
import { resolveDemoLoop } from "@/lib/axiom/branded-demo-loop";
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

export const INLAY_PRESET_IDS = ["surface", "vehicle", "glass", "tool"] as const;
export type InlayPresetId = (typeof INLAY_PRESET_IDS)[number];

export const INLAY_PRESETS: { id: InlayPresetId; label: string; instruction: string }[] = [
  {
    id: "surface",
    label: "Surface inlay",
    instruction: "Paint or inlay the business name into a wall, board, or job-site surface that is already in the photograph.",
  },
  {
    id: "vehicle",
    label: "Vehicle door",
    instruction: "Letter the business name on a vehicle door or panel already in the frame. Leave the rest of the vehicle real.",
  },
  {
    id: "glass",
    label: "Glass etch",
    instruction: "Etch the business name into glass or a window already in the frame. Keep the reflections physical.",
  },
  {
    id: "tool",
    label: "Tool stamp",
    instruction: "Stamp a small business mark onto a tool, case, or material already in the frame.",
  },
];

export function inlayInstruction(id?: string | null): string {
  return INLAY_PRESETS.find((preset) => preset.id === id)?.instruction || INLAY_PRESETS[0].instruction;
}

export const MOTION_PRESET_IDS = [
  "rain",
  "fog",
  "smoke",
  "passing-vehicle",
  "motorcycle",
  "subtle",
  "headlight-neon-flicker",
  "slow-steering-turn",
  "leaf-blowing",
  "tree-leaves-rustle",
  "subtle-river-flow",
  "shooting-star",
  "power-led-on",
  "screen-light-up",
] as const;
export type MotionPresetId = (typeof MOTION_PRESET_IDS)[number];

const MICRO =
  "Move only that one detail a short distance. Do not warp the frame, move the camera, or restage the photograph.";

export const MOTION_PRESETS: { id: MotionPresetId; label: string; instruction: string }[] = [
  {
    id: "rain",
    label: "Rain",
    instruction: `A few rain streaks in the far background. ${MICRO}`,
  },
  {
    id: "fog",
    label: "Fog",
    instruction: `A thin fog bank drifts behind the subject. ${MICRO}`,
  },
  {
    id: "smoke",
    label: "Smoke",
    instruction: `A small wisp of smoke moves behind the subject. ${MICRO}`,
  },
  {
    id: "passing-vehicle",
    label: "Passing car",
    instruction: `One distant car crosses the far street. ${MICRO}`,
  },
  {
    id: "motorcycle",
    label: "Motorcycle",
    instruction: `One distant motorcycle crosses the far background. ${MICRO}`,
  },
  {
    id: "subtle",
    label: "Subtle drift",
    instruction: `A little background light shifts. Add nothing. ${MICRO}`,
  },
  {
    id: "headlight-neon-flicker",
    label: "Headlight flicker",
    instruction: `One headlight or neon tube already in the frame flickers softly once. ${MICRO}`,
  },
  {
    id: "slow-steering-turn",
    label: "Slow steer",
    instruction: `The front wheels of a vehicle already in frame ease a few degrees. ${MICRO}`,
  },
  {
    id: "leaf-blowing",
    label: "Leaves blowing",
    instruction: `A few leaves already on the ground drift along the edge of the frame. ${MICRO}`,
  },
  {
    id: "tree-leaves-rustle",
    label: "Leaf rustle",
    instruction: `Leaves on a tree already in the background shiver. ${MICRO}`,
  },
  {
    id: "subtle-river-flow",
    label: "River flow",
    instruction: `Water already in the frame drifts a short way. Banks and the subject stay locked. ${MICRO}`,
  },
  {
    id: "shooting-star",
    label: "Shooting star",
    instruction: `One faint streak crosses open sky. If there is no sky, a single glint on an existing surface. ${MICRO}`,
  },
  {
    id: "power-led-on",
    label: "LED on",
    instruction: `One existing power LED eases on and holds. ${MICRO}`,
  },
  {
    id: "screen-light-up",
    label: "Screen glow",
    instruction: `One existing screen or phone brightens slightly. ${MICRO}`,
  },
];

export function motionInstruction(id?: string | null): string {
  return MOTION_PRESETS.find((preset) => preset.id === id)?.instruction || MOTION_PRESETS.find((preset) => preset.id === "subtle")!.instruction;
}

/** Autopilot picks one restrained detail that fits the trade. */
export function microMotionForNiche(niche?: string | null): MotionPresetId {
  const id = (niche || "").toLowerCase();
  if (/pool|water|irrigat|river|marine|plumb/.test(id)) return "subtle-river-flow";
  if (/landscap|lawn|garden|tree|nursery/.test(id)) return "leaf-blowing";
  if (/roof|gutter|exterior/.test(id)) return "tree-leaves-rustle";
  if (/electric|hvac|solar|appliance/.test(id)) return "power-led-on";
  if (/sign|print|screen|media|it|computer|phone/.test(id)) return "screen-light-up";
  if (/auto|mechanic|detail|tow|fleet|transport/.test(id)) return "headlight-neon-flicker";
  if (/driv|steer|wheel/.test(id)) return "slow-steering-turn";
  if (/night|bar|event|photo|astro/.test(id)) return "shooting-star";
  return "subtle";
}

export function buildProofTouchupPrompt(input: {
  slotLabel?: string;
  niche?: string;
  themeId?: string;
  shopName?: string;
  brandColor?: string;
  inlay?: string | null;
  logoUrl?: string | null;
}): string {
  const slot = (input.slotLabel || "Proof of Work").trim().slice(0, 80);
  const niche = (input.niche || "contractor").trim().slice(0, 40);
  const shop = (input.shopName || "").trim().slice(0, 80);
  const theme = resolveStorefrontTheme(input.themeId);
  const accent = normalizeBrandHex(input.brandColor) || theme.brandPrimary;
  const logo = (input.logoUrl || "").trim();
  return [
    `Recreate this uploaded ${niche} photograph as a finished branded still for ${shop || "the shop"}.`,
    `Use the uploaded photo as the only source. Do not substitute a library, stock, or animal plate.`,
    `Keep the real subject, tools, materials, and place. Upgrade it: sharp, high contrast, cinematic lighting, controlled shadows.`,
    inlayInstruction(input.inlay),
    `The readable name is "${shop || niche}". Color the mark ${accent}. It sits on a real surface, not a caption bar or slot label.`,
    logo.startsWith("https://") ? `Match the lettering to the shop mark at ${logo}. Paint it into the scene. Do not float a sticker.` : "",
    `Slot intent: ${slot}. Obsidian field ${STOREFRONT_OBSIDIAN}, secondary ${theme.brandSecondary}.`,
    `No extra people. No watermark. No text block that names the slot.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildBackgroundMotionPrompt(input: {
  niche?: string;
  shopName?: string;
  brandColor?: string;
  motion?: string | null;
}): string {
  const niche = (input.niche || "contractor").trim().slice(0, 40);
  const shop = (input.shopName || "").trim().slice(0, 80);
  const accent = normalizeBrandHex(input.brandColor) || "#00FFCC";
  return [
    `Animate only the background of this exact ${niche} photograph${shop ? ` for ${shop}` : ""}.`,
    `Keep the foreground subject, tools, materials, framing, and the embedded business name locked in place.`,
    `This is a micro-motion. One surrounding detail moves. The photograph does not warp.`,
    motionInstruction(input.motion),
    `Accent rim ${accent} may glow. Seamless loop.`,
    `Do not replace the photo. Do not add stock footage, animals, captions, or a different scene.`,
  ].join(" ");
}

/** Reference archetype cards (maps to canonical theme ids). */
export const STUDIO_ARCHETYPE_PRESETS = [
  { themeId: "sparta_gold" as const, label: "Luxora Motors", accent: "Champagne Gold / Black" },
  { themeId: "volt_pulse" as const, label: "Zenith Electric", accent: "Volt Lime / Dark" },
  { themeId: "kaelon_alpine" as const, label: "Kaelon Outdoor", accent: "Warm White / Amber" },
  { themeId: "forge_orange" as const, label: "Axis Works", accent: "Industrial Orange / Grey" },
];

/** Studio loop picker: catalog trades only. Animal films stay on wildlife niches. */
const STUDIO_LOOP_NICHES = [...CORE_PUBLIC_NICHES, "electrical", "hvac"] as const satisfies readonly CatalogNiche[];

export const NICHE_HERO_LOOP_OPTIONS = STUDIO_LOOP_NICHES.map((id) => ({
  id,
  label: CATALOG_BY_ID[id].label,
  url: resolveDemoLoop(id),
}));