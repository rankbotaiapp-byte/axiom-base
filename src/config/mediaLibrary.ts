/**
 * Central index of every loop and still under public/media.
 * Autopilot, Hero Studio, and social mix all read this file.
 */

import { MEDIA_LIBRARY_RECORDS } from "./mediaLibrary.data.ts";
import type { CatalogNiche } from "./catalog.ts";
import { resolveCatalogNiche } from "./catalog.ts";

export const MEDIA_THEMES = [
  "emergency",
  "tactical",
  "tech-cyber",
  "wildlife",
  "auto",
  "trades",
  "cinematic",
] as const;

export type MediaTheme = (typeof MEDIA_THEMES)[number];
export type MediaKind = "loop" | "still";

export type MediaLibraryRecord = {
  id: string;
  url: string;
  kind: MediaKind;
  theme: MediaTheme;
  niches: readonly string[];
  label: string;
  thumbnail: string;
};

export type MediaLibraryAsset = {
  id: string;
  url: string;
  kind: MediaKind;
  theme: MediaTheme;
  niches: CatalogNiche[];
  label: string;
  thumbnail: string;
};

const THEME_LABEL: Record<MediaTheme, string> = {
  emergency: "Emergency services",
  tactical: "Tactical",
  "tech-cyber": "Tech / cyber",
  wildlife: "Wildlife",
  auto: "Auto / motors",
  trades: "Trades",
  cinematic: "General cinematic",
};

export function mediaThemeLabel(theme: MediaTheme): string {
  return THEME_LABEL[theme];
}

function normalizeAsset(row: MediaLibraryRecord): MediaLibraryAsset {
  const niches = [...new Set(row.niches.map((n) => resolveCatalogNiche(n)))];
  return {
    id: row.id,
    url: row.url,
    kind: row.kind,
    theme: row.theme,
    niches,
    label: row.label,
    thumbnail: row.thumbnail || row.url,
  };
}

export const MEDIA_LIBRARY: readonly MediaLibraryAsset[] = (
  MEDIA_LIBRARY_RECORDS as unknown as MediaLibraryRecord[]
).map(normalizeAsset);

const BY_URL = new Map(MEDIA_LIBRARY.map((asset) => [asset.url.split("?")[0] ?? asset.url, asset]));
let LOOP_CACHE: MediaLibraryAsset[] | null = null;

export function isMediaLibraryUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("/media/") || url.includes("..") || /\s/.test(url)) return false;
  return BY_URL.has(url.split("?")[0] ?? url);
}

export function mediaAssetByUrl(url: string | null | undefined): MediaLibraryAsset | undefined {
  if (!url) return undefined;
  return BY_URL.get(url.split("?")[0] ?? url);
}

export function mediaLibraryLoops(): MediaLibraryAsset[] {
  return (LOOP_CACHE ??= MEDIA_LIBRARY.filter((asset) => asset.kind === "loop" && /\.mp4$/i.test(asset.url)));
}

export function mediaLibraryStills(): MediaLibraryAsset[] {
  return MEDIA_LIBRARY.filter((asset) => asset.kind === "still");
}

export function mediaByTheme(theme: MediaTheme, kind?: MediaKind): MediaLibraryAsset[] {
  return MEDIA_LIBRARY.filter((asset) => asset.theme === theme && (!kind || asset.kind === kind));
}

/** Assets tagged for a catalog niche, falling back to the matching theme pool. */
export function mediaForNiche(
  niche: string | null | undefined,
  kind?: MediaKind,
): MediaLibraryAsset[] {
  const id = resolveCatalogNiche(niche);
  const exact = MEDIA_LIBRARY.filter((asset) => asset.niches.includes(id) && (!kind || asset.kind === kind));
  if (exact.length) return exact;
  const theme: MediaTheme =
    id === "plumbing" || id === "electrical" || id === "hvac" || id === "security"
      ? "emergency"
      : id === "auto" || id === "power-sports"
        ? "auto"
        : id === "taxidermy" || id === "canine"
          ? "wildlife"
          : id === "forestry"
            ? "tactical"
            : "trades";
  const themed = mediaByTheme(theme, kind);
  return themed.length ? themed : MEDIA_LIBRARY.filter((asset) => !kind || asset.kind === kind);
}

export function pickMediaForNiche(
  niche: string | null | undefined,
  kind: MediaKind,
  seed = 0,
): MediaLibraryAsset | null {
  const pool = mediaForNiche(niche, kind);
  if (!pool.length) return null;
  const index = ((seed % pool.length) + pool.length) % pool.length;
  return pool[index] ?? null;
}

/** Studio dropdown rows: every cinematic loop, grouped-ready. */
export function mediaStudioLoopOptions(): {
  id: string;
  label: string;
  url: string;
  thumbnail: string;
  theme: MediaTheme;
  themeLabel: string;
}[] {
  return mediaLibraryLoops()
    .map((asset) => ({
      id: asset.id,
      label: asset.label,
      url: asset.url,
      thumbnail: asset.thumbnail,
      theme: asset.theme,
      themeLabel: mediaThemeLabel(asset.theme),
    }))
    .sort((a, b) => a.themeLabel.localeCompare(b.themeLabel) || a.label.localeCompare(b.label));
}

export function mediaThemeGroups(): { theme: MediaTheme; label: string; loops: MediaLibraryAsset[] }[] {
  return MEDIA_THEMES.map((theme) => ({
    theme,
    label: mediaThemeLabel(theme),
    loops: mediaByTheme(theme, "loop"),
  })).filter((group) => group.loops.length > 0);
}
