/**
 * Automated dataset → niche → verified MP4 + template pairing.
 * Used when master admin / outbound automation pulls business datasets
 * for a trade niche in a target geo and needs a personalized outreach preview.
 */
import {
  CATALOG_BY_ID,
  catalogCardStill,
  catalogFilmPath,
  resolveCatalogNiche,
  tradeLoopUrl,
  type CatalogNiche,
} from "../../config/catalog.ts";
import { nicheForLead } from "./directory.ts";
import { deskPreviewPath } from "./funnel.ts";
import type { ShopNiche } from "./types.ts";

export type VerifiedLoopBinding = {
  niche: CatalogNiche;
  /** Exact verified hero loop under `/media`. */
  primaryLoop: string;
  /** Alternate verified loops the same niche may pin. */
  alternateLoops: readonly string[];
};

/**
 * Explicit verified bindings called out by ops:
 * water → otter/shark, fabrication → polar bear/universal,
 * auto → auto-hero, taxidermy → leopard/raptor.
 * Everything else falls through to the catalog `file` / `fallback`.
 */
const SPECIAL_LOOP_BINDINGS: Partial<
  Record<CatalogNiche, { primary: string; alternates: readonly string[] }>
> = {
  // Emergency Plumbing & Water Systems share the urgent otter cinematic.
  "water-systems": {
    primary: "otter-hero-animation.mp4",
    alternates: ["shark-hero-animation.mp4", "master-defaults/sharks-loop.mp4", "plumbers-hero-animation.mp4"],
  },
  plumbing: {
    primary: "axiom-plumber-hero.mp4",
    alternates: [
      "axio-plumber-hero.mp4",
      "axiom-plumber-hero.mp4.mp4",
      "axiom-plumber-hero-mobile.mp4",
      "axio-plumber-hero-mobile.mp4",
      "plumbing-emergency-hero.mp4",
      "plumbers-hero-animation.mp4",
    ],
  },
  // Electrical outreach uses the electrician film (not the locksmith catalog default).
  electrical: {
    primary: "electrician-hero-animation.mp4",
    alternates: ["locksmith-hero-animation.mp4"],
  },
  fabrication: {
    // `universal-hero-animation.mp4` is not shipped; polar-bear is the verified loop.
    primary: "polar-bear-hero-animation.mp4",
    alternates: ["master-defaults/polar-bear-loop.mp4"],
  },
  auto: {
    primary: "auto-hero-animation.mp4",
    alternates: ["auto-tuning-hero-animation.mp4", "apex-launch-hero-animation.mp4"],
  },
  taxidermy: {
    primary: "leopard-hero-animation.mp4",
    alternates: [
      "raptor-hero-animation.mp4",
      "taxidermy-hero-animation.mp4",
      "underwater-leapord-hero-animation.mp4",
    ],
  },
};

function toMediaUrl(file: string): string {
  if (file.startsWith("/media/")) return file.split("?")[0]!;
  return catalogFilmPath(file.replace(/^\/+/, ""));
}

/** Verified primary + alternate loops for a catalog niche. */
export function verifiedLoopBinding(niche: CatalogNiche): VerifiedLoopBinding {
  const special = SPECIAL_LOOP_BINDINGS[niche];
  if (special) {
    return {
      niche,
      primaryLoop: withMediaFallback(toMediaUrl(special.primary)),
      alternateLoops: special.alternates.map((file) => withMediaFallback(toMediaUrl(file))),
    };
  }
  const row = CATALOG_BY_ID[niche];
  const primary = withMediaFallback(toMediaUrl(row.file));
  const fallback =
    "fallback" in row && typeof row.fallback === "string"
      ? withMediaFallback(toMediaUrl(row.fallback))
      : "";
  return {
    niche,
    primaryLoop: primary || MASTER_DEFAULT_LOOP,
    alternateLoops: fallback && fallback !== primary ? [fallback] : [],
  };
}

/** Resolve any trade phrase / filing to its verified loop binding. */
export function bindingForTrade(tradeType: string, tradeLabel = ""): VerifiedLoopBinding {
  const niche = resolveCatalogNiche(nicheForLead(tradeType, tradeLabel));
  return verifiedLoopBinding(niche);
}

