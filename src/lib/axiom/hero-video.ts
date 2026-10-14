export const HERO_VIDEO_MAX_BYTES = 12 * 1024 * 1024;

/** ISO BMFF files start with a size field and the `ftyp` brand. */
export function isMp4(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12 || bytes.byteLength > HERO_VIDEO_MAX_BYTES) return false;
  return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
}

export function isCustomHeroVideo(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/api/hero-video/");
}

export function heroVideoPath(shopId: string, version: number): string {
  return `/api/hero-video/${shopId}?v=${version}`;
}

/** A shop upload is served from that shop's route. It never points at a shared film. */
export function shopHeroVideoPath(shopId: string, version: number): string {
  const path = heroVideoPath(shopId, version);
  if (!path.startsWith(`/api/hero-video/${shopId}`) || path.includes("/media/")) {
    throw new Error("Shop films stay on this shop");
  }
  return path;
}

export function shopIdFromHeroPath(pathname: string): string | null {
  const id = pathname.split("/").filter(Boolean).pop() ?? "";
  return /^shop_[a-zA-Z0-9]+$/.test(id) ? id : null;
}
