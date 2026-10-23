import { UNIVERSAL_FALLBACK } from "./hero-films.ts";

const SKIP = new Set(["the", "a", "an", "and", "of", "for", "at", "to"]);

export type TwoWordBrand = {
  first: string;
  second: string;
  line: string;
};

export type ParticleStudioModel = TwoWordBrand & {
  heroUrl: string;
  heroKind: "video" | "image";
  staffFront: string;
  staffBack: string;
  filmLabel: string;
};

function meaningful(value: string): string[] {
  return value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !SKIP.has(word.toLowerCase()));
}

function titleWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** The mark is always two words: the shop's first pair, then the niche default. */
export function twoWordBrand(source: string, fallback: string): TwoWordBrand {
  const words = meaningful(source);
  const spare = meaningful(fallback);
  const first = titleWord(words[0] || spare[0] || "Axiom");
  let second = titleWord(words[1] || spare[1] || spare[0] || "Studio");
  if (second.toLowerCase() === first.toLowerCase()) {
    second = titleWord(spare.find((word) => word.toLowerCase() !== first.toLowerCase()) || "Studio");
  }
  return { first, second, line: `${first} ${second}` };
}

function heroesUrl(url: string): string {
  return url.startsWith("/media/heroes/") ? url : "";
}

export type ParticleStudioInput = {
  business?: string;
  defaultName: string;
  heroVideoUrl: string;
  heroImageUrl: string;
  staffFront: string;
  staffBack: string;
  filmLabel: string;
};

/** Niche film, staff portraits, and the two-word mark for the particle studio. */
export function particleStudioModel(input: ParticleStudioInput): ParticleStudioModel {
  const brand = twoWordBrand(input.business?.trim() || input.defaultName, input.defaultName);
  const video = heroesUrl(input.heroVideoUrl);
  const image = heroesUrl(input.heroImageUrl);
  return {
    ...brand,
    heroUrl: video || image || UNIVERSAL_FALLBACK,
    heroKind: video ? "video" : "image",
    staffFront: input.staffFront,
    staffBack: input.staffBack,
    filmLabel: input.filmLabel,
  };
}

export function createCover(cols: number, rows: number): Float32Array {
  return new Float32Array(cols * rows).fill(1);
}

/** A swipe clears a round patch. A wider radius is a broader reveal. */
export function revealStroke(cover: Float32Array, cols: number, rows: number, x: number, y: number, radius: number): void {
  const reach = Math.max(0.6, radius);
  const reachSq = reach * reach;
  const x0 = Math.max(0, Math.floor(x - reach));
  const x1 = Math.min(cols - 1, Math.ceil(x + reach));
  const y0 = Math.max(0, Math.floor(y - reach));
  const y1 = Math.min(rows - 1, Math.ceil(y + reach));
  for (let yy = y0; yy <= y1; yy += 1) {
    for (let xx = x0; xx <= x1; xx += 1) {
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy > reachSq) continue;
      cover[yy * cols + xx] = 0;
    }
  }
}

export function coveredShare(cover: Float32Array): number {
  if (cover.length === 0) return 1;
  let hidden = 0;
  for (let i = 0; i < cover.length; i += 1) {
    if ((cover[i] ?? 0) > 0.5) hidden += 1;
  }
  return hidden / cover.length;
}
