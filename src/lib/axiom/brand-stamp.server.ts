import sharp from "sharp";
import {
  brandStampCopy,
  brandStampSvg,
  normalizeStampPlatform,
  stampSafeCaption,
  type BrandStampPlatform,
  type BrandStampShop,
} from "./brand-stamp.ts";

export type ApplyAxiomBrandStampInput = {
  imageBuffer: Buffer | Uint8Array;
  shop: BrandStampShop;
  platform: BrandStampPlatform | string;
};

export async function applyAxiomBrandStamp(input: ApplyAxiomBrandStampInput): Promise<{
  webp: Buffer;
  copy: ReturnType<typeof brandStampCopy>;
  captionSafe: (caption: string) => string;
}> {
  const source = Buffer.isBuffer(input.imageBuffer) ? input.imageBuffer : Buffer.from(input.imageBuffer);
  const platform = normalizeStampPlatform(String(input.platform));
  const copy = brandStampCopy(input.shop, platform);
  const meta = await sharp(source, { failOn: "none", limitInputPixels: 40_000_000 }).metadata();
  const width = Math.max(320, meta.width || 1080);
  const height = Math.max(320, meta.height || 1350);
  const svg = brandStampSvg({ width, height, copy });
  const webp = await sharp(source, { failOn: "none", limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .composite([{ input: Buffer.from(svg), gravity: "southeast" }])
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  return {
    webp,
    copy,
    captionSafe: (caption: string) => stampSafeCaption(caption, platform),
  };
}
