import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlumberOutreachLive } from "@/components/plumbing/plumber-outreach-landing";
import { LEAD_STORAGE_KEY, parseFunnelSearch } from "@/lib/axiom/funnel";
import { ensureFunnelSession, recordFunnelHit } from "@/lib/axiom/master";
import {
  PLUMBER_OUTREACH_HERO_POSTER,
  PLUMBER_OUTREACH_HERO_VIDEO,
  fillTemplate,
  outreachVars,
} from "@/lib/axiom/plumber-outreach";
import { getPlumberOutreachPage } from "@/lib/axiom/plumber-outreach.functions";
import { DEFAULT_TENANT_SLUG } from "@/lib/axiom/tenant-overlay";

/**
 * Corporate root (`/`) is the industrial plumbing outreach storefront —
 * axio-plumber-hero loop + axiom-greeting pre-roll. Personalized `?b=` slugs
 * still inlay that contractor from Supabase.
 */
function rootSlug(search: { b?: string; lead_slug?: string }): string {
  const raw = (search.b || search.lead_slug || "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) ? raw : DEFAULT_TENANT_SLUG;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => parseFunnelSearch(search),
  loaderDeps: ({ search }) => ({ slug: rootSlug(search) }),
  loader: async ({ deps }) => {
    const page = await getPlumberOutreachPage({ data: deps.slug });
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Emergency Plumbing · Axiom" }] };
    }
    const { config, tenant } = loaderData.page;
    const vars = outreachVars(tenant);
    const title = `${vars.business} · ${fillTemplate(config.hero.headline, vars)}`;
    const description = fillTemplate(config.hero.subhead, vars) || "24/7 emergency lead capture for local plumbers.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#07080C" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER },
      ],
      links: [
        { rel: "preload", as: "image", href: config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER, fetchPriority: "high" },
        { rel: "prefetch", as: "video", href: PLUMBER_OUTREACH_HERO_VIDEO },
        { rel: "prefetch", as: "video", href: "/media/axiom-greeting.mp4" },
      ],
    };
  },
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const { page } = Route.useLoaderData();
  const slug = rootSlug(search);

  useEffect(() => {
    const leadSlug = search.b || search.lead_slug || "";
    const utmSource = search.utm_source || "";
    const county = search.county || "";
    const stopToken = search.t || "";
    if (!leadSlug && !utmSource && !county) return;
    const seen = `axiom.hit:${leadSlug}|${utmSource}|${county}|${stopToken}`;
    if (sessionStorage.getItem(seen) === "1") return;
    sessionStorage.setItem(seen, "1");
    if (leadSlug) {
      sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify({ leadSlug, utmSource, county, tradeType: "plumbing" }));
    }
    void ensureFunnelSession()
      .then(() => recordFunnelHit({ data: { leadSlug, utmSource, county, stopToken } }))
      .catch(() => undefined);
  }, [search.b, search.county, search.lead_slug, search.t, search.utm_source]);

  return (
    <PlumberOutreachLive
      key={slug}
      initial={page.config}
      tenant={page.tenant}
      studio={false}
      greet={true}
      tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
    />
  );
}
