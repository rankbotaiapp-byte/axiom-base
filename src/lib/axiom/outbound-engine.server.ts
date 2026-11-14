import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { AutopilotError, assertAutopilotDesk } from "./autopilot.server";
import { isEmailReady, masterFunnel, renderOutreachMessage } from "./funnel";
import { finalizeOutreachBody } from "./legal-notices";
import { outreachDestination } from "./preview-link";
import { resolvePublicAppOrigin } from "./public-app-url";
import { hasListedPhone } from "./autopilot";
import { parseOutreachMode } from "./outreach-queue";
import { OUTREACH_ACTIVE_VERTICAL, PLUMBING_LEAD_DATASET_SIZE, tradeTypeMatchersForNiche } from "./outreach-niche-batch";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  ENGINE_BATCH_TIMEOUT_MS,
  ENGINE_DATASET_BATCH_MAX,
  ENGINE_DATASET_BATCH_SIZE,
  ENGINE_ENQUEUE_CHUNK,
  ENGINE_MICRO_CHUNK,
  ENGINE_PROVIDER_TIMEOUT_MS,
  ENGINE_RECORD_TIMEOUT_MS,
  ENGINE_SNAPSHOT_TIMEOUT_MS,
  ENGINE_TICK_SIZE,
  aggregateEngineBatch,
  chunkArray,
  clampDailyCap,
  clickThroughRate,
  defaultEngineState,
  deliveryRate,
  emptyEngineBatch,
  engineErrorMessage,
  engineRowError,
  engineSupabaseRange,
  engineTickLine,
  parseDatasetBatchSize,
  parseDatasetOffset,
  pickEngineChannel,
  regionForCounty,
  remainingCap,
  throttleCount,
  withBatchTimeout,
  type EngineBatchError,
  type EngineBatchResult,
  type OutboundEngineMetrics,
  type OutboundEngineState,
} from "./outbound-engine";

type Sql = Awaited<ReturnType<typeof getSql>>;

async function assertEngine(request: Request) {
  // Automated ticks: timing-safe CRON_SECRET / OUTREACH_CRON_SECRET.
  // Interactive desk: master owner session (assertAutopilotDesk).
  const { cronTokenValid } = await import("./cron-auth.server");
  if (cronTokenValid(request)) return;
  await assertAutopilotDesk(request);
}

function pacificDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

function originOf(request: Request): string {
  try {
    return resolvePublicAppOrigin(new URL(request.url).origin);
  } catch {
    return resolvePublicAppOrigin(null);
  }
}

async function loadState(sql: Sql): Promise<OutboundEngineState & { smsSentToday: number; emailSentToday: number }> {
  const fallback = defaultEngineState();
  try {
    const rows = await sql<{
      paused: boolean;
      strategy_id: string;
      sms_daily_cap: number;
      email_daily_cap: number;
      sms_template: string;
      email_subject: string;
      email_body: string;
      sms_sent_today: number;
      email_sent_today: number;
      day_key: string;
      active_niche: string | null;
      cron_enabled: boolean | null;
      schedule_started_on: string | null;
    }>`
      select paused, strategy_id, sms_daily_cap, email_daily_cap, sms_template, email_subject, email_body,
             sms_sent_today, email_sent_today, day_key::text as day_key,
             coalesce(active_niche, '') as active_niche,
             coalesce(cron_enabled, false) as cron_enabled,
             coalesce(schedule_started_on::text, '') as schedule_started_on
      from outbound_engine_state where id = ${"master"} limit 1
    `;
    const row = rows[0];
    if (!row) return { ...fallback, smsSentToday: 0, emailSentToday: 0 };
    const today = pacificDay();
    let smsSent = Number(row.sms_sent_today) || 0;
    let emailSent = Number(row.email_sent_today) || 0;
    if ((row.day_key ?? "").slice(0, 10) !== today) {
      smsSent = 0;
      emailSent = 0;
      await sql`
        update outbound_engine_state
        set sms_sent_today = 0, email_sent_today = 0, day_key = ${today}::date, updated_at = now()
        where id = ${"master"}
      `;
    }
    const funnel = masterFunnel(row.strategy_id);
    return {
      paused: row.paused !== false,
      strategyId: funnel.id,
      smsDailyCap: clampDailyCap(row.sms_daily_cap, DEFAULT_SMS_DAILY_CAP),
      emailDailyCap: clampDailyCap(row.email_daily_cap, DEFAULT_EMAIL_DAILY_CAP),
      smsTemplate: row.sms_template || funnel.text,
      emailSubject: row.email_subject || funnel.emailSubject,
      emailBody: row.email_body || funnel.emailBody,
      activeNiche: (row.active_niche ?? "").trim(),
      cronEnabled: row.cron_enabled === true,
      scheduleStartedOn: (row.schedule_started_on ?? "").slice(0, 10),
      smsSentToday: smsSent,
      emailSentToday: emailSent,
    };
  } catch {
    return { ...fallback, smsSentToday: 0, emailSentToday: 0 };
  }
}

