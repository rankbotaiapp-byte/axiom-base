import { createFileRoute } from "@tanstack/react-router";
import { ShopFilmPage } from "@/app/[shopSlug]/page";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { LoopOverlay, TourOverlay } from "@/components/tour-overlay";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { isOutreachVisit, isProspectShopId } from "@/lib/axiom/outreach-visit";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/")({
  validateSearch: (s: Record<string, unknown>): ReturnType<typeof parseFunnelSearch> & {
    tour?: boolean;
    loop?: boolean;
    requested?: boolean;
  } => {
    const out: ReturnType<typeof parseFunnelSearch> & {
      tour?: boolean;
      loop?: boolean;
      requested?: boolean;
    } = parseFunnelSearch(s);
    if (s.tour === true || s.tour === "1" || s.tour === "true") out.tour = true;
    if (s.loop === true || s.loop === "1" || s.loop === "true") out.loop = true;
    if (s.requested === true || s.requested === "1" || s.requested === "true") out.requested = true;
    return out;
  },
  component: CustomerHome,
});

function CustomerHome() {
  const data = useShopPageData();
  const search = Route.useSearch();
  const people = data.employees ?? [];
  const invited = people[people.length - 1];

  if (isOutreachVisit(search) || isProspectShopId(data.shop.id)) {
    return (
      <OutreachStorefront
        search={{
          ...search,
          preview: true,
          greet: search.greet ?? true,
          b: search.b || data.shop.slug,
          biz: search.biz || data.shop.name,
          trade: search.trade || data.shop.customNiche || data.shop.niche,
          city: search.city || data.shop.address,
        }}
        shop={data}
      />
    );
  }

  return (
    <>
      <ShopFilmPage />
      {search.tour ? <TourOverlay slug={data.shop.slug} /> : null}
      {search.loop ? <LoopOverlay slug={data.shop.slug} employeeId={invited?.id} /> : null}
    </>
  );
}
