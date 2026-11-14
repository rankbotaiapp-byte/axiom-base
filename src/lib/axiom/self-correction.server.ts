import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { AXIOM_AUTOPILOT_LIMITS, hydrateAutopilotLimits } from "./autopilot-limits.ts";
import {
  TELEMETRY_SAMPLE_SIZE,
  detectTelemetrySource,
  evaluateOutreachHealth as scoreOutreachHealth,
  formBodyToRecord,
  hourlyHealthSlot,
  parseResendWebhook,
  parseTwilioStatusCallback,
  type HealthAssessment,
  type SendIdentity,
  type TelemetryEvent,
} from "./self-correction.ts";

type Sql = Awaited<ReturnType<typeof getSql>>;

function missingRelation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /does not exist|undefined_table|undefined_column/i.test(message);
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

export async function persistTelemetryEvent(event: TelemetryEvent): Promise<void> {
  await withSql(async (sql) => {
    await sql`
      insert into outreach_telemetry_logs (
        id, provider, channel, event_type, error_code, identity, destination, message_sid
      ) values (
        ${newId("tel")},
        ${event.provider},
        ${event.channel},
        ${event.eventType.slice(0, 40)},
        ${event.errorCode.slice(0, 40)},
        ${event.identity.slice(0, 80)},
        ${event.destination.slice(0, 160)},
        ${event.messageSid.slice(0, 80)}
      )
    `;
  }, undefined);
}

export async function handleTelemetryWebhook(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") || "";
  const bodyText = await request.text();
  const hinted = new URL(request.url).searchParams.get("provider")?.trim().toLowerCase();
  const source = hinted === "twilio" || hinted === "resend" ? hinted : detectTelemetrySource(contentType, bodyText);
  if (!source) {
    return Response.json({ ok: false, error: "Unrecognized telemetry payload" }, { status: 400 });
  }
  let event: TelemetryEvent | null = null;
  if (source === "twilio") {
    event = parseTwilioStatusCallback(formBodyToRecord(bodyText));
  } else {
    try {
      event = parseResendWebhook(JSON.parse(bodyText) as unknown);
    } catch {
      event = null;
    }
  }
  if (!event) {
    return Response.json({ ok: false, error: "Could not parse provider event" }, { status: 400 });
  }
  await persistTelemetryEvent(event);
  return Response.json({ ok: true, channel: event.channel, eventType: event.eventType });
}

function envSmsNumbers(): { primary: string; backup: string } {
  const primary = (env("TWILIO_FROM_NUMBER") || env("TWILIO_PHONE_NUMBER") || "").trim();
  const backup = (env("TWILIO_FROM_NUMBER_BACKUP") || env("TWILIO_BACKUP_NUMBER") || "").trim();
  return { primary, backup };
}

async function seedIdentities(sql: Sql): Promise<void> {
  const { primary, backup } = envSmsNumbers();
  const inbox = (env("RESEND_FROM") || "").trim();
  const rows: Array<{ identity: string; channel: "sms" | "email"; role: "primary" | "backup" }> = [];
  if (primary) rows.push({ identity: primary, channel: "sms", role: "primary" });
  if (backup && backup !== primary) rows.push({ identity: backup, channel: "sms", role: "backup" });
  if (inbox) rows.push({ identity: inbox, channel: "email", role: "primary" });
  for (const row of rows) {
    await sql`
      insert into outreach_send_identities (id, channel, identity, role, status)
      values (${newId("sid")}, ${row.channel}, ${row.identity.slice(0, 80)}, ${row.role}, ${"active"})
      on conflict (channel, identity) do nothing
    `.catch(() => undefined);
  }
  await sql`
    insert into outreach_dataset_chunks (id, niche, status)
    values (${"plumbing-current"}, ${"plumbing"}, ${"active"})
    on conflict (id) do nothing
  `.catch(() => undefined);
  await sql`
    insert into outreach_health_state (id, min_delay_seconds, max_delay_seconds)
    values (${"master"}, ${AXIOM_AUTOPILOT_LIMITS.minDelaySeconds}, ${AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds})
    on conflict (id) do nothing
  `.catch(() => undefined);
}

