import { createFileRoute } from "@tanstack/react-router";
import { CyberAugmentExperience, cyberAugmentAssets } from "@/components/cyber-augment";

export const Route = createFileRoute("/cyber-augment")({
  head: () => ({
    meta: [
      { title: "Cyber-Augment Labs — Elite Cyberware & Personal Protection" },
      {
        name: "description",
        content:
          "Precision-fitted cyberware, ballistic integration and neural-sync hardware. Book your upgrade consultation.",
      },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: cyberAugmentAssets.heroPoster },
    ],
    links: [
      { rel: "preload", href: cyberAugmentAssets.heroPoster, as: "image" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  component: CyberAugmentPage,
});

function CyberAugmentPage() {
  return <CyberAugmentExperience />;
}
