import { parseHeroLook, type HeroLook } from "./hero-look.ts";

/** Environmental overlays and the branding plate drawn onto a shop hero. */

export const HERO_EFFECTS = ["smoke", "rain", "water", "snow", "orb_genesis_transform"] as const;

export type HeroEffect = (typeof HERO_EFFECTS)[number];

export const HERO_EFFECT_LABEL: Record<HeroEffect, string> = {
  smoke: "Smoke",
  rain: "Rain",
  water: "Lake water",
  snow: "Snow",
  orb_genesis_transform: "Liquid orb",
};

export const MORPH_PROFILES = ["sphere", "vessel", "skull", "logo"] as const;

export type MorphProfile = (typeof MORPH_PROFILES)[number];

export const DEFAULT_MORPH_DURATION = 4.5;

export const HERO_BRAND_MAX_BYTES = 12 * 1024 * 1024;

const NICHE_STICKERS: Record<string, string> = {
  barber: "Chair mark",
  tattoo: "Flash sheet",
  guide: "Field sponsor",
  hunting: "Field sponsor",
  fitness: "Training mark",
  salon: "Salon mark",
  beauty: "Studio mark",
  photo: "Frame sponsor",
  pets: "Kennel mark",
  music: "Stage mark",
  contractor: "Job-site mark",
  field: "Service mark",
  trade: "Trade mark",
  detailer: "Finish mark",
  landscaper: "Grounds mark",
};

export type BrandPlate = {
  etch: string;
  sticker: string;
  line: string;
};

export function parseHeroEffect(value: unknown): HeroEffect {
  if (value === "orb_transform" || value === "orb_genesis") return "orb_genesis_transform";
  return isHeroEffect(value) ? value : "smoke";
}

/** Prompt words pick the silhouette the liquid orb reforms into. */
export function morphProfileFromPrompt(prompt: string): MorphProfile {
  const text = prompt.toLowerCase();
  if (/skull|cranium|bone/.test(text)) return "skull";
  if (/vessel|vase|bottle|chalice|flask|glass/.test(text)) return "vessel";
  if (/logo|emblem|crest|monogram|mark/.test(text)) return "logo";
  return "sphere";
}

export function morphProfileIndex(profile: MorphProfile): number {
  return MORPH_PROFILES.indexOf(profile);
}

export function parseMorphDuration(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MORPH_DURATION;
  return Math.min(12, Math.max(1.2, n));
}

export function isHeroEffect(value: unknown): value is HeroEffect {
  return typeof value === "string" && (HERO_EFFECTS as readonly string[]).includes(value);
}

export function heroAssetTooLarge(bytes: number): boolean {
  return !Number.isFinite(bytes) || bytes <= 0 || bytes > HERO_BRAND_MAX_BYTES;
}

/** Etched shop name, a niche sponsor sticker, and the operator tagline. */
export function brandPlate(input: {
  name: string;
  niche: string;
  trade?: string;
  tagline?: string;
}): BrandPlate {
  const etch = input.name.trim().replace(/\s+/g, " ").slice(0, 42) || "Axiom";
  const niche = input.niche.trim().toLowerCase();
  const trade = (input.trade ?? "").trim().replace(/\s+/g, " ");
  const sticker = (NICHE_STICKERS[niche] ?? (trade ? `${trade} mark` : "Shop mark")).slice(0, 32);
  const line = (input.tagline ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  return { etch, sticker, line };
}

export function sniffHeroAsset(bytes: Uint8Array): "jpeg" | "png" | "webp" | "mp4" | null {
  if (bytes.byteLength < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "mp4";
  return null;
}

export function isBrandedHeroStill(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/api/hero/brand/");
}

/** The weather layer is for a shop that published a branded still or a tagline. */
export function heroAtmosphereActive(imageUrl: string, tagline: string): boolean {
  return Boolean(tagline.trim()) || isBrandedHeroStill(imageUrl);
}

export type HeroBrandRecord = {
  effect: HeroEffect;
  tagline: string;
  prompt: string;
  morphDurationSec: number;
  look?: HeroLook;
};

const DATA_STILL = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i;
export const HERO_STILL_FALLBACK_CHARS = 1_400_000;

/** A still this shop is allowed to publish: its brand route, or a compact data URL. */
export function isPublishableHeroStill(shopId: string, image: string): boolean {
  if (image.startsWith(`/api/hero/brand/${shopId}`)) return true;
  return DATA_STILL.test(image) && image.length <= HERO_STILL_FALLBACK_CHARS;
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      return asRecord(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/** Effect and tagline kept on the trade profile when the hero columns are not there yet. */
export function readHeroBrandFallback(raw: unknown): HeroBrandRecord {
  const record = asRecord(raw);
  const brand = record ? asRecord(record.heroBrand) : null;
  const tagline = typeof brand?.tagline === "string" ? brand.tagline.trim().slice(0, 80) : "";
  const prompt = typeof brand?.prompt === "string" ? brand.prompt.trim().slice(0, 180) : "";
  return {
    effect: parseHeroEffect(brand?.effect),
    tagline,
    prompt,
    morphDurationSec: parseMorphDuration(brand?.morphDurationSec),
    ...(brand && typeof brand.look === "object" ? { look: parseHeroLook(brand.look) } : {}),
  };
}

export function heroBrandFallbackPresent(raw: unknown): boolean {
  const record = asRecord(raw);
  return Boolean(record && Object.prototype.hasOwnProperty.call(record, "heroBrand"));
}

export function withHeroBrandFallback(raw: unknown, brand: HeroBrandRecord): string {
  const record = asRecord(raw) ?? {};
  return JSON.stringify({
    ...record,
    heroBrand: {
      effect: parseHeroEffect(brand.effect),
      tagline: brand.tagline.trim().slice(0, 80),
      prompt: (brand.prompt ?? "").trim().slice(0, 180),
      morphDurationSec: parseMorphDuration(brand.morphDurationSec),
      ...(brand.look ? { look: parseHeroLook(brand.look) } : {}),
    },
  });
}

/** Keep a previously saved hero brand when another save rewrites the trade profile. */
export function keepHeroBrand(profile: unknown, previous: unknown): string {
  const prev = asRecord(previous);
  const base = asRecord(profile) ?? {};
  const withHud = prev && "heroHud" in prev && !("heroHud" in base) ? { ...base, heroHud: prev.heroHud } : base;
  const next =
    prev && "serviceThumbs" in prev && !("serviceThumbs" in withHud)
      ? { ...withHud, serviceThumbs: prev.serviceThumbs }
      : withHud;
  if (!heroBrandFallbackPresent(previous)) {
    return JSON.stringify(Object.keys(next).length > 0 ? next : (profile ?? {}));
  }
  return withHeroBrandFallback(next, readHeroBrandFallback(previous));
}

export function shopHeroStillPath(shopId: string, version: number): string {
  if (!/^shop_[a-zA-Z0-9]+$/.test(shopId)) throw new Error("Shop stills stay on this shop");
  const path = `/api/hero/brand/${shopId}?v=${version}`;
  if (path.includes("/media/")) throw new Error("Shop stills stay on this shop");
  return path;
}

export function shopIdFromBrandPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "hero" || parts[2] !== "brand") return null;
  const id = parts[3] ?? "";
  return /^shop_[a-zA-Z0-9]+$/.test(id) ? id : null;
}
