import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_DRONE_HUB_CONFIG, DroneHub } from "@/components/drone-hub";

export const Route = createFileRoute("/drone-hub")({
  head: () => ({
    meta: [
      { title: `${DEFAULT_DRONE_HUB_CONFIG.headline} | ${DEFAULT_DRONE_HUB_CONFIG.brand}` },
      { name: "description", content: DEFAULT_DRONE_HUB_CONFIG.subhead },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: DEFAULT_DRONE_HUB_CONFIG.posterSrc },
    ],
    links: [
      { rel: "preload", href: DEFAULT_DRONE_HUB_CONFIG.posterSrc, as: "image" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: DroneHubRoute,
});

function DroneHubRoute() {
  return <DroneHub config={DEFAULT_DRONE_HUB_CONFIG} />;
}
