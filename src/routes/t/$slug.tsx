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
import { PlumberOutreachLanding } from "@/components/plumbing/plumber-outreach-landing";
import {
  PLUMBER_OUTREACH_DRAFT_CHANNEL,
  PLUMBER_OUTREACH_DRAFT_MESSAGE,
  fillTemplate,
  outreachVars,
  parsePlumberOutreach,
  type OutreachTenant,
  type PlumberOutreachConfig,
} from "@/lib/axiom/plumber-outreach";
import { getPlumberOutreachPage } from "@/lib/axiom/plumber-outreach.functions";

type Search = ReturnType<typeof parseFunnelSearch> & {
  /** `?niche=plumbing` opens the B2B plumber outreach landing for this slug. */
  niche?: "plumbing";
  /** `?studio=1` is the admin's live-preview frame: it accepts unsaved drafts from the studio. */
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
    const storefront = await getPlumbingStorefront();
    return { kind: "plumbing" as const, slug: params.slug, storefront };
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
          // Personalised outreach links are for the prospect, not for search results.
          { name: "robots", content: "noindex" },
          { name: "theme-color", content: "#07080C" },
          { property: "og:title", content: title },
          { property: "og:description", content: description },
          { property: "og:image", content: config.hero.posterUrl },
        ],
        links: [
          // The poster is the first paint of the hero; the film streams in over it.
          { rel: "preload", as: "image", href: config.hero.posterUrl, fetchPriority: "high" },
        ],
      };
    }
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

  if (loaded.kind === "plumber-outreach") {
    return (
      <PlumberOutreachLive
        initial={loaded.page.config}
        tenant={loaded.page.tenant}
        studio={search.studio === "1"}
        tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
      />
    );
  }

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

function PlumberOutreachLive({
  initial,
  tenant,
  studio,
  tracking,
}: {
  initial: PlumberOutreachConfig;
  tenant: OutreachTenant;
  studio: boolean;
  tracking: { utmSource?: string; county?: string; stopToken?: string };
}) {
  const [config, setConfig] = useState<PlumberOutreachConfig>(initial);
  useEffect(() => setConfig(initial), [initial]);

  // Studio frame only: take unsaved drafts from the admin editor.
  useEffect(() => {
    if (!studio) return;
    const accept = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const msg = data as { type?: string; config?: unknown };
      if (msg.type === PLUMBER_OUTREACH_DRAFT_MESSAGE) setConfig(parsePlumberOutreach(msg.config));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      accept(event.data);
    };
    window.addEventListener("message", onMessage);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(PLUMBER_OUTREACH_DRAFT_CHANNEL);
      channel.onmessage = (event) => accept(event.data);
    } catch {
      channel = null;
    }
    window.parent?.postMessage({ type: `${PLUMBER_OUTREACH_DRAFT_MESSAGE}:ready` }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      channel?.close();
    };
  }, [studio]);

  return <PlumberOutreachLanding config={config} tenant={tenant} studio={studio} tracking={tracking} />;
}
