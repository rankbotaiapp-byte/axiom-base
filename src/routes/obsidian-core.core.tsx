import { createFileRoute } from "@tanstack/react-router";
import { HeroScreen, SITE } from "@/components/obsidian-core";

export const Route = createFileRoute("/obsidian-core/core")({
  head: () => ({
    meta: [
      { title: `Zero-Point Core — ${SITE.brand}` },
      { name: "theme-color", content: "#030712" },
      {
        name: "description",
        content: "OBSIDIAN//CORE chamber — zero-point energy field telemetry.",
      },
    ],
    links: [
      { rel: "preload", as: "image", href: SITE.core.poster },
      { rel: "preload", as: "video", href: SITE.core.video, type: "video/mp4" },
    ],
  }),
  component: ObsidianCoreChamber,
});

function ObsidianCoreChamber() {
  const c = SITE.core;
  return (
    <HeroScreen
      video={c.video}
      poster={c.poster}
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      node="CORE-00"
      depth="−2 // CHAMBER"
      secondary={{ label: "RETURN TO SURFACE", href: "/obsidian-core" }}
      readouts={c.readouts}
    />
  );
}
