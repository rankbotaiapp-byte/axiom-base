import { NextResponse } from "next/server";
import { AutopilotError } from "@/lib/axiom/autopilot.server";
import { recreateAnimatedHero } from "@/lib/axiom/outreach-desk.server";
import { inspectHeroMedia, markHeroRegenerated } from "@/lib/axiom/lead-verification.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      leadId?: string;
      imageUrl?: string;
      shopName?: string;
      city?: string;
      niche?: string;
    };
    const leadId = String(body.leadId ?? "").trim();
    if (!leadId) return NextResponse.json({ error: "Missing lead." }, { status: 400 });
    const lead = await recreateAnimatedHero(request, {
      leadId,
      imageUrl: body.imageUrl,
      shopName: body.shopName,
      city: body.city,
      niche: body.niche,
    });
    let origin = "";
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = "";
    }
    const hero = await inspectHeroMedia([lead.heroImageUrl, ...lead.datasetImages], origin);
    await markHeroRegenerated(lead.id, lead.heroImageUrl, hero.width);
    return NextResponse.json({ lead: { ...lead, heroImageStatus: hero.status === "low_res" ? "low_res" : "regenerated", heroImageWidth: hero.width } });
  } catch (err) {
    const status = err instanceof AutopilotError ? err.status : 500;
    const error = err instanceof Error ? err.message : "Hero compile failed.";
    return NextResponse.json({ error }, { status });
  }
}
