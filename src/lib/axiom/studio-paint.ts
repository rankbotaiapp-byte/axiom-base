import { canvasToJpeg } from "./brand-paint.ts";
import {
  STUDIO_PLATE,
  studioInitials,
  studioPlateLayout,
  type StudioIdentity,
} from "./studio-identity.ts";

function hexAlpha(hex: string, alpha: number): string {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  if (![r, g, b].every((channel) => Number.isFinite(channel))) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function cover(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / Math.max(srcW, 1), dstH / Math.max(srcH, 1));
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}

function paintBadge(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, identity: StudioIdentity) {
  ctx.save();
  ctx.font = "600 18px Outfit, sans-serif";
  const width = Math.ceil(ctx.measureText(label).width) + 28;
  const height = 36;
  roundRect(ctx, x - width / 2, y - height / 2, width, height, 18);
  ctx.fillStyle = identity.field;
  ctx.globalAlpha = 0.78;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = identity.accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = identity.neon;
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = identity.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

/**
 * Rebuild a raw photo as a branded plate: the landscape stays, and the locked
 * mark, sponsor chips, and neon horizon are painted into the scene.
 */
export function paintStudioPlate(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  identity: StudioIdentity,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = STUDIO_PLATE.width;
  canvas.height = STUDIO_PLATE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not re-create that photo");
  const layout = studioPlateLayout(identity.badges.length);
  const place = cover(sourceWidth, sourceHeight, canvas.width, canvas.height);

  ctx.fillStyle = identity.field || "#08080a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = "saturate(1.15) contrast(1.05)";
  ctx.drawImage(source, place.dx, place.dy, place.dw, place.dh);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = identity.field;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const horizon = layout.horizonY;
  const glow = ctx.createLinearGradient(0, horizon - 90, 0, horizon + 110);
  glow.addColorStop(0, "transparent");
  glow.addColorStop(0.42, hexAlpha(identity.neon, 0.08));
  glow.addColorStop(0.5, hexAlpha(identity.accent, 0.72));
  glow.addColorStop(0.58, hexAlpha(identity.neon, 0.16));
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon - 90, canvas.width, 200);

  ctx.save();
  ctx.strokeStyle = identity.neon;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.shadowColor = identity.neon;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(layout.beam.x1, layout.beam.y1);
  ctx.lineTo(layout.beam.x2, layout.beam.y2);
  ctx.stroke();
  ctx.restore();

  const band = ctx.createLinearGradient(0, canvas.height * 0.52, 0, canvas.height);
  band.addColorStop(0, "transparent");
  band.addColorStop(1, hexAlpha(identity.field, 0.88));
  ctx.fillStyle = band;
  ctx.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.48);

  const { logo } = layout;
  ctx.save();
  ctx.translate(logo.x, logo.y);
  ctx.strokeStyle = identity.neon;
  ctx.lineWidth = 3;
  ctx.shadowColor = identity.neon;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, 0, logo.size / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = hexAlpha(identity.field, 0.55);
  ctx.fill();
  ctx.fillStyle = identity.ink;
  ctx.font = `500 ${Math.round(logo.size * 0.34)}px "Instrument Serif", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(studioInitials(identity), 0, 2);
  ctx.restore();

  for (const [index, badge] of identity.badges.entries()) {
    const spot = layout.badges[index];
    if (!spot) continue;
    paintBadge(ctx, spot.x, spot.y, badge.label, identity);
  }

  let fontSize = 64;
  const title = identity.businessName;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = identity.ink;
  ctx.font = `400 ${fontSize}px "Instrument Serif", Georgia, serif`;
  while (fontSize > 28 && ctx.measureText(title).width > canvas.width * 0.86) {
    fontSize -= 2;
    ctx.font = `400 ${fontSize}px "Instrument Serif", Georgia, serif`;
  }
  ctx.shadowColor = identity.neon;
  ctx.shadowBlur = 18;
  ctx.fillText(title, 72, layout.nameY);
  ctx.shadowBlur = 0;
  return canvas;
}

export function studioPlateJpeg(canvas: HTMLCanvasElement): string {
  return canvasToJpeg(canvas);
}
