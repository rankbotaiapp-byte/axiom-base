import { FilmStage } from "@/app/[shopSlug]/page";
import { getNicheActions } from "@/config/niche-actions";
import type { BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { LEOPARD_HERO_ANIMATION, resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
import { NICHES } from "@/lib/axiom/niches";
import type { ShopNiche } from "@/lib/axiom/types";
import type { TenantPreviewSearch } from "@/components/tenant-preview";

export function PreviewFrame({
  niche,
  search,
  loaded = null,
}: {
  niche: ShopNiche;
  search: TenantPreviewSearch;
  loaded?: BusinessBrandRecord | null;
  lead?: string;
}) {
  const template = NICHES[niche];
  const name = (search.business || search.biz || loaded?.businessName || template.defaultName).trim();
  const city = (search.city || loaded?.city || "").trim();
  const film = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: null,
    niche,
    customNiche: `${niche} ${name}`,
    fallbackVideoUrl: LEOPARD_HERO_ANIMATION,
    shopTagline: template.tagline,
  });
  return (
    <FilmStage
      name={name}
      tagline={film.tagline}
      city={city}
      src={film.hero_video_url}
      actions={getNicheActions(niche)}
      niche={niche}
      bookHref={`/onboard?niche=${niche}`}
      book={
        <a href={`/onboard?niche=${niche}`}>
          {getNicheActions(niche)?.primaryCta ?? "Claim"}
        </a>
      }
    />
  );
}
