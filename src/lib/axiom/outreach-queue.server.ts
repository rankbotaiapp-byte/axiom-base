import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { isDueNurtureStep, nurtureReleasePlan, splitOutreachEmail } from "./funnel-guard";
import { finalizeOutreachBody } from "./legal-notices";
import { isLeadSlug } from "./funnel";
import { appendPreviewLink, shouldSendUnactivatedFollowUp, tenantPreviewUrl } from "./preview-link";
import { toE164 } from "./notify-target";
import {
  DEFAULT_EMAIL_DAILY_CAP,
  DEFAULT_SMS_DAILY_CAP,
  DEFAULT_TRICKLE_SLOT_MINUTES,
  formatSlotLabel,
  insideSendWindow,
  nextSendInstant,
  nextTrickleSlotInstant,
  outreachMayCallProviders,
  parseChunkSize,
  parseDailyCap,
  parseOutreachMode,
  parseSendTiming,
  parseTimingProfile,
  parseTrickleSeconds,
  parseTrickleSlots,
  timingProfileFor,
  trickleMayRelease,
  type OutreachMode,
  type SendTiming,
  type TimingProfile,
} from "./outreach-queue";

export type QueueMessage = {
  leadSlug: string;
  to: string;
  subject: string;
  body: string;
};

type Sql = Awaited<ReturnType<typeof getSql>>;

type DueDispatch = {
  id: string;
  campaign_id: string;
  channel: string;
  mode: string;
  chunk_index: number;
  chunk_count: number;
  lead_count: number;
  payload: string;
  interval_seconds: number;
  county: string;
  timing: string;
  profile: string;
};

export type OutreachDeskConfig = {
  mode: OutreachMode;
  intervalSeconds: number;
  chunkSize: number;
  /** Minutes from midnight Pacific for custom trickle releases. */
  slots: number[];
  slotLabels: string[];
  smsDailyCap: number;
  emailDailyCap: number;
};

export function readOutreachConfig(): OutreachDeskConfig {
  const slots = parseTrickleSlots(env("OUTREACH_TRICKLE_SLOTS"));
  return {
    mode: parseOutreachMode(env("OUTREACH_MODE")),
    intervalSeconds: parseTrickleSeconds(env("OUTREACH_TRICKLE_SECONDS")),
    chunkSize: parseChunkSize(env("OUTREACH_CHUNK_SIZE")),
    slots: slots.length > 0 ? slots : [...DEFAULT_TRICKLE_SLOT_MINUTES],
    slotLabels: (slots.length > 0 ? slots : [...DEFAULT_TRICKLE_SLOT_MINUTES]).map(formatSlotLabel),
    smsDailyCap: parseDailyCap(env("OUTREACH_SMS_DAILY_CAP"), DEFAULT_SMS_DAILY_CAP),
    emailDailyCap: parseDailyCap(env("OUTREACH_EMAIL_DAILY_CAP"), DEFAULT_EMAIL_DAILY_CAP),
  };
}

async function channelSentToday(sql: Sql, channel: "sms" | "email"): Promise<number> {
  try {
    const rows = await sql<{ n: number }>`
      select coalesce(sum(lead_count), 0)::int as n
      from outreach_dispatches
      where channel = ${channel}
        and status in ('sent', 'logged')
        and sent_at >= (date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles')
    `;
    return Number(rows[0]?.n ?? 0) || 0;
  } catch {
    return 0;
  }
}

function slugList(slugs: string[]): string {
  return [...new Set(slugs.filter((slug) => isLeadSlug(slug)))].join(",");
}

function missingRelation(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}

/** One in-process tick. The desk poll also drains, so a quiet tab still releases the next due chunk. */
export function ensureOutreachWorker(): void {
  const host = globalThis as typeof globalThis & { __axiomOutreachWorker?: boolean };
  if (host.__axiomOutreachWorker) return;
  host.__axiomOutreachWorker = true;
  const timer = setInterval(() => {
    void tickOutreachQueue();
  }, 15_000);
  if (typeof timer === "object" && timer && "unref" in timer) timer.unref();
}

