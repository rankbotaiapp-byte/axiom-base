import { defaultNicheFilm } from "../../config/catalog.ts";
import { heroLibraryItems } from "./hero-library.ts";
import { isCatalogHeroUrl, isPublicMediaFilm } from "./hero-films.ts";
import { parseHeroLook, type HeroLook } from "./hero-look.ts";
import { toRootPublicPath } from "./public-media.ts";

export { DEFAULT_HERO_LOOK, heroLookFromProfile, parseHeroLook } from "./hero-look.ts";
export type { HeroLook } from "./hero-look.ts";

export const HERO_STUDIO_KEY = "axiom-hero-studio";
export const HERO_STUDIO_EVENT = "axiom-hero-studio";

export type HeroDraft = {
  hero_video_url: string;
  hero_image_url?: string;
  tagline: string;
  look?: HeroLook;
  updatedAt: string;
};

export type HeroPreset = {
  id: string;
  label: string;
  url: string;
};

export const AUTO_HERO_ANIMATION = defaultNicheFilm("auto");
export const LEOPARD_HERO_ANIMATION = defaultNicheFilm("forestry");

const HERO_ANIMATION_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*-hero-animation\.mp4$/i;

/** A single public/media file named like `auto-hero-animation.mp4`. Doubled extensions do not match. */
export function isHeroAnimationFile(name: string): boolean {
  return HERO_ANIMATION_FILE.test(name);
}

/** `auto-hero-animation.mp4` becomes "Auto". */
export function heroAnimationLabel(name: string): string {
  const prefix = name.replace(/-hero-animation\.mp4$/i, "");
  return prefix
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function isHeroAnimationUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("/media/") || url.includes("..")) return false;
  const rest = url.slice("/media/".length).split("?")[0] ?? "";
  const nested = rest.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\/hero-animation\.mp4$/i);
  if (nested) return true;
  if (/^master-defaults\/[a-z0-9-]+-loop\.mp4$/i.test(rest)) return true;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*-hero-path\.mp4$/i.test(rest)) return true;
  if (rest.includes("/")) return false;
  return isHeroAnimationFile(rest);
}

/** Catalog loops, this shop's uploaded clip, or a public storage URL. */
export function isPlayableHeroFilm(url: string | null | undefined): boolean {
  if (!url || url.includes("..") || /\s/.test(url)) return false;
  if (isHeroAnimationUrl(url) || isCatalogHeroUrl(url) || isPublicMediaFilm(url)) return true;
  if (url.startsWith("/api/hero-video/")) return true;
  return url.startsWith("https://");
}

/** A shop still served from this app, or a public image URL. */
export function cleanStillUrl(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if ((url.startsWith("/api/shop-media/") || url.startsWith("/api/hero/brand/")) && !url.includes("..")) {
    return url.slice(0, 240);
  }
  if (url.startsWith("https://") && !url.includes(" ")) return url.slice(0, 400);
  return "";
}

/** Turns a directory listing into picker rows. Anything else in public/media is ignored. */
export function heroAnimationsFromNames(names: readonly string[]): HeroPreset[] {
  const seen = new Set<string>();
  const rows: HeroPreset[] = [];
  for (const name of names) {
    if (!isHeroAnimationFile(name)) continue;
    const file = name.toLowerCase();
    if (seen.has(file)) continue;
    seen.add(file);
    rows.push({ id: file, label: heroAnimationLabel(file), url: `/media/${file}` });
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label) || a.url.localeCompare(b.url));
}

export function heroPresets(): HeroPreset[] {
  const fromLibrary = heroLibraryItems().map((item) => ({ id: item.id, label: item.name, url: item.src }));
  if (fromLibrary.length) return fromLibrary;
  return [
    { id: "auto", label: "Auto", url: AUTO_HERO_ANIMATION },
    { id: "leopard", label: "Leopard", url: LEOPARD_HERO_ANIMATION },
  ];
}

/** Every trade uses `/media/{niche}/hero-animation.mp4`. */
export function boundHeroAnimation(niche: string, _customNiche = ""): string {
  return defaultNicheFilm(niche);
}

