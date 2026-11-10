import { createFileRoute } from "@tanstack/react-router";
import { PlumberOutreachStudio } from "@/components/plumbing/plumber-outreach-studio";
import { getPlumberOutreach } from "@/lib/axiom/plumber-outreach.functions";

/** Axiom Master Admin Studio — edit the plumber outreach landing (`/t/{slug}?niche=plumbing`) without touching code. */
export const Route = createFileRoute("/axiom-auto/outreach")({
  loader: () => getPlumberOutreach(),
  head: () => ({
    meta: [
      { title: "Axiom Studio · Plumber outreach landing" },
      { name: "robots", content: "noindex" },
      { name: "theme-color", content: "#08080A" },
    ],
  }),
  component: function AxiomOutreachAdmin() {
    const loaded = Route.useLoaderData();
    return <PlumberOutreachStudio initial={loaded} />;
  },
});
