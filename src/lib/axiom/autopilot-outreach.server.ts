import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import {
  planOutreachBatch,
  renderOutreachTemplate,
  rotateStockQuery,
  normalizeCounty,
  normalizeTrade,
  type OutreachBatchPlan,
  type OutreachCountyId,
  type OutreachLeadTarget,
  type OutreachTradeId,
} from "./autopilot-outreach";
import { parseOutreachMode } from "./outreach-queue";
import { AUTOPILOT_EMAIL_DAILY_CAP, AUTOPILOT_SMS_DAILY_CAP } from "./autopilot-limits";

export type RunOutreachBatchInput = {
  county?: OutreachCountyId | string;
  trade?: OutreachTradeId | string;
  mode?: string | null;
  limit?: number;
  dryRun?: boolean;
};

async function occupancyToday(): Promise<{ sms: number; email: number; lastSentAt: string | null }> {
  const sql = await getSql();
  try {
    const rows = await sql<{ channel: string; n: number; last_at: string | Date | null }>`
      select channel, count(*)::int as n, max(created_at) as last_at
      from outreach_dispatches
      where created_at::date = (now() at time zone 'America/Los_Angeles')::date
        and status in ('sent', 'queued', 'simulated')
      group by channel
    `;
    let sms = 0;
    let email = 0;
    let lastSentAt: string | null = null;
    for (const row of rows) {
      if (row.channel === "sms") sms = Number(row.n) || 0;
      if (row.channel === "email") email = Number(row.n) || 0;
      const at = row.last_at ? new Date(row.last_at).toISOString() : null;
      if (at && (!lastSentAt || at > lastSentAt)) lastSentAt = at;
    }
    return { sms, email, lastSentAt };
  } catch {
    return { sms: 0, email: 0, lastSentAt: null };
  }
}

async function loadRegionalLeads(
  county: OutreachCountyId,
  trade: OutreachTradeId,
  limit: number,
): Promise<OutreachLeadTarget[]> {
  const sql = await getSql();
  const countyLabel =
    county === "josephine"
      ? "Josephine"
      : county === "jackson"
        ? "Jackson"
        : county === "douglas"
          ? "Douglas"
          : "Klamath";
  try {
    const rows = await sql<{
      lead_slug: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      email: string;
      phone: string;
      contact_name: string | null;
    }>`
      select lead_slug, business_name, city, county, trade_type, email, phone, contact_name
      from territory_leads
      where county ilike ${`%${countyLabel}%`}
        and (
          trade_type ilike ${`%${trade}%`}
          or niche ilike ${`%${trade}%`}
          or trade_type ilike ${trade === "hvac" ? "%heat%" : `%${trade}%`}
        )
        and coalesce(claimed, false) = false
      order by updated_at desc nulls last, created_at desc
      limit ${limit}
    `;
    return rows.map((row) => ({
      leadSlug: row.lead_slug,
      businessName: row.business_name || row.lead_slug,
      trade: normalizeTrade(row.trade_type || trade),
      county: normalizeCounty(row.county) || county,
      city: row.city || OUTREACH_CITY_FALLBACK[county],
      email: row.email || "",
      phone: row.phone || "",
      contactName: row.contact_name || undefined,
    }));
  } catch {
    // Soft demo registry when territory_leads is empty / missing
    return DEMO_REGISTRY.filter((l) => l.county === county && l.trade === trade).slice(0, limit);
  }
}

const OUTREACH_CITY_FALLBACK: Record<OutreachCountyId, string> = {
  jackson: "Medford",
  josephine: "Grants Pass",
  douglas: "Roseburg",
  klamath: "Klamath Falls",
};