/** A chosen hero animation wins. Otherwise the niche default loop. */
export function resolveStorefrontFilm(input: {
  draft: HeroDraft | null;
  shopVideoUrl: string | null;
  niche: string;
  customNiche?: string;
  fallbackVideoUrl: string;
  shopTagline: string;
}): HeroSelection {
  const draftUrl = cleanHeroUrl(input.draft?.hero_video_url);
  if (draftUrl && isPlayableHeroFilm(draftUrl)) {
    return { hero_video_url: draftUrl, tagline: input.draft?.tagline ?? "", source: "studio" };
  }
  const shop = cleanHeroUrl(input.shopVideoUrl);
  if (shop && isPlayableHeroFilm(shop)) {
    return { hero_video_url: shop, tagline: input.shopTagline, source: "shop" };
  }
  const catalog = defaultNicheFilm(input.niche);
  return { hero_video_url: catalog, tagline: input.shopTagline, source: "niche" };
}

/** Client hero choices: niche folder loops plus extra pins. */
export function mediaLibrary(names?: readonly string[]): HeroPreset[] {
  if (names) return heroAnimationsFromNames(names);
  return heroPresets();
}

/** Catalog films, public/media loops, and this shop's uploaded clip. Anything else is dropped. */
export function cleanHeroUrl(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const url = toRootPublicPath(value.trim());
  if (url.startsWith("/api/hero-video/") && !url.includes("..")) return url.slice(0, 240);
  if (isPublicMediaFilm(url) || isCatalogHeroUrl(url)) return url;
  if (url.startsWith("https://") && !url.includes(" ")) return url.slice(0, 400);
  return "";
}

export function cleanTagline(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 160);
}

function readMap(): Record<string, HeroDraft> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(HERO_STUDIO_KEY) || "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, HeroDraft> = {};
    for (const [slug, value] of Object.entries(raw)) {
      const row = value as {
        hero_video_url?: unknown;
        heroVideoUrl?: unknown;
        hero_image_url?: unknown;
        tagline?: unknown;
        look?: unknown;
        updatedAt?: unknown;
      };
      const hero_video_url = cleanHeroUrl(typeof row.hero_video_url === "string" ? row.hero_video_url : typeof row.heroVideoUrl === "string" ? row.heroVideoUrl : "");
      if (!hero_video_url) continue;
      const still = cleanStillUrl(typeof row.hero_image_url === "string" ? row.hero_image_url : "");
      out[slug] = {
        hero_video_url,
        ...(still ? { hero_image_url: still } : {}),
        tagline: cleanTagline(typeof row.tagline === "string" ? row.tagline : ""),
        ...(row.look ? { look: parseHeroLook(row.look) } : {}),
        updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function readHeroDraft(slug: string): HeroDraft | null {
  return readMap()[slug.trim().toLowerCase()] ?? null;
}

export function writeHeroDraft(
  slug: string,
  input: { hero_video_url: string; tagline: string; hero_image_url?: string; look?: HeroLook },
): HeroDraft {
  const key = slug.trim().toLowerCase();
  const hero_video_url = cleanHeroUrl(input.hero_video_url);
  if (!key || !hero_video_url) throw new Error("Choose an mp4 loop");
  const still = cleanStillUrl(input.hero_image_url);
  const draft: HeroDraft = {
    hero_video_url,
    ...(still ? { hero_image_url: still } : {}),
    tagline: cleanTagline(input.tagline),
    ...(input.look ? { look: parseHeroLook(input.look) } : {}),
    updatedAt: new Date().toISOString(),
  };
  if (typeof localStorage === "undefined") return draft;
  const next = readMap();
  next[key] = draft;
  localStorage.setItem(HERO_STUDIO_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(HERO_STUDIO_EVENT, { detail: { slug: key } }));
  }
  return draft;
}

export type HeroSelection = {
  hero_video_url: string;
  tagline: string;
  source: "studio" | "shop" | "niche";
};

/** Studio draft wins, then the shop's saved hero_video_url, then the niche film. */
export function resolveHeroSelection(input: {
  draft: HeroDraft | null;
  shopVideoUrl: string | null;
  fallbackVideoUrl: string;
  shopTagline: string;
}): HeroSelection {
  const studio = input.draft?.hero_video_url || "";
  const shop = cleanHeroUrl(input.shopVideoUrl);
  const fallback = input.fallbackVideoUrl.trim();
  if (studio) {
    return { hero_video_url: studio, tagline: input.draft?.tagline ?? "", source: "studio" };
  }
  if (shop) {
    return { hero_video_url: shop, tagline: input.shopTagline, source: "shop" };
  }
  return { hero_video_url: fallback, tagline: input.shopTagline, source: "niche" };
}

function envValue(name: string): string {
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const fromVite = meta.env?.[name]?.trim();
  if (fromVite) return fromVite;
  if (typeof process === "undefined" || !process.env) return "";
  const bag = process.env as Record<string, string | undefined>;
  return bag[name]?.trim() ?? "";
}

function supabaseEnv(): { url: string; key: string } {
  const url = (
    envValue("VITE_SUPABASE_URL") ||
    envValue("NEXT_PUBLIC_SUPABASE_URL") ||
    envValue("SUPABASE_URL")
  ).replace(/\/$/, "");
  const key =
    envValue("VITE_SUPABASE_ANON_KEY") ||
    envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    envValue("SUPABASE_ANON_KEY");
  return { url, key };
}

/** Object key inside the public `media` storage bucket. */
export function heroStoragePath(slug: string, fileName: string, now = Date.now()): string {
  const key = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const lower = fileName.toLowerCase();
  const ext = lower.endsWith(".webm")
    ? "webm"
    : lower.endsWith(".png")
      ? "png"
      : lower.endsWith(".webp")
        ? "webp"
        : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          ? "jpg"
          : "mp4";
  return `${key || "shop"}/${now}.${ext}`;
}

function storageHeaders(key: string, mime: string): HeadersInit {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": mime,
    "x-upsert": "true",
  };
}

