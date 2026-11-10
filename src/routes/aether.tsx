// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AetherPropulsion } from "@/components/aether";

export const Route = createFileRoute("/aether")({
  component: AetherPage,
  head: () => ({
    meta: [
      { title: "Aether Dynamics — Precision Propulsion" },
      {
        name: "description",
        content: "Aether Dynamics — precision ion propulsion for deep space systems.",
      },
      { name: "theme-color", content: "#04060a" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
});

function AetherPage() {
  return <AetherPropulsion />;
}
