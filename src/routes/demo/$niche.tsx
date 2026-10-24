import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { parseBusinessId, type BusinessBrandRecord } from "@/lib/axiom/business-brand";
import { getBusinessBrand } from "@/lib/axiom/business-lookup";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { storefrontRevealHero } from "@/components/storefront-reveal";
import { TenantPreview } from "@/components/tenant-preview";
import type { ShopNiche } from "@/lib/axiom/types";

type DemoSearch = ReturnType<typeof parseFunnelSearch> & { id?: string };

export const Route = createFileRoute("/demo/$niche")({
  validateSearch: (search: Record<string, unknown>): DemoSearch => {
    const parsed = parseFunnelSearch(search);
    const id = parseBusinessId(search.id);
    return id ? { ...parsed, id } : parsed;
  },
  loader: ({ params }) => {
    const niche = resolveDemoNiche(params.niche);
    if (!niche) throw notFound();
    return { niche };
  },
  component: NicheDemo,
  notFoundComponent: DemoMissing,
});

function claimSearch(niche: ShopNiche) {
  return { niche } as const;
}

function NicheDemo() {
  const { niche } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const lookupId = search.id ?? "";
  const lookupSlug = search.b || search.lead_slug || "";
  const [loaded, setLoaded] = useState<BusinessBrandRecord | null>(null);

  useEffect(() => {
    if (!lookupId && !lookupSlug) {
      setLoaded(null);
      return;
    }
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

  return (
    <TenantPreview
      niche={niche}
      search={search}
      loaded={loaded}
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
