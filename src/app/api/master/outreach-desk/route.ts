import { NextResponse } from "next/server";
import { AutopilotError } from "@/lib/axiom/autopilot.server";
import {
  attachLeadDatasetImage,
  inspectDatasetLead,
  listDatasetBatches,
  recreateAnimatedHero,
  saveLeadPhone,
} from "@/lib/axiom/outreach-desk.server";
import { listCommandLeads, saveLeadIdentity, setLeadQa } from "@/lib/axiom/lead-verification.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function httpStatus(err: unknown): number {
  return err instanceof AutopilotError ? err.status : 500;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view") || "batches";
    if (view === "command") {
      const filter = (url.searchParams.get("filter") || "all") as "all" | "prime" | "needs_hero" | "needs_phone";
      const niche = (url.searchParams.get("niche") || "plumbing") as "plumbing" | "electrical" | "hvac" | "all";
      const leads = await listCommandLeads(request, {
        filter,
        niche,
        search: url.searchParams.get("q") || "",
        limit: Number(url.searchParams.get("limit") || 40),
      });
      return NextResponse.json({ leads });
    }
    if (view === "lead") {
      const page = await inspectDatasetLead(request, {
        batchId: url.searchParams.get("batchId") || undefined,
        leadId: url.searchParams.get("leadId") || undefined,
        index: Number(url.searchParams.get("index") || 0),
        hasPhone: url.searchParams.get("hasPhone") === "1",
        hasDatasetImages: url.searchParams.get("hasDatasetImages") === "1",
        unverified: url.searchParams.get("unverified") === "1",
      });
      return NextResponse.json(page);
    }
    const batches = await listDatasetBatches(request);
    return NextResponse.json({ batches });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Desk inspector failed.";
    return NextResponse.json({ error }, { status: httpStatus(err) });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      leadId?: string;
      phone?: string;
      imageUrl?: string;
      businessName?: string;
      city?: string;
      qaApproved?: boolean;
      notes?: string;
    };
    const leadId = String(body.leadId ?? "").trim();
    if (!leadId) return NextResponse.json({ error: "Missing lead." }, { status: 400 });
    if (body.action === "save-identity") {
      const lead = await saveLeadIdentity(request, {
        leadId,
        businessName: body.businessName,
        city: body.city,
        phone: body.phone,
      });
      return NextResponse.json({ lead });
    }
    if (body.action === "save-qa") {
      const lead = await setLeadQa(request, {
        leadId,
        qaApproved: body.qaApproved === true,
        notes: body.notes,
      });
      return NextResponse.json({ lead });
    }
    if (body.action === "save-phone") {
      const lead = await saveLeadPhone(request, leadId, String(body.phone ?? ""));
      return NextResponse.json({ lead });
    }
    if (body.action === "upload-image") {
      const lead = await attachLeadDatasetImage(request, leadId, String(body.imageUrl ?? ""));
      return NextResponse.json({ lead });
    }
    if (body.action === "recreate-hero") {
      const lead = await recreateAnimatedHero(request, { leadId, imageUrl: body.imageUrl });
      return NextResponse.json({ lead });
    }
    return NextResponse.json({ error: "Unknown inspector action." }, { status: 400 });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Desk inspector failed.";
    return NextResponse.json({ error }, { status: httpStatus(err) });
  }
}
