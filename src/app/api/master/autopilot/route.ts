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

function payloadRequestsDry(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return (body as { dryRun?: unknown }).dryRun === true;
}

function parseAction(
  body: unknown,
): "start" | "pause" | "run_batch" | "automate" | "tick_content" | "tick_blender" | "save_templates" | "" {
  if (!body || typeof body !== "object") return "";
  const action = (body as { action?: unknown }).action;
  if (
    action === "start" ||
    action === "pause" ||
    action === "run_batch" ||
    action === "automate" ||
    action === "tick_content" ||
    action === "tick_blender" ||
    action === "save_templates"
  ) {
    return action;
  }
  return "";
}

/** Queue a batch, or pause/start the outbound engine. Empty POST keeps the existing dispatch path. */
export async function POST(request: Request): Promise<Response> {
  try {
    const snapshot = request.clone();
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }
    const action = parseAction(payload);
    const dry = dryRunRequested(snapshot) || payloadRequestsDry(payload);
    if (dry && (action === "" || action === "run_batch")) {
      const { simulateAutopilot } = await import("@/lib/axiom/autopilot.server");
      const result = await simulateAutopilot(snapshot);
      return Response.json({ ...result, dryRun: true, message: "Dry-run sweep complete (0 live messages sent)." });
    }
    if (action) {
      const { commandMasterAutopilot } = await import("@/lib/axiom/master-dashboard.server");
      return Response.json(await commandMasterAutopilot(snapshot, action, payload));
    }
    const { dispatchAutopilot } = await import("@/lib/axiom/autopilot.server");
    return Response.json(await dispatchAutopilot(snapshot));
  } catch (err) {
    return fail(err);
  }
}
