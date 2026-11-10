import { CATALOG_BY_ID, catalogCardIsVideo, catalogCardSrc, catalogCardStill, type CatalogNiche } from "@/config/catalog";
import { CatalogCardVisual } from "@/components/catalog-card-visual";

/** Public niche tile media from the catalog row for this slug. */
export function CatalogCardMedia({
  niche,
  className,
  mode = "video",
}: {
  niche: CatalogNiche;
  className?: string;
  mode?: "video" | "canvas";
}) {
  const row = CATALOG_BY_ID[niche];
  const src = catalogCardSrc(niche);
  const still = catalogCardStill(niche);
  const loop = catalogCardIsVideo(src) ? src : "";
  return (
    <CatalogCardVisual
      mode={mode}
      videoSrc={loop || (row ? src : "")}
      poster={still || undefined}
      className={className}
    />
  );
}
