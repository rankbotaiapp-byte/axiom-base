import { createFileRoute } from "@tanstack/react-router";
import { ApexExperience, apexMedia } from "@/components/apex";

export const Route = createFileRoute("/apex-moto-gt3")({
  head: () => ({
    meta: [
      { title: "APEX MOTO · APEX GT3 Performance Lab" },
      {
        name: "description",
        content: "APEX GT3 launch desk — configure, dyno, and book a performance build.",
      },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: apexMedia.poster },
    ],
    links: [
      { rel: "preload", href: apexMedia.poster, as: "image" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: ApexMotoPage,
});

function ApexMotoPage() {
  return <ApexExperience />;
}
