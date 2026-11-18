import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  COMPANION_STATUS_WINDOW_MS,
  companionSourceFromEventType,
  isCompanionTelemetryStatus,
  scoreCompanionStatus,
  stripeCompanionEventType,
  twilioCompanionEventType,
  type CompanionTelemetryPulse,
  type CompanionTelemetrySnapshot,
  type CompanionTelemetryStatus,
} from "./companion-telemetry";

type Sql = Awaited<ReturnType<typeof getSql>>;

/** Process-local hot cache so serverless instances still see recent test pulses. */
const memoryPulses: CompanionTelemetryPulse[] = [];
const MEMORY_CAP = 64;

function missingRelation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /does not exist|undefined_table|undefined_column/i.test(message);
}

function pushMemory(pulse: CompanionTelemetryPulse) {
  memoryPulses.unshift(pulse);
  if (memoryPulses.length > MEMORY_CAP) memoryPulses.length = MEMORY_CAP;
}

async function withSql<T>(run: (sql: Sql) => Promise<T>, fallback: T): Promise<T> {
  try {
    const sql = await getSql();
    return await run(sql);
  } catch (err) {
    if (missingRelation(err)) return fallback;
    throw err;
  }
}

export async function recordCompanionPulse(input: {
  status: CompanionTelemetryStatus;
  eventType: string;
  shopId?: string | null;
  payload?: Record<string, unknown>;
  /** @deprecated prefer eventType; kept for desk-test callers */
  source?: string;
  detail?: string;
}): Promise<CompanionTelemetryPulse> {
  const eventType = (input.eventType || input.source || "system.pulse").slice(0, 120);
  const payload = {
    ...(input.payload ?? {}),
    ...(input.detail ? { detail: input.detail.slice(0, 240) } : {}),
  };
  const pulse: CompanionTelemetryPulse = {
    id: randomUUID(),
    status: input.status,
    source: companionSourceFromEventType(eventType),
    detail: input.detail?.slice(0, 240) || eventType,
    eventType,
    shopId: input.shopId?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  pushMemory(pulse);
  const payloadJson = JSON.stringify(payload);
  await withSql(async (sql) => {
    await sql`
      insert into companion_telemetry_pulses (id, shop_id, status, event_type, payload)
      values (
        ${pulse.id},
        ${pulse.shopId},
        ${pulse.status},
        ${pulse.eventType},
        ${payloadJson}::jsonb
      )
    `;
  }, undefined);
  return pulse;
}

export async function readCompanionTelemetryWindow(shopId?: string | null): Promise<{
  snapshot: CompanionTelemetrySnapshot;
  pulses: CompanionTelemetryPulse[];
}> {
  const scopedShop = shopId?.trim() || null;
  const fromDb = await withSql(async (sql) => {
    const rows = scopedShop
      ? await sql<{
          id: string;
          shop_id: string | null;
          status: string;
          event_type: string;
          payload: unknown;
          created_at: string | Date;
        }>`
          select id, shop_id, status, event_type, payload, created_at
          from companion_telemetry_pulses
          where created_at > now() - interval '5 minutes'
            and (shop_id is null or shop_id = ${scopedShop})
          order by created_at desc
          limit 40
        `
      : await sql<{
          id: string;
          shop_id: string | null;
          status: string;
          event_type: string;
          payload: unknown;
          created_at: string | Date;
        }>`
          select id, shop_id, status, event_type, payload, created_at
          from companion_telemetry_pulses
          where created_at > now() - interval '5 minutes'
          order by created_at desc
          limit 40
        `;

    return rows.map((row) => {
      const payload =
        row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {};
      const detail =
        typeof payload.detail === "string" ? payload.detail : row.event_type;
      return {
        id: String(row.id),
        status: isCompanionTelemetryStatus(row.status) ? row.status : ("idle" as const),
        source: companionSourceFromEventType(row.event_type),
        detail,
        eventType: row.event_type,
        shopId: row.shop_id,
        createdAt:
          typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
      } satisfies CompanionTelemetryPulse;
    });
  }, [] as CompanionTelemetryPulse[]);

  const memory = scopedShop
    ? memoryPulses.filter((pulse) => !pulse.shopId || pulse.shopId === scopedShop)
    : memoryPulses;

  const merged = [...memory, ...fromDb];
  const seen = new Set<string>();
  const unique: CompanionTelemetryPulse[] = [];
  for (const pulse of merged) {
    if (seen.has(pulse.id)) continue;
    seen.add(pulse.id);
    unique.push(pulse);
  }
  return { snapshot: scoreCompanionStatus(unique), pulses: unique };
}

export async function readCompanionTelemetrySnapshot(shopId?: string | null): Promise<CompanionTelemetrySnapshot> {
  const { snapshot } = await readCompanionTelemetryWindow(shopId);
  return snapshot;
}

export async function recordStripeCompanionPulse(
  eventType: string,
  detail = "",
  shopId?: string | null,
): Promise<void> {
  const { companionStatusFromStripeEvent } = await import("./companion-telemetry");
  const status = companionStatusFromStripeEvent(eventType);
  if (!status || status === "idle") return;
  try {
    await recordCompanionPulse({
      status,
      eventType: stripeCompanionEventType(eventType),
      shopId,
      detail: detail || eventType,
      payload: { stripeEvent: eventType },
    });
  } catch (err) {
    console.error(
      "[companion-telemetry] stripe pulse failed",
      err instanceof Error ? err.message.slice(0, 160) : err,
    );
  }
}

export async function recordTwilioCompanionPulse(
  eventType: string,
  errorCode = "",
  detail = "",
  shopId?: string | null,
): Promise<void> {
  const { companionStatusFromTwilioEvent } = await import("./companion-telemetry");
  const status = companionStatusFromTwilioEvent(eventType, errorCode);
  if (!status || status === "idle") return;
  try {
    await recordCompanionPulse({
      status,
      eventType: twilioCompanionEventType(eventType),
      shopId,
      detail: detail || `${eventType}${errorCode ? `:${errorCode}` : ""}`,
      payload: { twilioStatus: eventType, errorCode },
    });
  } catch (err) {
    console.error(
      "[companion-telemetry] twilio pulse failed",
      err instanceof Error ? err.message.slice(0, 160) : err,
    );
  }
}

export { COMPANION_STATUS_WINDOW_MS };
