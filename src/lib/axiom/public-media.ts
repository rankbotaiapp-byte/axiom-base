/**
 * Root-absolute public media URLs.
 * Tenant routes like `/{shopSlug}/admin` must never resolve `media/*.mp4`
 * as `/{shopSlug}/media/*.mp4`.
 */

export const FALLBACK_HERO_POSTER = "/media/hero-poster.jpg";
export const FALLBACK_HERO_LOOP = "/media/master-defaults/leopard-loop.mp4";
export const GIT_LFS_POINTER_MARK = "https://git-lfs.github.com/spec/v1";

const TENANT_PREFIX = /^\/(?!api\/|media\/|assets\/|__grok\/)[^/]+(?:\/[^/]+)?\/(media|assets)\//i;
const FILENAME_ONLY = /^[a-z0-9][a-z0-9._-]*\.(mp4|webm|jpg|jpeg|png|webp|svg|vtt)$/i;

function appBasePath(): string {
  try {
    const raw = typeof import.meta !== "undefined" ? String(import.meta.env?.BASE_URL ?? "/") : "/";
    if (!raw || raw === "/") return "";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  } catch {
    return "";
  }
}

function splitQuery(value: string): { path: string; query: string } {
  const cut = value.indexOf("?");
  if (cut < 0) return { path: value, query: "" };
  return { path: value.slice(0, cut), query: value.slice(cut) };
}

/** True when a checkout wrote a Git LFS pointer instead of media bytes. */
export function isGitLfsPointerText(sample: string | Uint8Array | null | undefined): boolean {
  if (sample == null) return false;
  const text =
    typeof sample === "string"
      ? sample.slice(0, 200)
      : new TextDecoder("utf-8", { fatal: false }).decode(sample.slice(0, 200));
  return text.includes(GIT_LFS_POINTER_MARK) || text.startsWith("version https://git-lfs.github.com/");
}

/**
 * Collapse tenant-relative and `public/` paths onto `/media` or `/assets`.
 * Remote https / blob / data / `/api/` URLs pass through.
 */
export function toRootPublicPath(src: string | null | undefined): string {
  if (typeof src !== "string") return "";
  const trimmed = src.trim();
  if (!trimmed || trimmed.includes("..") || /\s/.test(trimmed)) return "";

  const { path: rawPath, query } = splitQuery(trimmed);
  let path = rawPath.replace(/\\/g, "/");

  if (/^(https?:|blob:|data:)/i.test(path) || path.startsWith("//")) {
    return `${path}${query}`;
  }
  if (path.startsWith("/api/")) return `${path}${query}`.slice(0, 400);

  path = path.replace(/^\/public\//i, "/");
  path = path.replace(/^public\//i, "/");
  if (path.startsWith("media/") || path.startsWith("assets/")) path = `/${path}`;
  if (FILENAME_ONLY.test(path.replace(/^\//, ""))) path = `/media/${path.replace(/^\//, "")}`;

  if (!path.startsWith("/")) path = `/${path}`;

  const tenant = path.match(TENANT_PREFIX);
  if (tenant) {
    path = path.replace(TENANT_PREFIX, "/$1/");
  }

  const base = appBasePath();
  if (base && path.startsWith("/") && !path.startsWith(`${base}/`)) {
    path = `${base}${path}`;
  }
  return `${path}${query}`;
}

/** Path or same-origin absolute URL for a public video / still. */
export function resolvePublicMediaUrl(src: string | null | undefined, origin = ""): string {
  const path = toRootPublicPath(src);
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path) || path.startsWith("//")) return path;
  const host = origin.replace(/\/$/, "");
  if (!host) return path;
  return `${host}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolvePublicPosterUrl(src: string | null | undefined, origin = ""): string {
  return resolvePublicMediaUrl(src?.trim() ? src : FALLBACK_HERO_POSTER, origin) || resolvePublicMediaUrl(FALLBACK_HERO_POSTER, origin);
}

export function resolveFallbackHeroLoop(origin = ""): string {
  return resolvePublicMediaUrl(FALLBACK_HERO_LOOP, origin);
}
