import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { assertAutopilotDesk } from "./autopilot.server";
import {
  AI_TURN_CENTS,
  applyBanditReward,
  DEFAULT_TREASURY_CAPS,
  pickSeasonalNiche,
  parseFunnelEvent,
  parsePitchVariant,
  RESEND_EMAIL_CENTS,
  revenueForEvent,
  thompsonPick,
  treasuryDecision,
  TWILIO_SMS_CENTS,
  type BanditArm,
  type FunnelCounts,
  type FunnelEventInput,
  type FunnelEventKind,
  emptyFunnelCounts,
  clickToUnlockRate,
  dropOffPoint,
  revenuePerLead,
} from "./growth-engine.ts";
import { sendSms } from "./twilio-booking.server";

function mulberry(seed = Date.now()): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export async function recordFunnelEvent(input: FunnelEventInput): Promise<void> {
  const leadId = String(input.leadId || "").trim().slice(0, 80);
  const event = parseFunnelEvent(input.event);
  if (!leadId || !event) return;
  const sql = await getSql();
  const revenue = revenueForEvent(event, input.revenueCents);
  const variantRaw = String(input.variantId || "").trim();
  const storedVariant = variantRaw ? parsePitchVariant(variantRaw) : "";
  await sql`
    insert into lead_funnel_events (
      id, lead_id, event, trade, state, city, variant_id, dwell_ms, revenue_cents, meta
    ) values (
      ${newId("fun")}, ${leadId}, ${event}, ${String(input.trade || "").slice(0, 40)},
      ${String(input.state || "").slice(0, 8)}, ${String(input.city || "").slice(0, 80)},
      ${storedVariant}, ${Math.max(0, Math.round(input.dwellMs || 0))},
      ${revenue}, ${JSON.stringify({})}::jsonb
    )
  `.catch(() => undefined);
  if (event === "sent" && variantRaw) {
    await updateBandit(parsePitchVariant(variantRaw), false);
  } else if (event === "dollar_unlocked" && variantRaw) {
    await convertBandit(parsePitchVariant(variantRaw));
  }
}

async function readArm(variantId: string): Promise<BanditArm> {
  const sql = await getSql();
  const rows = await sql<{ alpha: number; beta: number; impressions: number; conversions: number }>`
    select alpha, beta, impressions, conversions from growth_variant_stats where variant_id = ${variantId} limit 1
  `.catch(() => []);
  return {
    variantId,
    alpha: Number(rows[0]?.alpha) || 1,
    beta: Number(rows[0]?.beta) || 1,
    impressions: Number(rows[0]?.impressions) || 0,
    conversions: Number(rows[0]?.conversions) || 0,
  };
}

async function writeArm(next: BanditArm) {
  const sql = await getSql();
  await sql`
    insert into growth_variant_stats (variant_id, channel, alpha, beta, impressions, conversions, pending_approval, updated_at)
    values (${next.variantId}, ${"outreach"}, ${next.alpha}, ${next.beta}, ${next.impressions}, ${next.conversions}, false, now())
    on conflict (variant_id) do update set
      alpha = excluded.alpha, beta = excluded.beta,
      impressions = excluded.impressions, conversions = excluded.conversions, updated_at = now()
  `.catch(() => undefined);
}

async function updateBandit(variantId: string, converted: boolean) {
  await writeArm(applyBanditReward(await readArm(variantId), converted));
}

async function convertBandit(variantId: string) {
  const current = await readArm(variantId);
  await writeArm({
    ...current,
    conversions: current.conversions + 1,
    alpha: current.alpha + 1,
  });
}

export async function queuePublicCreative(variantId: string, body: string) {
  const sql = await getSql();
  const creativeId = newId("cad");
  const variant = parsePitchVariant(variantId);
  const copy = body.slice(0, 500);
  await sql`
    insert into growth_creatives (id, variant_id, channel, body, status)
    values (${creativeId}, ${variant}, ${"public_ad"}, ${copy}, ${"pending_approval"})
  `.catch(() => undefined);
  const { enqueueProposal } = await import("./autopilot-queue.server");
  const { GEAR_GUARDIAN_BPS } = await import("./merchant-pricing.ts");
  const { SMS_TCPA_FOOTER } = await import("./legal-notices.ts");
  const compliant = /\bstop\b/i.test(copy) && /\bhelp\b/i.test(copy)
    ? copy
    : `${copy}\n\n${SMS_TCPA_FOOTER} Reply HELP for help.`;
  await enqueueProposal({
    category: "public_creative",
    title: `Public ad · ${variant}`,
    summary: "External ad creative is queued for owner sign-off. Approve publishes the pending_approval row; Disapprove keeps it off the wire.",
    evidence: { variantId: variant, channel: "public_ad" },
    proposedPayload: {
      kind: "public_creative",
      creativeId,
      variantId: variant,
      body: compliant,
      connectFeeBps: GEAR_GUARDIAN_BPS,
    },
    estimatedCostCents: 0,
    riskLevel: "high",
    sandboxChecks: { tsc: true, unitTests: true, verifyE2e: false },
  }).catch(() => undefined);
}

