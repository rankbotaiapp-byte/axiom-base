import { createFileRoute } from "@tanstack/react-router";
import { ShopFilmPage } from "@/app/[shopSlug]/page";
import { LoopOverlay, TourOverlay } from "@/components/tour-overlay";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/")({
  validateSearch: (s: Record<string, unknown>): { tour?: boolean; loop?: boolean; requested?: boolean } => {
    const out: { tour?: boolean; loop?: boolean; requested?: boolean } = {};
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

  return (
    <>
      <ShopFilmPage />
      {search.tour ? <TourOverlay slug={data.shop.slug} /> : null}
      {search.loop ? <LoopOverlay slug={data.shop.slug} employeeId={invited?.id} /> : null}
    </>
  );
}
