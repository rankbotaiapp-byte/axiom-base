import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import { newId } from "@/lib/utils";
import { nicheLabel } from "./directory";
import { outreachStrategy, renderOutreachMessage } from "./funnel";
import { outreachDestination } from "./preview-link";
import { verifyMasterPass } from "./master-bypass";
import { bypassSecret } from "./master-bypass.server";
import { MASTER_COOKIE } from "./master-owner";
import { isPlatformOwner } from "./platform-owner.server";
import {
  balanceChannels,
  formulateProposal,
  type AutopilotLead,
  type AutopilotProposal,
} from "./autopilot";
import {
  parseOutreachMode,
  planSmartChunks,
  type OutreachMode,
} from "./outreach-queue";
import { HOME_REGION_COUNTIES } from "./regional-roster";
import { buildAutopilotDryRun, type AutopilotDryRun, type DryCue, type DryShop } from "./autopilot-dry-run";

const BATCH_LIMIT = 24;

type Sql = Awaited<ReturnType<typeof getSql>>;

export class AutopilotError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readCookie(request: Request, name: string): string {
  const part = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((piece) => piece.trim())
    .find((piece) => piece.startsWith(`${name}=`));
  if (!part) return "";
  const value = part.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function assertAutopilotDesk(request: Request): Promise<void> {
  const origin = request.headers.get("origin");
  if (origin) {
    let same = false;
    try {
      same = new URL(origin).host === new URL(request.url).host;
    } catch {
      same = false;
    }
    if (!same) throw new AutopilotError(403, "Forbidden");
  }
  const secret = bypassSecret();
  const token = readCookie(request, MASTER_COOKIE);
  if (secret && token && verifyMasterPass(secret, token, Math.floor(Date.now() / 1000))) return;
  const header = request.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(\S+)$/i.exec(header.trim())?.[1] ?? "";
  if (bearer) {
    const { acceptMasterKey } = await import("./master-bypass.server");
    if (acceptMasterKey(bearer)) return;
  }
  const user = await getSessionUser();
  if (user && (await isPlatformOwner(user.id))) return;
  throw new AutopilotError(401, "Unauthorized");
}

function modeNow(): OutreachMode {
  return parseOutreachMode(env("OUTREACH_MODE"));
}

async function countOf(sql: Sql, query: Promise<{ n: number }[]>): Promise<number> {
  try {
    const rows = await query;
    const n = Number(rows[0]?.n ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch (err) {
    if (missingRelation(err)) return 0;
    throw err;
  }
}

function missingRelation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /does not exist|undefined_column|undefined_table/i.test(message);
}

async function metrics(sql: Sql): Promise<{ totalLeads: number; dailySent: number; remainingQueue: number }> {
  const [totalLeads, dailySent, remainingQueue] = await Promise.all([
    countOf(sql, sql<{ n: number }>`select count(*)::int as n from preloaded_leads`),
    countOf(
      sql,
      sql<{ n: number }>`
        select coalesce(sum(lead_count), 0)::int as n
        from outreach_dispatches
        where status in ('sent', 'logged')
          and sent_at >= (date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles')
      `,
    ),
    countOf(
      sql,
      sql<{ n: number }>`select count(*)::int as n from preloaded_leads where claimed = false`,
    ),
  ]);
  return { totalLeads, dailySent, remainingQueue };
}

type Cell = { county: string; trade_type: string; ready: number };

async function bestLocalCell(sql: Sql): Promise<Cell | null> {
  const counties = [...HOME_REGION_COUNTIES];
  try {
    const rows = await sql<Cell>`
      select county, trade_type,
        count(*) filter (
          where btrim(contact_email) <> '' or btrim(contact_phone) <> ''
        )::int as ready
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
      group by county, trade_type
      order by ready desc, county asc, trade_type asc
      limit 1
    `;
    const row = rows[0];
    if (!row || row.ready < 1) return null;
    return row;
  } catch (err) {
    if (missingRelation(err)) return null;
    throw err;
  }
}

async function loadLeads(sql: Sql, county: string, tradeType: string): Promise<AutopilotLead[]> {
  const map = (
    rows: {
      id: string;
      lead_slug: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      contact_email: string | null;
      contact_phone: string | null;
    }[],
  ): AutopilotLead[] =>
    rows.map((row) => ({
      id: row.id,
      leadSlug: row.lead_slug,
      businessName: row.business_name,
      city: row.city,
      county: row.county,
      tradeType: row.trade_type,
      email: row.contact_email ?? "",
      phone: row.contact_phone ?? "",
    }));
  try {
    const rows = await sql<{
      id: string;
      lead_slug: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      contact_email: string | null;
      contact_phone: string | null;
    }>`
      select id, lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and lower(county) = lower(${county})
        and trade_type = ${tradeType}
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
        and not exists (
          select 1 from outreach_sequences s
          where s.lead_slug = preloaded_leads.lead_slug and s.status = 'active'
        )
      order by lead_slug asc
      limit ${BATCH_LIMIT}
    `;
    return map(rows);
  } catch (err) {
    if (!missingRelation(err)) throw err;
    const rows = await sql<{
      id: string;
      lead_slug: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      contact_email: string | null;
      contact_phone: string | null;
    }>`
      select id, lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and lower(county) = lower(${county})
        and trade_type = ${tradeType}
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
      order by lead_slug asc
      limit ${BATCH_LIMIT}
    `;
    return map(rows);
  }
}

function toProposal(
  mode: OutreachMode,
  totals: { totalLeads: number; dailySent: number; remainingQueue: number },
  county: string,
  tradeType: string,
  emailCount: number,
  smsCount: number,
): AutopilotProposal {
  const label = tradeType ? nicheLabel(tradeType) : "";
  return {
    mode,
    totalLeads: totals.totalLeads,
    dailySent: totals.dailySent,
    remainingQueue: totals.remainingQueue,
    county,
    tradeType,
    tradeLabel: label,
    emailCount,
    smsCount,
    summary: formulateProposal({
      mode,
      ...totals,
      county,
      tradeLabel: label,
      emailCount,
      smsCount,
    }),
  };
}

export async function readAutopilot(request: Request): Promise<AutopilotProposal> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const totals = await metrics(sql);
  const mode = modeNow();
  const cell = await bestLocalCell(sql);
  if (!cell) return toProposal(mode, totals, "", "", 0, 0);
  const split = balanceChannels(await loadLeads(sql, cell.county, cell.trade_type));
  return toProposal(mode, totals, cell.county, cell.trade_type, split.email.length, split.sms.length);
}

function messageFor(lead: AutopilotLead, channel: "email" | "sms", origin: string): { leadSlug: string; to: string; subject: string; body: string } {
  const draft = outreachStrategy("done-for-you");
  const url = outreachDestination(origin, {
    businessName: lead.businessName,
    tradeType: lead.tradeType,
    county: lead.county,
    leadSlug: lead.leadSlug,
    leadId: lead.id,
    city: lead.city,
    trade: nicheLabel(lead.tradeType),
    greet: true,
  });
  const tokens = {
    business: lead.businessName,
    url,
    trade: nicheLabel(lead.tradeType),
    county: lead.county,
    city: lead.city,
    owner: lead.businessName,
    reviews: "no public reviews",
    website: "no website listed",
    line: "listed number",
  };
  if (channel === "sms") {
    return { leadSlug: lead.leadSlug, to: lead.phone, subject: "", body: renderOutreachMessage(draft.text, tokens).slice(0, 640) };
  }
  return {
    leadSlug: lead.leadSlug,
    to: lead.email,
    subject: renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200),
    body: renderOutreachMessage(draft.emailBody, tokens).slice(0, 4000),
  };
}