const DEMO_REGISTRY: OutreachLeadTarget[] = [
  {
    leadSlug: "vance-hvac-plumbing",
    businessName: "Vance HVAC & Plumbing",
    trade: "hvac",
    county: "josephine",
    city: "Grants Pass",
    email: "jim@vancehvac.example",
    phone: "5415550100",
    contactName: "Jim Vance",
  },
  {
    leadSlug: "rogue-rapid-plumbing",
    businessName: "Rogue Rapid Plumbing",
    trade: "plumbing",
    county: "jackson",
    city: "Medford",
    email: "desk@roguerapid.example",
    phone: "5415550140",
  },
  {
    leadSlug: "spark-line-electric",
    businessName: "Spark Line Electric",
    trade: "electrical",
    county: "jackson",
    city: "Medford",
    email: "hello@sparkline.example",
    phone: "5415550188",
  },
];

async function resolveStockUrl(trade: OutreachTradeId, leadSlug: string): Promise<string | null> {
  try {
    const { fetchPexelsStock, fetchUnsplashStock } = await import("./autopilot-content.server");
    const query = rotateStockQuery(trade, leadSlug);
    const pexels = await fetchPexelsStock(query, "image");
    if (pexels?.src) return pexels.src;
    const unsplash = await fetchUnsplashStock(query);
    if (unsplash?.src) return unsplash.src;
  } catch {
    /* curated fallback below */
  }
  try {
    const { curatedStockImage } = await import("./autopilot-content");
    return curatedStockImage(trade).src;
  } catch {
    return null;
  }
}

async function logDispatch(row: {
  leadSlug: string;
  channel: "sms" | "email";
  status: string;
  subject: string;
  body: string;
  mode: string;
  batchId: string;
  meta?: Record<string, unknown>;
}) {
  const sql = await getSql();
  try {
    await sql`
      insert into outreach_dispatches (
        id, lead_slug, channel, status, subject, body, mode, batch_id, meta, created_at
      ) values (
        ${newId("od")}, ${row.leadSlug}, ${row.channel}, ${row.status},
        ${row.subject}, ${row.body}, ${row.mode}, ${row.batchId},
        ${JSON.stringify(row.meta ?? {})}::jsonb, now()
      )
    `;
  } catch {
    try {
      await sql`
        insert into outreach_events (id, county, channel, summary, status)
        values (
          ${newId("oe")}, ${row.batchId}, ${row.channel},
          ${`${row.leadSlug}: ${row.status}`.slice(0, 200)}, ${row.status}
        )
      `;
    } catch {
      /* telemetry-best-effort */
    }
  }
}

/**
 * Plan + optionally enqueue a regional trade registry batch.
 * Live mode still respects daily caps (40 SMS / 80 email) and the weekday window.
 */
