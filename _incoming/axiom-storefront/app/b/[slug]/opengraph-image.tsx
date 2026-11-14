import { niches } from "@/config/storefront";
import { brandCard } from "@/lib/og/card";
import { getTenantBySlug } from "@/lib/tenants/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTenantBySlug(slug);
  if (!t) return brandCard({ kicker: "Axiom", title: "Local business app", footer: "" });
  return brandCard({ kicker: `${niches[t.niche].label} · ${t.city}, ${t.region}`, title: t.name, footer: t.config.services.map((s) => s.name).slice(0, 3).join(" · ") });
}
