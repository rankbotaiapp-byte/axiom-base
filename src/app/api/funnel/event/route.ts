import { NextResponse } from "next/server";
import { parseFunnelEvent, PUBLIC_FUNNEL_EVENTS } from "@/lib/axiom/growth-engine";
import { recordFunnelEvent } from "@/lib/axiom/growth-engine.server";
import { parseLeadId } from "@/lib/axiom/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = parseLeadId(body?.leadId ?? body?.lead_id);
  const event = parseFunnelEvent(body?.event);
  if (!leadId || !event) {
    return NextResponse.json({ ok: false, error: "lead_id and event required" }, { status: 400 });
  }
  if (!(PUBLIC_FUNNEL_EVENTS as readonly string[]).includes(event)) {
    return NextResponse.json({ ok: false, error: "event not allowed" }, { status: 403 });
  }
  await recordFunnelEvent({
    leadId,
    event,
    trade: String(body?.trade || ""),
    state: String(body?.state || ""),
    city: String(body?.city || ""),
    variantId: String(body?.variantId || body?.variant_id || ""),
    dwellMs: Number(body?.dwellMs || body?.dwell_ms) || 0,
    revenueCents: Number(body?.revenueCents) || 0,
  });
  return NextResponse.json({ ok: true });
}
