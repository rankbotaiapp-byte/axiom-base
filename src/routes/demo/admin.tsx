import { createFileRoute } from "@tanstack/react-router";
import ShopAdminPage from "@/app/[shopSlug]/admin/page";

/** Static path so `/demo/admin` is the studio desk, not `/demo/$niche`. */
export const Route = createFileRoute("/demo/admin")({
  component: function DemoAdminRoute() {
    return <ShopAdminPage params={Promise.resolve({ shopSlug: "demo" })} />;
  },
});
