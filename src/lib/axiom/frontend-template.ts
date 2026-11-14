import { BRAND_FONTS, type BrandFont } from "./shop-branding.ts";
import { toE164 } from "./notify-target.ts";

/**
 * Locked public-page snapshot.
 * Lives at `trade_profile.frontendTemplate` — a sibling of `trade_profile.shopConfig`.
 * Autopilot cron reads only `shopConfig.selectedAutopilotLoops` / `autopilotLoopCursor`.
 * This object must never write those keys.
 */
export type FrontendTemplate = {
  version: 1;
  builtAt: string;
  brandName: string;
  logoUrl: string;
  primary: string;
  font: BrandFont;
  city: string;
  address: string;
  phone: string;
  bookPath: string;
  mapsUrl: string;
  callHref: string;
  heroAssetUrl: string;
  heroVideoUrl: string;
  animate: boolean;
};

const HEX = /^#[0-9A-F]{6}$/;

export function mapsSearchUrl(address: string): string {
  const q = address.replace(/\s+/g, " ").trim().slice(0, 240);
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function callHrefFor(phone: string): string {
  const e164 = toE164(phone);
  return e164 ? `tel:${e164}` : "";
}

export function emptyFrontendTemplate(): FrontendTemplate {
  return {
    version: 1,
    builtAt: "",
    brandName: "",
    logoUrl: "",
    primary: "#2EE6D6",
    font: "display",
    city: "",
    address: "",
    phone: "",
    bookPath: "",
    mapsUrl: "",
    callHref: "",
    heroAssetUrl: "",
    heroVideoUrl: "",
    animate: false,
  };
}

function cleanLine(value: unknown, limit: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function cleanAsset(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw.includes("..") || /\s/.test(raw)) return "";
  if (raw.startsWith("data:image/") && raw.length <= 240_000) return raw;
  if (raw.startsWith("/media/") || raw.startsWith("/api/hero-video/")) return raw.split("?")[0] ?? raw;
  if (/^https:\/\//i.test(raw)) return raw.slice(0, 800);
  return "";
}

export function parseFrontendTemplate(raw: unknown): FrontendTemplate | null {
  let source: unknown = raw;
  if (typeof raw === "string") {
    try {
      source = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const record =
    source && typeof source === "object" && !Array.isArray(source) ? (source as Record<string, unknown>) : {};
  const nested =
    record.frontendTemplate && typeof record.frontendTemplate === "object" && !Array.isArray(record.frontendTemplate)
      ? (record.frontendTemplate as Record<string, unknown>)
      : record.demoConfig && typeof record.demoConfig === "object" && !Array.isArray(record.demoConfig)
        ? (record.demoConfig as Record<string, unknown>)
        : null;
  if (!nested) return null;
  const font = BRAND_FONTS.includes(nested.font as BrandFont) ? (nested.font as BrandFont) : "display";
  const primary = HEX.test(String(nested.primary ?? "").toUpperCase())
    ? String(nested.primary).toUpperCase()
    : "#2EE6D6";
  const address = cleanLine(nested.address, 240);
  const phone = cleanLine(nested.phone, 32);
  const brandName = cleanLine(nested.brandName, 80);
  if (!brandName && !nested.builtAt) return null;
  return {
    version: 1,
    builtAt: cleanLine(nested.builtAt, 40),
    brandName,
    logoUrl: cleanAsset(nested.logoUrl),
    primary,
    font,
    city: cleanLine(nested.city, 80),
    address,
    phone,
    bookPath: cleanLine(nested.bookPath, 160),
    mapsUrl: cleanLine(nested.mapsUrl, 400) || mapsSearchUrl(address),
    callHref: cleanLine(nested.callHref, 40) || callHrefFor(phone),
    heroAssetUrl: cleanAsset(nested.heroAssetUrl),
    heroVideoUrl: cleanAsset(nested.heroVideoUrl),
    animate: Boolean(nested.animate),
  };
}

export const BRANDED_STILL_SYSTEM =
  "Generate a hyper-real professional photograph of {category} with subtle organic branding for '{brand}' using {color} accents in the scene. Natural light, real tools and surfaces, no watermark, no fake UI, no extra people.";

export function brandedStillPrompt(input: {
  category: string;
  brand: string;
  color: string;
  details: string;
  logoLocked?: boolean;
}): string {
  const details = input.details.replace(/\s+/g, " ").trim().slice(0, 400);
  const base = BRANDED_STILL_SYSTEM.replace("{category}", input.category.slice(0, 80) || "local service work")
    .replace("{brand}", input.brand.slice(0, 80) || "the shop")
    .replace("{color}", input.color);
  const logo = input.logoLocked
    ? " Weave the locked logo into signage, vehicles, or tools. Keep the mark readable, not a watermark."
    : "";
  return details ? `${base}${logo} Operator note: ${details}` : `${base}${logo}`;
}
