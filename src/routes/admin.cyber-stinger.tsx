import { createFileRoute } from "@tanstack/react-router";
import {
  CYBER_STINGER,
  CyberStingerHub,
  INTENTS,
  type Intent,
} from "@/components/admin/cyber-stinger";
import "@/components/admin/cyber-stinger/cyber-stinger.css";

type CyberStingerSearch = { intent?: Intent };

/**
 * Admin CyberStinger command dashboard — perimeter telemetry + lead intents.
 * Path: /admin/cyber-stinger
 */
export const Route = createFileRoute("/admin/cyber-stinger")({
  validateSearch: (search: Record<string, unknown>): CyberStingerSearch => {
    const i = search.intent;
    return typeof i === "string" && (INTENTS as readonly string[]).includes(i)
      ? { intent: i as Intent }
      : {};
  },
  head: () => ({
    meta: [
      { title: "CyberStinger Command Dashboard | Axiom Admin" },
      {
        name: "description",
        content:
          "Master admin CyberStinger hub — fleet telemetry, threat feed, and secure lead capture.",
      },
      { name: "theme-color", content: "#030712" },
      { property: "og:image", content: CYBER_STINGER.media.poster },
    ],
    links: [
      { rel: "preload", as: "image", href: CYBER_STINGER.media.poster },
      { rel: "preload", as: "video", href: CYBER_STINGER.media.loop, type: "video/mp4" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: AdminCyberStingerPage,
});

function AdminCyberStingerPage() {
  const { intent } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <CyberStingerHub
      intent={intent}
      onIntentChange={(next) =>
        navigate({
          search: (prev) => ({ ...prev, intent: next }),
          replace: !next,
          resetScroll: false,
        })
      }
    />
  );
}
