import { FilmStage } from "@/app/[shopSlug]/page";
import { DemoRetentionStack } from "@/components/demo-retention-stack";
import { catalogCardStill, defaultNicheFilm, isCatalogNiche } from "@/config/catalog";
import { getNicheActions } from "@/config/niche-actions";
import type { BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
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
    fallbackVideoUrl: defaultNicheFilm(niche),
    shopTagline: template.tagline,
  });
  const plate = isCatalogNiche(niche) ? catalogCardStill(niche) : "";
  return (
    <main className="bg-obsidian text-fg">
      <FilmStage
        name={name}
        tagline={film.tagline}
        city={city}
        src={film.hero_video_url}
        still={plate}
        actions={getNicheActions(niche)}
        niche={niche}
        bookHref="#guest-book"
        guestBook
        claimHref={`/onboard?niche=${niche}`}
        book={
          <>
            <button type="button">{getNicheActions(niche)?.primaryCta ?? "Book"}</button>
            <a href={`/onboard?niche=${niche}`}>Use this as my shop</a>
          </>
        }
      />
      <DemoRetentionStack
        niche={niche}
        bookHref="#guest-book"
        greet={Boolean(search.greet)}
        fields={{
          businessName: name,
          phone: loaded?.phone || search.phone || undefined,
          email: loaded?.email || search.email || undefined,
          city: city || loaded?.city || undefined,
          county: loaded?.county || search.county || undefined,
          trade: loaded?.categoryLabel || search.trade || template.label,
          nicheLabel: template.label,
        }}
      />
    </main>
  );
}