async function tickOutreachQueue(): Promise<void> {
  try {
    const sql = await getSql();
    await drainOutreachQueue(sql);
    await drainNurtureTouches(sql);
    const { processOutreachQueue, ensureDailyPlumbingOutreach } = await import("./outreach-scheduler.server");
    try {
      const armed = await sql<{ cron_enabled: boolean; paused: boolean }>`
        select coalesce(cron_enabled, false) as cron_enabled, coalesce(paused, true) as paused
        from outbound_engine_state where id = ${"master"} limit 1
      `;
      if (armed[0]?.cron_enabled && !armed[0]?.paused) {
        await ensureDailyPlumbingOutreach(sql).catch(() => 0);
      }
    } catch {
      /* engine state may be missing in local snapshots */
    }
    await processOutreachQueue(sql).catch(() => undefined);
  } catch (err) {
    if (missingRelation(err, "outreach_dispatches") || missingRelation(err, "outreach_touches") || missingRelation(err, "attempts")) return;
    console.error("outreach queue", err instanceof Error ? err.message : err);
  }
}

function dispatchWindow(row: { timing: string; profile: string }): { timing: SendTiming; profile: TimingProfile } {
  const timing = parseSendTiming(row.timing);
  return { timing, profile: timing === "smart" ? parseTimingProfile(row.profile) : "general" };
}

/**
 * Release at most one due chunk. Overdue chunks stay queued until a full
 * interval has passed since the previous release, so a restart cannot dump the backlog.
 * Nights, Fridays, and weekends push the chunk to the next open window.
 */
