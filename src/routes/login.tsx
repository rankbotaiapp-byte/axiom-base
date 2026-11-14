import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SignInPortal, safePortalPath } from "@/components/auth/SignInPortal";
import { localDevAuthAllowedClient } from "@/lib/auth/local-dev-bypass";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isShopNiche, type ShopNiche } from "@/lib/axiom/types";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { next?: string; dev?: boolean } => ({
    next: typeof s.next === "string" ? s.next : undefined,
    // `?dev=1` / `?dev=true` — local bypass flag (ignored in production builds).
    dev: s.dev === true || s.dev === "1" || s.dev === "true" || s.dev === 1,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Axiom Void Portal" },
      { name: "theme-color", content: "#030712" },
    ],
  }),
  component: Login,
});

function onboardNiche(next: string): ShopNiche | undefined {
  const query = next.split("?")[1] ?? "";
  const niche = new URLSearchParams(query).get("niche") ?? "";
  if (!isShopNiche(niche)) return undefined;
  return niche;
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const search = Route.useSearch();
  const rawNext = search.next;
  const next = safePortalPath(rawNext, "/shops");
  const autoDevBypass = Boolean(search.dev) && localDevAuthAllowedClient();

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center" style={{ background: "#030712" }}>
        <div className="h-10 w-40 animate-pulse rounded-full bg-[#00ffcc]/15" />
      </main>
    );
  }

  // Deep-link next auto-forwards when already signed in.
  // Admin destinations stay on the portal so RBAC / master-key can run —
  // except local/dev with a shop admin next, which should land immediately.
  if (user && rawNext) {
    const path = next.split("?")[0] || "/shops";
    const niche = onboardNiche(next);
    if (path === "/onboard") return <Navigate to="/onboard" search={niche ? { niche } : {}} />;
    if (path === "/shops") return <Navigate to="/shops" />;
    if (path === "/welcome") return <Navigate to="/welcome" />;
    const isMasterDesk = path === "/admin/master-dashboard" || path === "/admin" || path === "/master";
    const isShopAdmin = /^\/[^/]+\/admin(?:\/|$)/.test(path);
    if (isMasterDesk && !localDevAuthAllowedClient()) {
      return <SignInPortal next={rawNext} autoDevBypass={autoDevBypass} />;
    }
    if ((isShopAdmin || isMasterDesk) && localDevAuthAllowedClient()) {
      if (typeof window !== "undefined") window.location.assign(next);
      return null;
    }
    if (isMasterDesk) {
      return <SignInPortal next={rawNext} autoDevBypass={autoDevBypass} />;
    }
    if (path.startsWith("/") && path !== "/login" && path !== "/") {
      if (typeof window !== "undefined") window.location.assign(next);
      return null;
    }
  }

  return <SignInPortal next={rawNext} autoDevBypass={autoDevBypass} />;
}
