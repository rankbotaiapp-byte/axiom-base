import {
  CATALOG,
  CATALOG_BY_ID,
  EXTRA_HERO_LOOPS,
  UNIVERSAL_CATALOG_FALLBACK,
  catalogFilmPath,
  catalogFilmUrl,
  isCatalogNiche,
  type CatalogNiche,
} from "@/config/catalog";
import type { ShopNiche } from "./types.ts";

/** Active cinematic loops under public/media — mirrors `src/config/catalog.ts`. */
export const ANIMATION_MP4_FILES = [
  ...CATALOG.map((row) => row.file),
  ...EXTRA_HERO_LOOPS.map((row) => row.file),
];

/** @deprecated Use ANIMATION_MP4_FILES — legacy /media/heroes catalog removed. */
export const HERO_MP4_FILES = ANIMATION_MP4_FILES;

export const UNIVERSAL_FALLBACK = UNIVERSAL_CATALOG_FALLBACK;
export const MASTER_TELEMETRY_KEY = "axiom-master-telemetry";
export const NICHE_FILM_KEY = "axiom-hero-niche-map";
/** Core log after the saved lines: GPU, frame rate, link, engine. */
export const BROWSER_LOG_ORDER = ["GPU", "FRAME", "LINK", "AI engine"] as const;

/** Niche → root /media/*-hero-animation file. */
export const ANIMATION_BY_NICHE: Record<ShopNiche, string> = Object.fromEntries(
  CATALOG.map((row) => [row.id, row.file]),
) as Record<ShopNiche, string>;

export function animationPath(file: string): string {
  return catalogFilmPath(file);
}

export function animationForNiche(niche: ShopNiche): string {
  if (!isCatalogNiche(niche)) return UNIVERSAL_FALLBACK;
  return catalogFilmUrl(niche);
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
  if (entry && entry.file === file) return 1000;
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
  const url = animationPath(best);
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
  if (url.includes("..") || url.includes("\\") || url.includes("/heroes/")) return false;
  const file = url.slice("/media/".length).split("?")[0] ?? "";
  if (file.includes("/")) return false;
  return onDisk(file) || /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-animation\.mp4$/i.test(file);
}

/** A loop that lives under public/media and can be pinned on a shop. */
export function isPublicMediaFilm(url: string | null | undefined): boolean {
  return isCatalogHeroUrl(url);
}

export type CatalogChoice = { url: string; label: string; score: number };

/** Admin studio dropdown — every verified loop, niche match first. */
export function catalogChoices(niche: ShopNiche): CatalogChoice[] {
  const ranked = [
    ...CATALOG.map((row) => ({
      url: catalogFilmUrl(row.id),
      label: row.label,
      score: scoreHeroFile(row.file, niche),
    })),
    ...EXTRA_HERO_LOOPS.map((row) => ({
      url: catalogFilmPath(row.file),
      label: row.label,
      score: scoreHeroFile(row.file, niche),
    })),
  ].sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  const pinned = catalogFilmUrl(niche);
  const head = ranked.filter((row) => row.url === pinned);
  const rest = ranked.filter((row) => row.url !== pinned);
  return [...head, ...rest];
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
  current: string | readonly string[],
  nicheFilm: string,
  browserPick: string,
): string | readonly string[] {
  if (!isCatalogHeroUrl(browserPick)) return current;
  if (typeof current === "string") {
    if (isCatalogHeroUrl(current) && current !== nicheFilm) return current;
    return browserPick;
  }
  const list = heroVideoList(current);
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
