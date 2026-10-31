import type { ShopNiche } from "./types.ts";

/** A frame in the proof-of-work album. Custom uploads are always stills. */
export type ProofFrame = {
  src: string;
  caption: string;
  kind: "image" | "video";
  placeholder?: boolean;
};

export const GALLERY_LIMIT = 12;
export const DEFAULT_PROOF_SLOTS = 3;
export const DEFAULT_SERVICE_SLOTS = 3;
export const DEFAULT_PREVIEW_LABEL = "Default Preview – Replace in Admin Studio";

export function isCustomStorefrontAsset(imageUrl: string): boolean {
  const value = imageUrl.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("blob:")) return true;
  if (value.includes("/api/shop-media/")) return true;
  if (value.includes("/api/hero/")) return true;
  return false;
}

/** Sample catalog stills and empty srcs are placeholders the owner should replace. */
export function isDefaultStorefrontAsset(imageUrl: string): boolean {
  return !isCustomStorefrontAsset(imageUrl);
}

export function isCustomProof(imageUrl: string): boolean {
  return isCustomStorefrontAsset(imageUrl);
}

export function defaultProof(_niche?: ShopNiche): ProofFrame[] {
  return Array.from({ length: DEFAULT_PROOF_SLOTS }, (_, index) => ({
    src: "",
    caption: `Job ${index + 1}`,
    kind: "image" as const,
    placeholder: true,
  }));
}

export function padProofFrames(custom: ProofFrame[]): ProofFrame[] {
  if (custom.length >= DEFAULT_PROOF_SLOTS) return custom.slice(0, GALLERY_LIMIT);
  return [...custom, ...defaultProof().slice(custom.length)];
}

export function parseServiceThumbs(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: DEFAULT_SERVICE_SLOTS }, (_, index) => {
    const raw = list[index];
    return typeof raw === "string" ? raw.trim().slice(0, 400) : "";
  });
}

export function countDefaultPlaceholders(input: {
  proofUrls?: readonly string[];
  serviceUrls?: readonly string[];
}): { proof: number; service: number; total: number } {
  const customProof = (input.proofUrls ?? []).filter(isCustomStorefrontAsset).length;
  const proof = Math.max(0, DEFAULT_PROOF_SLOTS - customProof);
  const services = input.serviceUrls ?? Array.from({ length: DEFAULT_SERVICE_SLOTS }, () => "");
  const padded = parseServiceThumbs(services);
  const service = padded.filter((url) => isDefaultStorefrontAsset(url)).length;
  return { proof, service, total: proof + service };
}
