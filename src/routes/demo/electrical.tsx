import { createFileRoute } from "@tanstack/react-router";
import { ElectricianOutreachLive } from "@/components/electrician/electrician-outreach-landing";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { DEFAULT_ELECTRICIAN_OUTREACH, ELECTRICIAN_HERO_POSTER } from "@/lib/axiom/electrician-outreach";
import { emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";

type Search = ReturnType<typeof parseFunnelSearch> & { studio?: "1" };

function demoSlug(search: Search): string {
  return search.b || search.lead_slug || "cascade-electric";
}

export const Route = createFileRoute("/demo/electrical")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = parseFunnelSearch(search);
    return search.studio === "1" || search.studio === 1 ? { ...parsed, studio: "1" } : parsed;
  },
  head: () => ({
    meta: [
      { title: "YOUR ELECTRIC CO. · Electrical" },
      { name: "theme-color", content: "#050507" },
      { property: "og:image", content: ELECTRICIAN_HERO_POSTER },
    ],
  }),
  component: ElectricalDemo,
});

function ElectricalDemo() {
  const search = Route.useSearch();
  const tenant = {
    ...emptyOutreachTenant(demoSlug(search)),
    business: search.biz || "",
    city: search.city || "",
    county: search.county || "",
  };
  return (
    <ElectricianOutreachLive
      tenant={tenant}
      config={DEFAULT_ELECTRICIAN_OUTREACH}
      studio={search.studio === "1"}
      tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
    />
  );
}