export async function dispatchAutopilot(request: Request): Promise<AutopilotProposal & { queued: number }> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const proposal = await readAutopilot(request);
  if (proposal.emailCount + proposal.smsCount === 0) {
    throw new AutopilotError(409, "No contactable leads are ready for a batch");
  }
  const mode = modeNow();
  const leads = await loadLeads(sql, proposal.county, proposal.tradeType);
  const split = balanceChannels(leads);
  const queued = split.email.length + split.sms.length;
  if (queued === 0) throw new AutopilotError(409, "No contactable leads are ready for a batch");

  const { readOutreachConfig, ensureOutreachWorker, drainOutreachQueue } = await import("./outreach-queue.server");
  const config = readOutreachConfig();
  const origin = new URL(request.url).origin;
  const campaignId = newId("cmp");
  const draft = outreachStrategy("done-for-you");
  await sql`
    insert into outreach_campaigns (id, county, trade_type, lead_count, status, template)
    values (
      ${campaignId},
      ${proposal.county},
      ${proposal.tradeType},
      ${queued},
      ${mode},
      ${JSON.stringify({ strategy: draft.id, channel: "split", queue: "trickle", mode })}
    )
  `;

  const started = new Date();
  const planned: {
    channel: "email" | "sms";
    messages: { leadSlug: string; to: string; subject: string; body: string }[];
    scheduledAt: string;
    profile: string;
    leads: AutopilotLead[];
  }[] = [];
  for (const channel of ["email", "sms"] as const) {
    const chunks = planSmartChunks(split[channel], {
      chunkSize: config.chunkSize,
      intervalSeconds: config.intervalSeconds,
      start: started,
      timing: "immediate",
    });
    for (const chunk of chunks) {
      planned.push({
        channel,
        messages: chunk.items.map((lead) => messageFor(lead, channel, origin)),
        scheduledAt: chunk.scheduledAt,
        profile: chunk.profile,
        leads: chunk.items,
      });
    }
  }
  for (let index = 0; index < planned.length; index += 1) {
    const chunk = planned[index];
    if (!chunk) continue;
    await sql`
      insert into outreach_dispatches (
        id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
        interval_seconds, payload, status, scheduled_at, county, timing, profile
      ) values (
        ${newId("dsp")}, ${campaignId}, ${chunk.channel}, ${mode}, ${index}, ${planned.length},
        ${chunk.messages.length}, ${config.intervalSeconds}, ${JSON.stringify(chunk.messages)},
        ${"queued"}, ${chunk.scheduledAt}, ${proposal.county}, ${"immediate"}, ${chunk.profile}
      )
    `;
    for (const lead of chunk.leads) {
      await sql`
        insert into outreach_sequences (
          id, lead_slug, campaign_id, channel, county, trade_type, strategy, status, stop_token_hash, timing
        ) values (
          ${newId("seq")}, ${lead.leadSlug}, ${campaignId}, ${chunk.channel},
          ${proposal.county}, ${proposal.tradeType}, ${draft.id}, ${"active"}, ${""}, ${"immediate"}
        )
      `;
    }
  }

  ensureOutreachWorker();
  if (mode !== "live") {
    await drainOutreachQueue(sql).catch(() => undefined);
  }
  const confirmed = toProposal(mode, proposal, proposal.county, proposal.tradeType, split.email.length, split.sms.length);
  await import("./hero-motion-studio.server")
    .then((mod) => mod.tickArmedAiHeroes())
    .catch(() => 0);
  return { ...confirmed, queued };
}