/** Puts the clip in Supabase Storage under `media/{shop}/{file}` and returns its public URL. */
export async function uploadHeroToStorage(slug: string, file: File): Promise<string | null> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;
  const objectPath = heroStoragePath(slug, file.name);
  const mime = file.type.startsWith("image/")
    ? file.type
    : objectPath.endsWith(".webm")
      ? "video/webm"
      : "video/mp4";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${url}/storage/v1/object/media/${objectPath}`, {
      method: "POST",
      signal: controller.signal,
      headers: storageHeaders(key, mime),
      body: file,
    });
    if (!response.ok) return null;
    return `${url}/storage/v1/object/public/media/${objectPath}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Writes `hero_video_url` and `tagline` on `client_storefronts` when Supabase is configured. */
export async function persistHeroToSupabase(slug: string, draft: HeroDraft): Promise<"skipped" | "saved"> {
  const { url, key } = supabaseEnv();
  const shopSlug = slug.trim().toLowerCase();
  if (!url || !key || !shopSlug) return "skipped";
  const payload: Record<string, unknown> = {
    shop_slug: shopSlug,
    hero_video_url: draft.hero_video_url,
    background_video_url: draft.hero_video_url,
    hero_background_loop: draft.hero_video_url,
    tagline: draft.tagline,
  };
  if (draft.hero_image_url) payload.hero_image_url = draft.hero_image_url;
  if (draft.look) payload.hero_look = draft.look;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    prefer: "resolution=merge-duplicates,return=minimal",
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const upsert = await fetch(`${url}/rest/v1/client_storefronts?on_conflict=shop_slug`, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify(payload),
    });
    if (upsert.ok) return "saved";
    const loop = {
      hero_video_url: draft.hero_video_url,
      background_video_url: draft.hero_video_url,
      hero_background_loop: draft.hero_video_url,
      tagline: draft.tagline,
    };
    const patch = await fetch(`${url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(shopSlug)}`, {
      method: "PATCH",
      signal: controller.signal,
      headers: { ...headers, prefer: "return=minimal" },
      body: JSON.stringify(loop),
    });
    if (patch.ok) return "saved";
    const plain = await fetch(`${url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(shopSlug)}`, {
      method: "PATCH",
      signal: controller.signal,
      headers: { ...headers, prefer: "return=minimal" },
      body: JSON.stringify({ hero_video_url: draft.hero_video_url, tagline: draft.tagline }),
    });
    return plain.ok ? "saved" : "skipped";
  } catch {
    return "skipped";
  } finally {
    clearTimeout(timer);
  }
}
