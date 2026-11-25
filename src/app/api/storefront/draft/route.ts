import { NextResponse } from "next/server";
import { httpStatus, readStorefrontDesk, saveStorefrontDraft } from "@/lib/axiom/storefront-unlock.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugFrom(value: unknown): string {
  const slug = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : "";
}

export async function GET(request: Request) {
  const slug = slugFrom(new URL(request.url).searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const desk = await readStorefrontDesk(slug);
  if (!desk) return NextResponse.json({ error: "Unknown shop" }, { status: 404 });
  return NextResponse.json({
    slug: desk.slug,
    businessName: desk.businessName,
    niche: desk.niche,
    phase: desk.phase,
    unlockStatus: desk.unlockStatus,
    publishStatus: desk.publishStatus,
    planStatus: desk.planStatus,
    stripeSubscriptionId: desk.stripeSubscriptionId,
    decision: desk.decision,
    config: desk.config,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown; config?: unknown } | null;
  const slug = slugFrom(body?.slug);
  if (!slug || !body) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  try {
    const config = await saveStorefrontDraft(request, slug, body.config);
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    const status = httpStatus(err);
    const error = err instanceof Error ? err.message : "Save failed.";
    return NextResponse.json({ ok: false, error }, { status });
  }
}
