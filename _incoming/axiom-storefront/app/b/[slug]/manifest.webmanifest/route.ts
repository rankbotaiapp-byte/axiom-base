import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenants/store";

/** Per-tenant PWA manifest — "Add to Home Screen" installs the business's own app. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTenantBySlug(slug);
  if (!t) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(
    {
      name: t.name,
      short_name: t.name.slice(0, 12),
      start_url: `/b/${t.slug}?source=pwa`,
      scope: `/b/${t.slug}`,
      display: "standalone",
      background_color: "#03060b",
      theme_color: "#03060b",
      icons: [{ src: `/b/${t.slug}/icon`, sizes: "512x512", type: "image/png", purpose: "any maskable" }],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } },
  );
}