async function loadIdentities(sql: Sql): Promise<SendIdentity[]> {
  const rows = await sql<{
    identity: string;
    channel: string;
    role: string;
    status: string;
  }>`
    select identity, channel, role, status from outreach_send_identities
  `.catch(() => [] as { identity: string; channel: string; role: string; status: string }[]);
  return rows.map((row) => ({
    identity: row.identity,
    channel: row.channel === "email" ? "email" : "sms",
    role: row.role === "backup" ? "backup" : "primary",
    status: row.status === "paused" ? "paused" : "active",
  }));
}

async function loadRecentEvents(sql: Sql): Promise<TelemetryEvent[]> {
  const rows = await sql<{
    provider: string;
    channel: string;
    event_type: string;
    error_code: string;
    identity: string;
    destination: string;
    message_sid: string;
  }>`
    select provider, channel, event_type, error_code, identity, destination, message_sid
    from outreach_telemetry_logs
    order by created_at desc
    limit ${TELEMETRY_SAMPLE_SIZE}
  `.catch(() => []);
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      provider: row.provider === "resend" ? "resend" : "twilio",
      channel: row.channel === "email" ? "email" : "sms",
      eventType: row.event_type,
      errorCode: row.error_code,
      identity: row.identity,
      destination: row.destination,
      messageSid: row.message_sid,
    }));
}

