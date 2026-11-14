import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import {
  decideDispatch,
  isRateLimited,
  nextDayHold,
  remainingDailyCap,
  OUTREACH_EMAIL_DAILY_CAP,
  OUTREACH_SMS_DAILY_CAP,
  type OutreachQueueChannel,
} from "./outreach-scheduler";
import { canDispatchNow, evaluateDispatchGate, getNextTrickleDelayMs } from "./autopilot-limits.ts";
import { parseOutreachMode } from "./outreach-queue";
import { env } from "@/lib/env.server";

type Sql = Awaited<ReturnType<typeof getSql>>;

export type QueueLead = {
  businessName: string;
  phone?: string;
  email?: string;
  niche: string;
  channel: OutreachQueueChannel;
  leadSlug?: string;
  campaignId?: string;
};

async function sentToday(sql: Sql, channel: OutreachQueueChannel): Promise<number> {
  try {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n
      from outreach_queue
      where channel = ${channel}
        and status = 'sent'
        and sent_at >= (date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles')
    `;
    return Number(rows[0]?.n ?? 0) || 0;
  } catch {
    return 0;
  }
}

async function pendingToday(sql: Sql, channel: OutreachQueueChannel): Promise<number> {
  try {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n
      from outreach_queue
      where channel = ${channel}
        and status = 'pending'
        and (btrim(coalesce(niche, '')) = '' or lower(niche) in ('plumbing', 'emergency plumbing'))
        and scheduled_for < ((date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day') at time zone 'America/Los_Angeles')
    `;
    return Number(rows[0]?.n ?? 0) || 0;
  } catch {
    return 0;
  }
}

export async function occupancyToday(sql: Sql, channel: OutreachQueueChannel) {
  const sent = await sentToday(sql, channel);
  const pending = await pendingToday(sql, channel);
  const used = sent + pending;
  return { sent, pending, used, remaining: remainingDailyCap(used, channel) };
}

/** Fill remaining Pacific-day room with jittered plumbing rows. No-op at cap. */
export async function ensureDailyPlumbingOutreach(sql?: Sql): Promise<number> {
  const { isDatasetChunkPaused } = await import("./self-correction.server");
  if (await isDatasetChunkPaused()) return 0;
  const db = sql ?? (await getSql());
  const sms = await occupancyToday(db, "sms");
  const email = await occupancyToday(db, "email");
  const want = sms.remaining + email.remaining;
  if (want <= 0) return 0;

  const { tradeTypeMatchersForNiche, OUTREACH_ACTIVE_VERTICAL } = await import("./outreach-niche-batch");
  const { hasListedPhone } = await import("./autopilot");
  const matchers = tradeTypeMatchersForNiche(OUTREACH_ACTIVE_VERTICAL);
  type Row = { lead_slug: string; business_name: string; contact_email: string | null; contact_phone: string | null };
  let rows: Row[] = [];
  try {
    rows = await db<Row>`
      select lead_slug, business_name, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(coalesce(trade_label, ''))) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(coalesce(contact_email, '')) <> '' or btrim(coalesce(contact_phone, '')) <> '')
        and lead_slug not in (
          select lead_slug from outreach_queue where btrim(lead_slug) <> ''
        )
      order by county asc, lead_slug asc
      limit ${want + 8}
    `;
  } catch {
    return 0;
  }

  const batch: QueueLead[] = [];
  let smsLeft = sms.remaining;
  let emailLeft = email.remaining;
  for (const row of rows) {
    const phone = (row.contact_phone ?? "").trim();
    const emailAddr = (row.contact_email ?? "").trim();
    const smsOk = hasListedPhone(phone) && smsLeft > 0;
    const emailOk = emailAddr.includes("@") && emailLeft > 0;
    if (smsOk) {
      batch.push({
        businessName: row.business_name,
        phone,
        email: emailAddr,
        niche: "plumbing",
        channel: "sms",
        leadSlug: row.lead_slug,
      });
      smsLeft -= 1;
    } else if (emailOk) {
      batch.push({
        businessName: row.business_name,
        phone,
        email: emailAddr,
        niche: "plumbing",
        channel: "email",
        leadSlug: row.lead_slug,
      });
      emailLeft -= 1;
    }
    if (smsLeft <= 0 && emailLeft <= 0) break;
  }
  return enqueueOutreachBatch(db, batch);
}

export async function enqueueOutreachBatch(sql: Sql, leads: QueueLead[], start = new Date()): Promise<number> {
  if (leads.length === 0) return 0;
  const times: Date[] = [];
  let cursor = start.getTime();
  for (let i = 0; i < leads.length; i += 1) {
    cursor += getNextTrickleDelayMs();
    times.push(new Date(cursor));
  }
  let n = 0;
  for (let i = 0; i < leads.length; i += 1) {
    const lead = leads[i]!;
    const when = times[i]!.toISOString();
    try {
      await sql`
        insert into outreach_queue (
          id, business_name, phone, email, niche, channel, status, scheduled_for, lead_slug, campaign_id
        ) values (
          ${newId("oq")},
          ${lead.businessName.slice(0, 160)},
          ${(lead.phone ?? "").slice(0, 40)},
          ${(lead.email ?? "").slice(0, 160)},
          ${"plumbing"},
          ${lead.channel},
          ${"pending"},
          ${when},
          ${(lead.leadSlug ?? "").slice(0, 120)},
          ${(lead.campaignId ?? "").slice(0, 80)}
        )
      `;
      n += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/does not exist/i.test(message)) return n;
      console.error("[outreach-queue] enqueue row", {
        rowId: lead.leadSlug,
        message,
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
  return n;
}

export async function processOutreachQueue(sql?: Sql): Promise<{
  processed: number;
  sent: number;
  failed: number;
  rateLimited: number;
}> {
  const db = sql ?? (await getSql());
  const tallies = { processed: 0, sent: 0, failed: 0, rateLimited: 0 };
  const { isDatasetChunkPaused } = await import("./self-correction.server");
  if (await isDatasetChunkPaused()) return tallies;
  let smsSent = await sentToday(db, "sms");
  let emailSent = await sentToday(db, "email");
  const mode = parseOutreachMode(env("OUTREACH_MODE"));

  let due: Array<{
    id: string;
    channel: string;
    business_name: string;
    phone: string;
    email: string;
  }> = [];
  try {
    due = await db`
      select id, channel, business_name, phone, email
      from outreach_queue
      where status in ('pending', 'rate_limited') and scheduled_for <= now()
        and (btrim(coalesce(niche, '')) = '' or lower(niche) in ('plumbing', 'emergency plumbing'))
      order by scheduled_for asc
      limit 20
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/does not exist/i.test(message)) return tallies;
    throw err;
  }

  const lastRow = await db<{ sent_at: unknown }>`
    select sent_at from outreach_queue
    where sent_at is not null and status = 'sent'
    order by sent_at desc
    limit 1
  `.catch(() => [] as { sent_at: unknown }[]);
  let lastSentAt: Date | string | null =
    lastRow[0]?.sent_at instanceof Date
      ? lastRow[0].sent_at
      : lastRow[0]?.sent_at != null
        ? String(lastRow[0].sent_at)
        : null;

  const now = new Date();
  for (const row of due) {
    tallies.processed += 1;
    const channel: OutreachQueueChannel = row.channel === "sms" ? "sms" : "email";
    const used = channel === "sms" ? smsSent : emailSent;
    const gateInput = {
      now,
      channel,
      smsSentToday: smsSent,
      emailSentToday: emailSent,
      lastSentAt,
    };
    if (!canDispatchNow(gateInput)) {
      const gate = evaluateDispatchGate(gateInput);
      if (gate.reason === "trickle_gap") break;
      const hold = (gate.retryAt ?? nextDayHold(now)).toISOString();
      const cap = gate.reason === "sms_cap" || gate.reason === "email_cap" || decisionRateLimited(channel, used);
      await db`
        update outreach_queue
        set status = ${cap ? "rate_limited" : "pending"},
            scheduled_for = ${hold},
            detail = ${holdReason(gate.reason, channel)}
        where id = ${row.id} and status in ('pending', 'rate_limited')
      `;
      if (cap) tallies.rateLimited += 1;
      continue;
    }
    const decision = decideDispatch(channel, used);
    if (decision.status === "rate_limited" || isRateLimited(used, channel)) {
      const hold = nextDayHold(now).toISOString();
      await db`
        update outreach_queue
        set status = 'rate_limited',
            scheduled_for = ${hold},
            detail = ${`Held: daily ${channel} cap reached`}
        where id = ${row.id} and status in ('pending', 'rate_limited')
      `;
      tallies.rateLimited += 1;
      continue;
    }

    let status: "sent" | "failed" = "sent";
    let detail = mode === "live" ? "Queued for live provider" : "Simulation — not sent to a carrier";
    if (mode === "live") {
      try {
        const { missingOutreachCredentials, deliverOutreachMessage } = await import("./notify.server");
        const missing = missingOutreachCredentials();
        if (missing.length) {
          status = "failed";
          detail = `Live outreach needs ${missing.join(", ")}`;
        } else {
          const to = channel === "sms" ? row.phone : row.email;
          const { withBatchTimeout, ENGINE_PROVIDER_TIMEOUT_MS } = await import("./outbound-engine");
          const result = await withBatchTimeout(
            deliverOutreachMessage({
              channel,
              to,
              subject: `${row.business_name} · Axiom`,
              body: `Hi — ${row.business_name} has a booking page ready.`,
            }),
            ENGINE_PROVIDER_TIMEOUT_MS,
            `provider ${channel} ${row.id}`,
          );
          if (result.status !== "sent") {
            status = "failed";
            detail = result.detail || result.status;
          }
        }
      } catch (err) {
        status = "failed";
        detail = err instanceof Error ? err.message.slice(0, 200) : "send failed";
      }
    }
    const sentAt = status === "sent" ? new Date().toISOString() : null;
    await db`
      update outreach_queue
      set status = ${status},
          sent_at = ${sentAt},
          detail = ${detail.slice(0, 400)}
      where id = ${row.id} and status in ('pending', 'rate_limited')
    `;
    if (status === "sent") {
      tallies.sent += 1;
      lastSentAt = sentAt;
      if (channel === "sms") smsSent += 1;
      else emailSent += 1;
    } else {
      tallies.failed += 1;
    }
    // One outbound per tick; remainder waits the 45–90s human gap.
    break;
  }

  return tallies;
}

function decisionRateLimited(channel: OutreachQueueChannel, used: number): boolean {
  return decideDispatch(channel, used).status === "rate_limited" || isRateLimited(used, channel);
}

function holdReason(reason: string, channel: OutreachQueueChannel): string {
  if (reason === "weekend") return "Held: weekend dispatch blocked.";
  if (reason === "outside_window") return "Held: outside 9:00 AM–4:00 PM window.";
  if (reason === "sms_cap" || reason === "email_cap") return `Held: daily ${channel} cap reached`;
  return `Held: ${reason}`;
}

export async function readOutreachCapSnapshot(sql?: Sql) {
  const db = sql ?? (await getSql());
  const sms = await occupancyToday(db, "sms");
  const email = await occupancyToday(db, "email");
  return {
    smsSentToday: sms.sent,
    emailSentToday: email.sent,
    smsPendingToday: sms.pending,
    emailPendingToday: email.pending,
    smsRemaining: sms.remaining,
    emailRemaining: email.remaining,
    smsDailyCap: OUTREACH_SMS_DAILY_CAP,
    emailDailyCap: OUTREACH_EMAIL_DAILY_CAP,
  };
}
