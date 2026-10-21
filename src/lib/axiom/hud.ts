import type { CSSProperties } from "react";
import { isOutdoorGuideNiche } from "./media.ts";
import { sanitizeAccent, sanitizeContactLine, sanitizeLogoUrl } from "./prospect-brand.ts";

/** Closed wash presets. The stylesheet owns the gradients. */
export const HERO_WASHES = ["obsidian", "ember", "tide", "copper"] as const;
export const FADE_STEPS = [28, 44, 60, 76, 92] as const;
export const GLOW_STEPS = [0, 25, 50, 75, 100] as const;
export const CARD_STEPS = [0.38, 0.52, 0.66, 0.82] as const;
export const BLUR_STEPS = [12, 18, 28, 40] as const;
export const FORCE_STEPS = [8, 16, 24, 32, 20] as const;
export const RADIUS_STEPS = [80, 140, 220, 300, 170] as const;
export const DAMP_STEPS = [6, 10, 14, 20] as const;
export const DEPTH_STEPS = [0, 0.35, 0.7, 1, 1.25] as const;

export type HeroWash = (typeof HERO_WASHES)[number];
export type HeroPick = "film" | "still" | "url";

export const HERO_LAYER_IDS = ["headline", "subheadline", "cta_button"] as const;
export type HeroLayerId = (typeof HERO_LAYER_IDS)[number];

export const HERO_FONTS = ["Outfit", "Instrument Serif", "Inter", "Playfair Display", "Fira Code", "Montserrat"] as const;
export type HeroFont = (typeof HERO_FONTS)[number];

export const HERO_EFFECTS = ["none", "shimmer", "pulsating", "flicker"] as const;
export type HeroEffect = (typeof HERO_EFFECTS)[number];

export const HERO_LAYER_LABELS: Record<HeroLayerId, string> = {
  headline: "Headline",
  subheadline: "Subheadline",
  cta_button: "CTA Text",
};

export const HERO_EFFECT_LABELS: Record<HeroEffect, string> = {
  none: "None",
  shimmer: "Metallic Shimmer",
  pulsating: "Pulsating Glow",
  flicker: "Neon Light Flicker",
};

/** One positioned hero text layer. Coordinates are percentages of the hero canvas. */
export type HeroTextLayer = {
  text: string;
  position: { x: number; y: number };
  fontFamily: HeroFont;
  colorMode: "solid" | "gradient";
  solidColor: string;
  gradientCss: string;
  effect: HeroEffect;
};

export type HeroTextLayout = Record<HeroLayerId, HeroTextLayer>;

export type StorefrontHud = {
  wash: HeroWash;
  fade: (typeof FADE_STEPS)[number];
  glow: (typeof GLOW_STEPS)[number];
  /** Mirrors layers.subheadline.text so older readers keep the same line. */
  headline: string;
  heroPick: HeroPick;
  heroUrl: string;
  card: number;
  blur: number;
  rim: boolean;
  scan: boolean;
  /** Index into FORCE_STEPS. Peak slide, in pixels. */
  force: number;
  /** Index into RADIUS_STEPS. */
  radius: number;
  /** Index into DAMP_STEPS. */
  damp: number;
  /** Index into DEPTH_STEPS. */
  depth: number;
  layers: HeroTextLayout;
};

const LAYER_TEXT_LIMIT: Record<HeroLayerId, number> = {
  headline: 140,
  subheadline: 180,
  cta_button: 48,
};

