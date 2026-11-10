import os from "node:os";
import { getSql } from "@/lib/db";
import { assertAutopilotDesk, dispatchAutopilot, readAutopilot } from "./autopilot.server";
import {
  channelFromLog,
  emptyChannelStats,
  logLevelFromStatus,
  parseSubscriptionStatus,
  type AutopilotAction,
  type AutopilotLog,
  type AutopilotStatus,
  type ChannelStats,
  type MasterTelemetry,
  type MasterTenant,
  type ServerStatus,
} from "./master-dashboard";

type Sql = Awaited<ReturnType<typeof getSql>>;

const latencySamples: number[] = [];
let lastCpu = process.cpuUsage();
let lastCpuAt = Date.now();

function missingRelation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /does not exist|undefined_column|undefined_table/i.test(message);
}

async function countOf(query: Promise<{ n: number }[]>): Promise<number> {
  try {
    const rows = await query;
    const n = Number(rows[0]?.n ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch (err) {
    if (missingRelation(err)) return 0;
    throw err;
  }
}

function cpuPercent(): number {
  const now = Date.now();
  const elapsedMs = Math.max(1, now - lastCpuAt);
  const usage = process.cpuUsage(lastCpu);
  lastCpu = process.cpuUsage();
  lastCpuAt = now;
  const cores = Math.max(1, os.cpus().length);
  const pct = ((usage.user + usage.system) / 1000 / elapsedMs / cores) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}

function memoryPercent(): number {
  const total = os.totalmem();
  if (!total) return 0;
  return Math.round(((total - os.freemem()) / total) * 1000) / 10;
}

function p95Latency(): number {
  if (latencySamples.length === 0) return 0;
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index] ?? 0;
}

function recordLatency(ms: number) {
  latencySamples.push(ms);
  if (latencySamples.length > 40) latencySamples.shift();
}

function serverStatus(cpu: number, mem: number, p95: number, dbOk: boolean): ServerStatus {
  if (!dbOk) return "down";
  if (cpu > 90 || mem > 90 || p95 > 800) return "degraded";
  return "optimal";
}

export async function readMasterTelemetry(request: Request): Promise<MasterTelemetry> {
  const started = Date.now();
  await assertAutopilotDesk(request);
  const cpu = cpuPercent();
  const mem = memoryPercent();
  let dbOk = true;
  let activeTenants = 0;
  let consumer = 0;
  let consumerDay = 0;
  let preloaded = 0;
  let preloadedDay = 0;
  let activeVapiCalls = 0;
  let leadsByState: { state: string; count: number }[] = [];
  try {
    const sql = await getSql();
    const [tenants, cAll, cDay, pAll, pDay, vapi, states] = await Promise.all([
      countOf(sql<{ n: number }>`select count(*)::int as n from shops where is_showcase = false and owner_user_id is not null`),
      countOf(sql<{ n: number }>`select count(*)::int as n from consumer_leads`),
      countOf(sql<{ n: number }>`select count(*)::int as n from consumer_leads where created_at >= now() - interval '24 hours'`),
      countOf(sql<{ n: number }>`select count(*)::int as n from preloaded_leads`),
      countOf(sql<{ n: number }>`select count(*)::int as n from preloaded_leads where created_at >= now() - interval '24 hours'`),
      countOf(
        sql<{ n: number }>`
          select count(*)::int as n from appointment_requests
          where status = 'new' and created_at >= now() - interval '8 minutes'
        `,
      ),
      (async () => {
        try {
          return await sql<{ state: string; count: number }>`
            select coalesce(nullif(btrim(state), ''), 'Unspecified') as state, count(*)::int as count
            from consumer_leads
            group by 1
            order by count desc
            limit 20
          `;
        } catch (err) {
          if (missingRelation(err)) return [];
          throw err;
        }
      })(),
    ]);
    activeTenants = tenants;
    consumer = cAll;
    consumerDay = cDay;
    preloaded = pAll;
    preloadedDay = pDay;
    activeVapiCalls = vapi;
    leadsByState = states;
  } catch {
    dbOk = false;
  }
  const p95 = p95Latency();
  recordLatency(Date.now() - started);
  return {
    activeTenants,
    totalLeads: consumer + preloaded,
    leadsLast24h: consumerDay + preloadedDay,
    leadsByState,
    activeVapiCalls,
    server: {
      status: serverStatus(cpu, mem, p95, dbOk),
      cpuPercent: cpu,
      memoryPercent: mem,
      p95LatencyMs: p95,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function readMasterTenants(request: Request): Promise<{ tenants: MasterTenant[] }> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  try {
    const rows = await sql<{
      id: string;
      name: string;
      slug: string;
      niche: string;
      hero_loop: string | null;
      lead_count: number;
      plan: string | null;
      mrr_cents: number | null;
      billing_status: string | null;
      stripe_customer_id: string | null;
      last_webhook_at: string | null;
    }>`
      select
        s.id,
        s.name,
        s.slug,
        s.niche,
        coalesce(s.hero_video_url, '') as hero_loop,
        coalesce((
          select count(*)::int from appointment_requests ar where ar.shop_id = s.id
        ), 0) as lead_count,
        b.plan,
        b.price_cents as mrr_cents,
        b.status as billing_status,
        coalesce(c.stripe_customer_id, '') as stripe_customer_id,
        (
          select max(e.created_at)::text from shop_events e where e.shop_id = s.id
        ) as last_webhook_at
      from shops s
      left join shop_billing b on b.shop_id = s.id
      left join shop_ai_credits c on c.shop_id = s.id
      where s.is_showcase = false
      order by s.created_at desc
      limit 200
    `;
    return { tenants: rows.map(mapTenant) };
  } catch (err) {
    if (!missingRelation(err)) throw err;
  }
  try {
    const rows = await sql<{
      id: string;
      name: string;
      slug: string;
      niche: string;
      hero_loop: string | null;
      plan: string | null;
      mrr_cents: number | null;
      billing_status: string | null;
    }>`
      select s.id, s.name, s.slug, s.niche, coalesce(s.hero_video_url, '') as hero_loop,
             b.plan, b.price_cents as mrr_cents, b.status as billing_status
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where s.is_showcase = false
      order by s.created_at desc
      limit 200
    `;
    return {
      tenants: rows.map((row) =>
        mapTenant({
          ...row,
          lead_count: 0,
          stripe_customer_id: "",
          last_webhook_at: null,
        }),
      ),
    };
  } catch (err) {
    if (missingRelation(err)) return { tenants: [] };
    throw err;
  }
}

function mapTenant(row: {
  id: string;
  name: string;
  slug: string;
  niche: string;
  hero_loop: string | null;
  lead_count: number;
  plan: string | null;
  mrr_cents: number | null;
  billing_status: string | null;
  stripe_customer_id: string | null;
  last_webhook_at: string | null;
}): MasterTenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    niche: row.niche,
    heroLoop: row.hero_loop || "unpinned",
    leadCount: Number(row.lead_count) || 0,
    plan: row.plan || "axiom_pro",
    mrrCents: Number(row.mrr_cents) || 0,
    subscriptionStatus: parseSubscriptionStatus(row.billing_status),
    stripeCustomerId: row.stripe_customer_id || "",
    currentPeriodEnd: null,
    lastWebhookAt: row.last_webhook_at,
  };
}

async function channelStats(sql: Sql, channel: "sms" | "email"): Promise<ChannelStats> {
  try {
    const rows = await sql<{
      sent: number;
      failed: number;
      in_flight: number;
      last_event: string | null;
    }>`
      select
        coalesce(sum(lead_count) filter (where status in ('sent', 'logged')), 0)::int as sent,
        coalesce(sum(lead_count) filter (where status = 'failed'), 0)::int as failed,
        coalesce(sum(lead_count) filter (where status in ('queued', 'releasing')), 0)::int as in_flight,
        max(sent_at)::text as last_event
      from outreach_dispatches
      where channel = ${channel}
    `;
    const row = rows[0];
    const sent = Number(row?.sent) || 0;
    const failed = Number(row?.failed) || 0;
    return {
      sent,
      delivered: sent,
      failed,
      inFlight: Number(row?.in_flight) || 0,
      healthy: failed === 0 || sent >= failed,
      lastEventAt: row?.last_event ?? null,
    };
  } catch (err) {
    if (missingRelation(err)) return emptyChannelStats();
    throw err;
  }
}

async function loadLogs(sql: Sql): Promise<AutopilotLog[]> {
  try {
    const rows = await sql<{
      id: string;
      at: string;
      channel: string;
      status: string;
      summary: string;
    }>`
      select id, created_at::text as at, channel, status, summary
      from outbound_engine_log
      order by created_at desc
      limit 40
    `;
    return rows.map((row) => ({
      id: row.id,
      at: row.at,
      level: logLevelFromStatus(row.status),
      channel: channelFromLog(row.channel),
      message: row.summary || row.status,
    }));
  } catch (err) {
    if (missingRelation(err)) return [];
    throw err;
  }
}

export async function readMasterAutopilotStatus(request: Request): Promise<AutopilotStatus> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const engine = await import("./outbound-engine.server");
  const shot = await engine.readOutboundEngine(request);
  const [sms, email, logs, batch] = await Promise.all([
    channelStats(sql, "sms"),
    channelStats(sql, "email"),
    loadLogs(sql),
    (async () => {
      try {
        const rows = await sql<{ id: string }>`
          select id from outreach_campaigns order by created_at desc limit 1
        `;
        return rows[0]?.id ?? null;
      } catch {
        return null;
      }
    })(),
  ]);
  const paused = shot.state.paused !== false;
  const queued = shot.metrics.queued;
  let state: AutopilotStatus["state"] = paused ? "paused" : "running";
  if (paused && queued === 0) state = "idle";
  if (!sms.healthy || !email.healthy) state = "error";
  return {
    state,
    currentBatchId: batch,
    queued,
    sentToday: shot.metrics.smsSentToday + shot.metrics.emailSentToday,
    sms,
    email,
    logs,
  };
}

export async function commandMasterAutopilot(request: Request, action: AutopilotAction): Promise<AutopilotStatus> {
  await assertAutopilotDesk(request);
  const engine = await import("./outbound-engine.server");
  if (action === "pause") {
    await engine.setOutboundPaused(request, true);
    return readMasterAutopilotStatus(request);
  }
  if (action === "start") {
    await engine.setOutboundPaused(request, false);
    const { ensureOutreachWorker } = await import("./outreach-queue.server");
    ensureOutreachWorker();
    return readMasterAutopilotStatus(request);
  }
  if (action === "automate") {
    const { automateOutreach } = await import("./autopilot.server");
    await automateOutreach(request);
    return readMasterAutopilotStatus(request);
  }
  await dispatchAutopilot(request);
  return readMasterAutopilotStatus(request);
}

export async function readAutopilotCombined(request: Request) {
  const [proposal, status] = await Promise.all([readAutopilot(request), readMasterAutopilotStatus(request)]);
  return { ...proposal, ...status };
}
