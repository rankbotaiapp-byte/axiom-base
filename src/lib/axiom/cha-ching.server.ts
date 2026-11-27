import { getSql } from "@/lib/db";
import type { ChaChingMetrics } from "./cha-ching-metrics";
import { emptyChaChingMetrics } from "./cha-ching-metrics";
import { axiomSubscriptionCostCents, netRoiCents, type BillingForRoi } from "./closed-job.ts";

function pacificDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

type Sql = Awaited<ReturnType<typeof getSql>>;

async function loadBilling(sql: Sql, shopId: string): Promise<BillingForRoi> {
  try {
    const rows = await sql<{
      plan: string | null;
      status: string | null;
      price_cents: number | null;
      awaiting_first_real_lead: boolean | null;
    }>`
      select plan, status, price_cents, awaiting_first_real_lead
      from shop_billing where shop_id = ${shopId} limit 1
    `;
    const row = rows[0];
    return {
      plan: row?.plan,
      status: row?.status,
      priceCents: row?.price_cents ?? 0,
      awaitingFirstRealLead: Boolean(row?.awaiting_first_real_lead),
    };
  } catch {
    try {
      const rows = await sql<{ plan: string | null; status: string | null; price_cents: number | null }>`
        select plan, status, price_cents from shop_billing where shop_id = ${shopId} limit 1
      `;
      return {
        plan: rows[0]?.plan,
        status: rows[0]?.status,
        priceCents: rows[0]?.price_cents ?? 0,
        awaitingFirstRealLead: false,
      };
    } catch {
      return {};
    }
  }
}

export async function readChaChingMetricsForShop(slug: string): Promise<ChaChingMetrics> {
  const key = slug.trim().toLowerCase();
  if (!key) return emptyChaChingMetrics();

  let sql: Sql;
  try {
    sql = await getSql();
  } catch {
    return emptyChaChingMetrics();
  }

  const shops = await sql<{ id: string }>`
    select id from shops where slug = ${key} limit 1
  `;
  const shopId = shops[0]?.id;
  if (!shopId) return emptyChaChingMetrics();

  const billing = await loadBilling(sql, shopId);
  const today = pacificDay();
  let jobsBookedToday = 0;
  let pipelineRevenueCents = 0;
  let paidRevenueCents = 0;
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
        and coalesce(is_simulated, false) = false
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
    `;
    jobsBookedToday = Number(booked[0]?.n ?? 0) || 0;
    pipelineRevenueCents = Number(booked[0]?.cents ?? 0) || 0;
    lastEventAt = booked[0]?.latest ?? null;
  } catch {
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
      jobsBookedToday = Number(booked[0]?.n ?? 0) || 0;
      pipelineRevenueCents = Number(booked[0]?.cents ?? 0) || 0;
      lastEventAt = booked[0]?.latest ?? null;
    } catch {
      /* appointments optional */
    }
  }

  try {
    const paid = await sql<{ cents: number }>`
      select coalesce(sum(payment_cents), 0)::int as cents
      from appointments
      where shop_id = ${shopId}
        and payment_status = 'paid'
        and coalesce(is_simulated, false) = false
        and date_trunc('month', created_at at time zone 'America/Los_Angeles')
          = date_trunc('month', (${today}::date)::timestamp)
    `;
    paidRevenueCents = Number(paid[0]?.cents ?? 0) || 0;
  } catch {
    try {
      const paid = await sql<{ cents: number }>`
        select coalesce(sum(payment_cents), 0)::int as cents
        from appointments
        where shop_id = ${shopId}
          and payment_status = 'paid'
          and date_trunc('month', created_at at time zone 'America/Los_Angeles')
            = date_trunc('month', (${today}::date)::timestamp)
      `;
      paidRevenueCents = Number(paid[0]?.cents ?? 0) || 0;
    } catch {
      paidRevenueCents = pipelineRevenueCents;
    }
  }

  let avgResponseSeconds = 0;
  try {
    const turns = await sql<{ created_at: string; prev: string | null }>`
      select created_at::text as created_at, lag(created_at) over (order by created_at)::text as prev
      from sms_inbound_turns
      where shop_id = ${shopId}
        and (created_at at time zone 'America/Los_Angeles')::date = ${today}::date
      order by created_at desc
      limit 24
    `;
    const samples: number[] = [];
    for (const row of turns) {
      if (row.prev && row.created_at) {
        const delta = (new Date(row.created_at).getTime() - new Date(row.prev).getTime()) / 1000;
        if (delta > 0 && delta < 600) samples.push(Math.round(delta));
      }
    }
    if (samples.length > 0) {
      avgResponseSeconds = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    }
  } catch {
    /* optional */
  }

  const verified = Math.max(paidRevenueCents, pipelineRevenueCents);
  const emptyBook = jobsBookedToday <= 0 && verified <= 0;
  return {
    source: "live",
    jobsBookedToday,
    pipelineRevenueCents,
    paidRevenueCents,
    subscriptionCostCents: axiomSubscriptionCostCents(billing),
    netRoiCents: netRoiCents(verified, billing),
    emptyBook,
    emptyMessage: emptyBook ? emptyChaChingMetrics(billing).emptyMessage : "",
    avgResponseSeconds,
    lastEventAt,
  };
}

export async function resolveChaChingMetrics(slug: string): Promise<ChaChingMetrics> {
  return readChaChingMetricsForShop(slug);
}
