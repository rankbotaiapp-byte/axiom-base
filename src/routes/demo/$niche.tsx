import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { GlassShardMatrix } from "@/components/GlassShardMatrix";
import { parseBusinessId, type BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { getBusinessBrand } from "@/lib/axiom/business-lookup";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { leadGlassCopy } from "@/lib/axiom/funnel-glass";
import { recordFunnelHit } from "@/lib/axiom/master";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { storefrontRevealHero } from "@/components/storefront-reveal";
import { TenantPreview } from "@/components/tenant-preview";
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
  const navigate = useNavigate();
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
  const triedLead = Boolean(lookupId || lookupSlug);

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
    <GlassShardMatrix
      armed={glass.armed}
      businessName={glass.businessName}
      city={glass.city}
      county={glass.county}
      niche={glass.armed ? loaded?.nicheSlug || niche : niche}
      hint={glass.hint}
    >
      <TenantPreview
        niche={niche}
        search={
          glass.armed
            ? { ...search, business: glass.businessName, city: glass.city || search.city }
            : triedLead
              ? { ...search, business: undefined, biz: undefined }
              : search
        }
        loaded={glass.armed ? loaded : null}
        onNiche={(next) => {
          void navigate({ to: "/demo/$niche", params: { niche: next }, search });
        }}
        revealHero={storefrontRevealHero(niche)}
        claim={
          <Link
            to="/onboard"
            search={claimSearch(niche)}
            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg sm:w-auto"
          >
            Claim This Storefront for Your Business
          </Link>
        }
      />
    </GlassShardMatrix>
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
