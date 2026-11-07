import { CATALOG_BY_ID, type CatalogNiche } from "./catalog.ts";
import { HERO_LIBRARY, heroLibraryEntryByUrl } from "./HeroLibrary.ts";
import { MASTER_HERO_DEFAULTS } from "./MasterHeroDefaults.ts";
import { masterCategoryFor } from "./NicheRegistry.ts";
import { isHeroLibrarySrc } from "../lib/axiom/hero-library.ts";

export const AUTOPILOT_LOOP_MIN = 2;
export const AUTOPILOT_LOOP_MAX = 4;

export type ShopConfig = {
  overrideHeroVideoUrl?: string | null;
  selectedAutopilotLoops?: string[];
  autopilotLoopCursor?: number;
  storefrontFilmAt?: number;
};

export type AutopilotClipOverlay = {
  shopName: string;
  city: string;
  tradeLabel: string;
  tradeLine: string;
  cta: string;
  bookUrl: string;
};

export type AutopilotComposedClip = {
  loopUrl: string;
  masterLoopUrl: string;
  overlay: AutopilotClipOverlay;
  caption: string;
  posterSvg: string;
};

function cleanMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const path = url.trim().split("?")[0] ?? "";
  if (!path.startsWith("/media/") || path.includes("..") || /\s/.test(path)) return "";
  if (!/\.mp4$/i.test(path)) return "";
  if (isHeroLibrarySrc(path) || heroLibraryEntryByUrl(path)) return path;
  return "";
}

export function parseShopConfig(raw: unknown): ShopConfig {
  let source: unknown = raw;
  if (typeof raw === "string") {
    try {
      source = JSON.parse(raw);
    } catch {
      source = {};
    }
  }
  const record =
    source && typeof source === "object" && !Array.isArray(source) ? (source as Record<string, unknown>) : {};
  const nested =
    record.shopConfig && typeof record.shopConfig === "object" && !Array.isArray(record.shopConfig)
      ? (record.shopConfig as Record<string, unknown>)
      : record;
  const loops = Array.isArray(nested.selectedAutopilotLoops)
    ? nested.selectedAutopilotLoops
        .filter((item): item is string => typeof item === "string")
        .map(cleanMediaUrl)
        .filter(Boolean)
    : [];
  const cursor = Number(nested.autopilotLoopCursor);
  const stamped = Number(nested.storefrontFilmAt);
  return {
    overrideHeroVideoUrl: cleanMediaUrl(
      typeof nested.overrideHeroVideoUrl === "string" ? nested.overrideHeroVideoUrl : "",
    ),
    selectedAutopilotLoops: [...new Set(loops)].slice(0, AUTOPILOT_LOOP_MAX),
    autopilotLoopCursor: Number.isFinite(cursor) && cursor >= 0 ? Math.floor(cursor) : 0,
    storefrontFilmAt: Number.isFinite(stamped) && stamped > 0 ? Math.floor(stamped) : 0,
  };
}

export function masterLoopForNiche(niche: string | null | undefined): string {
  return MASTER_HERO_DEFAULTS[masterCategoryFor(niche)].src;
}

export function tradeCopyForNiche(niche: string | null | undefined): { tradeLabel: string; tradeLine: string } {
  const key = (niche ?? "").trim().toLowerCase() as CatalogNiche;
  const row = CATALOG_BY_ID[key];
  if (!row) {
    const category = masterCategoryFor(niche);
    return {
      tradeLabel: MASTER_HERO_DEFAULTS[category].title,
      tradeLine: "Book online. The chair stays full.",
    };
  }
  return {
    tradeLabel: row.label,
    tradeLine: (row.tagline || row.blurb || row.kicker).trim().slice(0, 120),
  };
}

/** Pinned storefront film plus the parent category master loop. */
export function defaultAutopilotLoops(input: {
  pinnedHeroUrl?: string | null;
  niche?: string | null;
}): string[] {
  const pinned = cleanMediaUrl(input.pinnedHeroUrl);
  const master = masterLoopForNiche(input.niche);
  return [...new Set([pinned, master].filter(Boolean))].slice(0, AUTOPILOT_LOOP_MAX);
}

