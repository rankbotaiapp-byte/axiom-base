import { createFileRoute } from "@tanstack/react-router";
import { PlumberTenantDashboard } from "@/components/tenant-dashboard/PlumberTenantDashboard";
import { DEFAULT_TENANT_SLUG } from "@/lib/axiom/tenant-overlay";

export const Route = createFileRoute("/admin/tenant")({
  validateSearch: (search: Record<string, unknown>): { slug?: string; stripe?: "return" } => {
    const slug = typeof search.slug === "string" ? search.slug.trim().toLowerCase() : "";
    const stripe = search.stripe === "return" ? "return" : undefined;
    return {
      ...(slug ? { slug: slug.slice(0, 80) } : {}),
      ...(stripe ? { stripe } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Your shop desk — Axiom" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TenantDeskPage,
});

function TenantDeskPage() {
  const search = Route.useSearch();
  return (
    <PlumberTenantDashboard
      slug={search.slug || DEFAULT_TENANT_SLUG}
      stripeReturn={search.stripe === "return"}
    />
  );
}