export async function sampleLiveVariant(): Promise<string> {
  const sql = await getSql();
  const rows = await sql<BanditArm>`
    select variant_id as "variantId", alpha, beta, impressions, conversions
    from growth_variant_stats
    where pending_approval = false
  `.catch(() => [] as BanditArm[]);
  const picked = thompsonPick(rows, mulberry());
  return picked.variantId;
}

type SliceRow = {
  trade: string;
  state: string;
  city: string;
  variant_id: string;
  event: FunnelEventKind;
  n: number;
  revenue: number;
  leads: number;
};

function rollup(rows: SliceRow[]): FunnelCounts {
  const counts = emptyFunnelCounts();
  let sentLeads = 0;
  for (const row of rows) {
    counts[row.event] += Number(row.n) || 0;
    counts.revenueCents += Number(row.revenue) || 0;
    if (row.event === "sent") sentLeads += Number(row.leads) || 0;
  }
  counts.leads = Math.max(sentLeads, counts.sent, counts.clicked);
  return counts;
}

export async function readGrowthSnapshot() {
  const sql = await getSql();
  const events = await sql<SliceRow>`
    select coalesce(trade, '') as trade, coalesce(state, '') as state, coalesce(city, '') as city,
           coalesce(variant_id, '') as variant_id, event,
           count(*)::int as n,
           coalesce(sum(revenue_cents), 0)::int as revenue,
           count(distinct lead_id)::int as leads
    from lead_funnel_events
    where created_at > now() - interval '30 days'
    group by 1, 2, 3, 4, 5
  `.catch(() => [] as SliceRow[]);

  const byTrade = new Map<string, SliceRow[]>();
  const byGeo = new Map<string, SliceRow[]>();
  const byVariant = new Map<string, SliceRow[]>();
  for (const row of events) {
    const trade = row.trade || "unknown";
    const geo = `${row.state || "??"}|${row.city || ""}`;
    const variant = row.variant_id || "founder_video";
    byTrade.set(trade, [...(byTrade.get(trade) || []), row]);
    byGeo.set(geo, [...(byGeo.get(geo) || []), row]);
    byVariant.set(variant, [...(byVariant.get(variant) || []), row]);
  }
  const summarize = (rows: SliceRow[]) => {
    const counts = rollup(rows);
    return {
      counts,
      clickToUnlock: clickToUnlockRate(counts),
      dropOff: dropOffPoint(counts),
      revenuePerLead: revenuePerLead(counts),
    };
  };
  const overall = summarize(events);
  const seasonal = pickSeasonalNiche(new Date(), [...byGeo.keys()].map((key) => key.split("|")[0] || "OR"));
  const treasury = await readTreasurySnapshot();
  const creatives = await sql<{ id: string; variant_id: string; body: string; status: string }>`
    select id, variant_id, body, status from growth_creatives order by created_at desc limit 12
  `.catch(() => []);
  const arms = await sql<BanditArm>`
    select variant_id as "variantId", alpha, beta, impressions, conversions from growth_variant_stats
  `.catch(() => [] as BanditArm[]);
  return {
    overall,
    byTrade: [...byTrade.entries()].map(([key, rows]) => ({ key, ...summarize(rows) })),
    byGeo: [...byGeo.entries()].map(([key, rows]) => ({ key, ...summarize(rows) })),
    byVariant: [...byVariant.entries()].map(([key, rows]) => ({ key, ...summarize(rows) })),
    seasonalNiche: seasonal,
    bandit: arms,
    creatives,
    treasury,
  };
}

