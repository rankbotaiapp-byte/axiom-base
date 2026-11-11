import { AutopilotError } from "@/lib/axiom/autopilot.server";
import { publicJsonError } from "@/lib/axiom/public-api-error";

function fail(err: unknown): Response {
  if (err instanceof AutopilotError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  return publicJsonError(err, "Internal server error");
}

let tickInFlight: Promise<unknown> | null = null;

function kickAutopilotTick(): void {
  if (tickInFlight) return;
  tickInFlight = import("@/lib/axiom/shop-autopilot.server")
    .then((mod) => {
      console.log("[Autopilot] Background tick initiated...");
      return mod.tickShopAutopilot();
    })
    .then(() => {
      console.log("[Autopilot] Background tick completed successfully.");
    })
    .catch((error) => {
      console.error("[Autopilot Background Error]:", error);
    })
    .finally(() => {
      tickInFlight = null;
    });
}

/**
 * Desk metrics plus outreach engine status.
 * Auth: CRON_SECRET / OUTREACH_CRON_SECRET (automated) or master desk session.
 * Cron Bearer returns 202 and ticks in the background so the gateway cannot stall 60s.
 * Simulation stays on unless OUTREACH_MODE is exactly live.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { cronTokenValid } = await import("@/lib/axiom/cron-auth.server");
    if (cronTokenValid(request)) {
      kickAutopilotTick();
      return Response.json(
        { status: "accepted", message: "Autopilot tick initiated in background worker." },
        { status: 202 },
      );
    }
    const { readAutopilotCombined } = await import("@/lib/axiom/master-dashboard.server");
    return Response.json(await readAutopilotCombined(request));
  } catch (err) {
    return fail(err);
  }
}

function dryRunRequested(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("dry") === "1" || request.headers.get("x-autopilot-dry-run") === "1";
}

function parseAction(body: unknown): "start" | "pause" | "run_batch" | "automate" | "tick_content" | "tick_blender" | "" {
  if (!body || typeof body !== "object") return "";
  const action = (body as { action?: unknown }).action;
  if (
    action === "start" ||
    action === "pause" ||
    action === "run_batch" ||
    action === "automate" ||
    action === "tick_content" ||
    action === "tick_blender"
  ) {
    return action;
  }
  return "";
}

/** Queue a batch, or pause/start the outbound engine. Empty POST keeps the existing dispatch path. */
export async function POST(request: Request): Promise<Response> {
  try {
    const snapshot = request.clone();
    let action: "start" | "pause" | "run_batch" | "automate" | "tick_content" | "tick_blender" | "" = "";
    try {
      action = parseAction(await request.json());
    } catch {
      action = "";
    }
    if (action) {
      const { commandMasterAutopilot } = await import("@/lib/axiom/master-dashboard.server");
      return Response.json(await commandMasterAutopilot(snapshot, action));
    }
    if (dryRunRequested(snapshot)) {
      const { simulateAutopilot } = await import("@/lib/axiom/autopilot.server");
      return Response.json(await simulateAutopilot(snapshot));
    }
    const { dispatchAutopilot } = await import("@/lib/axiom/autopilot.server");
    return Response.json(await dispatchAutopilot(snapshot));
  } catch (err) {
    return fail(err);
  }
}
