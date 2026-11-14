import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenants/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public status check used by /welcome while Stripe's webhook lands. Exposes no private fields.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTenantBySlug(slug);
  if (!t) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, slug: t.slug, status: t.status, business_name: t.business_name });
}
