import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FilmStage } from "@/app/[shopSlug]/page";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { catalogCardStill, isCatalogNiche } from "@/config/catalog";
import { getNicheActions } from "@/config/niche-actions";
import { parseBusinessId } from "@/lib/axiom/business-brand";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { LEOPARD_HERO_ANIMATION, resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
import { NICHES } from "@/lib/axiom/niches";
import { isOutreachVisit } from "@/lib/axiom/outreach-visit";
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
  if (isOutreachVisit(search)) {
    return <OutreachStorefront search={{ ...search, trade: search.trade || niche }} />;
  }
  const template = NICHES[niche];
  const name = (search.business || template.defaultName).trim();
  const city = (search.city || "").trim();
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
      still={isCatalogNiche(niche) ? catalogCardStill(niche) : ""}
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