/** Primary verified MP4 for a niche (overrides catalog defaults for specials). */
export function verifiedPrimaryLoop(niche: string, tradeLabel = ""): string {
  return bindingForTrade(niche, tradeLabel).primaryLoop;
}

export type DatasetBusinessRecord = {
  businessName: string;
  tradeType: string;
  tradeLabel?: string;
  phone?: string;
  email?: string;
  city?: string;
  county?: string;
  address?: string;
  leadSlug?: string;
  leadId?: string;
};

export type PersonalizedLeadPreview = {
  niche: CatalogNiche;
  templateNiche: ShopNiche;
  templateName: string;
  tagline: string;
  heroVideoUrl: string;
  alternateLoops: readonly string[];
  heroStillUrl: string;
  overlay: {
    businessName: string;
    phone: string;
    email: string;
    location: string;
    tagline: string;
  };
  /** Relative storefront path ready for outreach (`/?b=…&utm_source=desk`). */
  previewPath: string;
};

function cleanLine(value: string | undefined, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function locationLine(record: DatasetBusinessRecord): string {
  const city = cleanLine(record.city, 80);
  const county = cleanLine(record.county, 80);
  const address = cleanLine(record.address, 120);
  if (address) return address;
  if (city && county) return `${city} · ${county}`;
  return city || county || "";
}

/**
 * Map a pulled business dataset row onto its niche template + verified MP4,
 * overlay name / phone / location, and produce an outreach-ready preview path.
 */
export function pairDatasetToNichePreview(record: DatasetBusinessRecord): PersonalizedLeadPreview {
  const niche = resolveCatalogNiche(nicheForLead(record.tradeType, record.tradeLabel ?? ""));
  const binding = verifiedLoopBinding(niche);
  const row = CATALOG_BY_ID[niche];
  const businessName = cleanLine(record.businessName, 80) || row.defaultName;
  const phone = cleanLine(record.phone, 40);
  const email = cleanLine(record.email, 120);
  const location = locationLine(record);
  const tagline = row.tagline;
  const leadSlug =
    cleanLine(record.leadSlug, 64) ||
    businessName
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) ||
    niche;

  return {
    niche,
    templateNiche: niche,
    templateName: row.defaultName,
    tagline,
    heroVideoUrl: binding.primaryLoop,
    alternateLoops: binding.alternateLoops,
    heroStillUrl: catalogCardStill(niche),
    overlay: {
      businessName,
      phone,
      email,
      location,
      tagline,
    },
    previewPath: deskPreviewPath({
      leadSlug,
      leadId: record.leadId,
      county: record.county,
      city: record.city,
      businessName,
      trade: record.tradeLabel || row.label,
    }),
  };
}

/**
 * Film URL used when provisioning a shop from a dataset / lead pull.
 * Prefers an explicit pin when it is already a verified `/media` loop.
 */
/** Graceful fallback when a niche loop is missing from `public/media`. */
export const MASTER_DEFAULT_LOOP = "/media/master-defaults/leopard-loop.mp4";

const KNOWN_MISSING_LOOPS = new Set([
  "/media/universal-hero-animation.mp4",
  "/media/abyssal-hero-loop.mp4",
]);

/** Remap known-missing catalog paths onto shipped master-default loops. */
export function withMediaFallback(url: string): string {
  const clean = url.trim().split("?")[0] ?? "";
  if (!clean) return MASTER_DEFAULT_LOOP;
  if (KNOWN_MISSING_LOOPS.has(clean)) {
    if (clean.includes("abyssal") || clean.includes("shark")) {
      return "/media/master-defaults/sharks-loop.mp4";
    }
    if (clean.includes("universal")) return "/media/master-defaults/polar-bear-loop.mp4";
    return MASTER_DEFAULT_LOOP;
  }
  return clean;
}

export function resolveProvisionFilm(input: {
  niche: string;
  heroFilm?: string | null;
  tradeLabel?: string;
}): string {
  const pin = (input.heroFilm ?? "").trim().split("?")[0] ?? "";
  if (pin.startsWith("/media/") && !pin.includes("..") && /\.mp4$/i.test(pin)) {
    return withMediaFallback(pin);
  }
  const niche = resolveCatalogNiche(nicheForLead(input.niche, input.tradeLabel ?? ""));
  return withMediaFallback(verifiedLoopBinding(niche).primaryLoop || tradeLoopUrl(niche) || MASTER_DEFAULT_LOOP);
}
