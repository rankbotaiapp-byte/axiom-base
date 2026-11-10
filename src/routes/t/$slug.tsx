import { createFileRoute, notFound } from "@tanstack/react-router";
import TenantFrame from "@/components/axiom-landing/TenantFrame";
import { FounderIntroHero, PLUMBING_DEMO_ANCHOR } from "@/components/plumbing/founder-intro-hero";
import { PlumberOutreachLive } from "@/components/plumbing/plumber-outreach-landing";
import { getShowcase, showcaseSrc } from "@/lib/axiom-landing/showcase";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import {
  PLUMBER_OUTREACH_GREETING_VIDEO,
  PLUMBER_OUTREACH_HERO_POSTER,
  PLUMBER_OUTREACH_HERO_VIDEO,
  fillTemplate,
  outreachVars,
} from "@/lib/axiom/plumber-outreach";
import { getPlumberOutreachPage } from "@/lib/axiom/plumber-outreach.functions";

type Search = ReturnType<typeof parseFunnelSearch> & {
  /** `?niche=plumbing` is the public plumbing campaign; omitted slugs still use the Claude outreach layout. */
  niche?: "plumbing";
  studio?: "1";
};

export const Route = createFileRoute("/t/$slug")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...parseFunnelSearch(search),
    ...(String(search.niche ?? "").toLowerCase() === "plumbing" ? { niche: "plumbing" as const } : {}),
    ...(search.studio === "1" || search.studio === 1 ? { studio: "1" as const } : {}),
  }),
  loaderDeps: ({ search }) => ({ niche: search.niche }),
  loader: async ({ params, deps }) => {
    if (deps.niche === "plumbing") {
      const page = await getPlumberOutreachPage({ data: params.slug });
      return { kind: "plumber-outreach" as const, page };
    }
    const { getTenantBySlug } = await import("@/lib/axiom-landing/tenants/store");
    const tenant = await getTenantBySlug(params.slug);
    const build = tenant ? getShowcase(tenant.build_id) : null;
    if (tenant && build && tenant.status !== "suspended") {
      return { kind: "cinematic" as const, tenant, build };
    }
    if (tenant && !build && tenant.status === "suspended") {
      throw notFound();
    }
    const page = await getPlumberOutreachPage({ data: params.slug });
    return { kind: "plumber-outreach" as const, page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }] };
    if (loaderData.kind === "plumber-outreach") {
      const { config, tenant } = loaderData.page;
      const vars = outreachVars(tenant);
      const title = `${vars.business} · ${fillTemplate(config.hero.headline, vars)}`;
      const description = fillTemplate(config.hero.subhead, vars) || "24/7 emergency lead capture for local plumbers.";
      return {
        meta: [
          { title },
          { name: "description", content: description },
          { name: "robots", content: "noindex" },
          { name: "theme-color", content: "#07080C" },
          { property: "og:title", content: title },
          { property: "og:description", content: description },
          { property: "og:image", content: config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER },
        ],
        links: [
          { rel: "preload", as: "image", href: config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER, fetchPriority: "high" },
          { rel: "prefetch", as: "video", href: PLUMBER_OUTREACH_HERO_VIDEO },
          { rel: "prefetch", as: "video", href: PLUMBER_OUTREACH_GREETING_VIDEO },
        ],
      };
    }
    return {
      meta: [
        { title: loaderData.tenant.business_name },
        ...(loaderData.tenant.status === "active" ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: TenantSite,
});

function TenantSite() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();

  if (loaded.kind === "plumber-outreach") {
    return (
      <>
        <FounderIntroHero />
        <PlumberOutreachLive
          initial={loaded.page.config}
          tenant={loaded.page.tenant}
          studio={search.studio === "1"}
          greet={false}
          sectionId={PLUMBING_DEMO_ANCHOR}
          tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
        />
      </>
    );
  }

  const { tenant, build } = loaded;
  if (tenant.status !== "active") {
    return (
      <main className="axiom-master grid min-h-svh place-items-center bg-ink px-6 text-center">
        <div>
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="mx-auto mb-6 h-16 w-auto object-contain" />
          ) : null}
          <h1 className="font-display text-3xl font-bold text-white">{tenant.business_name}</h1>
          <p className="mt-3 text-mist">
            {tenant.status === "pending_payment"
              ? "Finishing checkout — this page goes live as soon as payment clears."
              : "This site is being set up and will be live shortly."}
          </p>
        </div>
      </main>
    );
  }
  return (
    <TenantFrame
      src={showcaseSrc(build, build.entry)}
      spec={build.brand}
      tenant={{ business_name: tenant.business_name, phone: tenant.phone, logo_url: tenant.logo_url }}
    />
  );
}
