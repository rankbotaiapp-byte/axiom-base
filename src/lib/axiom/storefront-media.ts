export const HERO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const HERO_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const PROOF_IMAGE_TYPES = HERO_IMAGE_TYPES;
export const HERO_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const HERO_VIDEO_MAX_BYTES = 40 * 1024 * 1024;

export type StorefrontUploadKind = "hero" | "proof";

export function validateStorefrontUpload(
  file: File,
  kind: StorefrontUploadKind,
): { ok: true; media: "image" | "video" } | { ok: false; error: string } {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const isImage =
    HERO_IMAGE_TYPES.includes(type as (typeof HERO_IMAGE_TYPES)[number]) ||
    /\.(jpe?g|png|webp)$/.test(name);
  const isVideo =
    HERO_VIDEO_TYPES.includes(type as (typeof HERO_VIDEO_TYPES)[number]) || /\.(mp4|webm)$/.test(name);

  if (kind === "proof") {
    if (!isImage) return { ok: false, error: "Proof photos must be JPG, PNG, or WebP." };
    if (file.size > HERO_IMAGE_MAX_BYTES) return { ok: false, error: "Proof photos must be 8MB or smaller." };
    return { ok: true, media: "image" };
  }

  if (isImage) {
    if (file.size > HERO_IMAGE_MAX_BYTES) return { ok: false, error: "Hero images must be 8MB or smaller." };
    return { ok: true, media: "image" };
  }
  if (isVideo) {
    if (file.size > HERO_VIDEO_MAX_BYTES) return { ok: false, error: "Hero videos must be 40MB or smaller." };
    return { ok: true, media: "video" };
  }
  return { ok: false, error: "Hero media must be MP4, WebM, JPG, PNG, or WebP." };
}

export async function uploadStorefrontAsset(
  slug: string,
  file: File,
  kind: StorefrontUploadKind,
): Promise<string> {
  const check = validateStorefrontUpload(file, kind);
  if (!check.ok) throw new Error(check.error);
  const body = new FormData();
  body.set("file", file);
  body.set("slug", slug);
  body.set("kind", kind);
  const response = await fetch("/api/storefront/assets", { method: "POST", body });
  const json = (await response.json()) as { ok?: boolean; url?: string | null; error?: string };
  if (!response.ok || !json.url) throw new Error(json.error || "Upload did not finish.");
  return json.url;
}
