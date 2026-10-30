import { AutopilotError } from "@/lib/axiom/autopilot.server";

function fail(err: unknown): Response {
  const status = err instanceof AutopilotError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Autopilot failed";
  return Response.json({ error: message }, { status });
}

/** Desk metrics and the next local batch. Simulation stays on unless OUTREACH_MODE is exactly live. */
export async function GET(request: Request): Promise<Response> {
  try {
    const { readAutopilot } = await import("@/lib/axiom/autopilot.server");
    return Response.json(await readAutopilot(request));
  } catch (err) {
    return fail(err);
  }
}

function dryRunRequested(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("dry") === "1" || request.headers.get("x-autopilot-dry-run") === "1";
}

/** Queue the proposed batch. A dry run only reads and writes a simulation log. */
export async function POST(request: Request): Promise<Response> {
  try {
    if (dryRunRequested(request)) {
      const { simulateAutopilot } = await import("@/lib/axiom/autopilot.server");
      return Response.json(await simulateAutopilot(request));
    }
    const { dispatchAutopilot } = await import("@/lib/axiom/autopilot.server");
    return Response.json(await dispatchAutopilot(request));
  } catch (err) {
    return fail(err);
  }
}
