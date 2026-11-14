import {
  CATALOG,
  CATALOG_BY_ID,
  ROOT_HERO_ANIMATION_FILES,
  UNIVERSAL_CATALOG_FALLBACK,
  catalogFilmPath,
  catalogFilmUrl,
  tradeLoopUrl,
  isCatalogNiche,
} from "../../config/catalog.ts";
import { heroLibraryItems, isHeroLibrarySrc } from "./hero-library.ts";
import type { ShopNiche } from "./types.ts";

/** Active cinematic loops under public/media — mirrors `src/config/catalog.ts`. */
export const ANIMATION_MP4_FILES = [...ROOT_HERO_ANIMATION_FILES];

/** @deprecated Use ANIMATION_MP4_FILES — legacy /media/heroes catalog removed. */
export const HERO_MP4_FILES = ANIMATION_MP4_FILES;

export const UNIVERSAL_FALLBACK = UNIVERSAL_CATALOG_FALLBACK;
export const MASTER_TELEMETRY_KEY = "axiom-master-telemetry";
export const NICHE_FILM_KEY = "axiom-hero-niche-map";
/** Core log after the saved lines: GPU, frame rate, link, engine. */
export const BROWSER_LOG_ORDER = ["GPU", "FRAME", "LINK", "AI engine"] as const;

/** Niche → seed filename under public/media (copied to /media/{niche}/hero-animation.mp4). */
export const ANIMATION_BY_NICHE: Record<ShopNiche, string> = Object.fromEntries(
  CATALOG.map((row) => [row.id, tradeLoopUrl(row.id).replace(/^\/media\//, "")]),
) as Record<ShopNiche, string>;

export function animationPath(file: string): string {
  return catalogFilmPath(file);
}

export function animationForNiche(niche: ShopNiche): string {
  if (!isCatalogNiche(niche)) return UNIVERSAL_FALLBACK;
  return tradeLoopUrl(niche);
}

const FILLER = new Set(["hero", "master", "mobile", "custom", "loop", "animation", "page"]);

function onDisk(file: string): boolean {
  return (ANIMATION_MP4_FILES as readonly string[]).includes(file);
}

export function heroStem(file: string): string {
  return file
    .toLowerCase()
    .replace(/(\.mp4)+$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokensOf(file: string): string[] {
  return heroStem(file)
    .split(" ")
    .filter((word) => word && !FILLER.has(word));
}

export function scoreHeroFile(file: string, niche: ShopNiche): number {
  if (!onDisk(file)) return 0;
  const entry = CATALOG_BY_ID[niche];
  if (entry && (entry.file === file || ("fallback" in entry && entry.fallback === file))) return 1000;
  const stem = heroStem(file);
  const hay = `${niche} ${entry?.label ?? ""}`.toLowerCase();
  let score = 0;
  for (const token of tokensOf(file)) {
    if (hay.includes(token)) score += 80 + token.length;
  }
  if (score > 0 && /\b(hero|animation)\b/.test(stem)) score += 16;
  return score;
}

/**
 * A business title can pick a tighter film than the niche default.
 */
export function filmMatchingText(text: string, current = ""): string | null {
  const hay = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (hay.length < 3) return null;
  let best = "";
  let bestScore = 0;
  for (const row of CATALOG) {
    const words = `${row.id} ${row.label} ${row.blurb}`.toLowerCase();
    let score = 0;
    for (const part of words.split(/[^a-z0-9]+/).filter((w) => w.length >= 4)) {
      if (hay.includes(part)) score += 40 + part.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = row.file;
    }
  }
  if (!best || bestScore < 50) return null;
  const matched = CATALOG.find((row) => row.file === best);
  const url = matched ? tradeLoopUrl(matched.id) : animationPath(best);
  return url === current ? null : url;
}

export function resolveNicheFilm(niche: ShopNiche, curatedVideo = ""): string {
  if (isCatalogHeroUrl(curatedVideo)) return curatedVideo.split("?")[0] ?? curatedVideo;
  return animationForNiche(niche);
}

/** A niche entry may name one film or a rotation. Empty and repeated URLs drop out. */
export function heroVideoList(value: string | readonly string[] | null | undefined): string[] {
  const source = typeof value === "string" ? [value] : value;
  if (!source) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of source) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Next reel after `onEnded`. A single film stays put. */
export function nextReelIndex(index: number, count: number): number {
  if (count <= 1) return 0;
  const current = Number.isFinite(index) ? Math.trunc(index) : 0;
  return (current + count + 1) % count;
}

export function isCatalogHeroUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("/media/")) return false;
  if (url.includes("..") || url.includes("\\")) return false;
  if (isHeroLibrarySrc(url.split("?")[0])) return true;
  const file = url.slice("/media/".length).split("?")[0] ?? "";
  const nested = file.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\/hero-animation\.mp4$/i);
  if (nested) return isCatalogNiche(nested[1]!.toLowerCase());
  if (/^master-defaults\/[a-z0-9-]+-loop\.mp4$/i.test(file)) return true;
  if (/^heroes\/[a-z0-9._-]*hero(?:-animation)?(?:\.mp4)+$/i.test(file)) return true;
  if (file.includes("/")) return false;
  return (
    onDisk(file) ||
    /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-animation\.mp4$/i.test(file) ||
    /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-path\.mp4$/i.test(file)
  );
}

/** A loop that lives under public/media and can be pinned on a shop. */
export function isPublicMediaFilm(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("/media/") || url.includes("..") || /\s/.test(url)) return false;
  const path = url.split("?")[0] ?? url;
  if (isCatalogHeroUrl(path)) return true;
  return /\.mp4$/i.test(path);
}

/** The underwater river otter loop, including a cache-busted picker URL. */
export function isOtterHeroFilm(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0] ?? "";
  return path.endsWith("/otter-hero-animation.mp4") || path.endsWith("/otter-loop.mp4");
}

