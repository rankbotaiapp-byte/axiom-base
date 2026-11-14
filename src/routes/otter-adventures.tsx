import { createFileRoute } from "@tanstack/react-router";
import { OtterExperience } from "@/components/otter";
import { OTTER_CONFIG } from "@/lib/otter/config";

export const Route = createFileRoute("/otter-adventures")({
  head: () => ({
    meta: [
      { title: `${OTTER_CONFIG.brand.name} — River Expeditions` },
      { name: "description", content: OTTER_CONFIG.brand.tagline },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: OTTER_CONFIG.media.poster },
    ],
    links: [
      { rel: "preload", href: OTTER_CONFIG.media.poster, as: "image" },
      { rel: "preload", href: OTTER_CONFIG.media.video, as: "video", type: "video/mp4" },
    ],
  }),
  component: OtterAdventuresPage,
});

function OtterAdventuresPage() {
  return <OtterExperience />;
}
