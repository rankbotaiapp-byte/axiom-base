import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { HeroScreen, SITE } from "@/components/obsidian-core";

export const Route = createFileRoute("/obsidian-core")({
  head: () => ({
    meta: [
      { title: `${SITE.brand} · Fracture the Void` },
      { name: "theme-color", content: "#030712" },
      {
        name: "description",
        content: "Cinematic OBSIDIAN//CORE landing — crystal orbit field and secure channel.",
      },
    ],
    links: [
      { rel: "preload", as: "image", href: SITE.home.poster },
      { rel: "preload", as: "video", href: SITE.home.video, type: "video/mp4" },
    ],
  }),
  component: ObsidianCoreLayout,
});

function ObsidianCoreLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/obsidian-core" && pathname.startsWith("/obsidian-core/")) {
    return <Outlet />;
  }

  const h = SITE.home;
  return (
    <HeroScreen
      video={h.video}
      poster={h.poster}
      eyebrow={h.eyebrow}
      title={h.title}
      sub={h.sub}
      node="NODE-07"
      depth="SURFACE"
      secondary={{ label: "SYSTEM ACCESS", href: "/obsidian-core/core" }}
    />
  );
}
