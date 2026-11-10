import { createFileRoute } from "@tanstack/react-router";
import { PlumbingStudio } from "@/components/plumbing/plumbing-studio";
import { getPlumbingStorefront } from "@/lib/axiom/plumbing-storefront.functions";

/** Axiom Master Admin Studio — edit the Emergency Plumbing storefront without touching code. */
export const Route = createFileRoute("/axiom-auto/admin")({
  loader: () => getPlumbingStorefront(),
  head: () => ({
    meta: [
      { title: "Axiom Studio · Emergency Plumbing" },
      { name: "robots", content: "noindex" },
      { name: "theme-color", content: "#08080A" },
    ],
  }),
  component: function AxiomAutoAdmin() {
    const loaded = Route.useLoaderData();
    return <PlumbingStudio initial={loaded} />;
  },
});
