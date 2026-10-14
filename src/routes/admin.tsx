import { createFileRoute } from "@tanstack/react-router";
import { MasterAdminPage } from "@/components/master-desk";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { key?: string } => {
    const key = typeof search.key === "string" ? search.key : "";
    return key ? { key: key.slice(0, 200) } : {};
  },
  head: () => ({
    meta: [
      { title: "Master desk" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Master" },
    ],
    links: [{ rel: "manifest", href: "/master.webmanifest" }],
  }),
  component: MasterAdminPage,
});