export async function drainOutreachQueue(sql: Sql, origin = ""): Promise<{ released: boolean }> {
  await sql`
    update outreach_dispatches
    set status = 'queued'
    where status = 'releasing'
      and scheduled_at <= now() - interval '2 minutes'
  `;
  const due = await sql<DueDispatch>`
    select id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
      payload, interval_seconds, county, timing, profile
    from outreach_dispatches
    where status = 'queued' and scheduled_at <= now()
    order by scheduled_at asc, chunk_index asc
    limit 12
  `;
  const now = new Date();
  let row: DueDispatch | undefined;
  for (const candidate of due) {
    const window = dispatchWindow(candidate);
    if (insideSendWindow(now, window.timing, window.profile)) {
      row = candidate;
      break;
    }
    const next = nextSendInstant(now, window.timing, window.profile).toISOString();
    await sql`
      update outreach_dispatches
      set scheduled_at = ${next}
      where id = ${candidate.id} and status = 'queued'
    `;
  }
  if (!row) return { released: false };
  const intervalSeconds = parseTrickleSeconds(String(row.interval_seconds));
  const recent = await sql<{ sent_at: unknown }>`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null
        and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `;
  const lastSent = recent[0]?.sent_at;
  const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
  if (!trickleMayRelease(lastSentAt, new Date(), intervalSeconds)) return { released: false };

  const channel = row.channel === "sms" ? "sms" : "email";
  const config = readOutreachConfig();
  const dailyCap = channel === "sms" ? config.smsDailyCap : config.emailDailyCap;
  const sentToday = await channelSentToday(sql, channel);
  if (sentToday >= dailyCap) {
    // Hold until the next day's first trickle slot so we never blow the daily ceiling.
    const next = nextTrickleSlotInstant(new Date(Date.now() + 18 * 3600_000), config.slots).toISOString();
    await sql`
      update outreach_dispatches
      set scheduled_at = ${next},
          detail = ${`Held for daily ${channel} cap (${sentToday}/${dailyCap}).`}
      where id = ${row.id} and status = 'queued'
    `;
    return { released: false };
  }

  const claimed = await sql<{ id: string }>`
    update outreach_dispatches
    set status = 'releasing'
    where id = ${row.id} and status = 'queued'
    returning id
  `;
  if (!claimed[0]) return { released: false };

  const mode = parseOutreachMode(row.mode);
  let messages: QueueMessage[] = [];
  try {
    const parsed = JSON.parse(row.payload) as QueueMessage[];
    messages = Array.isArray(parsed) ? parsed : [];
  } catch {
    messages = [];
  }
  messages = await stampPreviewLinks(sql, row.county, origin, messages);
  const slugs = slugList(messages.map((message) => message.leadSlug));
  const clicked = new Set<string>();
  if (slugs) {
    const hits = await sql<{ lead_slug: string }>`
      select distinct lead_slug from funnel_visits
      where lead_slug <> ''
        and verified = true
        and lead_slug = any(string_to_array(${slugs}, ','))
    `;
    for (const hit of hits) clicked.add(hit.lead_slug);
  }

  let status: "logged" | "sent" | "failed" | "skipped" = "skipped";
  let detail = "Nothing to release";
  const delivered: string[] = [];
  const stopped: string[] = [];

  if (messages.length === 0) {
    status = "failed";
    detail = "Chunk payload was empty";
  } else if (!outreachMayCallProviders(mode)) {
    for (const message of messages) {
      if (clicked.has(message.leadSlug)) stopped.push(message.leadSlug);
      else delivered.push(message.leadSlug);
    }
    status = delivered.length === 0 ? "skipped" : "logged";
    detail =
      stopped.length > 0
        ? `Simulation log for ${delivered.length} leads. ${stopped.length} stopped after opening the booking link. No provider call.`
        : `Simulation log for ${delivered.length} leads. No provider call.`;
  } else {
    const { missingOutreachCredentials, deliverOutreachMessage } = await import("./notify.server");
    const missing = missingOutreachCredentials();
    if (missing.length > 0) {
      status = "failed";
      detail = `Live outreach needs ${missing.join(", ")}`;
    } else {
      const notes: string[] = [];
      let failed = 0;
      const pending: QueueMessage[] = [];
      for (const message of messages) {
        if (clicked.has(message.leadSlug)) {
          stopped.push(message.leadSlug);
          continue;
        }
        if (channel === "sms" && !message.to.startsWith("+")) {
          failed += 1;
          notes.push(`${message.leadSlug}: phone is not dialable`);
          continue;
        }
        pending.push(message);
      }
      const CONCURRENCY = 6;
      for (let i = 0; i < pending.length; i += CONCURRENCY) {
        const batch = pending.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map((message) =>
            deliverOutreachMessage({
              channel,
              to: message.to,
              subject: message.subject,
              body: message.body,
            }).then((result) => ({ message, result })),
          ),
        );
        for (const { message, result } of results) {
          if (result.status === "sent") delivered.push(message.leadSlug);
          else {
            failed += 1;
            notes.push(`${message.leadSlug}: ${result.detail || result.status}`);
          }
        }
      }
      if (delivered.length === 0 && failed === 0) status = "skipped";
      else if (failed > 0) status = "failed";
      else status = "sent";
      const summary = `${delivered.length} sent, ${stopped.length} stopped, ${failed} failed`;
      detail = notes.length > 0 ? `${summary}. ${notes.slice(0, 3).join("; ")}` : summary;
    }
  }

  await sql`
    update outreach_dispatches
    set status = ${status}, sent_at = now(), detail = ${detail.slice(0, 400)}
    where id = ${row.id}
  `;
  if (delivered.length > 0) await markDayZero(sql, row.campaign_id, delivered, "sent");
  if (stopped.length > 0) {
    await markDayZero(sql, row.campaign_id, stopped, "skipped");
    const { haltLeadDrip } = await import("./funnel-guard.server");
    for (const slug of stopped) await haltLeadDrip(sql, slug, "clicked");
  }
  return { released: true };
}

type DueTouch = {
  id: string;
  step: number;
  body: string;
  attempts: number;
  sequence_id: string;
  lead_slug: string;
  lead_id: string | null;
  channel: string;
  county: string;
  trade_type: string;
  timing: string;
  business_name: string | null;
  city: string | null;
  claimed: boolean | null;
  contact_email: string | null;
  contact_phone: string | null;
};

/**
 * Send due day 3 and day 7 touches. Simulation writes the live wire.
 * Live mode calls Resend or Twilio, and only then marks the touch sent.
 */
