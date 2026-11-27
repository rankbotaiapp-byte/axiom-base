import { NextResponse } from "next/server";
import { readLandingLead } from "@/lib/axiom/business-lookup.server";
import { parseLandingLeadQuery } from "@/lib/axiom/landing-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { leadId, slug } = parseLandingLeadQuery({
      lead_id: url.searchParams.get("lead_id"),
      lead: url.searchParams.get("lead"),
      slug: url.searchParams.get("slug"),
    });
    if (!leadId && !slug) {
      return NextResponse.json({ ok: false, error: "Pass lead_id or slug." }, { status: 400 });
    }
    const lead = await readLandingLead(leadId ? { id: leadId } : { slug });
    if (!lead) return NextResponse.json({ ok: false, error: "Unknown lead." }, { status: 404 });
    void import("@/lib/axiom/growth-engine.server").then((mod) =>
      mod.recordFunnelEvent({
        leadId: lead.id || leadId || slug,
        event: "clicked",
        trade: lead.trade || "plumbing",
        city: lead.city || "",
      }),
    ).catch(() => undefined);
    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Lookup failed.";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
