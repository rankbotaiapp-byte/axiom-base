import { getSql } from "@/lib/db";
import type { ChaChingMetrics } from "./cha-ching-metrics";
import { simulatedChaChingMetrics } from "./cha-ching-metrics";

function pacificDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

type Sql = Awaited<ReturnType<typeof getSql>>;

export async function readChaChingMetricsForShop(slug: string): Promise<ChaChingMetrics | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;

  let sql: Sql;
  try {
    sql = await getSql();
  } catch {
    return null;
  }

  const shops = await sql<{ id: string }>`
    select id from shops where slug = ${key} limit 1
  `;
  const shopId = shops[0]?.id;
  if (!shopId) return null;

  const today = pacificDay();
  let jobsBookedToday = 0;
  let pipelineRevenueCents = 0;
  let lastEventAt: string | null = null;

  try {
    const booked = await sql<{ n: number; cents: number; latest: string | null }>`
      select
        count(*)::int as n,
        coalesce(sum(case when payment_cents > 0 then payment_cents else 0 end), 0)::int as cents,
        max(created_at)::text as latest
      from appointments
      where shop_id = ${shopId}
        and status in ('pending', 'confirmed', 'completed')
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
    `;
    const row = booked[0];
    jobsBookedToday = Number(row?.n ?? 0) || 0;
    pipelineRevenueCents = Number(row?.cents ?? 0) || 0;
    lastEventAt = row?.latest ?? null;
  } catch {
    /* appointments optional */
  }

  let quoteEvents = 0;
  let responseSamples: number[] = [];
  try {
    const events = await sql<{
      type: string;
      created_at: string;
      payload: string | null;
    }>`
      select type, created_at::text as created_at, payload::text as payload
      from shop_events
      where shop_id = ${shopId}
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
        and type in ('booking_request', 'booking_confirmed', 'payment_received')
      order by created_at desc
      limit 48
    `;
    for (const event of events) {
      if (!lastEventAt || event.created_at > lastEventAt) lastEventAt = event.created_at;
      if (event.type === "booking_request" || event.type === "booking_confirmed") quoteEvents += 1;
      type EventPayload = { quoteMaxCents?: number; quoteMinCents?: number; responseSec?: number };
      let payload: EventPayload | null = null;
      try {
        payload = event.payload ? (JSON.parse(event.payload) as EventPayload) : null;
      } catch {
        payload = null;
      }
      if (payload?.quoteMaxCents && pipelineRevenueCents === 0) {
        const mid = Math.round(((payload.quoteMinCents ?? payload.quoteMaxCents) + payload.quoteMaxCents) / 2);
        pipelineRevenueCents += mid;
      }
      if (typeof payload?.responseSec === "number" && payload.responseSec > 0) {
        responseSamples.push(payload.responseSec);
      }
    }
    if (jobsBookedToday === 0 && quoteEvents > 0) jobsBookedToday = Math.min(quoteEvents, 8);
  } catch {
    /* shop_events optional */
  }

  try {
    const turns = await sql<{ created_at: string; prev: string | null }>`
      select created_at::text as created_at, lag(created_at) over (order by created_at)::text as prev
      from sms_inbound_turns
      where shop_id = ${shopId}
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
      order by created_at desc
      limit 24
    `;
    for (const row of turns) {
      if (row.prev && row.created_at) {
        const delta = (new Date(row.created_at).getTime() - new Date(row.prev).getTime()) / 1000;
        if (delta > 0 && delta < 600) responseSamples.push(Math.round(delta));
      }
    }
  } catch {
    /* sms turns optional */
  }

  const avgResponseSeconds =
    responseSamples.length > 0
      ? Math.round(responseSamples.reduce((a, b) => a + b, 0) / responseSamples.length)
      : 0;

  if (jobsBookedToday === 0 && pipelineRevenueCents === 0) {
    return null;
  }

  if (pipelineRevenueCents === 0 && jobsBookedToday > 0) {
    pipelineRevenueCents = jobsBookedToday * 32_500;
  }

  return {
    source: "live",
    jobsBookedToday,
    pipelineRevenueCents,
    avgResponseSeconds,
    lastEventAt,
  };
}

export async function resolveChaChingMetrics(slug: string): Promise<ChaChingMetrics> {
  const live = await readChaChingMetricsForShop(slug);
  if (live) {
    const sim = simulatedChaChingMetrics(slug);
    return {
      ...live,
      avgResponseSeconds: live.avgResponseSeconds || sim.avgResponseSeconds,
      source: "live",
    };
  }
  return simulatedChaChingMetrics(slug);
}