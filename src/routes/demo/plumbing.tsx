import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FounderWelcomeStage } from "@/components/founder-welcome-stage";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { EmergencyPlumbingStorefront } from "@/components/plumbing/emergency-storefront";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { isOutreachVisit } from "@/lib/axiom/outreach-visit";
import {
  PLUMBING_DRAFT_CHANNEL,
  PLUMBING_DRAFT_MESSAGE,
  PLUMBING_HERO_POSTER,
  PLUMBING_HERO_VIDEO,
  parsePlumbingStorefront,
  type PlumbingStorefront,
} from "@/lib/axiom/plumbing-storefront";
import { getPlumbingStorefront } from "@/lib/axiom/plumbing-storefront.functions";

type Search = ReturnType<typeof parseFunnelSearch> & { studio?: "1" };

/**
 * Static route: wins over `/demo/$niche` for plumbing.
 * - Outreach links (`?preview=true&business=…`) still open the outreach storefront, unchanged.
 * - `?studio=1` is the admin's live-preview frame: it accepts unsaved drafts from the studio.
 */
export const Route = createFileRoute("/demo/plumbing")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = parseFunnelSearch(search);
    return search.studio === "1" || search.studio === 1 ? { ...parsed, studio: "1" } : parsed;
  },
  loader: () => getPlumbingStorefront(),
  head: ({ loaderData }) => {
    const cfg = loaderData?.config;
    const title = cfg ? `${cfg.company} · 24/7 Emergency Plumbing${cfg.city ? ` in ${cfg.city}` : ""}` : "Emergency Plumbing";
    const description = cfg?.hero.subhead || "24/7 emergency plumbing with instant missed-call text-back.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#04070b" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: cfg?.hero.posterUrl || PLUMBING_HERO_POSTER },
      ],
      links: [
        { rel: "preload", as: "image", href: cfg?.hero.posterUrl || PLUMBING_HERO_POSTER },
        { rel: "prefetch", as: "video", href: cfg?.hero.videoUrl || PLUMBING_HERO_VIDEO },
      ],
    };
  },
  component: PlumbingDemo,
});

function PlumbingDemo() {
  const search = Route.useSearch();
  if (isOutreachVisit(search)) {
    return <OutreachStorefront search={{ ...search, trade: search.trade || "plumbing" }} />;
  }
  return <PlumbingLive studio={search.studio === "1"} />;
}

function PlumbingLive({ studio }: { studio: boolean }) {
  const loaded = Route.useLoaderData();
  const [config, setConfig] = useState<PlumbingStorefront>(loaded.config);

  useEffect(() => setConfig(loaded.config), [loaded.config]);

  useEffect(() => {
    if (!studio) return;
    const accept = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const msg = data as { type?: string; config?: unknown };
      if (msg.type === PLUMBING_DRAFT_MESSAGE) setConfig(parsePlumbingStorefront(msg.config));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      accept(event.data);
    };
    window.addEventListener("message", onMessage);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(PLUMBING_DRAFT_CHANNEL);
      channel.onmessage = (event) => accept(event.data);
    } catch {
      channel = null;
    }
    // Tell the studio this frame is ready for the current draft.
    window.parent?.postMessage({ type: `${PLUMBING_DRAFT_MESSAGE}:ready` }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      channel?.close();
    };
  }, [studio]);

  // Studio iframe stays on the storefront alone; live/demo leads get Eric's greeting first.
  if (studio) {
    return <EmergencyPlumbingStorefront config={config} studio />;
  }
  return (
    <main className="bg-obsidian text-fg">
      <FounderWelcomeStage
        owner={config.company}
        business={config.company}
        trade="Emergency Plumbing"
        place={config.city}
      />
      <div id="trade-stage">
        <EmergencyPlumbingStorefront config={config} studio={false} />
      </div>
    </main>
  );
}
