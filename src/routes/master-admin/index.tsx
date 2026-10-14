import { createFileRoute } from "@tanstack/react-router";
import { MasterAdminPage } from "@/components/master-desk";

export const Route = createFileRoute("/master-admin/")({
  validateSearch: masterSearch,
  head: masterHead,
  component: MasterAdminPage,
});

function masterSearch(search: Record<string, unknown>): { key?: string } {
  const key = typeof search.key === "string" ? search.key : "";
  return key ? { key: key.slice(0, 200) } : {};
}

function masterHead() {
  return {
    meta: [
      { title: "Master desk" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Master" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "theme-color", content: "#08080A" },
    ],
    links: [
      { rel: "manifest", href: "/master.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180-png.png" },
    ],
  };
}