/** Deep-sea / Abyssal Systems loop (shark reef or ocean alias). */
export function isSharkHeroFilm(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0] ?? "";
  return (
    path.endsWith("/shark-hero-animation.mp4") ||
    path.endsWith("/sharks-loop.mp4") ||
    path.endsWith("/abyssal-hero-loop.mp4") ||
    path.endsWith("/abyssal-hero-animation.mp4") ||
    path.endsWith("/hero-ocean-loop.mp4")
  );
}

/** HUD readouts for the Abyssal Systems / water-systems theme. */
export function abyssalTelemetry(lat = 42.4318, lng = -123.1709): string[] {
  const fmt = (v: number, pos: string, neg: string) =>
    `${Math.abs(v).toFixed(3)}°${v >= 0 ? pos : neg}`;
  return [
    "DEPTH 1,243 m",
    "WATER TEMP 4.2 °C",
    `COORDS ${fmt(lat, "N", "S")} ${fmt(lng, "E", "W")}`,
  ];
}

export type CatalogChoice = { url: string; label: string; score: number };

/** Admin studio library — category default first, then every loop. */
export function catalogChoices(niche: ShopNiche): CatalogChoice[] {
  const pinned = tradeLoopUrl(niche);
  return heroLibraryItems()
    .map((item) => ({
      url: item.src,
      label: item.name,
      score: item.src === pinned ? 1000 : item.kind === "master-default" ? 80 : 0,
    }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label) || a.url.localeCompare(b.url));
}

export function readMasterTelemetry(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(MASTER_TELEMETRY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((line): line is string => typeof line === "string")
      .map((line) => line.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export function writeMasterTelemetry(lines: readonly string[]) {
  if (typeof localStorage === "undefined") return;
  const clean = lines
    .filter((line) => typeof line === "string")
    .map((line) => line.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 3);
  localStorage.setItem(MASTER_TELEMETRY_KEY, JSON.stringify(clean));
}

/** Browser-only niche film pins from the master desk. Shop uploads still win. */
export function readNicheOverrides(): Partial<Record<ShopNiche, string>> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(NICHE_FILM_KEY) || "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Partial<Record<ShopNiche, string>> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!isCatalogNiche(key) || typeof value !== "string" || !isCatalogHeroUrl(value)) continue;
      out[key] = value.split("?")[0];
    }
    return out;
  } catch {
    return {};
  }
}

export function writeNicheFilmOverride(niche: ShopNiche, url: string) {
  if (typeof localStorage === "undefined" || !isCatalogNiche(niche) || !isCatalogHeroUrl(url)) return;
  const next = { ...readNicheOverrides(), [niche]: url.split("?")[0] };
  localStorage.setItem(NICHE_FILM_KEY, JSON.stringify(next));
}

/** Per-niche browser pin used by the storefront. */
export function readNicheFilmOverride(niche: ShopNiche): string {
  return readNicheOverrides()[niche] ?? "";
}

export function applyBrowserFilmOverride(
  current: string | readonly string[] | null,
  nicheFilm: string,
  browserPick: string,
): string | readonly string[] | null {
  if (!isCatalogHeroUrl(browserPick)) return current;
  if (typeof current === "string") {
    if (current.startsWith("/api/hero-video/")) return current;
    if (isCatalogHeroUrl(current) && current !== nicheFilm) return current;
    return browserPick;
  }
  const list = heroVideoList(current);
  if (list.some((url) => url.startsWith("/api/hero-video/"))) return current;
  if (list.some((url) => isCatalogHeroUrl(url) && url !== nicheFilm)) return current;
  return browserPick;
}

export function heroTelemetryOrder(lines: readonly string[]): string[] {
  const saved = lines
    .filter((line) => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
  return [...saved, ...BROWSER_LOG_ORDER];
}