async function saveState(sql: Sql, patch: Partial<OutboundEngineState>) {
  const current = await loadState(sql);
  const next = { ...current, ...patch };
  const funnel = masterFunnel(next.strategyId);
  try {
    const started = next.scheduleStartedOn?.slice(0, 10) || null;
    await sql`
      insert into outbound_engine_state (
        id, paused, strategy_id, sms_daily_cap, email_daily_cap, sms_template, email_subject, email_body,
        active_niche, cron_enabled, schedule_started_on, day_key, updated_at
      ) values (
        ${"master"}, ${next.paused}, ${funnel.id}, ${next.smsDailyCap}, ${next.emailDailyCap},
        ${next.smsTemplate}, ${next.emailSubject}, ${next.emailBody}, ${next.activeNiche ?? ""},
        ${next.cronEnabled === true}, ${started}, ${pacificDay()}::date, now()
      )
      on conflict (id) do update set
        paused = excluded.paused,
        strategy_id = excluded.strategy_id,
        sms_daily_cap = excluded.sms_daily_cap,
        email_daily_cap = excluded.email_daily_cap,
        sms_template = excluded.sms_template,
        email_subject = excluded.email_subject,
        email_body = excluded.email_body,
        active_niche = excluded.active_niche,
        cron_enabled = excluded.cron_enabled,
        schedule_started_on = coalesce(excluded.schedule_started_on, outbound_engine_state.schedule_started_on),
        updated_at = now()
    `;
  } catch (err) {
    // Older snapshots without niche/cron columns still accept the core columns.
    try {
      await sql`
        insert into outbound_engine_state (
          id, paused, strategy_id, sms_daily_cap, email_daily_cap, sms_template, email_subject, email_body, day_key, updated_at
        ) values (
          ${"master"}, ${next.paused}, ${funnel.id}, ${next.smsDailyCap}, ${next.emailDailyCap},
          ${next.smsTemplate}, ${next.emailSubject}, ${next.emailBody}, ${pacificDay()}::date, now()
        )
        on conflict (id) do update set
          paused = excluded.paused,
          strategy_id = excluded.strategy_id,
          sms_daily_cap = excluded.sms_daily_cap,
          email_daily_cap = excluded.email_daily_cap,
          sms_template = excluded.sms_template,
          email_subject = excluded.email_subject,
          email_body = excluded.email_body,
          updated_at = now()
      `;
    } catch {
      throw err;
    }
  }
}

export async function setActiveOutreachNiche(request: Request, niche: string) {
  await assertEngine(request);
  const sql = await getSql();
  const today = pacificDay();
  const current = await loadState(sql);
  await saveState(sql, {
    activeNiche: niche.trim(),
    scheduleStartedOn: current.scheduleStartedOn || today,
  });
}

