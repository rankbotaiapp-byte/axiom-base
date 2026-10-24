import { mkdirSync, writeFileSync } from "node:fs";

const width = 512;
const height = 256;

function rgbe(r, g, b) {
  const max = Math.max(r, g, b);
  if (max < 1e-32) return [0, 0, 0, 0];
  const exp = Math.floor(Math.log2(max)) + 1;
  const scale = Math.pow(2, exp - 8);
  return [
    Math.min(255, Math.max(0, Math.round(r / scale))),
    Math.min(255, Math.max(0, Math.round(g / scale))),
    Math.min(255, Math.max(0, Math.round(b / scale))),
    Math.min(255, Math.max(0, exp + 128)),
  ];
}

function gauss(x, y, cx, cy, radius) {
  const dx = x - cx;
  const dy = y - cy;
  return Math.exp(-(dx * dx + dy * dy) / (radius * radius));
}

const pixels = Buffer.alloc(width * height * 4);
let peak = 0;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const u = x / (width - 1);
    const v = y / (height - 1);
    let r = 0.012;
    let g = 0.016;
    let b = 0.032;
    const key = gauss(u, v, 0.22, 0.18, 0.11);
    r += key * 18;
    g += key * 16.5;
    b += key * 14;
    const blue = gauss(u, v, 0.5, 0.3, 0.16);
    r += blue * 1.4;
    g += blue * 4.8;
    b += blue * 16;
    const rim = gauss(u, v, 0.8, 0.46, 0.09);
    r += rim * 3.2;
    g += rim * 7.4;
    b += rim * 14;
    const floor = gauss(u, v, 0.5, 0.86, 0.2);
    r += floor * 0.35;
    g += floor * 0.28;
    b += floor * 0.22;
    const n = (x * 73 + y * 131) % 997;
    if (n < 18) {
      const spike = 6 + (n % 9) * 3.5;
      r += spike;
      g += spike * 0.95;
      b += spike * 1.15;
    }
    peak = Math.max(peak, r, g, b);
    const encoded = rgbe(r, g, b);
    const i = (y * width + x) * 4;
    pixels[i] = encoded[0];
    pixels[i + 1] = encoded[1];
    pixels[i + 2] = encoded[2];
    pixels[i + 3] = encoded[3];
  }
}

const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`, "ascii");
mkdirSync("public/textures", { recursive: true });
writeFileSync("public/textures/space_hdr.hdr", Buffer.concat([header, pixels]));
if (!(peak > 8)) throw new Error("Studio HDR has no bright lights");
console.log(`wrote public/textures/space_hdr.hdr peak ${peak.toFixed(1)}`);
