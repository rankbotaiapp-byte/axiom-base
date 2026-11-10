/**
 * Automated content sourcing + custom branding for tenant storefronts.
 * Pure module: keywords, stock fallbacks, overlay stamp, composition metadata.
 * Network I/O lives in autopilot-content.server.ts.
 */

import { CATALOG_BY_ID, resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";
import { pickMediaForNiche } from "../../config/mediaLibrary.ts";
import {
  bookingCta,
  composeAutopilotClip,
  masterLoopForNiche,
  tradeCopyForNiche,
  type AutopilotClipOverlay,
  type AutopilotComposedClip,
} from "../../config/AutopilotContentEngine.ts";
import { nicheProofPlates } from "../../config/nicheDefaults.ts";
import {
  facebookFeedPayload,
  gbpLocalPostPayload,
  instagramMediaPayload,
  type GbpLocalPostPayload,
  type GraphFeedPayload,
  type InstagramMediaPayload,
} from "./social-publish.ts";

export type StockMediaKind = "image" | "video";

export type StockMediaLicense = {
  provider: "pexels" | "unsplash" | "pixabay" | "curated";
  license: "pexels" | "unsplash" | "unsplash-curated" | "pixabay" | "platform";
  attribution: string;
  pageUrl?: string;
  photographer?: string;
};

export type StockMediaAsset = {
  id: string;
  kind: StockMediaKind;
  src: string;
  previewSrc?: string;
  width?: number;
  height?: number;
  query: string;
  license: StockMediaLicense;
};

export type BrandOverlayStamp = {
  shopName: string;
  city: string;
  cta: string;
  tradeLabel: string;
  tradeLine: string;
  bookUrl: string;
};

export type BrandedStockComposition = {
  base: StockMediaAsset;
  overlay: BrandOverlayStamp;
  caption: string;
  posterSvg: string;
  /** Self-contained SVG that embeds the stock still + stamped brand plate. */
  framedSvg: string;
  clip: AutopilotComposedClip;
  metadata: {
    version: 1;
    stampedAt: string;
    niche: string;
    keywords: string[];
    provider: StockMediaLicense["provider"];
    attribution: string;
  };
};

/** Search phrases for commercially free stock APIs, keyed by catalog niche. */
const TRADE_KEYWORDS: Record<CatalogNiche, readonly string[]> = {
  auto: ["auto repair garage", "car mechanic workshop", "vehicle detailing bay"],
  barber: ["barbershop chair", "barber fade haircut", "classic barbershop interior"],
  "beauty-salon": ["beauty salon studio", "hair color salon", "spa treatment room"],
  "bow-tech": ["archery bow workshop", "compound bow bench", "custom bow crafting"],
  canine: ["dog grooming salon", "pet boarding kennel", "dog walking outdoors"],
  contractor: ["home construction site", "general contractor tools", "residential remodel"],
  electrical: ["electrician panel work", "electrical service call", "wiring installation"],
  fabrication: ["metal fabrication shop", "welding workshop", "custom steel build"],
  forestry: ["forestry logging work", "firewood splitting", "tree service crew"],
  glasswork: ["glassblowing studio", "stained glass workshop", "glass artisan bench"],
  hvac: ["hvac technician service", "air conditioning install", "furnace repair"],
  landscaping: ["landscaping garden design", "lawn care crew", "outdoor hardscape"],
  machining: ["cnc machining shop", "precision mill work", "machine shop tools"],
  "personal-trainer": ["personal trainer gym", "fitness coaching session", "strength training"],
  plumbing: ["plumber under sink", "plumbing pipe repair", "residential plumber tools"],
  "power-sports": ["atv repair shop", "motorcycle service bay", "power sports garage"],
  roofing: ["roofing contractor install", "residential roof shingles", "roofer on rooftop"],
  security: ["home security install", "security camera technician", "locksmith service"],
  "stone-masonry": ["stone masonry wall", "brick mason work", "natural stone patio"],
  taxidermy: ["wildlife taxidermy studio", "taxidermy workshop", "hunting lodge interior"],
  "tool-repair": ["tool repair bench", "power tool workshop", "equipment repair shop"],
  "water-systems": ["water treatment system", "well pump service", "plumbing water filtration"],
  woodworking: ["woodworking shop bench", "custom cabinetry workshop", "carpenter hand tools"],
};

export function tradeKeywordsForNiche(niche: string | null | undefined): string[] {
  const id = resolveCatalogNiche(niche);
  const row = CATALOG_BY_ID[id];
  const base = [...(TRADE_KEYWORDS[id] ?? ["local trade service workshop"])];
  if (row?.label) base.unshift(row.label.toLowerCase());
  return [...new Set(base.map((k) => k.trim()).filter(Boolean))].slice(0, 6);
}

export function pickTradeKeyword(niche: string | null | undefined, daySeed = 0): string {
  const keys = tradeKeywordsForNiche(niche);
  const index = ((daySeed % keys.length) + keys.length) % keys.length;
  return keys[index] ?? "local trade workshop";
}

export function brandOverlayStamp(input: {
  shopName: string;
  city: string;
  bookUrl?: string;
  niche?: string | null;
  cta?: string;
}): BrandOverlayStamp {
  const shopName = input.shopName.replace(/\s+/g, " ").trim().slice(0, 48) || "Local shop";
  const city = input.city.replace(/\s+/g, " ").trim().slice(0, 40) || "Your city";
  const bookUrl = (input.bookUrl ?? "/book").trim().slice(0, 240) || "/book";
  const { tradeLabel, tradeLine } = tradeCopyForNiche(input.niche);
  const cta = (input.cta ?? bookingCta(city)).replace(/\s+/g, " ").trim().slice(0, 48);
  return { shopName, city, cta, tradeLabel, tradeLine, bookUrl };
}

export function curatedStockImage(niche: string | null | undefined, slot = 0): StockMediaAsset {
  const id = resolveCatalogNiche(niche);
  const plates = nicheProofPlates(id);
  const plate = plates[Math.abs(slot) % plates.length] ?? plates[0]!;
  const query = pickTradeKeyword(id, slot);
  return {
    id: `curated-img-${id}-${Math.abs(slot) % 3}`,
    kind: "image",
    src: plate.stockUrl,
    previewSrc: plate.stockUrl,
    query,
    license: {
      provider: "curated",
      license: "unsplash-curated",
      attribution: "Photo via Unsplash License (curated niche default)",
      pageUrl: plate.stockUrl.split("?")[0],
    },
  };
}

/** Owned master cinematic loop when no free stock video API key is configured. */
export function curatedStockVideo(niche: string | null | undefined): StockMediaAsset {
  const id = resolveCatalogNiche(niche);
  const local = libraryStockAsset(id, "video", 0);
  if (local) return local;
  const src = masterLoopForNiche(id);
  return {
    id: `curated-vid-${id}`,
    kind: "video",
    src,
    query: pickTradeKeyword(id, 1),
    license: {
      provider: "curated",
      license: "platform",
      attribution: "Axiom master cinematic loop (platform-owned)",
      pageUrl: src,
    },
  };
}

/** Platform-owned loop or still from the indexed public/media library. */
export function libraryStockAsset(
  niche: string | null | undefined,
  kind: StockMediaKind,
  seed = 0,
): StockMediaAsset | null {
  const asset = pickMediaForNiche(niche, kind === "video" ? "loop" : "still", seed);
  if (!asset) return null;
  return {
    id: `library-${asset.id}`,
    kind,
    src: asset.url,
    previewSrc: asset.thumbnail,
    query: `axiom-library:${asset.theme}`,
    license: {
      provider: "curated",
      license: "platform",
      attribution: `Axiom media library · ${asset.label}`,
      pageUrl: asset.url,
    },
  };
}

export function daySeedFromDate(now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(start / 86_400_000);
}

/** Programmatic brand stamp: SVG plate + framed still composition + social caption. */
export function composeBrandedStock(input: {
  base: StockMediaAsset;
  shopName: string;
  city: string;
  bookUrl: string;
  niche?: string | null;
  stampedAt?: string;
}): BrandedStockComposition {
  const overlay = brandOverlayStamp({
    shopName: input.shopName,
    city: input.city,
    bookUrl: input.bookUrl,
    niche: input.niche,
  });
  const clip = composeAutopilotClip({
    loopUrl: input.base.kind === "video" ? input.base.src : "",
    shopName: overlay.shopName,
    city: overlay.city,
    bookUrl: overlay.bookUrl,
    niche: input.niche,
  });
  const keywords = tradeKeywordsForNiche(input.niche);
  const posterSvg = brandedStockPosterSvg(overlay, input.base);
  const framedSvg = framedStockSvg(overlay, input.base);
  const caption = [
    `${overlay.shopName} · ${overlay.tradeLabel} in ${overlay.city}.`,
    overlay.tradeLine,
    overlay.cta,
    overlay.bookUrl,
    input.base.license.attribution,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    base: input.base,
    overlay,
    caption,
    posterSvg,
    framedSvg,
    clip: {
      ...clip,
      loopUrl: input.base.kind === "video" ? input.base.src : clip.loopUrl,
      posterSvg,
      caption,
      overlay: {
        shopName: overlay.shopName,
        city: overlay.city,
        tradeLabel: overlay.tradeLabel,
        tradeLine: overlay.tradeLine,
        cta: overlay.cta,
        bookUrl: overlay.bookUrl,
      } satisfies AutopilotClipOverlay,
    },
    metadata: {
      version: 1,
      stampedAt: input.stampedAt ?? new Date().toISOString(),
      niche: resolveCatalogNiche(input.niche),
      keywords,
      provider: input.base.license.provider,
      attribution: input.base.license.attribution,
    },
  };
}

export function brandedStockPosterSvg(overlay: BrandOverlayStamp, base?: StockMediaAsset): string {
  const name = escapeXml(overlay.shopName);
  const city = escapeXml(overlay.city);
  const trade = escapeXml(overlay.tradeLabel);
  const line = escapeXml(overlay.tradeLine);
  const cta = escapeXml(overlay.cta);
  const credit = escapeXml(base?.license.attribution ?? "Stock media");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070a" stop-opacity="0.2"/>
      <stop offset="0.5" stop-color="#05070a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#05070a" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="#0b1220"/>
  <rect width="1080" height="1920" fill="url(#veil)"/>
  <text x="72" y="1420" fill="#00ffcc" font-family="ui-monospace, monospace" font-size="26">${trade}</text>
  <text x="72" y="1505" fill="#f3f1eb" font-family="Georgia, serif" font-size="64">${name}</text>
  <text x="72" y="1570" fill="#a8b0b8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32">${city}</text>
  <text x="72" y="1624" fill="#c8cdd3" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26">${line}</text>
  <rect x="72" y="1672" width="440" height="72" rx="16" fill="#f3f1eb"/>
  <text x="92" y="1720" fill="#05070a" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28">${cta}</text>
  <text x="72" y="1860" fill="#6b7280" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20">${credit}</text>
</svg>`;
}

/** Frame a stock still under the brand plate (composition metadata for clients). */
export function framedStockSvg(overlay: BrandOverlayStamp, base: StockMediaAsset): string {
  const name = escapeXml(overlay.shopName);
  const city = escapeXml(overlay.city);
  const trade = escapeXml(overlay.tradeLabel);
  const cta = escapeXml(overlay.cta);
  const credit = escapeXml(base.license.attribution);
  const href = escapeXml(base.previewSrc || base.src);
  const isImage = base.kind === "image" && /^https:\/\//i.test(base.src);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#030712" stop-opacity="0"/>
      <stop offset="0.45" stop-color="#030712" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#030712" stop-opacity="0.92"/>
    </linearGradient>
    <clipPath id="frame"><rect width="1200" height="1500" rx="0"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    ${
      isImage
        ? `<image href="${href}" xlink:href="${href}" width="1200" height="1500" preserveAspectRatio="xMidYMid slice"/>`
        : `<rect width="1200" height="1500" fill="#0b1220"/>`
    }
    <rect width="1200" height="1500" fill="url(#plate)"/>
  </g>
  <text x="64" y="1180" fill="#00ffcc" font-family="ui-monospace, monospace" font-size="28">${trade}</text>
  <text x="64" y="1260" fill="#f8fafc" font-family="Georgia, serif" font-size="56">${name}</text>
  <text x="64" y="1320" fill="#94a3b8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="30">${city}</text>
  <rect x="64" y="1360" width="380" height="64" rx="14" fill="#f8fafc"/>
  <text x="84" y="1404" fill="#030712" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26">${cta}</text>
  <text x="64" y="1470" fill="#64748b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18">${credit}</text>
</svg>`;
}

export function framedSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function composeSocialPublishJob(input: {
  caption: string;
  storefrontUrl: string;
  imageUrl: string;
  pageId?: string;
  igUserId?: string;
  gbpAccountId?: string;
  gbpLocationId?: string;
}): {
  facebook: GraphFeedPayload;
  instagram: InstagramMediaPayload;
  gbp: GbpLocalPostPayload;
} {
  return {
    facebook: facebookFeedPayload({
      pageId: input.pageId ?? "",
      message: input.caption,
      link: input.storefrontUrl,
    }),
    instagram: instagramMediaPayload({
      igUserId: input.igUserId ?? "",
      imageUrl: input.imageUrl,
      caption: input.caption,
    }),
    gbp: gbpLocalPostPayload({
      accountId: input.gbpAccountId ?? "",
      locationId: input.gbpLocationId ?? "",
      summary: input.caption,
      articleUrl: input.storefrontUrl,
    }),
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