async function conversionVelocity(sql: Sql): Promise<number> {
  try {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n
      from funnel_visits
      where verified = true
        and created_at >= now() - interval '1 hour'
    `;
    const clicks = Number(rows[0]?.n ?? 0) || 0;
    return Math.min(1, clicks / TELEMETRY_SAMPLE_SIZE);
  } catch {
    return 0;
  }
}

async function applyAssessment(sql: Sql, assessment: HealthAssessment): Promise<void> {
  const now = new Date().toISOString();
  for (const action of assessment.actions) {
    if (action.rule === "sms_burn") {
      await sql`
        update outreach_send_identities
        set status = ${"paused"},
            pause_reason = ${action.detail.slice(0, 400)},
            paused_at = ${now},
            updated_at = ${now}
        where channel = ${"sms"} and identity = ${action.pauseIdentity}
      `;
      if (action.routeTo) {
        await sql`
          update outreach_send_identities
          set status = ${"active"}, updated_at = ${now}
          where channel = ${"sms"} and identity = ${action.routeTo}
        `;
      }
    }
    if (action.rule === "email_bounce" && action.pauseChunk) {
      await sql`
        update outreach_dataset_chunks
        set status = ${"paused_reverify"},
            pause_reason = ${action.detail.slice(0, 400)},
            paused_at = ${now},
            updated_at = ${now}
        where id = ${"plumbing-current"}
      `;
    }
    if (action.rule === "throttle") {
      hydrateAutopilotLimits(action.limits);
      await sql`
        update outreach_health_state
        set min_delay_seconds = ${action.limits.minDelaySeconds},
            max_delay_seconds = ${action.limits.maxDelaySeconds},
            updated_at = ${now}
        where id = ${"master"}
      `;
    }
    await sql`
      insert into outreach_health_adjustments (
        id, rule, summary, detail, min_delay_seconds, max_delay_seconds
      ) values (
        ${newId("hadj")},
        ${action.rule},
        ${action.summary.slice(0, 240)},
        ${action.detail.slice(0, 400)},
        ${action.rule === "throttle" ? action.limits.minDelaySeconds : AXIOM_AUTOPILOT_LIMITS.minDelaySeconds},
        ${action.rule === "throttle" ? action.limits.maxDelaySeconds : AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds}
      )
    `;
  }
  const pausedChunk = assessment.actions.some((action) => action.rule === "email_bounce");
  const datasetStatus = pausedChunk ? "paused_reverify" : "";
  await sql`
    update outreach_health_state
    set sms_violation_rate = ${assessment.smsViolationRate},
        email_bounce_rate = ${assessment.emailBounceRate},
        conversion_velocity = ${assessment.conversionVelocity},
        error_rate = ${assessment.errorRate},
        previous_error_rate = ${assessment.errorRate},
        previous_conversion_velocity = ${assessment.conversionVelocity},
        dataset_status = case when ${datasetStatus} = ${"paused_reverify"} then ${"paused_reverify"} else dataset_status end,
        last_evaluated_at = ${now},
        updated_at = ${now}
    where id = ${"master"}
  `;
}

/**
 * Background assessment: last 100 messages, then Rule A / B / C writes.
 */
export async function evaluateOutreachHealth(now = new Date()): Promise<HealthAssessment | null> {
  return withSql(async (sql) => {
    await seedIdentities(sql);
    const state = await sql<{
      min_delay_seconds: number;
      max_delay_seconds: number;
      previous_error_rate: number;
      previous_conversion_velocity: number;
    }>`
      select min_delay_seconds, max_delay_seconds, previous_error_rate, previous_conversion_velocity
      from outreach_health_state where id = ${"master"} limit 1
    `.catch(() => []);
    const row = state[0];
    if (row) hydrateAutopilotLimits({ minDelaySeconds: Number(row.min_delay_seconds), maxDelaySeconds: Number(row.max_delay_seconds) });
    const events = await loadRecentEvents(sql);
    const identities = await loadIdentities(sql);
    const assessment = scoreOutreachHealth({
      events,
      identities,
      limits: { ...AXIOM_AUTOPILOT_LIMITS },
      previousErrorRate: Number(row?.previous_error_rate ?? 0) || 0,
      previousConversionVelocity: Number(row?.previous_conversion_velocity ?? 0) || 0,
      conversionVelocity: await conversionVelocity(sql),
    });
    await applyAssessment(sql, assessment);
    return assessment;
  }, null);
}

/** End of each dispatch-window hour. No-op nights, weekends, and duplicate slots. */
export async function maybeEvaluateOutreachHealthHourly(now = new Date()): Promise<{
  ran: boolean;
  slot: string | null;
  assessment: HealthAssessment | null;
}> {
  const slot = hourlyHealthSlot(now);
  if (!slot) return { ran: false, slot: null, assessment: null };
  return withSql(async (sql) => {
    await seedIdentities(sql);
    const prior = await sql<{ last_hour_key: string }>`
      select last_hour_key from outreach_health_state where id = ${"master"} limit 1
    `.catch(() => [] as { last_hour_key: string }[]);
    if ((prior[0]?.last_hour_key ?? "") === slot) {
      return { ran: false, slot, assessment: null };
    }
    const assessment = await evaluateOutreachHealth(now);
    await sql`
      update outreach_health_state
      set last_hour_key = ${slot}, updated_at = ${new Date().toISOString()}
      where id = ${"master"}
    `;
    return { ran: true, slot, assessment };
  }, { ran: false, slot, assessment: null });
}

export async function resolveActiveSmsIdentity(): Promise<string | undefined> {
  const fallback = envSmsNumbers();
  return withSql(async (sql) => {
    await seedIdentities(sql);
    const rows = await sql<{ identity: string }>`
      select identity from outreach_send_identities
      where channel = ${"sms"} and status = ${"active"}
      order by case when role = 'primary' then 0 else 1 end, updated_at desc
      limit 1
    `;
    return rows[0]?.identity || fallback.primary || fallback.backup || undefined;
  }, fallback.primary || fallback.backup || undefined);
}

export async function isDatasetChunkPaused(): Promise<boolean> {
  return withSql(async (sql) => {
    const rows = await sql<{ status: string }>`
      select status from outreach_dataset_chunks where id = ${"plumbing-current"} limit 1
    `;
    const status = (rows[0]?.status ?? "active").toLowerCase();
    return status === "paused" || status === "paused_reverify";
  }, false);
}

export type OutreachHealthSnapshot = {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  smsViolationRate: number;
  emailBounceRate: number;
  errorRate: number;
  conversionVelocity: number;
  datasetStatus: string;
  lastEvaluatedAt: string | null;
  lastHourKey: string;
  identities: SendIdentity[];
  adjustments: Array<{
    id: string;
    rule: string;
    summary: string;
    detail: string;
    minDelaySeconds: number | null;
    maxDelaySeconds: number | null;
    createdAt: string;
  }>;
};

export async function readOutreachHealthSnapshot(): Promise<OutreachHealthSnapshot> {
  const empty: OutreachHealthSnapshot = {
    minDelaySeconds: AXIOM_AUTOPILOT_LIMITS.minDelaySeconds,
    maxDelaySeconds: AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds,
    smsViolationRate: 0,
    emailBounceRate: 0,
    errorRate: 0,
    conversionVelocity: 0,
    datasetStatus: "active",
    lastEvaluatedAt: null,
    lastHourKey: "",
    identities: [],
    adjustments: [],
  };
  return withSql(async (sql) => {
    await seedIdentities(sql);
    const state = await sql<{
      min_delay_seconds: number;
      max_delay_seconds: number;
      sms_violation_rate: number;
      email_bounce_rate: number;
      error_rate: number;
      conversion_velocity: number;
      dataset_status: string;
      last_evaluated_at: string | Date | null;
      last_hour_key: string;
    }>`
      select min_delay_seconds, max_delay_seconds, sms_violation_rate, email_bounce_rate,
        error_rate, conversion_velocity, dataset_status, last_evaluated_at, last_hour_key
      from outreach_health_state where id = ${"master"} limit 1
    `.catch(() => []);
    const row = state[0];
    if (row) {
      hydrateAutopilotLimits({
        minDelaySeconds: Number(row.min_delay_seconds),
        maxDelaySeconds: Number(row.max_delay_seconds),
      });
    }
    const adjustments = await sql<{
      id: string;
      rule: string;
      summary: string;
      detail: string;
      min_delay_seconds: number | null;
      max_delay_seconds: number | null;
      created_at: string | Date;
    }>`
      select id, rule, summary, detail, min_delay_seconds, max_delay_seconds, created_at
      from outreach_health_adjustments
      order by created_at desc
      limit 12
    `.catch(() => []);
    return {
      minDelaySeconds: AXIOM_AUTOPILOT_LIMITS.minDelaySeconds,
      maxDelaySeconds: AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds,
      smsViolationRate: Number(row?.sms_violation_rate ?? 0) || 0,
      emailBounceRate: Number(row?.email_bounce_rate ?? 0) || 0,
      errorRate: Number(row?.error_rate ?? 0) || 0,
      conversionVelocity: Number(row?.conversion_velocity ?? 0) || 0,
      datasetStatus: row?.dataset_status ?? "active",
      lastEvaluatedAt: row?.last_evaluated_at
        ? row.last_evaluated_at instanceof Date
          ? row.last_evaluated_at.toISOString()
          : String(row.last_evaluated_at)
        : null,
      lastHourKey: row?.last_hour_key ?? "",
      identities: await loadIdentities(sql),
      adjustments: adjustments.map((item) => ({
        id: item.id,
        rule: item.rule,
        summary: item.summary,
        detail: item.detail,
        minDelaySeconds: item.min_delay_seconds,
        maxDelaySeconds: item.max_delay_seconds,
        createdAt: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
      })),
    };
  }, empty);
}

export async function readOutreachHealthForDesk(request: Request): Promise<OutreachHealthSnapshot> {
  const { assertAutopilotDesk } = await import("./autopilot.server");
  await assertAutopilotDesk(request);
  return readOutreachHealthSnapshot();
}