export async function runMasterOutreachBatch(
  input: RunOutreachBatchInput = {},
): Promise<{ plan: OutreachBatchPlan; queued: number; simulated: number; stockAttached: number }> {
  const mode = parseOutreachMode(input.mode ?? env("OUTREACH_MODE"));
  const county = (normalizeCounty(String(input.county || "josephine")) || "josephine") as OutreachCountyId;
  const trade = normalizeTrade(String(input.trade || "hvac"));
  const limit = Math.min(40, Math.max(1, Math.round(input.limit ?? 20)));
  const occupancy = await occupancyToday();
  const leads = await loadRegionalLeads(county, trade, limit);

  const plan = planOutreachBatch({
    mode,
    county,
    trade,
    leads,
    smsSentToday: occupancy.sms,
    emailSentToday: occupancy.email,
    lastSentAt: occupancy.lastSentAt,
  });

  let queued = 0;
  let simulated = 0;
  let stockAttached = 0;

  if (input.dryRun || !plan.gate.allowed) {
    return { plan, queued, simulated, stockAttached };
  }

  // Day-0 sequence only for this batch tick (later days via drip worker)
  const day0 = plan.sequence.filter((s) => s.dayOffset === 0);
  let smsBudget = plan.smsRemaining;
  let emailBudget = plan.emailRemaining;

  for (const lead of plan.leads) {
    for (const step of day0) {
      if (step.channel === "sms" && smsBudget <= 0) continue;
      if (step.channel === "email" && emailBudget <= 0) continue;
      if (step.channel === "sms" && lead.phone.replace(/\D/g, "").length < 10) continue;
      if (step.channel === "email" && !/@/.test(lead.email)) continue;

      let stockUrl: string | null = null;
      if (step.includeStockAsset) {
        stockUrl = await resolveStockUrl(lead.trade, lead.leadSlug);
        if (stockUrl) stockAttached += 1;
      }

      const copy = renderOutreachTemplate(step.templateId, lead, {
        stockUrl: stockUrl || undefined,
        previewUrl: `${(env("NEXT_PUBLIC_APP_URL") || env("BETTER_AUTH_URL") || "https://axiom.shop").replace(/\/$/, "")}/${lead.leadSlug}`,
      });

      if (mode === "simulation") {
        await logDispatch({
          leadSlug: lead.leadSlug,
          channel: step.channel,
          status: "simulated",
          subject: copy.subject,
          body: copy.body,
          mode,
          batchId: plan.batchId,
          meta: { stockUrl, templateId: step.templateId },
        });
        simulated += 1;
      } else {
        try {
          const sql = await getSql();
          const { enqueueOutreachBatch } = await import("./outreach-scheduler.server");
          await enqueueOutreachBatch(sql, [
            {
              leadSlug: lead.leadSlug,
              businessName: lead.businessName,
              phone: lead.phone,
              email: lead.email,
              niche: lead.trade,
              channel: step.channel,
              campaignId: plan.batchId,
            },
          ]);
          await logDispatch({
            leadSlug: lead.leadSlug,
            channel: step.channel,
            status: "queued",
            subject: copy.subject,
            body: copy.body,
            mode,
            batchId: plan.batchId,
            meta: { stockUrl, templateId: step.templateId },
          });
          queued += 1;
        } catch {
          await logDispatch({
            leadSlug: lead.leadSlug,
            channel: step.channel,
            status: "queued",
            subject: copy.subject,
            body: copy.body,
            mode,
            batchId: plan.batchId,
            meta: { stockUrl, templateId: step.templateId, fallback: true },
          });
          queued += 1;
        }
      }

      if (step.channel === "sms") smsBudget -= 1;
      else emailBudget -= 1;
    }
  }

  try {
    const { recordCompanionPulse } = await import("./companion-telemetry.server");
    await recordCompanionPulse({
      status: mode === "live" ? "good" : "warning",
      eventType: mode === "live" ? "twilio.outreach.batch" : "system.outreach.simulation",
      detail: plan.summary.slice(0, 240),
      payload: {
        batchId: plan.batchId,
        queued,
        simulated,
        stockAttached,
        smsCap: AUTOPILOT_SMS_DAILY_CAP,
        emailCap: AUTOPILOT_EMAIL_DAILY_CAP,
      },
    });
  } catch {
    /* non-blocking */
  }

  return { plan, queued, simulated, stockAttached };
}

export async function readOutreachEngineStatus() {
  const mode = parseOutreachMode(env("OUTREACH_MODE"));
  const occupancy = await occupancyToday();
  return {
    mode,
    smsSentToday: occupancy.sms,
    emailSentToday: occupancy.email,
    smsCap: AUTOPILOT_SMS_DAILY_CAP,
    emailCap: AUTOPILOT_EMAIL_DAILY_CAP,
    smsRemaining: Math.max(0, AUTOPILOT_SMS_DAILY_CAP - occupancy.sms),
    emailRemaining: Math.max(0, AUTOPILOT_EMAIL_DAILY_CAP - occupancy.email),
    lastSentAt: occupancy.lastSentAt,
    counties: ["jackson", "josephine", "douglas", "klamath"],
    trades: ["plumbing", "hvac", "electrical", "contractor", "auto", "welding"],
  };
}
