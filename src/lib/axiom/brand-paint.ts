import { PROOF_DATA_LIMIT, brandPlate, fittedSize, framePlacement, heroDrift, HERO_LOOP_SECONDS } from "./branded-hero.ts";

export type BrandInk = { obsidian: string; ink: string; accent: string };

export function readBrandInk(host: HTMLElement): BrandInk {
  const hostStyle = getComputedStyle(host);
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    obsidian: hostStyle.getPropertyValue("--hero-obsidian").trim() || hostStyle.backgroundColor,
    ink: hostStyle.color,
    accent: rootStyle.getPropertyValue("--color-accent").trim() || hostStyle.outlineColor,
  };
}

function displayFont(): string {
  const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return stack || "Georgia, serif";
}

export function paintBrandedStill(
  bitmap: ImageBitmap,
  name: string,
  ink: BrandInk,
  maxEdge: number,
): HTMLCanvasElement {
  const plate = brandPlate(name);
  const size = fittedSize(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not brand that photo");
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);

  const vignette = ctx.createRadialGradient(
    size.width / 2,
    size.height / 2,
    Math.min(size.width, size.height) * 0.28,
    size.width / 2,
    size.height / 2,
    Math.max(size.width, size.height) * 0.72,
  );
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, ink.obsidian);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size.width, size.height);

  const band = ctx.createLinearGradient(0, size.height * 0.55, 0, size.height);
  band.addColorStop(0, "transparent");
  band.addColorStop(1, ink.obsidian);
  ctx.fillStyle = band;
  ctx.fillRect(0, size.height * 0.55, size.width, size.height * 0.45);

  const markSize = Math.max(36, Math.round(Math.min(size.width, size.height) * 0.16));
  const mx = size.width * 0.06;
  const my = size.height * 0.08;
  ctx.save();
  ctx.translate(mx + markSize / 2, my + markSize * 0.36);
  ctx.rotate(-0.06);
  ctx.strokeStyle = ink.accent;
  ctx.lineWidth = Math.max(2, markSize * 0.045);
  ctx.strokeRect(-markSize / 2, -markSize * 0.36, markSize, markSize * 0.72);
  ctx.fillStyle = ink.ink;
  ctx.font = `600 ${Math.round(markSize * 0.32)}px ${displayFont()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(plate.mark, 0, 0);
  ctx.restore();

  const line = plate.line.toUpperCase();
  let fontSize = Math.round(Math.min(size.width, size.height) * 0.07);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ink.ink;
  ctx.font = `400 ${fontSize}px ${displayFont()}`;
  while (fontSize > 14 && ctx.measureText(line).width > size.width * 0.88) {
    fontSize -= 2;
    ctx.font = `400 ${fontSize}px ${displayFont()}`;
  }
  ctx.fillText(line, size.width * 0.06, size.height * 0.7);
  ctx.strokeStyle = ink.accent;
  ctx.lineWidth = Math.max(1, size.width * 0.003);
  ctx.beginPath();
  ctx.moveTo(size.width * 0.06, size.height * 0.735);
  ctx.lineTo(size.width * 0.06 + Math.min(ctx.measureText(line).width, size.width * 0.5), size.height * 0.735);
  ctx.stroke();
  return canvas;
}

export function canvasToJpeg(source: HTMLCanvasElement, limit = PROOF_DATA_LIMIT): string {
  let canvas = source;
  let quality = 0.82;
  let url = canvas.toDataURL("image/jpeg", quality);
  for (let guard = 0; url.length > limit && guard < 8; guard += 1) {
    if (quality > 0.5) {
      quality = Math.round((quality - 0.08) * 100) / 100;
    } else {
      const next = document.createElement("canvas");
      next.width = Math.max(480, Math.round(canvas.width * 0.82));
      next.height = Math.max(320, Math.round(canvas.height * 0.82));
      if (next.width === canvas.width && next.height === canvas.height) break;
      const nextCtx = next.getContext("2d");
      if (!nextCtx) break;
      nextCtx.drawImage(canvas, 0, 0, next.width, next.height);
      canvas = next;
      quality = 0.7;
    }
    url = canvas.toDataURL("image/jpeg", quality);
  }
  if (url.length > limit) throw new Error("That branded still is still too large for the gallery.");
  return url;
}

export function paintHeroFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  second: number,
  ink: BrandInk,
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.save();
  ctx.fillStyle = ink.obsidian;
  ctx.fillRect(0, 0, width, height);
  const place = framePlacement(srcW, srcH, width, height, heroDrift(second));
  ctx.drawImage(source, place.dx, place.dy, place.dw, place.dh);

  const inset = Math.round(Math.min(width, height) * 0.045);
  ctx.strokeStyle = ink.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const arm = Math.round(Math.min(width, height) * 0.08);
  ctx.lineWidth = 3;
  const corners: Array<[number, number, number, number]> = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * arm);
    ctx.stroke();
  }

  const scanT = (second % HERO_LOOP_SECONDS) / HERO_LOOP_SECONDS;
  const y = inset + scanT * (height - inset * 2);
  ctx.globalAlpha = 0.12 + 0.5 * Math.sin(Math.PI * scanT);
  ctx.beginPath();
  ctx.moveTo(inset, y);
  ctx.lineTo(width - inset, y);
  ctx.stroke();
  ctx.restore();
}
