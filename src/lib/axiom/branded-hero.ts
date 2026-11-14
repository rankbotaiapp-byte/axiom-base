/** Branded stills and the 6 second hero loop. No network, no canvas. */

export const BRAND_STAGES = ["Reading the surface", "Mapping the mark", "Etching the name"] as const;

export const HERO_LOOP_SECONDS = 6;
export const HERO_LOOP_FPS = 30;
export const HERO_LOOP_FRAMES = HERO_LOOP_SECONDS * HERO_LOOP_FPS;
export const HERO_LOOP_WIDTH = 640;
export const HERO_LOOP_HEIGHT = 360;
/** The still sits inside the obsidian field so the name is not cropped off. */
export const HERO_FIT = 0.9;
export const PROOF_EDGE = 960;
export const PROOF_DATA_LIMIT = 1_100_000;
export const PROOF_BATCH_LIMIT = 12;
export const PROOF_FILE_MAX_BYTES = 15 * 1024 * 1024;

const postedProof = new Set<string>();

export function brandStageLabel(index: number): string {
  const i = Math.max(0, Math.min(BRAND_STAGES.length - 1, Math.floor(index)));
  return BRAND_STAGES[i] ?? BRAND_STAGES[0];
}

export function brandPlate(name: string): { line: string; mark: string } {
  const line = name.replace(/\s+/g, " ").trim().slice(0, 42) || "Axiom";
  const mark = line
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => [...word][0]?.toUpperCase() ?? "")
    .join("");
  return { line, mark: mark || "A" };
}

/** Zoom and pan that meet again at the end of the 6 second loop. */
export function heroDrift(second: number): { scale: number; x: number; y: number } {
  const turns = (second % HERO_LOOP_SECONDS) / HERO_LOOP_SECONDS;
  const angle = turns * Math.PI * 2;
  return {
    scale: 1.04 + Math.sin(angle) * 0.035,
    x: Math.cos(angle) * 0.012,
    y: Math.sin(angle * 2) * 0.008,
  };
}

export function framePlacement(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  drift: { scale: number; x: number; y: number },
): { dx: number; dy: number; dw: number; dh: number } {
  const fit = Math.min(dstW / Math.max(srcW, 1), dstH / Math.max(srcH, 1));
  const scale = fit * HERO_FIT * drift.scale;
  const dw = srcW * scale;
  const dh = srcH * scale;
  return {
    dw,
    dh,
    dx: (dstW - dw) / 2 + drift.x * dstW,
    dy: (dstH - dh) / 2 + drift.y * dstH,
  };
}

export function fittedSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const edge = Math.max(width, height, 1);
  const scale = Math.min(1, maxEdge / edge);
  return {
    width: Math.max(2, Math.round(width * scale)),
    height: Math.max(2, Math.round(height * scale)),
  };
}

export function frameTiming(frame: number): { timestamp: number; duration: number } {
  const timestamp = Math.round((frame * 1_000_000) / HERO_LOOP_FPS);
  const next = Math.round(((frame + 1) * 1_000_000) / HERO_LOOP_FPS);
  return { timestamp, duration: next - timestamp };
}

export function heroEncoderConfig(hardwareAcceleration: "prefer-hardware" | "prefer-software" = "prefer-hardware") {
  return {
    codec: "avc1.42001f",
    width: HERO_LOOP_WIDTH,
    height: HERO_LOOP_HEIGHT,
    bitrate: 1_200_000,
    framerate: HERO_LOOP_FPS,
    hardwareAcceleration,
    latencyMode: "quality" as const,
    avc: { format: "avc" as const },
  };
}

export function proofCaption(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (base || "Proof of work").slice(0, 80);
}

export function isImageFile(file: { type: string; name: string }): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
}

export function takeBatch<T>(items: readonly T[], limit = PROOF_BATCH_LIMIT): { kept: T[]; overflow: number } {
  return {
    kept: items.slice(0, limit),
    overflow: Math.max(0, items.length - limit),
  };
}

export function proofDeployKey(slug: string, jpeg: string): string {
  const sample = jpeg.slice(Math.max(0, jpeg.length - 48));
  return `${slug}:${jpeg.length}:${sample}`;
}

export function hasProofDeploy(key: string): boolean {
  return postedProof.has(key);
}

export function markProofDeploy(key: string): void {
  postedProof.add(key);
}
