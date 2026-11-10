import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { FilmStage } from "@/app/[shopSlug]/page";
import { DemoRetentionStack } from "@/components/demo-retention-stack";
import { FounderWelcomeStage } from "@/components/founder-welcome-stage";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { catalogCardStill, defaultNicheFilm, isCatalogNiche } from "@/config/catalog";
import { getNicheActions } from "@/config/niche-actions";
import { parseBusinessId } from "@/lib/axiom/business-brand";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { resolveStorefrontFilm } from "@/lib/axiom/hero-studio-state";
import { NICHES } from "@/lib/axiom/niches";
import { outreachNicheHero } from "@/lib/axiom/outreach-niche-batch";
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
    if (params.niche === "plumbing" || params.niche === "emergency-plumbing") {
      throw redirect({ href: "/demo/plumbing" });
    }
    if (params.niche === "admin") return { niche: "contractor" as const, desk: "admin" as const };
    const niche = resolveDemoNiche(params.niche);
    if (!niche) throw notFound();
    if (niche === "plumbing") {
      throw redirect({ href: "/demo/plumbing" });
    }
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
  const mappedHero =
    search.hero?.startsWith("/media/") ? search.hero : outreachNicheHero(niche, search.trade || name);
  const film = resolveStorefrontFilm({
    draft: null,
    shopVideoUrl: mappedHero,
    niche,
    customNiche: `${niche} ${name}`,
    fallbackVideoUrl: mappedHero || defaultNicheFilm(niche),
    shopTagline: template.tagline,
  });

  return (
    <main className="bg-obsidian text-fg">
      {search.greet ? (
        <FounderWelcomeStage
          owner={name}
          business={name}
          trade={search.trade || template.label}
          place={city}
        />
      ) : null}
      <div id="trade-stage">
        <FilmStage
          name={name}
          tagline={film.tagline}
          city={city}
          src={film.hero_video_url}
          still={isCatalogNiche(niche) ? catalogCardStill(niche) : ""}
          actions={getNicheActions(niche)}
          niche={niche}
          bookHref="#guest-book"
          guestBook
          claimHref={`/onboard?niche=${niche}`}
          book={
            <>
              <button type="button">{getNicheActions(niche)?.primaryCta ?? "Book"}</button>
              <Link to="/onboard" search={claimSearch(niche)}>
                Use this as my shop
              </Link>
            </>
          }
        />
      </div>
      <DemoRetentionStack
        niche={niche}
        bookHref="#guest-book"
        greet={Boolean(search.greet)}
        fields={{
          businessName: name,
          phone: search.phone || undefined,
          email: search.email || undefined,
          city: city || undefined,
          county: search.county || undefined,
          trade: search.trade || template.label,
          nicheLabel: template.label,
        }}
      />
    </main>
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