export async function drainNurtureTouches(sql: Sql, origin = ""): Promise<{ released: number }> {
  const config = readOutreachConfig();
  const credentialsReady = config.mode === "live" ? (await import("./notify.server")).missingOutreachCredentials().length === 0 : false;
  const plan = nurtureReleasePlan(config.mode, credentialsReady);
  if (plan === "hold") return { released: 0 };

  const due = await sql<DueTouch>`
    select t.id, t.step, t.body, t.attempts, s.id as sequence_id, s.lead_slug, s.channel, s.county,
      s.trade_type, s.timing, l.id as lead_id, l.business_name, l.city, l.claimed, l.contact_email, l.contact_phone
    from outreach_touches t
    join outreach_sequences s on s.id = t.sequence_id
    left join preloaded_leads l on l.lead_slug = s.lead_slug
    where t.status = 'scheduled'
      and t.step in (3, 7)
      and t.scheduled_at <= now()
      and s.status = 'active'
    order by t.scheduled_at asc, t.step asc
    limit 24
  `;
  const now = new Date();
  const batch: DueTouch[] = [];
  for (const row of due) {
    if (!isDueNurtureStep(numStep(row.step))) continue;
    const timing = parseSendTiming(row.timing);
    const profile = timing === "smart" ? timingProfileFor(row.trade_type) : "general";
    if (!insideSendWindow(now, timing, profile)) {
      const next = nextSendInstant(now, timing, profile).toISOString();
      await sql`
        update outreach_touches
        set scheduled_at = ${next}
        where id = ${row.id} and status = 'scheduled'
      `;
      continue;
    }
    batch.push(row);
    if (batch.length >= config.chunkSize) break;
  }
  if (batch.length === 0) return { released: 0 };

  const recent = await sql<{ sent_at: unknown }>`
    select sent_at from (
      select sent_at from outreach_dispatches
      where sent_at is not null and status in ('logged', 'sent', 'failed', 'skipped')
      union all
      select created_at as sent_at from outreach_events
      where status in ('logged', 'sent', 'failed')
    ) releases
    order by sent_at desc
    limit 1
  `;
  const lastSent = recent[0]?.sent_at;
  const lastSentAt = lastSent == null ? null : lastSent instanceof Date ? lastSent.toISOString() : String(lastSent);
  if (!trickleMayRelease(lastSentAt, new Date(), config.intervalSeconds)) return { released: 0 };

  let sent = 0;
  let failed = 0;
  const channel = batch[0]?.channel === "sms" ? "sms" : "email";
  const county = batch[0]?.county ?? "";
  const batchSlugs = slugList(batch.map((touch) => touch.lead_slug));
  const opened = new Set<string>();
  if (batchSlugs) {
    const hits = await sql<{ lead_slug: string }>`
      select distinct lead_slug from funnel_visits
      where verified = true and lead_slug = any(string_to_array(${batchSlugs}, ','))
    `.catch(() => [] as { lead_slug: string }[]);
    for (const hit of hits) opened.add(hit.lead_slug);
  }
  for (const touch of batch) {
    const booked = await leadHasBooking(sql, touch.lead_slug);
    const clicked = opened.has(touch.lead_slug);
    if (
      !shouldSendUnactivatedFollowUp({
        step: numStep(touch.step),
        claimed: Boolean(touch.claimed),
        clicked,
        booked,
        replied: false,
      })
    ) {
      const { haltLeadDrip } = await import("./funnel-guard.server");
      const reason = clicked ? "clicked" : touch.claimed ? "claimed" : "booked";
      await haltLeadDrip(sql, touch.lead_slug, reason);
      await sql`update outreach_touches set status = 'skipped' where id = ${touch.id} and status = 'scheduled'`;
      continue;
    }
    const claimed = await sql<{ id: string }>`
      update outreach_touches
      set attempts = attempts + 1
      where id = ${touch.id} and status = 'scheduled' and attempts < 3
      returning id
    `;
    if (!claimed[0]) continue;
    const touchChannel = touch.channel === "sms" ? "sms" : "email";
    const preview = origin
      ? tenantPreviewUrl(origin, {
          businessName: touch.business_name ?? "",
          tradeType: touch.trade_type,
          county: touch.county,
          leadSlug: touch.lead_slug,
          leadId: touch.lead_id ?? "",
          city: touch.city ?? "",
        })
      : null;
    const body = preview ? appendPreviewLink(touch.body, preview) : touch.body;
    const outcome = await releaseNurtureTouch({ ...touch, body }, touchChannel, plan);
    if (outcome === "sent") {
      sent += 1;
      await sql`update outreach_touches set status = 'sent' where id = ${touch.id}`;
      await sql`
        update outreach_sequences s
        set status = 'complete', stopped_reason = ''
        where s.id = ${touch.sequence_id}
          and s.status = 'active'
          and not exists (
            select 1 from outreach_touches t
            where t.sequence_id = s.id and t.status = 'scheduled'
          )
      `;
    } else {
      failed += 1;
      const attempts = numStep(touch.attempts) + 1;
      if (attempts >= 3) {
        await sql`update outreach_touches set status = 'skipped' where id = ${touch.id} and status = 'scheduled'`;
      } else {
        const next = new Date(Date.now() + config.intervalSeconds * 1000).toISOString();
        await sql`
          update outreach_touches
          set scheduled_at = ${next}
          where id = ${touch.id} and status = 'scheduled'
        `;
      }
    }
  }
  if (sent + failed === 0) return { released: 0 };
  const status = plan === "log" ? "logged" : failed > 0 ? "failed" : "sent";
  const summary =
    plan === "log"
      ? `Day 3/7 simulation log for ${sent} leads. No provider call.`
      : `${sent} sent, ${failed} failed`;
  await sql`
    insert into outreach_events (id, county, channel, summary, status)
    values (${newId("evt")}, ${county}, ${channel}, ${summary}, ${status})
  `;
  return { released: sent };
}

