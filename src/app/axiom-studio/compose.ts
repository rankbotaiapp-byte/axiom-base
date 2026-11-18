export type Rgb = { r: number; g: number; b: number };

export type StudioNiche = "plumbing" | "fishing" | "contracting";

export type Palette = {
  tint: Rgb;
  accent: string;
  warm: boolean;
};

const CYAN = "#00f2fe";
const AMBER = "#ffb020";

export function inferNiche(name: string): StudioNiche {
  const value = name.toLowerCase();
  if (/fish|river|guide|boat|angler|drift/.test(value)) return "fishing";
  if (/plumb|pipe|drain|water|leak|hvac|heat/.test(value)) return "plumbing";
  return "contracting";
}

export function analyzeImage(image: CanvasImageSource, width: number, height: number): { subject: HTMLCanvasElement; palette: Palette } {
  const maxEdge = 960;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(image, 0, 0, w, h);
  const frame = ctx.getImageData(0, 0, w, h);
  const palette = paletteFrom(frame.data, w, h);
  knockOutBackdrop(frame, w, h);
  ctx.putImageData(frame, 0, 0);
  return { subject: canvas, palette };
}

function paletteFrom(data: Uint8ClampedArray, w: number, h: number): Palette {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  let best = 0;
  let accent: Rgb = { r: 0, g: 242, b: 254 };
  const step = Math.max(1, Math.floor((w * h) / 2500));
  for (let p = 0; p < w * h; p += step) {
    const i = p * 4;
    if (data[i + 3] < 20) continue;
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    r += pr;
    g += pg;
    b += pb;
    n += 1;
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const sat = max - min;
    if (sat > best && max > 28) {
      best = sat;
      accent = { r: pr, g: pg, b: pb };
    }
  }
  const tint = n
    ? { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
    : { r: 0, g: 80, b: 90 };
  const warm = accent.r + accent.g * 0.4 > accent.b + 40;
  return { tint, accent: warm ? AMBER : CYAN, warm };
}

function knockOutBackdrop(frame: ImageData, w: number, h: number) {
  const data = frame.data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const take = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  };
  for (let x = 0; x < w; x += 3) {
    take(x, 0);
    take(x, h - 1);
  }
  for (let y = 0; y < h; y += 3) {
    take(0, y);
    take(w - 1, y);
  }
  if (!n) return;
  r /= n;
  g /= n;
  b /= n;
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.hypot(cx, cy) || 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dist = Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - b);
      const center = 1 - Math.hypot(x - cx, y - cy) / maxDist;
      if (dist < 48 && center < 0.78) {
        const fade = Math.min(1, (48 - dist) / 32) * (1 - center * 0.35);
        data[i + 3] = Math.round(data[i + 3] * (1 - fade));
      }
    }
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, tint: Rgb, ink: Rgb = tint) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);

  const driftX = w * (0.35 + Math.sin(t * 0.35) * 0.18);
  const driftY = h * (0.4 + Math.cos(t * 0.28) * 0.12);
  const mist = ctx.createRadialGradient(driftX, driftY, 10, driftX, driftY, w * 0.55);
  mist.addColorStop(0, `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.42)`);
  mist.addColorStop(1, "rgba(5, 5, 7, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, w, h);

  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, "rgba(5, 5, 7, 0.1)");
  wash.addColorStop(1, "rgba(5, 5, 7, 0.72)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  const accentGlow = ctx.createRadialGradient(w * 0.82, h * 0.2, 8, w * 0.82, h * 0.2, w * 0.4);
  accentGlow.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0.28)`);
  accentGlow.addColorStop(1, "rgba(5, 5, 7, 0)");
  ctx.fillStyle = accentGlow;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 16; i++) {
    const x = ((i * 83 + t * (18 + (i % 5) * 6)) % (w + 120)) - 60;
    const y = ((Math.sin(t * 0.4 + i) * 0.5 + 0.5) * h);
    const radius = 16 + (i % 5) * 18;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${0.06 + (i % 4) * 0.03})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 42; i++) {
    const x = (i * 47 + t * (10 + (i % 6) * 4)) % w;
    const y = (i * 31 + Math.sin(t + i) * 12 + h) % h;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + (i % 4) * 0.06})`;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
  }
}

