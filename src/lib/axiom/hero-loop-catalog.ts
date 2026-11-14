/** @deprecated Import from `../../config/catalog.ts` — kept so older imports keep resolving. */
export {
  CATALOG as HERO_LOOP_CATALOG_SOURCE,
  CATALOG_FILINGS as HERO_LOOP_FILINGS,
  CATALOG_NICHES,
  CORE_PUBLIC_NICHES,
  catalogByFilm as heroLoopByUrl,
  catalogEntry as heroLoopById,
  catalogFilmUrl,
  isCatalogNiche as isPublicNiche,
  resolveCatalogNiche,
  type CatalogEntry as HeroLoopEntry,
  type CatalogNiche as PublicNiche,
} from "../../config/catalog.ts";

import { CATALOG, CORE_PUBLIC_NICHES, catalogFilmUrl, type CatalogNiche } from "../../config/catalog.ts";

export const HERO_LOOP_CATALOG = CATALOG.map((row) => ({
  id: row.id,
  file: row.file,
  url: catalogFilmUrl(row.id),
  niche: row.id as CatalogNiche,
  label: row.label,
  blurb: row.blurb,
}));

export const PUBLIC_NICHE_ORDER = [...CORE_PUBLIC_NICHES];

export function heroLoopForNiche(niche: CatalogNiche) {
  return HERO_LOOP_CATALOG.find((row) => row.niche === niche);
}