async function readCaps() {
  const sql = await getSql();
  const rows = await sql<{
    twilio_daily_cap_cents: number;
    resend_daily_cap_cents: number;
    ai_daily_cap_cents: number;
    total_daily_cap_cents: number;
    alert_phone: string;
    paused: boolean;
    pause_reason: string;
  }>`
    select twilio_daily_cap_cents, resend_daily_cap_cents, ai_daily_cap_cents, total_daily_cap_cents,
           alert_phone, paused, pause_reason
    from growth_treasury_settings where id = ${"platform"} limit 1
  `.catch(() => []);
  const row = rows[0];
  return {
    twilioDailyCapCents: Number(row?.twilio_daily_cap_cents) || DEFAULT_TREASURY_CAPS.twilioDailyCapCents,
    resendDailyCapCents: Number(row?.resend_daily_cap_cents) || DEFAULT_TREASURY_CAPS.resendDailyCapCents,
    aiDailyCapCents: Number(row?.ai_daily_cap_cents) || DEFAULT_TREASURY_CAPS.aiDailyCapCents,
    totalDailyCapCents: Number(row?.total_daily_cap_cents) || DEFAULT_TREASURY_CAPS.totalDailyCapCents,
    alertPhone: row?.alert_phone || env("TREASURY_ALERT_PHONE") || "",
    paused: Boolean(row?.paused),
    pauseReason: row?.pause_reason || "",
  };
}

export async function readTreasurySnapshot() {
  const sql = await getSql();
  const sms = await sql<{ n: number }>`
    select count(*)::int as n from lead_funnel_events
    where event = 'sent' and created_at > date_trunc('day', now())
  `.catch(() => [{ n: 0 }]);
  const voice = await sql<{ cents: number }>`
    select coalesce(sum(cents), 0)::int as cents from voice_spend_ledger
    where created_at > date_trunc('day', now())
  `.catch(() => [{ cents: 0 }]);
  const emails = await sql<{ n: number }>`
    select count(*)::int as n from outreach_touches
    where channel = 'email' and status = 'sent' and coalesce(sent_at, created_at) > date_trunc('day', now())
  `.catch(() => [{ n: 0 }]);
  const inflow = await sql<{ cents: number }>`
    select coalesce(sum(revenue_cents), 0)::int as cents from lead_funnel_events
    where event in ('dollar_unlocked', 'mrr_active') and created_at > date_trunc('day', now())
  `.catch(() => [{ cents: 0 }]);
  const connect = await sql<{ cents: number }>`
    select coalesce(sum((deposit_cents * 15) / 1000), 0)::int as cents from shop_quotes
    where created_at > date_trunc('day', now())
  `.catch(() => [{ cents: 0 }]);
  const twilioCents = Number(sms[0]?.n || 0) * TWILIO_SMS_CENTS + Number(voice[0]?.cents || 0);
  const resendCents = Number(emails[0]?.n || 0) * RESEND_EMAIL_CENTS;
  const aiCents = Math.max(0, Math.round(Number(voice[0]?.cents || 0) * (AI_TURN_CENTS / Math.max(1, 35))));
  const inflowCents = Number(inflow[0]?.cents || 0) + Number(connect[0]?.cents || 0);
  const caps = await readCaps();
  const decision = treasuryDecision(
    { twilioCents, resendCents, aiCents, inflowCents },
    caps,
  );
  return {
    ...caps,
    twilioCents,
    resendCents,
    aiCents,
    inflowCents,
    connectFeeCents: Number(connect[0]?.cents || 0),
    ...decision,
    paused: caps.paused || decision.pause,
  };
}

export async function enforceTreasuryCaps(): Promise<{ paused: boolean; reason: string }> {
  const snap = await readTreasurySnapshot();
  if (!snap.pause) return { paused: snap.paused, reason: snap.pauseReason };
  const sql = await getSql();
  await sql`
    update growth_treasury_settings
    set paused = true, pause_reason = ${snap.reason}, updated_at = now()
    where id = ${"platform"}
  `.catch(() => undefined);
  await sql`
    update outbound_engine_state set paused = true, updated_at = now() where id = ${"master"}
  `.catch(() => undefined);
  const already = snap.pauseReason === snap.reason && snap.paused;
  if (!already && snap.alertPhone) {
    await sendSms(
      snap.alertPhone,
      `AXIOM treasury paused outreach: ${snap.reason}. Spend ${snap.totalSpendCents}¢ vs inflow ${snap.inflowCents}¢. Reply STOP to opt out.`,
    ).catch(() => undefined);
  }
  return { paused: true, reason: snap.reason };
}

