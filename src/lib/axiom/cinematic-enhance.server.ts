import sharp from "sharp";

export const JOB_PHOTO_MAX_EDGE = 2400;
export const JOB_THUMB_WIDTH = 720;

export type EnhancedJobPhoto = {
  webp: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  mime: "image/webp";
};

export function isRasterJobPhoto(mime: string, name = ""): boolean {
  return (
    /image\/(jpeg|jpg|pjpeg|png|webp|heic|heif|gif)$/i.test(mime) ||
    /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(name)
  );
}

/**
 * Authentic job-photo finish: EXIF rotate, histogram normalize, local
 * micro-contrast, light sharpen. No generative fill or geometry warp.
 */
export async function enhanceJobPhoto(input: Buffer | Uint8Array): Promise<EnhancedJobPhoto> {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const base = sharp(source, { failOn: "none", sequentialRead: true, limitInputPixels: 40_000_000 })
    .rotate()
    .normalize({ lower: 2, upper: 98 })
    .clahe({ width: 8, height: 8, maxSlope: 2 })
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 0.8, m1: 0.7, m2: 0.3 })
    .resize({
      width: JOB_PHOTO_MAX_EDGE,
      height: JOB_PHOTO_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

  const webp = await base
    .clone()
    .webp({ quality: 84, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await base
    .clone()
    .resize({ width: JOB_THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78, effort: 3, smartSubsample: true })
    .toBuffer();

  return {
    webp: webp.data,
    thumb,
    width: webp.info.width,
    height: webp.info.height,
    mime: "image/webp",
  };
}
