import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { OutreachTenantPage } from "@/components/shop-film-stage";
import { DemoRetentionStack } from "@/components/demo-retention-stack";
import { catalogCardStill, defaultNicheFilm, isCatalogNiche } from "@/config/catalog";
import { getNicheActions } from "@/config/niche-actions";
import { nicheHeroButtons } from "@/config/niche-button-presets";
import { getBusinessBrand } from "@/lib/axiom/business-lookup";
import type { BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { LEAD_STORAGE_KEY, type FunnelSearch } from "@/lib/axiom/funnel";
import { seedFilmPlates } from "@/lib/axiom/hero-hud";
import { resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
import { ensureFunnelSession, recordFunnelHit } from "@/lib/axiom/master";
import { NICHES } from "@/lib/axiom/niches";
import { outreachNicheHero } from "@/lib/axiom/outreach-niche-batch";
import { isOutreachVisit, resolveOutreachProspect } from "@/lib/axiom/outreach-visit";
import type { ShopPublic } from "@/lib/axiom/types";

export function OutreachStorefront({
  search,
  shop = null,
}: {
  search: FunnelSearch;
  shop?: ShopPublic | null;
}) {
  const lookupId = search.lead || "";
  const lookupSlug = search.b || search.lead_slug || "";
  const [row, setRow] = useState<BusinessBrandRecord | null>(null);

  useEffect(() => {
    if (!lookupId && !lookupSlug) {
      setRow(null);
      return;
    }
    let cancelled = false;
    const request = lookupId
      ? getBusinessBrand({ data: { id: lookupId } })
      : getBusinessBrand({ data: { slug: lookupSlug } });
    void request
      .then((next) => {
        if (!cancelled) setRow(next);
      })
      .catch(() => {
        if (!cancelled) setRow(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupId, lookupSlug]);

  const prospect = resolveOutreachProspect(search, row);
  const niche = shop?.shop.niche && isCatalogNiche(shop.shop.niche) ? shop.shop.niche : prospect.niche;
  const template = NICHES[niche];
  const actions = getNicheActions(niche);
  const bookHref = shop ? `/${shop.shop.slug}/book` : "#guest-book";
  const mappedHero = search.hero?.startsWith("/media/")
    ? search.hero
    : outreachNicheHero(niche, prospect.trade || prospect.name);
  const film = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: shop?.shop.heroVideoUrl ?? mappedHero,
    niche,
    customNiche: `${niche} ${prospect.name} ${prospect.trade}`,
    fallbackVideoUrl: mappedHero || defaultNicheFilm(niche),
    shopTagline: shop?.shop.tagline || template.tagline,
  });
  const city = prospect.place || shop?.shop.address || "";
  const hud = seedFilmPlates(
    { title: "", buttons: nicheHeroButtons(niche, { phone: prospect.phone, bookHref }), plates: [] },
    {
      name: prospect.name,
      tagline: film.tagline,
      city,
      badge: actions?.badge ?? prospect.trade,
      bookHref,
      services: actions?.services ?? [],
    },
  );

  useEffect(() => {
    if (!isOutreachVisit(search)) return;
    const leadSlug = prospect.leadSlug;
    const utmSource = search.utm_source || "regional";
    const county = prospect.county || search.county || "";
    const stopToken = search.t || "";
    if (!leadSlug && !utmSource && !county) return;
    const seen = `axiom.outreach:${leadSlug}|${utmSource}|${county}|${stopToken}`;
    if (sessionStorage.getItem(seen) === "1") return;
    sessionStorage.setItem(seen, "1");
    if (leadSlug) {
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug, tradeType: niche, county, utmSource }),
      );
    }
    void ensureFunnelSession()
      .then(() =>
        recordFunnelHit({
          data: {
            leadSlug,
            utmSource,
            county,
            stopToken,
            path: shop ? `/${shop.shop.slug}` : `/demo/${niche}`,
          },
        }),
      )
      .catch(() => undefined);
  }, [niche, prospect.county, prospect.leadSlug, search, shop]);

  return (
    <main className="outreach-reel bg-obsidian text-fg">
      <OutreachTenantPage
        owner={prospect.owner}
        business={prospect.name}
        trade={prospect.trade}
        place={prospect.place}
        name={prospect.name}
        tagline={film.tagline}
        city={city}
        src={film.hero_video_url || defaultNicheFilm(niche)}
        still={isCatalogNiche(niche) ? catalogCardStill(niche) : ""}
        hud={hud}
        actions={actions}
        niche={niche}
        serviceThumbs={shop?.shop.tradeProfile.serviceThumbs}
        proofSlug={shop?.shop.slug || prospect.leadSlug}
        proofNiche={niche}
        bookHref={bookHref}
        guestBook={!shop}
        claimHref={`/onboard?niche=${niche}`}
        book={
          shop ? (
            <a href={bookHref}>{actions?.primaryCta ?? "Book"}</a>
          ) : (
            <>
              <button type="button">{actions?.primaryCta ?? "Book"}</button>
              <Link to="/onboard" search={{ niche }}>
                Use this as my shop
              </Link>
            </>
          )
        }
      />
      <DemoRetentionStack
        niche={niche}
        bookHref={bookHref}
        greet={Boolean(search.greet)}
        fields={{
          businessName: prospect.name,
          phone: prospect.phone || undefined,
          email: prospect.email || undefined,
          city: prospect.city || undefined,
          county: prospect.county || undefined,
          trade: prospect.trade,
          nicheLabel: template.label,
        }}
      />
    </main>
  );
}