function layerDefaults(id: HeroLayerId): HeroTextLayer {
  if (id === "headline") {
    return {
      text: "",
      position: { x: 5, y: 46 },
      fontFamily: "Instrument Serif",
      colorMode: "solid",
      solidColor: "#F3F1EB",
      gradientCss: "linear-gradient(105deg, #F3F1EB 0%, #2EE6D6 42%, #F3F1EB 78%)",
      effect: "none",
    };
  }
  if (id === "subheadline") {
    return {
      text: "",
      position: { x: 5, y: 68 },
      fontFamily: "Outfit",
      colorMode: "solid",
      solidColor: "#F3F1EB",
      gradientCss: "linear-gradient(100deg, #F3F1EB 0%, #9A9AA3 100%)",
      effect: "none",
    };
  }
  return {
    text: "",
    position: { x: 5, y: 74 },
    fontFamily: "Outfit",
    colorMode: "solid",
    solidColor: "#F3F1EB",
    gradientCss: "linear-gradient(100deg, #2EE6D6 0%, #F3F1EB 100%)",
    effect: "none",
  };
}

export function defaultHeroLayout(): HeroTextLayout {
  return {
    headline: layerDefaults("headline"),
    subheadline: layerDefaults("subheadline"),
    cta_button: layerDefaults("cta_button"),
  };
}

export function cloneHeroLayout(layout: HeroTextLayout): HeroTextLayout {
  return {
    headline: { ...layout.headline, position: { ...layout.headline.position } },
    subheadline: { ...layout.subheadline, position: { ...layout.subheadline.position } },
    cta_button: { ...layout.cta_button, position: { ...layout.cta_button.position } },
  };
}

export type LookPresetId = "studio" | "frost" | "minimal";

export type LookPreset = {
  id: LookPresetId;
  label: string;
  line: string;
  hud: Pick<StorefrontHud, "wash" | "fade" | "glow" | "blur" | "force" | "radius" | "damp" | "depth" | "rim" | "scan" | "card">;
};

/** Public looks. The step indexes stay inside the closed slider tables. */
export const LOOK_PRESETS: readonly LookPreset[] = [
  {
    id: "studio",
    label: "High-Tech Studio",
    line: "A bright rim, a deep field, and a live scan.",
    hud: { wash: "obsidian", fade: 76, glow: 100, blur: 3, force: 3, radius: 2, damp: 1, depth: 4, rim: true, scan: true, card: 1 },
  },
  {
    id: "frost",
    label: "Frosted Glass",
    line: "Soft glass, a wide field, and a slow settle.",
    hud: { wash: "tide", fade: 60, glow: 25, blur: 3, force: 1, radius: 3, damp: 3, depth: 2, rim: true, scan: false, card: 2 },
  },
  {
    id: "minimal",
    label: "Clean Minimal",
    line: "Quiet type, a short reach, and no glow.",
    hud: { wash: "obsidian", fade: 44, glow: 0, blur: 0, force: 0, radius: 0, damp: 2, depth: 0, rim: false, scan: false, card: 0 },
  },
];

export function activeLookPreset(hud: StorefrontHud): LookPresetId | null {
  const match = LOOK_PRESETS.find((preset) => {
    const look = preset.hud;
    return (
      look.wash === hud.wash &&
      look.fade === hud.fade &&
      look.glow === hud.glow &&
      look.blur === hud.blur &&
      look.force === hud.force &&
      look.radius === hud.radius &&
      look.damp === hud.damp &&
      look.depth === hud.depth &&
      look.rim === hud.rim &&
      look.scan === hud.scan &&
      look.card === hud.card
    );
  });
  return match?.id ?? null;
}

export const DEFAULT_HUD: StorefrontHud = {
  wash: "obsidian",
  fade: 60,
  glow: 50,
  headline: "",
  heroPick: "film",
  heroUrl: "",
  card: 1,
  blur: 2,
  rim: true,
  scan: true,
  force: 1,
  radius: 1,
  damp: 1,
  depth: 2,
  layers: defaultHeroLayout(),
};

