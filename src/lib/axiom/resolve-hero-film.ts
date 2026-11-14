import { resolveCatalogNiche, tradeLoopUrl } from "../../config/catalog.ts";
import { isHeroLibrarySrc } from "./hero-library.ts";
import { toRootPublicPath } from "./public-media.ts";

export type ShopHeroConfig = {
  overrideHeroVideoUrl?: string | null;
  heroVideoUrl?: string | null;
  niche?: string | null;
};

function playableOverride(url: string | null | undefined): string {
  if (!url) return "";
  const value = toRootPublicPath(url.trim()).split("?")[0] ?? "";
  if (!value || value.includes("..") || /\s/.test(value)) return "";
  if (value.startsWith("/api/hero-video/")) return value.slice(0, 240);
  if (isHeroLibrarySrc(value) || value.startsWith("/media/master-defaults/")) return value;
  if (value.startsWith("/media/") && /\.mp4$/i.test(value)) return value;
  if (value.startsWith("https://") && !value.includes(" ")) return value.slice(0, 400);
  return "";
}

/**
 * Shop pin first. Otherwise the niche's own loop (not the parent category film).
 * Playback still applies the 1.75s loop tail trim in the video element.
 */
export function resolveShopHeroFilm(config: ShopHeroConfig): string {
  const override = playableOverride(config.overrideHeroVideoUrl) || playableOverride(config.heroVideoUrl);
  if (override) return override;
  return tradeLoopUrl(resolveCatalogNiche(config.niche));
}

/** Append a pin revision so a hard reload cannot reuse a stale MP4. */
export function bustStorefrontFilm(url: string, revision?: number | null): string {
  const path = url.trim();
  if (!path) return path;
  const stamp = Number(revision);
  if (!Number.isFinite(stamp) || stamp <= 0) return path.split("?")[0] ?? path;
  const base = path.split("?")[0] ?? path;
  return `${base}?v=${Math.floor(stamp)}`;
}
