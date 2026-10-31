import { CATALOG_BY_ID, catalogCardIsVideo, catalogCardSrc, type CatalogNiche } from "@/config/catalog";
import { LoopVideo } from "@/components/cinematic-hero";

/** Public niche tile media from the catalog row for this slug. */
export function CatalogCardMedia({ niche, className }: { niche: CatalogNiche; className?: string }) {
  const row = CATALOG_BY_ID[niche];
  const src = catalogCardSrc(niche);
  const frame = className ?? "absolute inset-0 h-full w-full object-cover";
  if (catalogCardIsVideo(src)) {
    return <LoopVideo key={`${niche}:${src}`} src={src} className={frame} />;
  }
  return <img key={`${niche}:${src}`} src={src} alt={row.label} className={frame} />;
}