async function releaseNurtureTouch(
  touch: DueTouch,
  channel: "email" | "sms",
  plan: "log" | "send",
): Promise<"sent" | "failed"> {
  if (plan === "log") return "sent";
  const { deliverOutreachMessage } = await import("./notify.server");
  if (channel === "sms") {
    const to = toE164(touch.contact_phone ?? "");
    if (!to) return "failed";
    const result = await deliverOutreachMessage({
      channel,
      to,
      subject: "",
      body: finalizeOutreachBody(touch.body, "sms"),
    });
    return result.status === "sent" ? "sent" : "failed";
  }
  const to = (touch.contact_email ?? "").trim();
  if (!to) return "failed";
  const message = splitOutreachEmail(finalizeOutreachBody(touch.body, "email"));
  const result = await deliverOutreachMessage({ channel, to, subject: message.subject, body: message.text });
  return result.status === "sent" ? "sent" : "failed";
}

async function stampPreviewLinks(sql: Sql, county: string, origin: string, messages: QueueMessage[]): Promise<QueueMessage[]> {
  if (!origin) return messages;
  const pending = messages.filter((message) => !message.body.includes("preview=true"));
  if (pending.length === 0) return messages;
  const slugs = slugList(pending.map((message) => message.leadSlug));
  if (!slugs) return messages;
  let rows: { id: string; business_name: string; trade_type: string; lead_slug: string; county: string; city: string }[] = [];
  try {
    rows = await sql<{ id: string; business_name: string; trade_type: string; lead_slug: string; county: string; city: string }>`
      select id, business_name, trade_type, lead_slug, county, city
      from preloaded_leads
      where lead_slug = any(string_to_array(${slugs}, ','))
    `;
  } catch (err) {
    if (missingRelation(err, "preloaded_leads")) return messages;
    throw err;
  }
  const bySlug = new Map(rows.map((row) => [row.lead_slug, row]));
  return messages.map((message) => {
    const row = bySlug.get(message.leadSlug);
    if (!row) return message;
    const url = tenantPreviewUrl(origin, {
      businessName: row.business_name,
      tradeType: row.trade_type,
      county: row.county || county,
      leadSlug: row.lead_slug,
      leadId: row.id,
      city: row.city,
    });
    if (!url) return message;
    return { ...message, body: appendPreviewLink(message.body, url) };
  });
}

async function leadHasBooking(sql: Sql, leadSlug: string): Promise<boolean> {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n
    from appointments a
    join shops s on s.id = a.shop_id
    join preloaded_leads l on l.shop_id = s.id
    where l.lead_slug = ${leadSlug}
      and a.status <> 'cancelled'
  `.catch(() => [{ n: 0 }]);
  return Number(rows[0]?.n ?? 0) > 0;
}

function numStep(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function markDayZero(sql: Sql, campaignId: string, slugs: string[], status: "sent" | "skipped"): Promise<void> {
  const list = slugList(slugs);
  if (!list) return;
  await sql`
    update outreach_touches
    set status = ${status}
    where step = 0
      and status = 'scheduled'
      and sequence_id in (
        select id from outreach_sequences
        where campaign_id = ${campaignId}
          and lead_slug = any(string_to_array(${list}, ','))
      )
  `;
}
