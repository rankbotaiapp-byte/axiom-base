import { createFileRoute, Navigate } from "@tanstack/react-router";
import { resolveHeroStudioSlug } from "@/lib/axiom/hero-studio-route";

export const Route = createFileRoute("/admin/hero-studio")({
  component: HeroStudioTenantRedirect,
});

/** Global /admin/hero-studio is not a desk — send it to the active or seeded tenant studio. */
function HeroStudioTenantRedirect() {
  const shopSlug = resolveHeroStudioSlug();
  return <Navigate to="/$shopSlug/admin/hero-studio" params={{ shopSlug }} replace />;
}