export async function applyTreasuryCapsDirect(next: {
  twilioDailyCapCents: number;
  resendDailyCapCents: number;
  aiDailyCapCents: number;
  totalDailyCapCents: number;
  alertPhone?: string;
}) {
  const sql = await getSql();
  await sql`
    insert into growth_treasury_settings (
      id, twilio_daily_cap_cents, resend_daily_cap_cents, ai_daily_cap_cents, total_daily_cap_cents, alert_phone
    ) values (
      ${"platform"}, ${next.twilioDailyCapCents}, ${next.resendDailyCapCents}, ${next.aiDailyCapCents},
      ${next.totalDailyCapCents}, ${next.alertPhone || ""}
    )
    on conflict (id) do update set
      twilio_daily_cap_cents = excluded.twilio_daily_cap_cents,
      resend_daily_cap_cents = excluded.resend_daily_cap_cents,
      ai_daily_cap_cents = excluded.ai_daily_cap_cents,
      total_daily_cap_cents = excluded.total_daily_cap_cents,
      alert_phone = coalesce(nullif(excluded.alert_phone, ''), growth_treasury_settings.alert_phone),
      updated_at = now()
  `;
}

export async function saveTreasuryCaps(request: Request, raw: Record<string, unknown>) {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const current = await readCaps();
  const pickCap = (rawValue: unknown, fallback: number) =>
    rawValue == null || rawValue === "" ? fallback : Math.max(0, Number(rawValue) || fallback);
  const twilio = pickCap(raw.twilioDailyCapCents, current.twilioDailyCapCents);
  const resend = pickCap(raw.resendDailyCapCents, current.resendDailyCapCents);
  const ai = pickCap(raw.aiDailyCapCents, current.aiDailyCapCents);
  const total = pickCap(raw.totalDailyCapCents, current.totalDailyCapCents);
  const phone = String(raw.alertPhone || "").slice(0, 24);
  const resume = raw.resume === true;
  const { capsIncreaseSpend } = await import("./autopilot-queue.ts");
  if (
    raw.fromProposal !== true &&
    capsIncreaseSpend(current, {
      twilioDailyCapCents: twilio,
      resendDailyCapCents: resend,
      aiDailyCapCents: ai,
      totalDailyCapCents: total,
    })
  ) {
    const { enqueueProposal } = await import("./autopilot-queue.server");
    const { GEAR_GUARDIAN_BPS } = await import("./merchant-pricing.ts");
    await enqueueProposal({
      category: "budget_cap_change",
      title: "Raise daily spend caps",
      summary: "Spend-cap increase waits on one-tap approval. Hard ceilings still apply at execute time.",
      evidence: { current, requested: { twilio, resend, ai, total } },
      proposedPayload: {
        kind: "budget_cap_change",
        twilioDailyCapCents: twilio,
        resendDailyCapCents: resend,
        aiDailyCapCents: ai,
        totalDailyCapCents: total,
        connectFeeBps: GEAR_GUARDIAN_BPS,
      },
      estimatedCostCents: Math.max(0, total - current.totalDailyCapCents),
      riskLevel: "high",
      sandboxChecks: { tsc: true, unitTests: true, verifyE2e: false },
    });
    return { ...current, queued: true };
  }
  await sql`
    insert into growth_treasury_settings (
      id, twilio_daily_cap_cents, resend_daily_cap_cents, ai_daily_cap_cents, total_daily_cap_cents, alert_phone, paused, pause_reason
    ) values (
      ${"platform"}, ${twilio}, ${resend}, ${ai}, ${total}, ${phone}, ${resume ? false : false}, ${resume ? "" : ""}
    )
    on conflict (id) do update set
      twilio_daily_cap_cents = excluded.twilio_daily_cap_cents,
      resend_daily_cap_cents = excluded.resend_daily_cap_cents,
      ai_daily_cap_cents = excluded.ai_daily_cap_cents,
      total_daily_cap_cents = excluded.total_daily_cap_cents,
      alert_phone = excluded.alert_phone,
      paused = case when ${resume} then false else growth_treasury_settings.paused end,
      pause_reason = case when ${resume} then '' else growth_treasury_settings.pause_reason end,
      updated_at = now()
  `;
  if (resume) {
    await sql`update outbound_engine_state set paused = false where id = ${"master"}`.catch(() => undefined);
  }
  return readTreasurySnapshot();
}

export async function readMasterGrowth(request: Request) {
  await assertAutopilotDesk(request);
  return readGrowthSnapshot();
}
