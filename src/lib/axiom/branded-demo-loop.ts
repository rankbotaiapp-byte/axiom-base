import { resolveCatalogNiche, tradeLoopUrl, type CatalogNiche } from "../../config/catalog.ts";
import { verifiedPrimaryLoop } from "./niche-dataset-pairing.ts";

const WILDLIFE_NICHES = new Set<CatalogNiche>(["taxidermy", "water-systems", "fabrication", "canine"]);
const ANIMAL_FILE = /leopard|leapord|otter|shark|polar-bear|raptor|grizzly|bear-charge|charging-bear|wildlife|tiger|owl|snowleapard/i;
const CLEAN_LOOP = tradeLoopUrl("contractor");

export function allowsAnimalMedia(niche: CatalogNiche): boolean {
  return WILDLIFE_NICHES.has(niche);
}

export function isAnimalMediaUrl(url: string): boolean {
  return ANIMAL_FILE.test(url);
}

function usable(url: string, niche: CatalogNiche): boolean {
  if (!url || url.includes("..")) return false;
  if (allowsAnimalMedia(niche)) return true;
  return !isAnimalMediaUrl(url);
}

/** Niche-matched `.mp4`, with a clean trade loop when the only hit is wildlife. */
export function resolveDemoLoop(niche: string): string {
  const id = resolveCatalogNiche(niche);
  const primary = verifiedPrimaryLoop(id);
  if (usable(primary, id)) return primary;
  const trade = tradeLoopUrl(id);
  if (usable(trade, id)) return trade;
  return CLEAN_LOOP;
}
