import { CATALOG_BY_ID, resolveCatalogNiche, tradeLoopUrl } from "../../config/catalog";
import { demoPlatePath } from "./branded-demo-url";
import { resolveDemoLoop } from "./branded-demo-loop";

export type PreviewStock = {
  still: string;
  proof: string;
  services: string;
  loop: string;
};

/**
 * Branded plates for a named prospect. The plate route recreates the still
 * from the niche registry, a niche stock query, or a clean trade fallback.
 */
export function previewStockForBusiness(input: {
  niche: string | null | undefined;
  businessName?: string | null;
  city?: string | null;
  accent?: string | null;
  heroImageUrl?: string | null;
}): PreviewStock {
  const niche = resolveCatalogNiche(input.niche);
  const businessName = (input.businessName ?? "").trim() || CATALOG_BY_ID[niche].defaultName;
  const city = (input.city ?? "").trim();
  const accent = input.accent ?? undefined;
  const src = (input.heroImageUrl ?? "").trim();
  const shared = { businessName, niche, city, accent, src };
  return {
    still: demoPlatePath({ ...shared, slot: "hero" }),
    proof: demoPlatePath({ ...shared, slot: "proof", src: undefined }),
    services: demoPlatePath({ ...shared, slot: "services", src: undefined }),
    loop: resolveDemoLoop(niche),
  };
}

/** Niche-only plate. Shop and demo pages with a business name should use `previewStockForBusiness`. */
export function previewStockForNiche(niche: string | null | undefined): PreviewStock {
  return previewStockForBusiness({ niche });
}

export function previewLoopForNiche(niche: string | null | undefined): string {
  const id = niche?.trim() || "contractor";
  return resolveDemoLoop(id) || tradeLoopUrl(resolveCatalogNiche(id));
}
