import { NextResponse } from "next/server";
import { httpStatus, publishStorefront } from "@/lib/axiom/storefront-unlock.server";
import { applyShowcaseThemeToShop } from "@/lib/axiom/shop-accent.server";
import { parseShowcaseThemeId } from "@/lib/axiom/outreach-desk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown; showcaseThemeId?: unknown } | null;
  const slug = String(body?.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  }
  try {
    if (body?.showcaseThemeId) {
      await applyShowcaseThemeToShop(slug, parseShowcaseThemeId(body.showcaseThemeId));
    }
    const result = await publishStorefront(request, slug);
    if (!result.published) {
      const decision = result.decision;
      const status = decision.reason === "UNLOCK_REQUIRED" ? 402 : 409;
      return NextResponse.json(
        {
          ok: false,
          code: decision.reason,
          decision,
          error: decision.requiresUnlockFirst ? "Unlock the page before publishing." : "Choose a plan to go live.",
          plans: decision.requiresPlanSelection
            ? [
                { id: "monthly", name: "Axiom monthly", price: "$150/mo" },
                { id: "lifetime", name: "Founder's lifetime", price: "$1,500 once" },
              ]
            : [],
        },
        { status },
      );
    }
    return NextResponse.json({ ok: true, publishStatus: "published" });
  } catch (err) {
    const status = httpStatus(err);
    const error = err instanceof Error ? err.message : "Publish failed.";
    return NextResponse.json({ ok: false, error }, { status });
  }
}
