import { createFileRoute } from "@tanstack/react-router";
import { PlumberOutreachStudio } from "@/components/plumbing/plumber-outreach-studio";
import { getPlumberOutreach } from "@/lib/axiom/plumber-outreach.functions";

/** Master admin: industrial plumbing outreach is the only campaign template. */
export const Route = createFileRoute("/axiom-auto/admin")({
  loader: () => getPlumberOutreach(),
  head: () => ({
    meta: [
      { title: "Master Admin Desk · Plumbing trickle" },
      { name: "robots", content: "noindex" },
      { name: "theme-color", content: "#08080A" },
    ],
  }),
  component: function AxiomAutoAdmin() {
    const outreach = Route.useLoaderData();
    return <PlumberOutreachStudio initial={outreach} />;
  },
});
