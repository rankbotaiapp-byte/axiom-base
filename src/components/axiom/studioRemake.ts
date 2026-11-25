"use client";

import { handleGenerationGuardHttpStatus } from "@/lib/axiom/generation-checkout-client";
import type { InlayPresetId, MotionPresetId } from "@/lib/axiom/storefront-themes";
import type { StudioPhoto } from "./types";

const STORE_KEY = "axiom:studio-remake:v1";

type StoredPhoto = {
  id: string;
  name: string;
  url: string;
  inlay?: InlayPresetId;
  motions?: Partial<Record<MotionPresetId, string>>;
};

type ShopBucket = {
  photos: StoredPhoto[];
  files: Record<string, { imageUrl: string; inlay: InlayPresetId; motions: Partial<Record<MotionPresetId, string>> }>;
};

function emptyBucket(): ShopBucket {
  return { photos: [], files: {} };
}

function readStore(): Record<string, ShopBucket> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, ShopBucket>) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ShopBucket>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* private mode or a full disk */
  }
}

function bucket(slug: string): ShopBucket {
  return readStore()[slug] || emptyBucket();
}

function saveBucket(slug: string, next: ShopBucket) {
  const store = readStore();
  store[slug] = next;
  writeStore(store);
}

function fileKey(file: File, input: { shopSlug: string; niche: string; shopName: string; brandColor: string; inlay?: InlayPresetId; logoUrl?: string }): string {
  return [file.name, file.size, file.lastModified, input.shopSlug, input.niche, input.shopName, input.brandColor, input.inlay || "surface", input.logoUrl || ""].join("|");
}

/** Saved remakes for this shop. The still is shown on reload; motion stays behind the button. */
export function readCachedStudioPhotos(shopSlug: string): StudioPhoto[] {
  return bucket(shopSlug).photos
    .filter((photo) => /^https:\/\//i.test(photo.url))
    .map((photo) => ({
      id: photo.id,
      name: photo.name,
      url: photo.url,
      source: "upload" as const,
      enhanced: true,
      inlay: photo.inlay,
    }));
}

export function rememberStudioPhoto(shopSlug: string, photo: { id: string; name: string; url: string; inlay?: InlayPresetId }) {
  if (!/^https:\/\//i.test(photo.url)) return;
  const current = bucket(shopSlug);
  const previous = current.photos.find((item) => item.id === photo.id);
  const next: StoredPhoto = {
    id: photo.id,
    name: photo.name,
    url: photo.url,
    inlay: photo.inlay,
    motions: previous?.url === photo.url ? previous.motions : {},
  };
  current.photos = [...current.photos.filter((item) => item.id !== photo.id), next].slice(-6);
  saveBucket(shopSlug, current);
}

export function cachedBackground(shopSlug: string, imageUrl: string, motion: MotionPresetId): string | null {
  const current = bucket(shopSlug);
  const photo = current.photos.find((item) => item.url === imageUrl);
  const fromPhoto = photo?.motions?.[motion];
  if (fromPhoto) return fromPhoto;
  for (const entry of Object.values(current.files)) {
    if (entry.imageUrl === imageUrl && entry.motions[motion]) return entry.motions[motion] || null;
  }
  return null;
}

export function rememberBackground(shopSlug: string, imageUrl: string, motion: MotionPresetId, videoUrl: string) {
  const current = bucket(shopSlug);
  for (const photo of current.photos) {
    if (photo.url === imageUrl) photo.motions = { ...photo.motions, [motion]: videoUrl };
  }
  for (const entry of Object.values(current.files)) {
    if (entry.imageUrl === imageUrl) entry.motions = { ...entry.motions, [motion]: videoUrl };
  }
  saveBucket(shopSlug, current);
}

/** Public upload, then Flux image-to-image. Library plates are not a source. */
export async function remakeUploadedPhoto(input: {
  file: File;
  shopSlug: string;
  niche: string;
  shopName: string;
  brandColor: string;
  slotLabel: string;
  inlay?: InlayPresetId;
  logoUrl?: string;
}): Promise<string> {
  const saved = bucket(input.shopSlug).files[fileKey(input.file, input)];
  if (saved?.imageUrl && saved.inlay === (input.inlay || "surface")) return saved.imageUrl;

  const body = new FormData();
  body.set("file", input.file);
  body.set("slug", input.shopSlug);
  const uploaded = await fetch("/api/studio/upload", { method: "POST", body });
  const uploadJson = (await uploaded.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!uploaded.ok || !uploadJson.url) {
    throw new Error(uploadJson.error || "The photo did not upload.");
  }
  if (!/^https:\/\//i.test(uploadJson.url)) {
    throw new Error("Studio needs a public photo URL before it can remake the upload.");
  }

  const res = await fetch("/api/studio/slot-generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "proof_touchup",
      shopSlug: input.shopSlug,
      sourceImageUrl: uploadJson.url,
      slotLabel: input.slotLabel,
      niche: input.niche,
      shopName: input.shopName,
      brandColor: input.brandColor,
      inlay: input.inlay,
      logoUrl: input.logoUrl,
    }),
  });
  if (await handleGenerationGuardHttpStatus(res.status, input.shopSlug)) {
    throw new Error("Sign in to run Axiom generation.");
  }
  const json = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!res.ok || !json.imageUrl) throw new Error(json.error || "Studio did not return a remake.");
  const current = bucket(input.shopSlug);
  current.files[fileKey(input.file, input)] = {
    imageUrl: json.imageUrl,
    inlay: input.inlay || "surface",
    motions: {},
  };
  saveBucket(input.shopSlug, current);
  return json.imageUrl;
}

/** Video motion of the recreated still. The same frame stays the subject. */
export async function animateRecreatedBackground(input: {
  imageUrl: string;
  shopSlug: string;
  niche: string;
  shopName: string;
  brandColor: string;
  motion?: MotionPresetId;
  reactions?: string[];
}): Promise<string> {
  if (!/^https:\/\//i.test(input.imageUrl)) {
    throw new Error("Remake the uploaded photo first, then animate its background.");
  }
  const motion = input.motion || "smoke";
  const saved = cachedBackground(input.shopSlug, input.imageUrl, motion);
  if (saved) return saved;
  const res = await fetch("/api/studio/slot-generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "background_motion",
      shopSlug: input.shopSlug,
      sourceImageUrl: input.imageUrl,
      niche: input.niche,
      shopName: input.shopName,
      brandColor: input.brandColor,
      motion: input.motion,
      reactions: input.reactions,
    }),
  });
  if (await handleGenerationGuardHttpStatus(res.status, input.shopSlug)) {
    throw new Error("Sign in to animate the background.");
  }
  const json = (await res.json().catch(() => ({}))) as { videoUrl?: string; error?: string };
  if (!res.ok || !json.videoUrl) throw new Error(json.error || "Background motion did not finish.");
  rememberBackground(input.shopSlug, input.imageUrl, motion, json.videoUrl);
  return json.videoUrl;
}
