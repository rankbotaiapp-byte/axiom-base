import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paint(width, height, draw) {
  const rgba = Buffer.alloc(width * height * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    const alpha = a / 255;
    rgba[i] = Math.round(rgba[i] * (1 - alpha) + r * alpha);
    rgba[i + 1] = Math.round(rgba[i + 1] * (1 - alpha) + g * alpha);
    rgba[i + 2] = Math.round(rgba[i + 2] * (1 - alpha) + b * alpha);
    rgba[i + 3] = 255;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const shade = 8 + Math.round((y / height) * 10);
      set(x, y, shade, shade, shade + 2);
    }
  }
  draw(set, width, height);
  return encodePng(width, height, rgba);
}

function disc(set, cx, cy, radius, color, softness = 1.4) {
  const [r, g, b] = color;
  const reach = radius + softness * 3;
  for (let y = Math.floor(cy - reach); y <= cy + reach; y += 1) {
    for (let x = Math.floor(cx - reach); x <= cx + reach; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      const edge = Math.max(0, Math.min(1, (radius + softness - d) / softness));
      if (edge > 0) set(x, y, r, g, b, Math.round(255 * edge));
    }
  }
}

function roundBox(set, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      const dx = px < x + radius ? x + radius - px : px > x + w - radius ? px - (x + w - radius) : 0;
      const dy = py < y + radius ? y + radius - py : py > y + h - radius ? py - (y + h - radius) : 0;
      if (dx * dx + dy * dy <= radius * radius) set(px, py, color[0], color[1], color[2]);
    }
  }
}

const width = 960;
const height = 540;
const metal = [214, 218, 224];
const frost = [232, 236, 234];
const amber = [176, 112, 48];
const carbon = [28, 30, 34];

const watches = paint(width, height, (set) => {
  disc(set, 480, 270, 210, [18, 22, 26], 8);
  roundBox(set, 430, 70, 100, 400, 48, [36, 40, 46]);
  disc(set, 480, 270, 128, metal, 2);
  disc(set, 480, 270, 108, [12, 14, 16], 1.5);
  disc(set, 456, 246, 28, [255, 252, 244], 6);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    disc(set, 480 + Math.cos(angle) * 88, 270 + Math.sin(angle) * 88, i % 3 === 0 ? 4 : 2, metal, 1);
  }
  roundBox(set, 474, 176, 8, 96, 3, frost);
  roundBox(set, 478, 266, 72, 6, 3, [46, 230, 214]);
});

const skincare = paint(width, height, (set) => {
  disc(set, 480, 300, 220, [22, 28, 26], 10);
  roundBox(set, 392, 150, 176, 250, 64, frost);
  roundBox(set, 408, 118, 144, 54, 16, [196, 204, 200]);
  disc(set, 430, 230, 36, [255, 255, 250], 8);
  roundBox(set, 430, 280, 100, 8, 4, [46, 230, 214]);
});

const bourbon = paint(width, height, (set) => {
  disc(set, 480, 280, 200, [16, 14, 12], 8);
  roundBox(set, 430, 150, 100, 280, 18, carbon);
  roundBox(set, 448, 78, 64, 84, 12, [48, 46, 44]);
  roundBox(set, 444, 250, 72, 140, 10, amber);
  disc(set, 456, 200, 16, [255, 220, 170], 5);
});

mkdirSync("public/media/demo-niches", { recursive: true });
writeFileSync("public/media/demo-niches/luxury-watches.png", watches);
writeFileSync("public/media/demo-niches/organic-skincare.png", skincare);
writeFileSync("public/media/demo-niches/craft-bourbon.png", bourbon);
