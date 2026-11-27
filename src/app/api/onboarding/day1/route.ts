import { NextResponse } from "next/server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(code: string, error: string, status: number) {
  return NextResponse.json({ ok: false, error, code }, { status });
}

export async function GET(request: Request) {
  try {
    const slug = cleanShopSlug(new URL(request.url).searchParams.get("slug") || "");
    if (!slug) return fail("UNKNOWN_SHOP", "Unknown shop", 400);
    const { loadDay1Onboarding } = await import("@/lib/axiom/sprint2-dispatch.server");
    const row = await loadDay1Onboarding(slug);
    if (!row) return fail("UNKNOWN_SHOP", "Unknown shop", 404);
    return NextResponse.json({
      ok: true,
      slug: row.slug,
      businessName: row.name,
      ownerPhone: row.owner_phone || row.notify_phone || "",
      googleReviewUrl: row.google_review_url || "",
      hoursStart: row.service_hours_start || "07:00",
      hoursEnd: row.service_hours_end || "19:00",
      city: row.address || "",
      niche: row.niche || "",
      completed: Boolean(row.onboarding_completed_at),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Day-1 lookup failed";
    console.error("[onboarding/day1 GET]", message.slice(0, 200));
    return fail("DAY1_UNAVAILABLE", "Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      slug?: unknown;
      ownerPhone?: unknown;
      googleReviewUrl?: unknown;
      hoursStart?: unknown;
      hoursEnd?: unknown;
      skipReview?: unknown;
    } | null;
    const slug = cleanShopSlug(String(body?.slug ?? ""));
    if (!slug) return fail("UNKNOWN_SHOP", "Unknown shop", 400);
    const { saveDay1Onboarding } = await import("@/lib/axiom/sprint2-dispatch.server");
    const saved = await saveDay1Onboarding({
      slug,
      ownerPhone: String(body?.ownerPhone ?? ""),
      googleReviewUrl: String(body?.googleReviewUrl ?? ""),
      hoursStart: String(body?.hoursStart ?? "07:00"),
      hoursEnd: String(body?.hoursEnd ?? "19:00"),
      skipReview: body?.skipReview === true,
    });
    if (!saved.ok) return NextResponse.json({ ...saved, code: "DAY1_INVALID" }, { status: 400 });
    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Day-1 save failed";
    console.error("[onboarding/day1 POST]", message.slice(0, 200));
    return fail("DAY1_UNAVAILABLE", "Internal server error", 500);
  }
}
