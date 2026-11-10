import { createFileRoute } from "@tanstack/react-router";
import { HyperMotoLanding, shopConfig } from "@/components/hyper-moto";

export const Route = createFileRoute("/hyper-moto")({
  head: () => ({
    meta: [
      { title: `${shopConfig.brand} — Custom Turbo Builds` },
      { name: "description", content: shopConfig.subhead },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: shopConfig.heroVideo.poster },
    ],
    links: [
      { rel: "preload", as: "image", href: shopConfig.heroVideo.poster },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Saira:opsz,wdth,wght@8..60,75..125,400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: HyperMotoPage,
});

function HyperMotoPage() {
  return <HyperMotoLanding config={shopConfig} />;
}
