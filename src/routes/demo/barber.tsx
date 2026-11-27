import { createFileRoute } from "@tanstack/react-router";
import { BarberOutreachLive } from "@/components/barber/barber-outreach-landing";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { BARBER_HERO, DEFAULT_BARBER_OUTREACH } from "@/lib/axiom/barber-outreach";
import { emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";

type Search = ReturnType<typeof parseFunnelSearch> & { studio?: "1" };

function demoSlug(search: Search): string {
  return search.b || search.lead_slug || "ashland-barber";
}

export const Route = createFileRoute("/demo/barber")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = parseFunnelSearch(search);
    return search.studio === "1" || search.studio === 1 ? { ...parsed, studio: "1" } : parsed;
  },
  head: () => ({
    meta: [
      { title: "Barber · Walk-ins welcome" },
      { name: "theme-color", content: "#0a0806" },
      { property: "og:image", content: BARBER_HERO },
    ],
  }),
  component: BarberDemo,
});

function BarberDemo() {
  const search = Route.useSearch();
  const tenant = {
    ...emptyOutreachTenant(demoSlug(search)),
    business: search.biz || search.business || "",
    city: search.city || "",
    county: search.county || "",
  };
  return (
    <BarberOutreachLive
      tenant={tenant}
      config={DEFAULT_BARBER_OUTREACH}
      studio={search.studio === "1"}
      tracking={{ utmSource: search.utm_source, county: search.county, stopToken: search.t }}
    />
  );
}
