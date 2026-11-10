import { brandCard } from "@/lib/og/card";
import { getPost, getTenantBySlug } from "@/lib/tenants/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string; post: string }> }) {
  const { slug, post } = await params;
  const t = await getTenantBySlug(slug);
  const p = t ? await getPost(t.id, post) : null;
  return brandCard({
    kicker: t ? `${t.name} · ${t.city}, ${t.region}` : "Axiom",
    title: p?.title ?? t?.name ?? "Local guide",
    footer: t?.phone ?? "",
  });
}
