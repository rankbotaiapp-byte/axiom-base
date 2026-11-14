// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AbyssalSanctuary } from "@/components/abyssal";

export const Route = createFileRoute("/abyssal-sanctuary")({
  component: AbyssalSanctuaryPage,
  head: () => ({
    meta: [
      { title: "Abyssal Sanctuary — Guided Reef Dives" },
      {
        name: "description",
        content:
          "Guided reef dives. A live, touchable reef feed: ripple the water, lock on to the shark, make the octopus ink.",
      },
      { name: "theme-color", content: "#030712" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
});

function AbyssalSanctuaryPage() {
  return <AbyssalSanctuary />;
}
