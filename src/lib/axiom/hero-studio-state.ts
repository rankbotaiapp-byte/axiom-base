import { catalogFilmUrl, resolveCatalogNiche } from "../../config/catalog.ts";
import { ANIMATION_MP4_FILES, isCatalogHeroUrl, isPublicMediaFilm } from "./hero-films.ts";

export const HERO_STUDIO_KEY = "axiom-hero-studio";
export const HERO_STUDIO_EVENT = "axiom-hero-studio";

export type HeroDraft = {
  hero_video_url: string;
  tagline: string;
  updatedAt: string;
};

export type HeroPreset = {
  id: string;
  label: string;
  url: string;
};

export const AUTO_HERO_ANIMATION = "/media/auto-hero-animation.mp4";
export const LEOPARD_HERO_ANIMATION = "/media/leopard-hero-animation.mp4";

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
  if (!url || !url.startsWith("/media/") || url.includes("..") || url.slice("/media/".length).includes("/")) return false;
  return isHeroAnimationFile(url.slice("/media/".length).split("?")[0] ?? "");
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
  return heroAnimationsFromNames(ANIMATION_MP4_FILES);
}

/** Auto and cyberpunk shops use the auto loop. Wildlife and expedition shops use the leopard loop. */
export function boundHeroAnimation(niche: string, customNiche = ""): string | null {
  const hay = `${niche} ${customNiche}`.toLowerCase();
  if (/\b(cyberpunk|cyber|auto|mechanic|detailer|detailing)\b/.test(hay) || niche === "field" || niche === "detailer") {
    return AUTO_HERO_ANIMATION;
  }
  if (/\b(wildlife|expeditions?|leopard|safari)\b/.test(hay) || niche === "hunting") {
    return LEOPARD_HERO_ANIMATION;
  }
  return null;
}

/** A chosen hero animation wins. Otherwise a bound niche uses its animation. */
export function resolveStorefrontFilm(input: {
  draft: HeroDraft | null;
  shopVideoUrl: string | null;
  niche: string;
  customNiche?: string;
  fallbackVideoUrl: string;
  shopTagline: string;
}): HeroSelection {
  const draftUrl = isHeroAnimationUrl(input.draft?.hero_video_url) ? input.draft?.hero_video_url ?? "" : "";
  if (draftUrl) {
    return { hero_video_url: draftUrl, tagline: input.draft?.tagline ?? "", source: "studio" };
  }
  const shop = cleanHeroUrl(input.shopVideoUrl);
  if (shop && isHeroAnimationUrl(shop)) {
    return { hero_video_url: shop, tagline: input.shopTagline, source: "shop" };
  }
  const catalog = catalogFilmUrl(resolveCatalogNiche(input.niche));
  if (isHeroAnimationUrl(catalog)) {
    return { hero_video_url: catalog, tagline: input.shopTagline, source: "niche" };
  }
  const bound = boundHeroAnimation(input.niche, input.customNiche ?? "");
  if (bound) return { hero_video_url: bound, tagline: input.shopTagline, source: "niche" };
  const fallback = isHeroAnimationUrl(input.fallbackVideoUrl) ? input.fallbackVideoUrl : LEOPARD_HERO_ANIMATION;
  return { hero_video_url: fallback, tagline: input.shopTagline, source: "niche" };
}

/** Client hero choices: only `*-hero-animation.mp4` in the media root. */
export function mediaLibrary(names?: readonly string[]): HeroPreset[] {
  return heroAnimationsFromNames(names ?? ANIMATION_MP4_FILES);
}

/** Catalog films, public/media loops, and this shop's uploaded clip. Anything else is dropped. */
export function cleanHeroUrl(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
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
      const row = value as { hero_video_url?: unknown; heroVideoUrl?: unknown; tagline?: unknown; updatedAt?: unknown };
      const hero_video_url = cleanHeroUrl(typeof row.hero_video_url === "string" ? row.hero_video_url : typeof row.heroVideoUrl === "string" ? row.heroVideoUrl : "");
      if (!hero_video_url) continue;
      out[slug] = {
        hero_video_url,
        tagline: cleanTagline(typeof row.tagline === "string" ? row.tagline : ""),
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

export function writeHeroDraft(slug: string, input: { hero_video_url: string; tagline: string }): HeroDraft {
  const key = slug.trim().toLowerCase();
  const hero_video_url = cleanHeroUrl(input.hero_video_url);
  if (!key || !hero_video_url) throw new Error("Choose an mp4 loop");
  const draft: HeroDraft = {
    hero_video_url,
    tagline: cleanTagline(input.tagline),
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
  const ext = fileName.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
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
  const mime = objectPath.endsWith(".webm") ? "video/webm" : "video/mp4";
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
  const payload = { shop_slug: shopSlug, hero_video_url: draft.hero_video_url, tagline: draft.tagline };
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
    const patch = await fetch(`${url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(shopSlug)}`, {
      method: "PATCH",
      signal: controller.signal,
      headers: { ...headers, prefer: "return=minimal" },
      body: JSON.stringify({ hero_video_url: draft.hero_video_url, tagline: draft.tagline }),
    });
    return patch.ok ? "saved" : "skipped";
  } catch {
    return "skipped";
  } finally {
    clearTimeout(timer);
  }
}
