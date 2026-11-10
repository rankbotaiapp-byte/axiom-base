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
import { HOME_REGION_COUNTIES } from "./regional-roster";
import { OUTREACH_ACTIVE_VERTICAL, tradeTypeMatchersForNiche } from "./outreach-niche-batch";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  ENGINE_TICK_SIZE,
  clampDailyCap,
  clickThroughRate,
  defaultEngineState,
  deliveryRate,
  engineTickLine,
  regionForCounty,
  remainingCap,
  throttleCount,
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
  const counties = [...HOME_REGION_COUNTIES];
  let queued = 0;
  let sent = 0;
  let failed = 0;
  let clicks = 0;
  let onboarded = 0;
  try {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from preloaded_leads
      where claimed = false and county = any(string_to_array(${counties.join("|")}, '|'))
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

async function loadLeads(sql: Sql, limit: number): Promise<LeadRow[]> {
  const counties = [...HOME_REGION_COUNTIES];
  const matchers = tradeTypeMatchersForNiche(OUTREACH_ACTIVE_VERTICAL);
  try {
    return await sql<LeadRow>`
      select lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(coalesce(trade_label, ''))) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(coalesce(contact_email, '')) <> '' or btrim(coalesce(contact_phone, '')) <> '')
      order by county asc, lead_slug asc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

/** Logs simulation or queued lines. Provider send is the outreach drain, and only when OUTREACH_MODE is live. */
async function tickEngine(sql: Sql, request: Request, state: Awaited<ReturnType<typeof loadState>>) {
  if (state.paused) return { ticked: 0, paused: true as const };
  const smsRoom = remainingCap(state.smsSentToday, state.smsDailyCap);
  const emailRoom = remainingCap(state.emailSentToday, state.emailDailyCap);
  const want = ENGINE_TICK_SIZE;
  const leads = await loadLeads(sql, want * 2);
  const origin = originOf(request);
  const live = parseOutreachMode(env("OUTREACH_MODE")) === "live";
  let sms = 0;
  let email = 0;
  for (const lead of leads) {
    const { founderOfferMedia, founderOfferPitchUrl, appendFounderOfferAssets } = await import(
      "@/lib/stripe/commercial"
    );
    const media = founderOfferMedia(origin);
    const url = founderOfferPitchUrl(origin, { leadSlug: lead.lead_slug, county: lead.county });
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
    const smsBody = finalizeOutreachBody(
      appendFounderOfferAssets(renderOutreachMessage(state.smsTemplate, vars), {
        videoUrl: media.videoUrl,
        thumbUrl: media.thumbUrl,
        previewUrl: url,
      }),
      "sms",
    );
    const emailBody = finalizeOutreachBody(
      appendFounderOfferAssets(renderOutreachMessage(state.emailBody, vars), {
        videoUrl: media.videoUrl,
        thumbUrl: media.thumbUrl,
        previewUrl: url,
      }),
      "email",
    );
    const canSms = hasListedPhone(lead.contact_phone ?? "") && sms < throttleCount(want, smsRoom);
    const canEmail = isEmailReady(lead.contact_email ?? "") && email < throttleCount(want, emailRoom);
    if (!canSms && !canEmail) continue;
    const channel = canSms && sms <= email ? "sms" : canEmail ? "email" : "sms";
    if (channel === "sms") sms += 1;
    else email += 1;
    const line = engineTickLine({ live, channel, business: lead.business_name });
    await logLine(sql, {
      county: lead.county,
      channel,
      status: line.status,
      leadSlug: lead.lead_slug,
      summary: `${line.summary} · ${smsBody.slice(0, 80)}`,
    });
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
  };
}

export async function runOutboundEngine(request: Request) {
  await assertEngine(request);
  const sql = await getSql();
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
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
  if (action === "dispatch_today" || action === "send_outreach") {
    const { dispatchAutopilot } = await import("./autopilot.server");
    const today = pacificDay();
    await saveState(sql, {
      scheduleStartedOn: (await loadState(sql)).scheduleStartedOn || today,
      activeNiche: OUTREACH_ACTIVE_VERTICAL,
      cronEnabled: true,
      paused: false,
    });
    const dispatched = await dispatchAutopilot(request);
    const snapshot = await readOutboundEngine(request);
    return { ...snapshot, dispatch: dispatched };
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
