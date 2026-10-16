import type { ShopNiche } from "./types.ts";

/** A frame in the proof-of-work album. Custom uploads are always stills. */
export type ProofFrame = {
  src: string;
  caption: string;
  kind: "image" | "video";
};

export const GALLERY_LIMIT = 12;

/** Sample albums are retired. A shop shows only the photos the owner uploads. */
export function defaultProof(_niche: ShopNiche): ProofFrame[] {
  return [];
}

export function isCustomProof(imageUrl: string): boolean {
  return imageUrl.startsWith("data:image/");
}
