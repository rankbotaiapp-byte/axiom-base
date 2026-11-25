import { NextResponse } from "next/server";
import { AutopilotError } from "@/lib/axiom/autopilot.server";
import { verifyLeadBatch, verifyLeadRecord } from "@/lib/axiom/lead-verification.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusOf(err: unknown): number {
  return err instanceof AutopilotError ? err.status : 500;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      leadId?: string;
      batchIds?: string[];
      dryRun?: boolean;
      useCallerName?: boolean;
    };
    const batchIds = Array.isArray(body.batchIds) ? body.batchIds.map(String) : [];
    const leadId = String(body.leadId ?? "").trim();
    if (batchIds.length) {
      const result = await verifyLeadBatch(request, batchIds, { dryRun: body.dryRun === true });
      return NextResponse.json(result);
    }
    if (!leadId) return NextResponse.json({ error: "Provide leadId or batchIds." }, { status: 400 });
    const lead = await verifyLeadRecord(request, leadId, {
      dryRun: body.dryRun === true,
      useCallerName: body.useCallerName === true,
    });
    return NextResponse.json({ lead });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Lead verification failed.";
    return NextResponse.json({ error }, { status: statusOf(err) });
  }
}
