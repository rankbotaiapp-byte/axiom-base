/** GIF89a encoder for short studio loops. 16-color global palette, Netscape loop. */

const MIN_CODE_SIZE = 4;
const CLEAR = 1 << MIN_CODE_SIZE;
const EOI = CLEAR + 1;

export function encodeGif(width: number, height: number, frames: Uint8ClampedArray[], delayCs = 8): Uint8Array {
  const palette = buildPalette(frames[0] ?? new Uint8ClampedArray(width * height * 4));
  const indexed = frames.map((frame) => indexFrame(frame, palette));
  const parts: Uint8Array[] = [];
  parts.push(header(width, height, palette));
  parts.push(netscapeLoop());
  for (const frame of indexed) {
    parts.push(graphicControl(delayCs));
    parts.push(imageBlock(width, height, lzw(frame)));
  }
  parts.push(Uint8Array.of(0x3b));
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function buildPalette(frame: Uint8ClampedArray): Uint8Array {
  const palette = new Uint8Array(16 * 3);
  const seeds = [
    [5, 5, 7],
    [0, 242, 254],
    [255, 176, 32],
    [255, 255, 255],
  ];
  seeds.forEach((rgb, index) => {
    palette.set(rgb, index * 3);
  });
  const step = Math.max(4, Math.floor(frame.length / 4 / 12));
  let slot = seeds.length;
  for (let i = 0; i < frame.length && slot < 16; i += step * 4) {
    if (frame[i + 3] < 24) continue;
    palette[slot * 3] = frame[i];
    palette[slot * 3 + 1] = frame[i + 1];
    palette[slot * 3 + 2] = frame[i + 2];
    slot += 1;
  }
  return palette;
}

function indexFrame(frame: Uint8ClampedArray, palette: Uint8Array): Uint8Array {
  const count = frame.length / 4;
  const out = new Uint8Array(count);
  for (let p = 0; p < count; p++) {
    const i = p * 4;
    if (frame[i + 3] < 24) {
      out[p] = 0;
      continue;
    }
    let best = 0;
    let score = Infinity;
    for (let c = 0; c < 16; c++) {
      const dr = frame[i] - palette[c * 3];
      const dg = frame[i + 1] - palette[c * 3 + 1];
      const db = frame[i + 2] - palette[c * 3 + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < score) {
        score = dist;
        best = c;
      }
    }
    out[p] = best;
  }
  return out;
}

function header(width: number, height: number, palette: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(13 + palette.length);
  bytes.set(ascii("GIF89a"), 0);
  writeShort(bytes, 6, width);
  writeShort(bytes, 8, height);
  bytes[10] = 0xf3;
  bytes[11] = 0;
  bytes[12] = 0;
  bytes.set(palette, 13);
  return bytes;
}

function netscapeLoop(): Uint8Array {
  return Uint8Array.of(0x21, 0xff, 0x0b, ...ascii("NETSCAPE2.0"), 0x03, 0x01, 0x00, 0x00, 0x00);
}

function graphicControl(delayCs: number): Uint8Array {
  const bytes = Uint8Array.of(0x21, 0xf9, 0x04, 0x08, 0, 0, 0, 0);
  writeShort(bytes, 4, delayCs);
  return bytes;
}

function imageBlock(width: number, height: number, compressed: Uint8Array): Uint8Array {
  const chunks: number[] = [0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0, MIN_CODE_SIZE];
  writeShortInto(chunks, 1, 0);
  writeShortInto(chunks, 3, 0);
  writeShortInto(chunks, 5, width);
  writeShortInto(chunks, 7, height);
  for (let i = 0; i < compressed.length; i += 255) {
    const slice = compressed.subarray(i, i + 255);
    chunks.push(slice.length, ...slice);
  }
  chunks.push(0);
  return Uint8Array.from(chunks);
}

function lzw(indices: Uint8Array): Uint8Array {
  const dict = new Map<string, number>();
  let codeSize = MIN_CODE_SIZE + 1;
  let nextCode = EOI + 1;
  const reset = () => {
    dict.clear();
    codeSize = MIN_CODE_SIZE + 1;
    nextCode = EOI + 1;
  };
  reset();
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  const write = (code: number) => {
    buffer |= code << bits;
    bits += codeSize;
    while (bits >= 8) {
      out.push(buffer & 255);
      buffer >>= 8;
      bits -= 8;
    }
  };
  write(CLEAR);
  if (!indices.length) {
    write(EOI);
    if (bits) out.push(buffer & 255);
    return Uint8Array.from(out);
  }
  let prefix = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const key = `${prefix},${indices[i]}`;
    if (dict.has(key)) {
      prefix = key;
      continue;
    }
    write(codeFor(dict, prefix));
    if (nextCode < 4096) {
      dict.set(key, nextCode);
      nextCode += 1;
      if (nextCode === 1 << codeSize && codeSize < 12) codeSize += 1;
    } else {
      write(CLEAR);
      reset();
    }
    prefix = String(indices[i]);
  }
  write(codeFor(dict, prefix));
  write(EOI);
  if (bits) out.push(buffer & 255);
  return Uint8Array.from(out);
}

function codeFor(dict: Map<string, number>, key: string): number {
  if (!key.includes(",")) return Number(key);
  return dict.get(key) ?? 0;
}

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}

function writeShort(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >> 8) & 255;
}

function writeShortInto(chunks: number[], offset: number, value: number) {
  chunks[offset] = value & 255;
  chunks[offset + 1] = (value >> 8) & 255;
}
