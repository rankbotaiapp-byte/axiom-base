export type Rgb = [number, number, number];

/**
 * Lit average becomes the ripple hue. Saturated pixels become the second
 * gradient stop, so a sunset and a head-unit glow do not collapse into one gray.
 */
export function paletteFromFrame(data: Uint8ClampedArray): { accent: Rgb; copper: Rgb } | null {
  let litR = 0;
  let litG = 0;
  let litB = 0;
  let litN = 0;
  let satR = 0;
  let satG = 0;
  let satB = 0;
  let satN = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < 0.14) continue;
    litR += r;
    litG += g;
    litB += b;
    litN += 1;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat > 0.22 && luma > 0.18) {
      satR += r;
      satG += g;
      satB += b;
      satN += 1;
    }
  }

  if (litN < 6) return null;
  const accent: Rgb = [litR / litN, litG / litN, litB / litN];
  const copper: Rgb = satN >= 4 ? [satR / satN, satG / satN, satB / satN] : accent;
  return { accent, copper };
}

export function mixRgb(from: Rgb, to: Rgb, t: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}
