import { publicJsonError } from "@/lib/axiom/public-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { readMasterProposals } = await import("@/lib/axiom/autopilot-queue.server");
    return Response.json(await readMasterProposals(request));
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { decideProposal, readMasterProposals } = await import("@/lib/axiom/autopilot-queue.server");
    const action = body.action === "disapprove" ? "disapprove" : body.action === "approve" ? "approve" : null;
    if (!action) {
      return Response.json({ error: "action must be approve or disapprove" }, { status: 400 });
    }
    await decideProposal(request, {
      id: String(body.id || ""),
      action,
      reason: String(body.reason || ""),
    });
    return Response.json(await readMasterProposals(request));
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
