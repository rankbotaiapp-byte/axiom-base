/**
 * Builds and caches self-contained branded demo plates.
 * The SVG inlines the source photo so a prospect page is a finished image,
 * not a raw file with a label on top.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { CATALOG_BY_ID, resolveCatalogNiche } from "../../config/catalog.ts";
import { demoStillCandidates, renderBrandedPlateSvg, type DemoStillSource } from "./branded-demo.ts";
import type { DemoPlateSlot } from "./branded-demo-url.ts";

const MAX_BYTES = 1_500_000;
const CACHE_LIMIT = 48;

export type MaterializedDemoPlate = {
  svg: string;
  source: DemoStillSource;
  query: string;
  sourceUrl: string;
};

type PlateInput = {
  businessName: string;
  niche: string;
  slot?: DemoPlateSlot;
  accent?: string;
  city?: string;
  overrideUrl?: string | null;
};

const cache = new Map<string, MaterializedDemoPlate>();

function cacheKey(input: PlateInput): string {
  return [
    input.businessName.trim().toLowerCase(),
    resolveCatalogNiche(input.niche),
    input.slot ?? "hero",
    (input.accent ?? "").toLowerCase(),
    (input.city ?? "").trim().toLowerCase(),
    (input.overrideUrl ?? "").trim(),
  ].join("|");
}

function mimeFor(file: string, header?: string | null): string | null {
  const fromHeader = (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (/^image\/(jpeg|jpg|png|webp|svg\+xml|gif)$/.test(fromHeader)) {
    return fromHeader === "image/jpg" ? "image/jpeg" : fromHeader;
  }
  const ext = path.extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return null;
}

async function readPublicImage(url: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!url.startsWith("/media/") && !url.startsWith("/axiom/")) return null;
  if (url.includes("..")) return null;
  const rel = url.split("?")[0]!.replace(/^\//, "");
  const root = path.join(process.cwd(), "public");
  const full = path.join(root, rel);
  const fromRoot = path.relative(root, full);
  if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) return null;
  try {
    const bytes = new Uint8Array(await readFile(full));
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) return null;
    const mime = mimeFor(full);
    if (!mime) return null;
    return { bytes, mime };
  } catch {
    return null;
  }
}

async function fetchRemoteImage(url: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!/^https:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const mime = mimeFor(url, res.headers.get("content-type"));
    if (!mime || mime === "image/svg+xml") return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) return null;
    return { bytes, mime };
  } catch {
    return null;
  }
}

async function inlineImage(url: string): Promise<string | null> {
  const file = url.startsWith("/") ? await readPublicImage(url) : await fetchRemoteImage(url);
  if (!file) return null;
  const b64 = Buffer.from(file.bytes).toString("base64");
  return `data:${file.mime};base64,${b64}`;
}

export async function materializeDemoPlate(input: PlateInput): Promise<MaterializedDemoPlate> {
  const key = cacheKey(input);
  const hit = cache.get(key);
  if (hit) return hit;

  const niche = resolveCatalogNiche(input.niche);
  const businessName = input.businessName.replace(/\s+/g, " ").trim().slice(0, 80) || CATALOG_BY_ID[niche].defaultName;
  const slot = input.slot ?? "hero";
  const candidates = demoStillCandidates({ niche, slot, overrideUrl: input.overrideUrl });

  let chosen = candidates[candidates.length - 1]!;
  let href = "";
  for (const candidate of candidates) {
    const inlined = await inlineImage(candidate.url);
    if (!inlined) continue;
    chosen = candidate;
    href = inlined;
    break;
  }

  const svg = renderBrandedPlateSvg({
    businessName,
    niche,
    accent: input.accent,
    city: input.city,
    imageHref: href,
  });
  const plate: MaterializedDemoPlate = { svg, source: chosen.source, query: chosen.query, sourceUrl: chosen.url };
  cache.set(key, plate);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return plate;
}

export function demoPlateCacheSize(): number {
  return cache.size;
}
