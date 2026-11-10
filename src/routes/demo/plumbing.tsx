import { createFileRoute } from "@tanstack/react-router";
import { PlumberOutreachLive } from "@/components/plumbing/plumber-outreach-landing";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import {
  PLUMBER_OUTREACH_HERO_POSTER,
  PLUMBER_OUTREACH_HERO_VIDEO,
  fillTemplate,
  outreachVars,
} from "@/lib/axiom/plumber-outreach";
import { getPlumberOutreachPage } from "@/lib/axiom/plumber-outreach.functions";

type Search = ReturnType<typeof parseFunnelSearch> & { studio?: "1" };

function demoSlug(search: Search): string {
  return search.b || search.lead_slug || "accurate-plumbing";
}

/**
 * Static route: wins over `/demo/$niche` for plumbing.
 * Renders the Claude plumber outreach landing (hero + optional `?greet=1` pre-roll).
 */
export const Route = createFileRoute("/demo/plumbing")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = parseFunnelSearch(search);
    return search.studio === "1" || search.studio === 1 ? { ...parsed, studio: "1" } : parsed;
  },
  loaderDeps: ({ search }) => ({ slug: demoSlug(search) }),
  loader: ({ deps }) => getPlumberOutreachPage({ data: deps.slug }),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Emergency Plumbing" }] };
    const vars = outreachVars(loaderData.tenant);
    const title = `${vars.business} · ${fillTemplate(loaderData.config.hero.headline, vars)}`;
    const description = fillTemplate(loaderData.config.hero.subhead, vars);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#07080C" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: loaderData.config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER },
      ],
      links: [
        { rel: "preload", as: "image", href: loaderData.config.hero.posterUrl || PLUMBER_OUTREACH_HERO_POSTER },
        { rel: "prefetch", as: "video", href: PLUMBER_OUTREACH_HERO_VIDEO },
      ],
    };
  },
  component: PlumbingDemo,
});

function PlumbingDemo() {
  const page = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <PlumberOutreachLive
      initial={page.config}
      tenant={page.tenant}
      studio={search.studio === "1"}
      greet={Boolean(search.greet)}
      tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
    />
  );
}