export function drawNiche(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, niche: StudioNiche, ink: Rgb) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.shadowColor = `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0.9)`;
  ctx.shadowBlur = 10;
  if (niche === "plumbing") drawPlumbing(ctx, w, h, t, ink);
  else if (niche === "fishing") drawFishing(ctx, w, h, t, ink);
  else drawContracting(ctx, w, h, t, ink);
  ctx.restore();
}

function drawPlumbing(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ink: Rgb) {
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 18; i++) {
    const x = (i * 79 + 20) % w;
    const speed = 36 + (i % 5) * 14;
    const y = ((t * speed + i * 48) % (h + 30)) - 16;
    ctx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${0.4 + (i % 3) * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.6, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0.45)`;
    ctx.beginPath();
    ctx.arc(x, y + 5, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    const life = (t * 0.85 + i * 0.19) % 1;
    const x = w * (0.18 + (i % 4) * 0.2);
    const y = h * (0.42 + (i % 3) * 0.16);
    ctx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${1 - life})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(i * 1.3) * 18 * life, y - 10 - 16 * life);
    ctx.stroke();
  }
}

function drawFishing(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ink: Rgb) {
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.22 + i / 3) % 1;
    ctx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${0.4 * (1 - p)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.74, Math.max(8, w * 0.38 * p), Math.max(3, 22 * p), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const x = (i * 67 + Math.sin(t + i) * 10) % w;
    const y = h - ((t * (22 + (i % 4) * 10) + i * 36) % (h + 24));
    const radius = 2 + (i % 4);
    ctx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${0.4 + (i % 3) * 0.15})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawContracting(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ink: Rgb) {
  for (let i = 0; i < 14; i++) {
    const life = (t * 1.15 + i * 0.13) % 1;
    const angle = i * 0.85 + t * 0.4;
    const x = w * (0.12 + (i % 5) * 0.18);
    const y = h * (0.28 + (i % 4) * 0.16);
    ctx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${1 - life})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * 26 * life, y + Math.sin(angle) * 18 * life);
    ctx.stroke();
    ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${0.85 * (1 - life)})`;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

export function paintStill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  niche: StudioNiche,
  tint: Rgb,
  subject: CanvasImageSource,
  subjectWidth: number,
  subjectHeight: number,
  name: string,
  accent: string,
) {
  const ink = hexRgb(accent);
  drawBackground(ctx, w, h, t, tint, ink);
  const pad = 0.78;
  const scale = Math.min((w * pad) / subjectWidth, (h * pad) / subjectHeight);
  const dw = subjectWidth * scale;
  const dh = subjectHeight * scale;
  const entry = Math.min(1, t / 0.7);
  const eased = 1 - Math.pow(1 - entry, 3);
  const pop = 0.92 + eased * 0.08;
  ctx.save();
  ctx.globalAlpha = eased;
  ctx.translate(w / 2, h / 2 + 8);
  ctx.scale(pop, pop);
  ctx.drawImage(subject, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  drawNiche(ctx, w, h, t, niche, ink);
  ctx.font = "600 28px 'Space Grotesk', Inter, sans-serif";
  ctx.fillStyle = accent;
  ctx.textBaseline = "top";
  ctx.fillText(name.slice(0, 42), 28, 24);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  const marks: Array<[number, number, number, number]> = [
    [16, 16, 16, 16],
    [w - 16, 16, -16, 16],
    [16, h - 16, 16, -16],
    [w - 16, h - 16, -16, -16],
  ];
  for (const [x, y, dx, dy] of marks) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  }
}

export function hexRgb(accent: string): Rgb {
  const hex = accent.replace("#", "");
  if (hex.length !== 6) return { r: 0, g: 255, b: 204 };
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}
