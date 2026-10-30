import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FilmStage } from "@/app/[shopSlug]/page";
import { getNicheActions } from "@/config/niche-actions";
import { parseBusinessId, type BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { getBusinessBrand } from "@/lib/axiom/business-lookup";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { leadGlassCopy } from "@/lib/axiom/funnel-glass";
import { LEOPARD_HERO_ANIMATION, resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
import { recordFunnelHit } from "@/lib/axiom/master";
import { NICHES } from "@/lib/axiom/niches";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import ShopAdminPage from "@/app/[shop-slug]/admin/page";
import type { ShopNiche } from "@/lib/axiom/types";

type DemoSearch = ReturnType<typeof parseFunnelSearch> & { id?: string };

export const Route = createFileRoute("/demo/$niche")({
  validateSearch: (search: Record<string, unknown>): DemoSearch => {
    const parsed = parseFunnelSearch(search);
    const id = parseBusinessId(search.id);
    return id ? { ...parsed, id } : parsed;
  },
  loader: ({ params }) => {
    if (params.niche === "admin") return { niche: "contractor" as const, desk: "admin" as const };
    const niche = resolveDemoNiche(params.niche);
    if (!niche) throw notFound();
    return { niche, desk: null };
  },
  component: NicheDemo,
  notFoundComponent: DemoMissing,
});

function claimSearch(niche: ShopNiche) {
  return { niche } as const;
}

function NicheDemo() {
  const loaded = Route.useLoaderData();
  if (loaded.desk === "admin") {
    return <ShopAdminPage params={Promise.resolve({ "shop-slug": "demo" })} />;
  }
  return <NichePreview />;
}

function NichePreview() {
  const { niche } = Route.useLoaderData();
  const search = Route.useSearch();
  const lookupId = search.lead || search.id || "";
  const lookupSlug = search.b || search.lead_slug || "";
  const [loaded, setLoaded] = useState<BusinessBrandRecord | null>(null);

  useEffect(() => {
    if (!lookupId && !lookupSlug) {
      setLoaded(null);
      return;
    }
    setLoaded(null);
    let cancelled = false;
    const request = lookupId
      ? getBusinessBrand({ data: { id: lookupId } })
      : getBusinessBrand({ data: { slug: lookupSlug } });
    void request
      .then((row) => {
        if (!cancelled) setLoaded(row);
      })
      .catch(() => {
        if (!cancelled) setLoaded(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupId, lookupSlug]);

  const glass = leadGlassCopy(loaded);
  const template = NICHES[niche];
  const name = (glass.armed ? glass.businessName : search.business || template.defaultName).trim();
  const city = (glass.city || search.city || "").trim();
  const film = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: null,
    niche,
    customNiche: `${niche} ${name}`,
    fallbackVideoUrl: LEOPARD_HERO_ANIMATION,
    shopTagline: template.tagline,
  });

  useEffect(() => {
    const leadSlug = glass.armed ? loaded?.slug || "" : "";
    if (!leadSlug) return;
    const seen = `axiom.demo:${leadSlug}`;
    if (sessionStorage.getItem(seen) === "1") return;
    sessionStorage.setItem(seen, "1");
    void recordFunnelHit({
      data: {
        leadSlug,
        utmSource: search.utm_source || "regional",
        county: search.county || glass.county || "",
        stopToken: search.t || "",
        path: `/demo/${niche}`,
      },
    }).catch(() => undefined);
  }, [glass.armed, glass.county, loaded, niche, search.county, search.t, search.utm_source]);

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
        <Link to="/onboard" search={claimSearch(niche)}>
          {getNicheActions(niche)?.primaryCta ?? "Claim"}
        </Link>
      }
    />
  );
}

function DemoMissing() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="font-display text-3xl">That industry is not on the book.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Back to Axiom
        </Link>
      </div>
    </main>
  );
}
