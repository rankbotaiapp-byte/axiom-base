import { publicJsonError } from "@/lib/axiom/public-api-error";
import { isCompanionTelemetryStatus } from "@/lib/axiom/companion-telemetry";

export const runtime = "nodejs";

/** Latest companion hue status + recent pulses (5-minute window). Safe for polling — no PII. */
export async function GET(request: Request): Promise<Response> {
  try {
    const shopId = new URL(request.url).searchParams.get("shopId");
    const { readCompanionTelemetryWindow } = await import("@/lib/axiom/companion-telemetry.server");
    const { snapshot, pulses } = await readCompanionTelemetryWindow(shopId);
    return Response.json(
      { ...snapshot, pulses },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}

/**
 * Desk test pulse OR pipeline event ingest (Twilio SMS delivery, booking conversion).
 * Master desk session required unless `X-Axiom-Telemetry-Key` matches COMPANION_TELEMETRY_SECRET.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const telemetryKey = request.headers.get("x-axiom-telemetry-key")?.trim();
    const secret = process.env.COMPANION_TELEMETRY_SECRET?.trim();
    const keyOk = Boolean(secret && telemetryKey && telemetryKey === secret);
    if (!keyOk) {
      const { assertAutopilotDesk } = await import("@/lib/axiom/autopilot.server");
      await assertAutopilotDesk(request);
    }
    const body = (await request.json().catch(() => ({}))) as {
      status?: unknown;
      detail?: unknown;
      shopId?: unknown;
      eventType?: unknown;
      payload?: unknown;
      kind?: unknown;
    };
    if (!isCompanionTelemetryStatus(body.status) || body.status === "idle") {
      return Response.json(
        { error: "status must be good, warning, or alert" },
        { status: 400 },
      );
    }
    const { recordCompanionPulse, readCompanionTelemetryWindow } = await import(
      "@/lib/axiom/companion-telemetry.server"
    );
    const kind =
      typeof body.kind === "string" && body.kind.trim() ? body.kind.trim().slice(0, 80) : "";
    const eventType =
      typeof body.eventType === "string" && body.eventType.trim()
        ? body.eventType.trim()
        : kind
          ? `twilio.${kind}`
          : `desk-test.${body.status}`;
    const payload =
      body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : { origin: keyOk ? "pipeline" : "desk-test" };
    const pulse = await recordCompanionPulse({
      status: body.status,
      eventType,
      shopId: typeof body.shopId === "string" ? body.shopId : null,
      detail: typeof body.detail === "string" ? body.detail : `Manual ${body.status} pulse`,
      payload: { ...payload, kind: kind || undefined },
    });
    const { snapshot, pulses } = await readCompanionTelemetryWindow(
      typeof body.shopId === "string" ? body.shopId : null,
    );
    return Response.json({ ok: true, pulse, snapshot: { ...snapshot, pulses } });
  } catch (err) {
    return publicJsonError(err, "Internal server error");
  }
}
