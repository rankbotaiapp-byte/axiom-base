import { NextResponse } from "next/server";
import { readAxiomBusinessNumber } from "@/lib/axiom/axiom-business-number.server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = cleanShopSlug(new URL(request.url).searchParams.get("slug") || "");
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const record = await readAxiomBusinessNumber(slug);
  if (record) return NextResponse.json({ ok: true, ...record });

  const { loadTenantStorefrontConfig } = await import("@/lib/storefront/load-tenant-config");
  const loaded = await loadTenantStorefrontConfig(slug);
  if (loaded.status !== "ok") return NextResponse.json({ error: "Unknown shop" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    slug,
    businessName: loaded.config.businessName,
    e164: "",
    display: "Provisioning…",
    status: "none",
    assignedAt: null,
    welcomeSms: "none",
  });
}
