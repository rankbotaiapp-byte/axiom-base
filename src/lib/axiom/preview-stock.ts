import { catalogCardStill, resolveCatalogNiche, tradeLoopUrl } from "../../config/catalog";
import { studioMatrixEntry } from "./studio-engine";

export type PreviewStock = {
  still: string;
  loop: string;
};

/**
 * Local outreach media. These paths are files under `public/media`, never a live render.
 * Pest control has no dedicated still, so it uses the contractor plate.
 */
export function previewStockForNiche(niche: string | null | undefined): PreviewStock {
  const entry = studioMatrixEntry(niche);
  const catalog = entry.catalogNiche ?? resolveCatalogNiche("contractor");
  const card = catalogCardStill(catalog);
  const still = card.startsWith("/media/heroes/") ? card : "/media/heroes/contractor.jpg";
  return {
    still,
    loop: tradeLoopUrl(catalog),
  };
}
