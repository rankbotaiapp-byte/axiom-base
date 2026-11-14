// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { LandClearingExperience } from "@/components/land-clearing";
import { site } from "@/components/land-clearing/config/site";

export const Route = createFileRoute("/land-clearing")({
  component: LandClearingPage,
  head: () => ({
    meta: [
      { title: `${site.legalName} | Forestry Mulching & Land Clearing` },
      { name: "description", content: site.description },
      { name: "theme-color", content: "#030712" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Big+Shoulders+Stencil+Display:wght@700;800;900&family=Share+Tech+Mono&display=swap",
      },
    ],
  }),
});

function LandClearingPage() {
  return <LandClearingExperience />;
}
