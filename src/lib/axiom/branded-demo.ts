/**
 * Branded demo stills and niche loops.
 *
 * Still order:
 * 1. Business override (uploaded / saved hero)
 * 2. Exact niche registry asset (catalog card or a library still tagged with that niche only)
 * 3. Niche-scoped free-stock query (curated Unsplash plate for the trade keywords)
 * 4. Clean non-animal trade fallback (contractor still / proof plates)
 *
 * Loops stay on the verified niche `.mp4`. Wildlife films are kept for wildlife
 * niches and are not the generic fallback.
 */

import { CATALOG_BY_ID, catalogCardStill, resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";
import { MEDIA_LIBRARY } from "../../config/mediaLibrary.ts";
import { DEFAULT_PROOF_BAY_SVG, DEFAULT_PROOF_FINISH_SVG } from "../../config/nicheDefaults.ts";
import { curatedStockImage, pickTradeKeyword } from "./autopilot-content.ts";
import { allowsAnimalMedia, isAnimalMediaUrl } from "./branded-demo-loop.ts";
import { defaultBadges, studioInitials, studioPlateLayout, type StudioIdentity } from "./studio-identity.ts";
import type { DemoPlateSlot } from "./branded-demo-url.ts";

export { resolveDemoLoop } from "./branded-demo-loop.ts";

const FALLBACK_STILLS = [
  "/media/heroes/contractor.jpg",
  DEFAULT_PROOF_BAY_SVG,
  DEFAULT_PROOF_FINISH_SVG,
] as const;

export type DemoStillSource = "override" | "registry" | "stock" | "fallback";

export type DemoStillCandidate = {
  source: DemoStillSource;
  url: string;
  query: string;
};

const SLOT_INDEX: Record<DemoPlateSlot, 0 | 1 | 2> = { hero: 0, proof: 1, services: 2 };

function clean(value: string | undefined, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function usable(url: string, niche: CatalogNiche): boolean {
  if (!url || url.includes("..")) return false;
  if (allowsAnimalMedia(niche)) return true;
  return !isAnimalMediaUrl(url);
}

function exactRegistryStills(niche: CatalogNiche): string[] {
  const card = catalogCardStill(niche);
  const library = MEDIA_LIBRARY.filter(
    (asset) => asset.kind === "still" && asset.niches.length === 1 && asset.niches[0] === niche,
  ).map((asset) => asset.url);
  return [...new Set([card, ...library].filter((url) => usable(url, niche)))];
}

export function demoStillCandidates(input: {
  niche: string;
  slot?: DemoPlateSlot;
  overrideUrl?: string | null;
}): DemoStillCandidate[] {
  const niche = resolveCatalogNiche(input.niche);
  const slot = SLOT_INDEX[input.slot ?? "hero"];
  const query = pickTradeKeyword(niche, slot);
  const out: DemoStillCandidate[] = [];
  const override = clean(input.overrideUrl ?? "", 500);
  if (input.slot !== "proof" && input.slot !== "services" && usable(override, niche)) {
    out.push({ source: "override", url: override, query: "business-override" });
  }
  const registry = exactRegistryStills(niche);
  const registryUrl = registry[slot % Math.max(registry.length, 1)] ?? registry[0];
  if (registryUrl) out.push({ source: "registry", url: registryUrl, query: `registry:${niche}` });
  const stock = curatedStockImage(niche, slot);
  if (usable(stock.src, niche)) out.push({ source: "stock", url: stock.src, query: stock.query || query });
  const fallback = FALLBACK_STILLS[slot];
  out.push({ source: "fallback", url: fallback, query: "clean-trade-fallback" });
  const seen = new Set<string>();
  return out.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plateIdentity(input: { businessName: string; niche: CatalogNiche; accent?: string }): StudioIdentity {
  const accent = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.accent ?? "")
    ? input.accent!.toUpperCase()
    : "#00FFCC";
  const businessName = clean(input.businessName, 48) || CATALOG_BY_ID[input.niche].defaultName;
  return {
    locked: true,
    businessName,
    niche: input.niche,
    nicheLabel: CATALOG_BY_ID[input.niche].label,
    paletteId: "",
    accent,
    neon: accent,
    ink: "#F3F1EB",
    field: "#030712",
    badges: defaultBadges(input.niche),
    animated: false,
  };
}

/** Self-contained branded plate. `imageHref` must be a data URL or empty. */
export function renderBrandedPlateSvg(input: {
  businessName: string;
  niche: string;
  accent?: string;
  city?: string;
  imageHref?: string;
}): string {
  const niche = resolveCatalogNiche(input.niche);
  const identity = plateIdentity({ businessName: input.businessName, niche, accent: input.accent });
  const layout = studioPlateLayout(identity.badges.length);
  const name = escapeXml(identity.businessName);
  const city = escapeXml(clean(input.city, 40));
  const trade = escapeXml(identity.nicheLabel);
  const initials = escapeXml(studioInitials(identity));
  const accent = escapeXml(identity.accent);
  const field = escapeXml(identity.field);
  const fontSize = identity.businessName.length > 28 ? 36 : identity.businessName.length > 18 ? 48 : 64;
  const image = input.imageHref && input.imageHref.startsWith("data:image/")
    ? `<image href="${escapeXml(input.imageHref)}" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1280" height="720" fill="#0b1220"/>
       <rect x="80" y="160" width="1120" height="360" rx="18" fill="#111827"/>
       <rect x="140" y="220" width="420" height="240" fill="#1f2937"/>
       <rect x="600" y="260" width="500" height="28" fill="${accent}" opacity="0.35"/>
       <rect x="600" y="310" width="360" height="18" fill="#334155"/>`;
  const badges = identity.badges
    .map((badge, index) => {
      const spot = layout.badges[index];
      if (!spot) return "";
      const label = escapeXml(badge.label);
      const width = Math.max(96, label.length * 11 + 28);
      return `<g transform="translate(${spot.x} ${spot.y})">
        <rect x="${-width / 2}" y="-18" width="${width}" height="36" rx="18" fill="${field}" fill-opacity="0.78" stroke="${accent}" stroke-width="2"/>
        <text y="5" text-anchor="middle" fill="${escapeXml(identity.ink)}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="600">${label}</text>
      </g>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <filter id="grade"><feColorMatrix type="saturate" values="1.15"/></filter>
    <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${accent}" stop-opacity="0.72"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${field}" stop-opacity="0"/>
      <stop offset="1" stop-color="${field}" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="${field}"/>
  <g filter="url(#grade)">${image}</g>
  <rect width="1280" height="720" fill="${field}" opacity="0.28"/>
  <rect y="${layout.horizonY - 90}" width="1280" height="200" fill="url(#horizon)"/>
  <line x1="${layout.beam.x1}" y1="${layout.beam.y1}" x2="${layout.beam.x2}" y2="${layout.beam.y2}" stroke="${accent}" stroke-width="2" opacity="0.7"/>
  <g transform="translate(${layout.logo.x} ${layout.logo.y})">
    <circle r="${layout.logo.size / 2}" fill="${field}" fill-opacity="0.55" stroke="${accent}" stroke-width="3"/>
    <text y="8" text-anchor="middle" fill="${escapeXml(identity.ink)}" font-family="Georgia, serif" font-size="${Math.round(layout.logo.size * 0.34)}">${initials}</text>
  </g>
  ${badges}
  <rect y="360" width="1280" height="360" fill="url(#band)"/>
  <text x="72" y="${layout.nameY - 36}" fill="${accent}" font-family="ui-monospace, monospace" font-size="18">${trade}${city ? ` · ${city}` : ""}</text>
  <text x="72" y="${layout.nameY}" fill="${escapeXml(identity.ink)}" font-family="Georgia, serif" font-size="${fontSize}">${name}</text>
</svg>`;
}
