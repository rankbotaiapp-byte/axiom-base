import { CATALOG, CATALOG_BY_ID, catalogCardStill, type CatalogNiche } from "./catalog.ts";

/**
 * Proof-of-work defaults per niche.
 *
 * Resolution order (never throws; never blocks the build):
 * 1. `/media/defaults/{niche}-*.{jpg,png,webp,svg}` when present
 * 2. Catalog trade still (`/media/heroes/...`) when configured
 * 3. Local SVG plates shipped under `/media/defaults/` + `/media/gallery/`
 * 4. Stable external stock URL (Unsplash) as last resort
 */

export const DEFAULT_PROOF_SVG = "/media/defaults/proof-plate.svg";
export const DEFAULT_PROOF_BAY_SVG = "/media/defaults/proof-bay.svg";
export const DEFAULT_PROOF_FINISH_SVG = "/media/defaults/proof-finish.svg";
export const DEFAULT_GALLERY_FIELD_SVG = "/media/gallery/field-service.svg";
export const DEFAULT_GALLERY_STUDIO_SVG = "/media/gallery/app-studio.svg";

/** Always-on local plates — checked into `public/media`. */
export const LOCAL_PROOF_PLATES = [
  DEFAULT_PROOF_SVG,
  DEFAULT_PROOF_BAY_SVG,
  DEFAULT_PROOF_FINISH_SVG,
  DEFAULT_GALLERY_FIELD_SVG,
  DEFAULT_GALLERY_STUDIO_SVG,
] as const;

export type NicheProofPlate = {
  caption: string;
  /** Preferred path under public/media/defaults — may be missing on disk. */
  preferred: string;
  /** Local assets that should exist (catalog stills, shipped SVGs). */
  localFallbacks: readonly string[];
  /** HTTPS stock image used only after local options fail at runtime. */
  stockUrl: string;
};

const STOCK = {
  auto: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
  contractor: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  plumbing: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
  barber: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  taxidermy: "https://images.unsplash.com/photo-1474511320723-9a56873867b4?auto=format&fit=crop&w=1200&q=80",
  craft: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80",
  outdoor: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
  shop: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
} as const;

function stockFor(niche: CatalogNiche): string {
  if (niche === "auto" || niche === "tool-repair") return STOCK.auto;
  if (niche === "contractor" || niche === "roofing" || niche === "stone-masonry") return STOCK.contractor;
  if (niche === "plumbing" || niche === "hvac" || niche === "electrical" || niche === "water-systems") {
    return STOCK.plumbing;
  }
  if (niche === "barber" || niche === "beauty-salon" || niche === "personal-trainer") return STOCK.barber;
  if (niche === "taxidermy" || niche === "canine" || niche === "bow-tech") return STOCK.taxidermy;
  if (niche === "forestry" || niche === "landscaping" || niche === "power-sports") return STOCK.outdoor;
  if (niche === "machining" || niche === "fabrication" || niche === "woodworking") return STOCK.craft;
  return STOCK.shop;
}

function captionsFor(niche: CatalogNiche): [string, string, string] {
  const label = CATALOG_BY_ID[niche]?.label ?? "Job";
  return [`${label} · bay`, `${label} · in progress`, `${label} · finished`];
}

function preferredDefaults(niche: CatalogNiche): [string, string, string] {
  return [
    `/media/defaults/${niche}-1.jpg`,
    `/media/defaults/${niche}-2.jpg`,
    `/media/defaults/${niche}-3.jpg`,
  ];
}

function localChain(niche: CatalogNiche, slot: 0 | 1 | 2): string[] {
  const still = catalogCardStill(niche);
  const plates = [DEFAULT_PROOF_SVG, DEFAULT_PROOF_BAY_SVG, DEFAULT_PROOF_FINISH_SVG];
  const gallery = [DEFAULT_GALLERY_FIELD_SVG, DEFAULT_GALLERY_STUDIO_SVG];
  const chain = [still, plates[slot]!, gallery[slot % gallery.length]!].filter(Boolean);
  return [...new Set(chain)];
}

/** Build three proof plates for a catalog niche. */
export function nicheProofPlates(niche: CatalogNiche): readonly NicheProofPlate[] {
  const preferred = preferredDefaults(niche);
  const captions = captionsFor(niche);
  const stock = stockFor(niche);
  return [0, 1, 2].map((slot) => ({
    caption: captions[slot as 0 | 1 | 2],
    preferred: preferred[slot as 0 | 1 | 2],
    localFallbacks: localChain(niche, slot as 0 | 1 | 2),
    stockUrl: stock,
  }));
}

/** Full candidate list for a plate (preferred → local → stock). */
export function proofSrcCandidates(plate: NicheProofPlate): string[] {
  return [...new Set([plate.preferred, ...plate.localFallbacks, plate.stockUrl].filter(Boolean))];
}

/**
 * Best-effort src without filesystem IO (safe for client + SSR).
 * Prefers the first local fallback that is a shipped SVG/catalog still, not a maybe-missing JPG.
 */
export function resolveProofSrc(plate: NicheProofPlate): string {
  const localSvg = plate.localFallbacks.find(
    (src) =>
      (src.startsWith("/media/defaults/") && src.endsWith(".svg")) ||
      src.startsWith("/media/gallery/") ||
      /\.(jpe?g|png|webp)$/i.test(src),
  );
  return localSvg || plate.localFallbacks[0] || DEFAULT_PROOF_SVG || plate.stockUrl;
}

/** All catalog niches → default proof plates (for audits / seeding). */
export const NICHE_DEFAULT_PROOF: Record<CatalogNiche, readonly NicheProofPlate[]> = Object.fromEntries(
  CATALOG.map((row) => [row.id, nicheProofPlates(row.id)]),
) as Record<CatalogNiche, readonly NicheProofPlate[]>;

export function isRobustMediaUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("/media/defaults/") && value.endsWith(".svg")) return true;
  if (value.startsWith("/media/gallery/") && value.endsWith(".svg")) return true;
  if (value.startsWith("https://images.unsplash.com/")) return true;
  return /\.(jpe?g|png|webp|svg|gif)(?:$|\?)/i.test(value);
}
