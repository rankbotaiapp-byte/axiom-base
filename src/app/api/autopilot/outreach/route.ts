import { NextResponse } from "next/server";
import { z } from "zod";
import { publicJsonError } from "@/lib/axiom/public-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  action: z.enum(["status", "plan", "run"]).default("run"),
  county: z.enum(["jackson", "josephine", "douglas", "klamath"]).optional(),
  trade: z
    .enum(["plumbing", "hvac", "electrical", "contractor", "auto", "welding"])
    .optional(),
  mode: z.enum(["simulation", "live"]).optional(),
  limit: z.number().int().min(1).max(40).optional(),
  dryRun: z.boolean().optional(),
});

/** Master Autopilot Outreach Engine — status / plan / run regional batches. */
export async function GET(request: Request) {
  try {
    const { cronTokenValid } = await import("@/lib/axiom/cron-auth.server");
    const { assertAutopilotDesk } = await import("@/lib/axiom/autopilot.server");
    if (!cronTokenValid(request)) await assertAutopilotDesk(request);
    const { readOutreachEngineStatus } = await import("@/lib/axiom/autopilot-outreach.server");
    return NextResponse.json({ ok: true, ...(await readOutreachEngineStatus()) });
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const { cronTokenValid } = await import("@/lib/axiom/cron-auth.server");
    const { assertAutopilotDesk } = await import("@/lib/axiom/autopilot.server");
    if (!cronTokenValid(request)) await assertAutopilotDesk(request);

    const json = (await request.json().catch(() => ({}))) as unknown;
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid outreach payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { readOutreachEngineStatus, runMasterOutreachBatch } = await import(
      "@/lib/axiom/autopilot-outreach.server"
    );

    if (parsed.data.action === "status") {
      return NextResponse.json({ ok: true, ...(await readOutreachEngineStatus()) });
    }

    const result = await runMasterOutreachBatch({
      county: parsed.data.county,
      trade: parsed.data.trade,
      mode: parsed.data.mode,
      limit: parsed.data.limit,
      dryRun: parsed.data.action === "plan" || parsed.data.dryRun === true,
    });

    return NextResponse.json({
      ok: true,
      action: parsed.data.action,
      ...result,
    });
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