export async function setOutreachCronEnabled(request: Request, enabled: boolean) {
  await assertEngine(request);
  const sql = await getSql();
  const today = pacificDay();
  const current = await loadState(sql);
  await saveState(sql, {
    cronEnabled: enabled,
    paused: enabled ? false : current.paused,
    scheduleStartedOn: current.scheduleStartedOn || (enabled ? today : ""),
    activeNiche: OUTREACH_ACTIVE_VERTICAL,
  });
}

async function metrics(sql: Sql, state: Awaited<ReturnType<typeof loadState>>): Promise<OutboundEngineMetrics> {
  let queued = 0;
  let sent = 0;
  let failed = 0;
  let clicks = 0;
  let onboarded = 0;
  try {
    const matchers = tradeTypeMatchersForNiche(OUTREACH_ACTIVE_VERTICAL).join("|");
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from preloaded_leads
      where claimed = false
        and (
          lower(trade_type) = any(string_to_array(${matchers}, '|'))
          or lower(btrim(coalesce(trade_label, ''))) = any(string_to_array(${matchers}, '|'))
        )
    `;
    queued = Number(rows[0]?.n ?? 0);
  } catch {
    queued = 0;
  }
  try {
    const rows = await sql<{ sent: number; failed: number }>`
      select
        coalesce(sum(lead_count) filter (where status in ('sent', 'logged')), 0)::int as sent,
        coalesce(sum(lead_count) filter (where status = 'failed'), 0)::int as failed
      from outreach_dispatches
    `;
    sent = Number(rows[0]?.sent ?? 0);
    failed = Number(rows[0]?.failed ?? 0);
  } catch {
    sent = state.smsSentToday + state.emailSentToday;
  }
  try {
    const rows = await sql<{ n: number }>`select count(*)::int as n from funnel_visits`;
    clicks = Number(rows[0]?.n ?? 0);
  } catch {
    clicks = 0;
  }
  try {
    const rows = await sql<{ n: number }>`select count(*)::int as n from preloaded_leads where claimed = true`;
    onboarded = Number(rows[0]?.n ?? 0);
  } catch {
    onboarded = 0;
  }
  const engineSent = state.smsSentToday + state.emailSentToday;
  const sentTotal = Math.max(sent, engineSent);
  return {
    queued,
    sent: sentTotal,
    delivered: sentTotal,
    failed,
    clicks,
    onboarded,
    deliveryRate: deliveryRate(sentTotal, failed),
    ctr: clickThroughRate(clicks, sentTotal),
    smsSentToday: state.smsSentToday,
    emailSentToday: state.emailSentToday,
    smsRemaining: remainingCap(state.smsSentToday, state.smsDailyCap),
    emailRemaining: remainingCap(state.emailSentToday, state.emailDailyCap),
  };
}

async function logLine(
  sql: Sql,
  row: { county: string; channel: string; status: string; leadSlug: string; summary: string },
) {
  try {
    await sql`
      insert into outbound_engine_log (id, county, region, channel, status, lead_slug, summary, created_at)
      values (
        ${newId("obx")}, ${row.county}, ${regionForCounty(row.county)}, ${row.channel},
        ${row.status}, ${row.leadSlug}, ${row.summary}, now()
      )
    `;
  } catch {
    try {
      await sql`
        insert into outreach_events (id, county, channel, summary, status)
        values (${newId("obx")}, ${row.county}, ${row.channel}, ${row.summary}, ${row.status})
      `;
    } catch {
      /* desk still shows metrics */
    }
  }
}

type LeadRow = {
  lead_slug: string;
  business_name: string;
  city: string;
  county: string;
  trade_type: string;
  contact_email: string | null;
  contact_phone: string | null;
};

async function loadLeads(sql: Sql, limit: number, offset = 0): Promise<LeadRow[]> {
  const matchers = tradeTypeMatchersForNiche(OUTREACH_ACTIVE_VERTICAL);
  const from = parseDatasetOffset(offset);
  const size = Math.max(1, Math.min(ENGINE_DATASET_BATCH_MAX + 1, Math.floor(limit) || 1));
  const to = from + size - 1;
  try {
    // Inclusive `.range(from, to)` window — never `select *` the 20,330 catalog.
    return await sql<LeadRow>`
      select lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(coalesce(trade_label, ''))) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(coalesce(contact_email, '')) <> '' or btrim(coalesce(contact_phone, '')) <> '')
      order by county asc, lead_slug asc
      offset ${from}
      limit ${size}
    `;
  } catch (err) {
    logEngineFailure("loadLeads.range", err, { from, to, size });
    throw err;
  }
}

function logEngineFailure(label: string, err: unknown, extra: Record<string, unknown> = {}) {
  const error = err instanceof Error ? err : new Error(engineErrorMessage(err));
  console.error("[outbound-engine]", {
    label,
    message: error.message,
    stack: error.stack,
    ...extra,
  });
}

async function queuedSlugSet(sql: Sql, slugs: string[]): Promise<Set<string>> {
  const list = slugs.filter(Boolean);
  if (list.length === 0) return new Set();
  try {
    const rows = await sql<{ lead_slug: string }>`
      select lead_slug from outreach_queue
      where lead_slug = any(string_to_array(${list.join(",")}, ','))
    `;
    return new Set(rows.map((row) => row.lead_slug));
  } catch (err) {
    logEngineFailure("queuedSlugSet", err);
    return new Set();
  }
}

type OfferTools = Awaited<typeof import("@/lib/stripe/commercial")>;

function assignChannel(lead: LeadRow, rooms: { sms: number; email: number }): "sms" | "email" | null {
  const channel = pickEngineChannel({
    canSms: hasListedPhone(lead.contact_phone ?? ""),
    canEmail: isEmailReady(lead.contact_email ?? ""),
    smsRemaining: rooms.sms,
    emailRemaining: rooms.email,
  });
  if (channel === "sms") rooms.sms -= 1;
  else if (channel === "email") rooms.email -= 1;
  return channel;
}

async function logAssignedLead(
  sql: Sql,
  request: Request,
  state: Awaited<ReturnType<typeof loadState>>,
  offer: OfferTools,
  lead: LeadRow,
  live: boolean,
  channel: "sms" | "email",
): Promise<void> {
  const origin = originOf(request);
  const media = offer.founderOfferMedia(origin);
  const url = offer.founderOfferPitchUrl(origin, { leadSlug: lead.lead_slug, county: lead.county });
  void outreachDestination;
  const vars = {
    business: lead.business_name,
    url,
    city: lead.city,
    county: lead.county,
    trade: lead.trade_type,
    video: media.videoUrl,
    videoThumb: media.thumbUrl,
  };
  const body = finalizeOutreachBody(
    offer.appendFounderOfferAssets(renderOutreachMessage(state.smsTemplate, vars), {
      videoUrl: media.videoUrl,
      thumbUrl: media.thumbUrl,
      previewUrl: url,
    }),
    channel,
  );
  const line = engineTickLine({ live, channel, business: lead.business_name });
  await logLine(sql, {
    county: lead.county,
    channel,
    status: line.status,
    leadSlug: lead.lead_slug,
    summary: `${line.summary} · ${body.slice(0, 80)}`,
  });
}

async function enqueueLeadRow(
  sql: Sql,
  request: Request,
  state: Awaited<ReturnType<typeof loadState>>,
  lead: LeadRow,
  live: boolean,
  rooms: { sms: number; email: number },
  offer?: OfferTools,
): Promise<"sms" | "email" | null> {
  const channel = assignChannel(lead, rooms);
  if (!channel) return null;
  const tools = offer ?? (await import("@/lib/stripe/commercial"));
  await logAssignedLead(sql, request, state, tools, lead, live, channel);
  return channel;
}

async function dispatchDatasetBatch(
  sql: Sql,
  request: Request,
  state: Awaited<ReturnType<typeof loadState>>,
  offset: number,
  batchSize: number,
): Promise<EngineBatchResult> {
  const size = parseDatasetBatchSize(batchSize);
  const start = parseDatasetOffset(offset);
  const live = parseOutreachMode(env("OUTREACH_MODE")) === "live";
  const errors: EngineBatchError[] = [];
  const note = (rowId: string, err: unknown) => {
    errors.push(engineRowError(rowId, err));
    logEngineFailure("record", err, { rowId });
  };
  const { occupancyToday, enqueueOutreachBatch, processOutreachQueue } = await import("./outreach-scheduler.server");
  const [smsOcc, emailOcc] = await Promise.all([
    withBatchTimeout(occupancyToday(sql, "sms"), ENGINE_BATCH_TIMEOUT_MS, "occupancy.sms").catch((err) => {
      logEngineFailure("occupancy.sms", err);
      return { remaining: remainingCap(state.smsSentToday, state.smsDailyCap), sent: 0, pending: 0, used: 0 };
    }),
    withBatchTimeout(occupancyToday(sql, "email"), ENGINE_BATCH_TIMEOUT_MS, "occupancy.email").catch((err) => {
      logEngineFailure("occupancy.email", err);
      return { remaining: remainingCap(state.emailSentToday, state.emailDailyCap), sent: 0, pending: 0, used: 0 };
    }),
  ]);
  const rooms = {
    sms: Math.min(smsOcc.remaining, remainingCap(state.smsSentToday, state.smsDailyCap)),
    email: Math.min(emailOcc.remaining, remainingCap(state.emailSentToday, state.emailDailyCap)),
  };
  const fetched = await withBatchTimeout(loadLeads(sql, size + 1, start), ENGINE_BATCH_TIMEOUT_MS, "loadLeads.range");
  const page = fetched.slice(0, size);
  const alreadyQueued = await queuedSlugSet(
    sql,
    page.map((lead) => lead.lead_slug),
  );
  const offer = await import("@/lib/stripe/commercial");
  type QueueRow = {
    businessName: string;
    phone: string;
    email: string;
    niche: string;
    channel: "sms" | "email";
    leadSlug: string;
  };
  const planned: Array<{ lead: LeadRow; channel: "sms" | "email" }> = [];
  let visited = 0;
  let sms = 0;
  let email = 0;
  for (const lead of page) {
    visited += 1;
    if (alreadyQueued.has(lead.lead_slug)) continue;
    if (rooms.sms <= 0 && rooms.email <= 0) {
      visited -= 1;
      break;
    }
    const channel = assignChannel(lead, rooms);
    if (!channel) continue;
    if (channel === "sms") sms += 1;
    else email += 1;
    planned.push({ lead, channel });
  }

  const queueRows: QueueRow[] = [];
  for (const group of chunkArray(planned, ENGINE_MICRO_CHUNK)) {
    const settled = await Promise.allSettled(
      group.map((item) =>
        withBatchTimeout(
          logAssignedLead(sql, request, state, offer, item.lead, live, item.channel),
          ENGINE_RECORD_TIMEOUT_MS,
          `lead ${item.lead.lead_slug}`,
        ),
      ),
    );
    settled.forEach((result, index) => {
      const item = group[index];
      if (!item) return;
      if (result.status === "rejected") {
        note(item.lead.lead_slug, result.reason);
        return;
      }
      queueRows.push({
        businessName: item.lead.business_name,
        phone: (item.lead.contact_phone ?? "").trim(),
        email: (item.lead.contact_email ?? "").trim(),
        niche: OUTREACH_ACTIVE_VERTICAL,
        channel: item.channel,
        leadSlug: item.lead.lead_slug,
      });
    });
  }

  let queued = 0;
  for (const group of chunkArray(queueRows, ENGINE_ENQUEUE_CHUNK)) {
    try {
      queued += await withBatchTimeout(
        enqueueOutreachBatch(sql, group),
        ENGINE_BATCH_TIMEOUT_MS,
        "enqueueOutreachBatch",
      );
    } catch (err) {
      logEngineFailure("enqueueOutreachBatch", err, { failingRowIds: group.map((row) => row.leadSlug) });
      for (const row of group) note(row.leadSlug, err);
    }
  }
  try {
    await withBatchTimeout(
      processOutreachQueue(sql),
      ENGINE_PROVIDER_TIMEOUT_MS + ENGINE_BATCH_TIMEOUT_MS,
      "processOutreachQueue",
    );
  } catch (err) {
    note("provider", err);
  }
  try {
    await sql`
      update outbound_engine_state
      set sms_sent_today = sms_sent_today + ${sms},
          email_sent_today = email_sent_today + ${email},
          updated_at = now()
      where id = ${"master"}
    `;
  } catch (err) {
    logEngineFailure("counters", err);
  }
  return aggregateEngineBatch({
    offset: start,
    batchSize: size,
    catalogSize: PLUMBING_LEAD_DATASET_SIZE,
    fetched: fetched.length,
    visited,
    queued,
    failed: errors.length,
    errors,
    niche: OUTREACH_ACTIVE_VERTICAL,
  });
}

/** Logs simulation or queued lines. Provider send is the outreach drain, and only when OUTREACH_MODE is live. */
async function tickEngine(sql: Sql, request: Request, state: Awaited<ReturnType<typeof loadState>>) {
  if (state.paused) return { ticked: 0, paused: true as const };
  const want = ENGINE_TICK_SIZE;
  const rooms = {
    sms: throttleCount(want, remainingCap(state.smsSentToday, state.smsDailyCap)),
    email: throttleCount(want, remainingCap(state.emailSentToday, state.emailDailyCap)),
  };
  const leads = await withBatchTimeout(loadLeads(sql, want * 2, 0), ENGINE_BATCH_TIMEOUT_MS, "tick.loadLeads").catch(
    (err) => {
      logEngineFailure("tick.loadLeads", err);
      return [] as LeadRow[];
    },
  );
  const live = parseOutreachMode(env("OUTREACH_MODE")) === "live";
  let sms = 0;
  let email = 0;
  for (const lead of leads) {
    try {
      const channel = await withBatchTimeout(
        enqueueLeadRow(sql, request, state, lead, live, rooms),
        ENGINE_RECORD_TIMEOUT_MS,
        `tick ${lead.lead_slug}`,
      );
      if (channel === "sms") sms += 1;
      else if (channel === "email") email += 1;
    } catch (err) {
      logEngineFailure("tick.record", err, { rowId: lead.lead_slug });
    }
  }
  try {
    await sql`
      update outbound_engine_state
      set sms_sent_today = sms_sent_today + ${sms},
          email_sent_today = email_sent_today + ${email},
          updated_at = now()
      where id = ${"master"}
    `;
  } catch {
    /* counters are optional on older snapshots */
  }
  return { ticked: sms + email, paused: false as const, sms, email };
}

async function recentLog(sql: Sql) {
  try {
    return await sql<{
      id: string;
      county: string;
      region: string;
      channel: string;
      status: string;
      summary: string;
      created_at: string;
    }>`
      select id, county, region, channel, status, summary, created_at::text as created_at
      from outbound_engine_log
      order by created_at desc
      limit 24
    `;
  } catch {
    return [];
  }
}

export async function readOutboundEngine(request: Request) {
  await assertEngine(request);
  const sql = await getSql();
  const state = await loadState(sql);
  const {
    OUTREACH_ACTIVE_VERTICAL,
    OUTREACH_DAILY_NICHE_SCHEDULE,
    nextScheduledNiche,
    outreachNicheHero,
    outreachNicheLabel,
    scheduleDayForNiche,
  } = await import("./outreach-niche-batch");
  const today = pacificDay();
  const started = state.scheduleStartedOn || today;
  const activeNiche = OUTREACH_ACTIVE_VERTICAL;
  const dayNumber = scheduleDayForNiche(activeNiche) || 1;
  const nextNiche = nextScheduledNiche(activeNiche);
  return {
    state: { ...state, activeNiche },
    metrics: await metrics(sql, state),
    log: await recentLog(sql),
    mode: parseOutreachMode(env("OUTREACH_MODE")),
    funnels: (await import("./funnel")).MASTER_FUNNELS,
    schedule: {
      dayNumber,
      activeNiche,
      activeLabel: outreachNicheLabel(activeNiche),
      heroVideoUrl: outreachNicheHero(activeNiche),
      nextNiche,
      nextLabel: outreachNicheLabel(nextNiche),
      slate: OUTREACH_DAILY_NICHE_SCHEDULE.map((niche, index) => ({
        day: index + 1,
        niche,
        label: outreachNicheLabel(niche),
        heroVideoUrl: outreachNicheHero(niche),
      })),
      cronEnabled: state.cronEnabled,
      scheduleStartedOn: state.scheduleStartedOn || null,
    },
    plumbingQueue: await (await import("./autopilot.server")).readPlumbingQueue(sql).catch(() => null),
  };
}

export async function runOutboundEngine(request: Request, bodyOverride?: Record<string, unknown>) {
  await assertEngine(request);
  const sql = await getSql();
  let body: Record<string, unknown> = bodyOverride ?? {};
  if (!bodyOverride) {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }
  const action = String(body.action ?? "tick");
  if (action === "pause") {
    await saveState(sql, { paused: true });
    return readOutboundEngine(request);
  }
  if (action === "resume") {
    await saveState(sql, { paused: false });
    return readOutboundEngine(request);
  }
  if (action === "configure") {
    const funnel = masterFunnel(String(body.strategyId ?? ""));
    await saveState(sql, {
      strategyId: funnel.id,
      smsDailyCap: clampDailyCap(body.smsDailyCap, DEFAULT_SMS_DAILY_CAP),
      emailDailyCap: clampDailyCap(body.emailDailyCap, DEFAULT_EMAIL_DAILY_CAP),
      smsTemplate: String(body.smsTemplate ?? funnel.text).slice(0, 600),
      emailSubject: String(body.emailSubject ?? funnel.emailSubject).slice(0, 160),
      emailBody: String(body.emailBody ?? funnel.emailBody).slice(0, 2000),
    });
    return readOutboundEngine(request);
  }
  if (action === "inject") {
    const slug = String(body.leadSlug ?? "").trim().toLowerCase();
    if (!slug) throw new AutopilotError(400, "Lead slug required");
    const state = await loadState(sql);
    await logLine(sql, {
      county: String(body.county ?? "Test"),
      channel: String(body.channel ?? "sms"),
      status: "injected",
      leadSlug: slug,
      summary: `Manual inject · ${slug} · ${state.strategyId}`,
    });
    return readOutboundEngine(request);
  }
  if (action === "set_cron") {
    await setOutreachCronEnabled(request, body.enabled === true || body.cronEnabled === true);
    return readOutboundEngine(request);
  }
  if (action === "activate_plumbing" || action === "select_niche") {
    const niche = String(body.niche ?? "plumbing").trim().toLowerCase();
    if (niche && niche !== "plumbing" && niche !== "emergency plumbing") {
      throw new AutopilotError(409, "Live outreach is locked to Emergency Plumbing until that dataset is exhausted");
    }
    const { activatePlumbingQueue } = await import("./autopilot.server");
    const plumbingQueue = await activatePlumbingQueue(request);
    const snapshot = await readOutboundEngine(request);
    return { ...snapshot, plumbingQueue };
  }
  if (action === "dispatch_today" || action === "send_outreach" || action === "send_trickle") {
    const today = pacificDay();
    await saveState(sql, {
      scheduleStartedOn: (await loadState(sql)).scheduleStartedOn || today,
      activeNiche: OUTREACH_ACTIVE_VERTICAL,
      cronEnabled: true,
      paused: false,
    });
    const offset = parseDatasetOffset(body.offset);
    const batchSize = parseDatasetBatchSize(body.batchSize ?? ENGINE_DATASET_BATCH_SIZE);
    const range = engineSupabaseRange(offset, batchSize);
    const state = await loadState(sql);
    let batch = emptyEngineBatch(range.from, OUTREACH_ACTIVE_VERTICAL);
    try {
      batch = await dispatchDatasetBatch(sql, request, state, range.from, batchSize);
    } catch (err) {
      logEngineFailure("dispatchDatasetBatch", err, { offset, batchSize, range });
      batch = aggregateEngineBatch({
        offset: range.from,
        batchSize,
        catalogSize: PLUMBING_LEAD_DATASET_SIZE,
        fetched: 0,
        visited: 0,
        queued: 0,
        failed: 1,
        errors: [{ id: "batch", rowId: "batch", message: engineErrorMessage(err) }],
        niche: OUTREACH_ACTIVE_VERTICAL,
      });
      batch.hasMore = true;
    }
    try {
      const { ensureOutreachWorker } = await import("./outreach-queue.server");
      ensureOutreachWorker();
    } catch (err) {
      logEngineFailure("ensureOutreachWorker", err);
    }
    let snapshot: Awaited<ReturnType<typeof readOutboundEngine>> | Record<string, never> = {};
    try {
      snapshot = await withBatchTimeout(
        readOutboundEngine(request),
        ENGINE_SNAPSHOT_TIMEOUT_MS,
        "readOutboundEngine",
      );
    } catch (err) {
      logEngineFailure("readOutboundEngine", err, { offset, batchSize });
    }
    return {
      ...snapshot,
      ok: batch.ok,
      processed: batch.processed,
      queued: batch.queued,
      failed: batch.failed,
      remaining: batch.remaining,
      hasMore: batch.hasMore,
      nextOffset: batch.nextOffset,
      errors: batch.errors,
      dispatch: batch,
    };
  }
  const state = await loadState(sql);
  if (!state.cronEnabled && action === "tick") {
    return { ...(await readOutboundEngine(request)), tick: { ticked: 0, paused: true as const, held: "cron_disabled" } };
  }
  const result = await tickEngine(sql, request, state);
  const snapshot = await readOutboundEngine(request);
  return { ...snapshot, tick: result };
}

export async function setOutboundPaused(request: Request, paused: boolean) {
  await assertEngine(request);
  const sql = await getSql();
  await saveState(sql, { paused });
}

export async function tickOutboundFromCron(request: Request) {
  const sql = await getSql();
  const state = await loadState(sql);
  const { processOutreachQueue, ensureDailyPlumbingOutreach } = await import("./outreach-scheduler.server");
  if (state.paused) {
    const drain = await processOutreachQueue(sql).catch(() => ({ processed: 0, sent: 0, failed: 0, rateLimited: 0 }));
    return { ticked: drain.sent, paused: true as const, held: "paused", drain };
  }
  if (!state.cronEnabled) {
    const drain = await processOutreachQueue(sql).catch(() => ({ processed: 0, sent: 0, failed: 0, rateLimited: 0 }));
    return { ticked: drain.sent, paused: true as const, held: "cron_disabled", drain };
  }
  const queued = await ensureDailyPlumbingOutreach(sql).catch(() => 0);
  const drain = await processOutreachQueue(sql).catch(() => ({ processed: 0, sent: 0, failed: 0, rateLimited: 0 }));
  return { ticked: drain.sent + queued, paused: false as const, queued, drain };
}

export { AutopilotError };
