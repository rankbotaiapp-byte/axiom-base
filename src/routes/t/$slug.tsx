import { useEffect, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import TenantFrame from "@/components/axiom-landing/TenantFrame";
import { FounderWelcomeStage } from "@/components/founder-welcome-stage";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { EmergencyPlumbingStorefront } from "@/components/plumbing/emergency-storefront";
import { getShowcase, showcaseSrc } from "@/lib/axiom-landing/showcase";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { isOutreachVisit } from "@/lib/axiom/outreach-visit";
import {
  PLUMBING_HERO_POSTER,
  PLUMBING_HERO_VIDEO,
  parsePlumbingStorefront,
  type PlumbingStorefront,
} from "@/lib/axiom/plumbing-storefront";
import { getPlumbingStorefront } from "@/lib/axiom/plumbing-storefront.functions";

type Search = ReturnType<typeof parseFunnelSearch>;

export const Route = createFileRoute("/t/$slug")({
  validateSearch: (search: Record<string, unknown>): Search => parseFunnelSearch(search),
  loader: async ({ params }) => {
    const { getTenantBySlug } = await import("@/lib/axiom-landing/tenants/store");
    const tenant = await getTenantBySlug(params.slug);
    const build = tenant ? getShowcase(tenant.build_id) : null;
    if (tenant && build && tenant.status !== "suspended") {
      return { kind: "cinematic" as const, tenant, build };
    }
    if (tenant && !build && tenant.status === "suspended") {
      throw notFound();
    }
    const storefront = await getPlumbingStorefront();
    return { kind: "plumbing" as const, slug: params.slug, storefront };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }] };
    if (loaderData.kind === "cinematic") {
      return {
        meta: [
          { title: loaderData.tenant.business_name },
          ...(loaderData.tenant.status === "active" ? [] : [{ name: "robots", content: "noindex" }]),
        ],
      };
    }
    const cfg = loaderData.storefront.config;
    const title = cfg
      ? `${cfg.company} · 24/7 Emergency Plumbing${cfg.city ? ` in ${cfg.city}` : ""}`
      : "Emergency Plumbing";
    return {
      meta: [
        { title },
        { name: "description", content: cfg?.hero.subhead || "24/7 emergency plumbing with instant missed-call text-back." },
        { name: "theme-color", content: "#04070b" },
        { property: "og:image", content: cfg?.hero.posterUrl || PLUMBING_HERO_POSTER },
      ],
      links: [
        { rel: "prefetch", as: "video", href: cfg?.hero.videoUrl || PLUMBING_HERO_VIDEO },
      ],
    };
  },
  component: TenantSite,
});

function TenantSite() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const params = Route.useParams();

  if (loaded.kind === "cinematic") {
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

  const outreachSearch = {
    ...search,
    b: search.b || params.slug,
    preview: search.preview ?? true,
    greet: search.greet ?? true,
    trade: search.trade || "plumbing",
  };
  if (isOutreachVisit(outreachSearch)) {
    return <OutreachStorefront search={outreachSearch} />;
  }
  return <PlumbingLive config={loaded.storefront.config} />;
}

function PlumbingLive({ config: initial }: { config: PlumbingStorefront }) {
  const [config, setConfig] = useState<PlumbingStorefront>(parsePlumbingStorefront(initial));
  useEffect(() => setConfig(parsePlumbingStorefront(initial)), [initial]);
  return (
    <main className="bg-obsidian text-fg">
      <FounderWelcomeStage
        owner={config.company}
        business={config.company}
        trade="Emergency Plumbing"
        place={config.city}
      />
      <div id="trade-stage">
        <EmergencyPlumbingStorefront config={config} studio={false} />
      </div>
    </main>
  );
}