async function rowsOrEmpty<T>(query: Promise<T[]>): Promise<T[]> {
  try {
    return await query;
  } catch (err) {
    if (missingRelation(err)) return [];
    throw err;
  }
}

/**
 * Read active shops, pending cues, and home-county leads.
 * Writes simulation lines to outreach_events. Never calls Twilio or Resend.
 */
export async function simulateAutopilot(request: Request): Promise<AutopilotDryRun & { logged: number }> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const origin = new URL(request.url).origin;
  const shops = await rowsOrEmpty(
    sql<DryShop>`
      select s.id, s.slug, s.name, s.niche, coalesce(b.status, 'trialing') as billing
      from shops s
      left join shop_billing b on b.shop_id = s.id
      where coalesce(b.status, 'trialing') in ('active', 'trialing')
      order by s.slug asc
      limit 40
    `,
  );
  const social = await rowsOrEmpty(
    sql<{ id: string; slug: string; caption: string; status: string }>`
      select p.id, s.slug, p.caption, p.status
      from shop_social_posts p
      join shops s on s.id = p.shop_id
      where p.status in ('draft', 'pending', 'queued')
      order by p.created_at asc
      limit 24
    `,
  );
  const queued = await rowsOrEmpty(
    sql<{ id: string; county: string; channel: string; status: string }>`
      select id, county, channel, status
      from outreach_dispatches
      where status = 'queued'
      order by scheduled_at asc
      limit 24
    `,
  );
  const countyKeys = HOME_REGION_COUNTIES.flatMap((county) => [county.toLowerCase(), county.toLowerCase().replace(/ county$/, "")]).join("|");
  const leads = await rowsOrEmpty(
    sql<{
      id: string;
      lead_slug: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      contact_email: string | null;
      contact_phone: string | null;
    }>`
      select id, lead_slug, business_name, city, county, trade_type, contact_email, contact_phone
      from preloaded_leads
      where claimed = false
        and lower(county) = any(string_to_array(${countyKeys}, '|'))
        and (btrim(coalesce(contact_email, '')) <> '' or btrim(coalesce(contact_phone, '')) <> '')
      order by county asc, lead_slug asc
      limit 72
    `,
  );
  const cues: DryCue[] = [
    ...social.map((row) => ({
      kind: "social" as const,
      id: row.id,
      shopSlug: row.slug,
      county: "",
      status: row.status,
      detail: row.caption.slice(0, 80),
    })),
    ...queued.map((row) => ({
      kind: "outreach" as const,
      id: row.id,
      shopSlug: "",
      county: row.county,
      status: row.status,
      detail: row.channel,
    })),
  ];
  const run = buildAutopilotDryRun({
    shops,
    cues,
    origin,
    leads: leads.map((row) => ({
      id: row.id,
      leadSlug: row.lead_slug,
      businessName: row.business_name,
      city: row.city,
      county: row.county,
      tradeType: row.trade_type,
      email: row.contact_email ?? "",
      phone: row.contact_phone ?? "",
    })),
  });
  let logged = 0;
  for (const line of run.logs) {
    try {
      await sql`
        insert into outreach_events (id, county, channel, summary, status)
        values (${newId("dry")}, ${line.county}, ${line.channel}, ${line.summary}, ${line.status})
      `;
      logged += 1;
    } catch (err) {
      if (!missingRelation(err)) throw err;
    }
  }
  return { ...run, logged };
}