const VIDEO = /\.(mp4|webm|mov)(?:$|[?#])/i;

function nearest<T extends number>(steps: readonly T[], value: number): T {
  return steps.reduce((best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best));
}

function indexOf(length: number, value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n >= length) return fallback;
  return n;
}

function percent(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}

/** A gradient function only. urls, expressions, and extra declarations are dropped. */
export function sanitizeGradient(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 240);
  if (!raw) return fallback;
  if (/url\s*\(|expression\s*\(|javascript:|@import|[;{}<>]|&/i.test(raw)) return fallback;
  if (!/^(linear|radial|conic)-gradient\([^()]*(?:\([^()]*\)[^()]*)*\)$/i.test(raw)) return fallback;
  return raw;
}

function parseLayer(id: HeroLayerId, raw: unknown, legacyText = ""): HeroTextLayer {
  const base = layerDefaults(id);
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const position =
    record?.position && typeof record.position === "object" ? (record.position as Record<string, unknown>) : {};
  const font =
    record && HERO_FONTS.includes(record.fontFamily as HeroFont) ? (record.fontFamily as HeroFont) : base.fontFamily;
  const effect = record && HERO_EFFECTS.includes(record.effect as HeroEffect) ? (record.effect as HeroEffect) : "none";
  const mode = record?.colorMode === "gradient" ? "gradient" : "solid";
  const text = record
    ? sanitizeContactLine(record.text, LAYER_TEXT_LIMIT[id])
    : sanitizeContactLine(legacyText, LAYER_TEXT_LIMIT[id]);
  return {
    text,
    position: {
      x: percent(position.x, base.position.x),
      y: percent(position.y, base.position.y),
    },
    fontFamily: font,
    colorMode: mode,
    solidColor: sanitizeAccent(record?.solidColor) || base.solidColor,
    gradientCss: sanitizeGradient(record?.gradientCss, base.gradientCss),
    effect,
  };
}

export function parseHeroLayout(raw: unknown, legacyHeadline = ""): HeroTextLayout {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const subRaw = record && "subheadline" in record ? record.subheadline : null;
  return {
    headline: parseLayer("headline", record && "headline" in record ? record.headline : null),
    subheadline: parseLayer("subheadline", subRaw, record && "subheadline" in record ? "" : legacyHeadline),
    cta_button: parseLayer("cta_button", record?.cta_button),
  };
}

/** Stronger depth look for the five 3D hero films. Indexes append onto the step lists. */
const DEPTH_LOOK: Partial<
  Record<string, Pick<StorefrontHud, "wash" | "glow" | "force" | "radius" | "blur" | "depth" | "damp" | "rim" | "scan">>
> = {
  tattoo: { wash: "ember", glow: 75, force: 4, radius: 4, blur: 3, depth: 4, damp: 3, rim: true, scan: true },
  field: { wash: "obsidian", glow: 75, force: 4, radius: 4, blur: 3, depth: 4, damp: 3, rim: true, scan: true },
  contractor: { wash: "tide", glow: 75, force: 4, radius: 4, blur: 3, depth: 4, damp: 3, rim: true, scan: true },
  events: { wash: "copper", glow: 75, force: 4, radius: 4, blur: 3, depth: 4, damp: 3, rim: true, scan: true },
  location: { wash: "obsidian", glow: 75, force: 4, radius: 4, blur: 3, depth: 4, damp: 3, rim: true, scan: true },
};

export function depthStudio(niche: string) {
  return DEPTH_LOOK[niche] ?? null;
}

/** Apply a niche depth preset without touching the text layers. */
export function applyDepthStudio(hud: StorefrontHud, niche: string): StorefrontHud {
  if (isOutdoorGuideNiche(niche)) return { ...hud, ...LOOK_PRESETS[0].hud };
  const look = depthStudio(niche);
  if (!look) return hud;
  return { ...hud, ...look };
}

/** Replace one layer. The legacy headline string stays aligned with the subheadline. */
export function setHeroLayer(hud: StorefrontHud, id: HeroLayerId, layer: HeroTextLayer): StorefrontHud {
  const layers = cloneHeroLayout(hud.layers);
  layers[id] = parseLayer(id, layer);
  return { ...hud, layers, headline: layers.subheadline.text };
}

export function parseHud(raw: unknown): StorefrontHud {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const wash = HERO_WASHES.includes(record.wash as HeroWash) ? (record.wash as HeroWash) : DEFAULT_HUD.wash;
  const pick = record.heroPick === "still" || record.heroPick === "url" || record.heroPick === "film" ? record.heroPick : "film";
  const legacyHeadline = sanitizeContactLine(record.headline, 140);
  const layers = parseHeroLayout(record.layers, legacyHeadline);
  return {
    wash,
    fade: nearest(FADE_STEPS, Number(record.fade)),
    glow: nearest(GLOW_STEPS, Number(record.glow)),
    headline: layers.subheadline.text,
    layers,
    heroPick: pick,
    heroUrl: sanitizeLogoUrl(record.heroUrl),
    card: indexOf(CARD_STEPS.length, record.card, DEFAULT_HUD.card),
    blur: indexOf(BLUR_STEPS.length, record.blur, DEFAULT_HUD.blur),
    rim: typeof record.rim === "boolean" ? record.rim : DEFAULT_HUD.rim,
    scan: typeof record.scan === "boolean" ? record.scan : DEFAULT_HUD.scan,
    force: indexOf(FORCE_STEPS.length, record.force, DEFAULT_HUD.force),
    radius: indexOf(RADIUS_STEPS.length, record.radius, DEFAULT_HUD.radius),
    damp: indexOf(DAMP_STEPS.length, record.damp, DEFAULT_HUD.damp),
    depth: indexOf(DEPTH_STEPS.length, record.depth, DEFAULT_HUD.depth),
  };
}

/** Maps a saved HUD onto the closed custom properties. Never accepts a CSS string. */
export function hudVars(hud: StorefrontHud, accent: string): CSSProperties {
  const card = CARD_STEPS[hud.card] ?? CARD_STEPS[DEFAULT_HUD.card];
  const blur = BLUR_STEPS[hud.blur] ?? BLUR_STEPS[DEFAULT_HUD.blur];
  const force = FORCE_STEPS[hud.force] ?? FORCE_STEPS[DEFAULT_HUD.force];
  const radius = RADIUS_STEPS[hud.radius] ?? RADIUS_STEPS[DEFAULT_HUD.radius];
  const damp = DAMP_STEPS[hud.damp] ?? DAMP_STEPS[DEFAULT_HUD.damp];
  const depth = DEPTH_STEPS[hud.depth] ?? DEPTH_STEPS[DEFAULT_HUD.depth];
  const vars: CSSProperties = {
    ["--hero-fade" as string]: `${hud.fade}%`,
    ["--glow" as string]: hud.rim ? String(hud.glow / 100) : "0",
    ["--card-alpha" as string]: String(card),
    ["--glass-blur" as string]: `${blur}px`,
    ["--displace" as string]: `${force}px`,
    ["--prox" as string]: `${radius}px`,
    ["--spring-damp" as string]: String(damp),
    ["--depth-feather" as string]: String(depth),
  };
  if (!accent) return vars;
  return { ...vars, ["--neon" as string]: accent };
}

export function paintHero(
  nicheImage: string,
  nicheVideo: string | null,
  hud: StorefrontHud,
): { imageUrl: string; videoUrl: string | null } {
  const film = nicheVideo || null;
  const still = nicheImage || "";
  if (hud.heroPick === "still") {
    return still ? { imageUrl: still, videoUrl: null } : { imageUrl: "", videoUrl: film };
  }
  if (hud.heroPick === "url") {
    const url = sanitizeLogoUrl(hud.heroUrl);
    if (!url) return { imageUrl: still, videoUrl: film };
    if (VIDEO.test(url)) return { imageUrl: still, videoUrl: url };
    return { imageUrl: url, videoUrl: null };
  }
  return { imageUrl: still, videoUrl: film };
}