/**
 * Resolve the rotation set for a tenant.
 * Always includes the master cinematic category loop for the niche — no manual pairing required.
 */
export function resolveAutopilotLoops(input: {
  shopConfig?: ShopConfig | null;
  pinnedHeroUrl?: string | null;
  niche?: string | null;
}): string[] {
  const master = masterLoopForNiche(input.niche);
  const picked = (input.shopConfig?.selectedAutopilotLoops ?? []).map(cleanMediaUrl).filter(Boolean);
  const unique = [...new Set(picked)];
  if (unique.length >= AUTOPILOT_LOOP_MIN) {
    return [...new Set([master, ...unique].filter(Boolean))].slice(0, AUTOPILOT_LOOP_MAX);
  }
  const fallback = defaultAutopilotLoops({ pinnedHeroUrl: input.pinnedHeroUrl, niche: input.niche });
  return [...new Set([master, ...unique, ...fallback].filter(Boolean))].slice(0, AUTOPILOT_LOOP_MAX);
}

export function sanitizeAutopilotLoops(urls: readonly string[]): string[] {
  return [...new Set(urls.map(cleanMediaUrl).filter(Boolean))].slice(0, AUTOPILOT_LOOP_MAX);
}

/** Sequential rotation; wraps the list. */
export function pickAutopilotLoop(loops: readonly string[], cursor = 0): { loopUrl: string; nextCursor: number } {
  const list = loops.filter(Boolean);
  if (!list.length) {
    return { loopUrl: HERO_LIBRARY[0]?.videoUrl ?? "/media/otter-hero-animation.mp4", nextCursor: 0 };
  }
  const index = ((cursor % list.length) + list.length) % list.length;
  return { loopUrl: list[index]!, nextCursor: index + 1 };
}

export function bookingCta(city: string): string {
  const place = city.trim() || "your city";
  return `Book in ${place}`;
}

export function composeAutopilotClip(input: {
  loopUrl: string;
  shopName: string;
  city: string;
  bookUrl: string;
  niche?: string | null;
}): AutopilotComposedClip {
  const shopName = input.shopName.replace(/\s+/g, " ").trim().slice(0, 48) || "Local shop";
  const city = input.city.replace(/\s+/g, " ").trim().slice(0, 40) || "Your city";
  const bookUrl = input.bookUrl.trim().slice(0, 240) || "/book";
  const { tradeLabel, tradeLine } = tradeCopyForNiche(input.niche);
  const cta = bookingCta(city);
  const overlay: AutopilotClipOverlay = { shopName, city, tradeLabel, tradeLine, cta, bookUrl };
  const caption = `${shopName} · ${tradeLabel} in ${city}. ${tradeLine} ${cta}. ${bookUrl}`
    .replace(/\s+/g, " ")
    .trim();
  const masterLoopUrl = masterLoopForNiche(input.niche);
  return {
    loopUrl: cleanMediaUrl(input.loopUrl) || input.loopUrl,
    masterLoopUrl,
    overlay,
    caption,
    posterSvg: autopilotPosterSvg(overlay),
  };
}

export function autopilotPosterSvg(overlay: AutopilotClipOverlay): string {
  const name = escapeXml(overlay.shopName);
  const city = escapeXml(overlay.city);
  const trade = escapeXml(overlay.tradeLabel);
  const line = escapeXml(overlay.tradeLine);
  const cta = escapeXml(overlay.cta);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070a" stop-opacity="0.15"/>
      <stop offset="0.55" stop-color="#05070a" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#05070a" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#veil)"/>
  <text x="72" y="1460" fill="#00ffcc" font-family="ui-monospace, monospace" font-size="28">${trade}</text>
  <text x="72" y="1540" fill="#f3f1eb" font-family="Georgia, serif" font-size="64">${name}</text>
  <text x="72" y="1608" fill="#a8b0b8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32">${city}</text>
  <text x="72" y="1660" fill="#c8cdd3" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26">${line}</text>
  <rect x="72" y="1708" width="420" height="72" rx="16" fill="#f3f1eb"/>
  <text x="92" y="1756" fill="#05070a" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28">${cta}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
