import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import { newId } from "@/lib/utils";
import {
  appendFounderOfferAssets,
  founderOfferMedia,
  founderOfferPitchUrl,
} from "@/lib/stripe/commercial";
import { followUpBody, followUpSchedule, outreachStrategy, renderOutreachMessage, type PhoneLine } from "./funnel";
import { newStopToken, hashStopToken } from "./funnel-guard";
import { finalizeOutreachBody } from "./legal-notices";
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
  firstNameFrom,
  renderSmsDripBody,
  smsDripSchedule,
  smsDripStorefrontPath,
} from "./sms-drip";
import {
  nextSendInstant,
  parseOutreachMode,
  planSmartSlotChunks,
  timingProfileFor,
  type OutreachMode,
} from "./outreach-queue";
import {
  demoStorefrontPath,
  outreachNicheHero,
  outreachNicheLabel,
  OUTREACH_ACTIVE_VERTICAL,
  pickNextNicheBatch,
  tradeTypeMatchersForNiche,
  trimBatchToDailyCaps,
  type OutreachNicheId,
  isOutreachNicheId,
} from "./outreach-niche-batch";
import { outreachTemplatesForNiche, PLUMBING_EMERGENCY_POSTER } from "./outreach-templates";
import { nicheForLead } from "./directory";
import { HOME_REGION_COUNTIES, type HomeCounty } from "./regional-roster";
import { buildAutopilotDryRun, type AutopilotDryRun, type DryCue, type DryShop } from "./autopilot-dry-run";
import { remainingCap } from "./outbound-engine";

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
  // Automated schedulers: CRON_SECRET / OUTREACH_CRON_SECRET (timing-safe).
  const { cronTokenValid } = await import("./cron-auth.server");
  if (cronTokenValid(request)) return;

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

type NicheBatch = {
  niche: OutreachNicheId;
  county: string;
  ready: number;
  heroVideoUrl: string;
};

async function readActiveNiche(sql: Sql): Promise<string> {
  try {
    const rows = await sql<{ active_niche: string | null }>`
      select coalesce(active_niche, '') as active_niche
      from outbound_engine_state where id = ${"master"} limit 1
    `;
    return (rows[0]?.active_niche ?? "").trim();
  } catch {
    return "";
  }
}

async function readyCountsByTrade(sql: Sql): Promise<{ niche: string; ready: number }[]> {
  const counties = [...HOME_REGION_COUNTIES];
  const aggregate = (
    rows: { trade_type: string; trade_label: string; ready: number }[],
  ): { niche: string; ready: number }[] => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const niche = nicheForLead(row.trade_type, row.trade_label);
      counts.set(niche, (counts.get(niche) ?? 0) + (Number(row.ready) || 0));
    }
    return [...counts.entries()].map(([niche, ready]) => ({ niche, ready }));
  };
  try {
    const rows = await sql<{ trade_type: string; trade_label: string; ready: number }>`
      select trade_type, trade_label,
        count(*) filter (
          where btrim(contact_email) <> '' or btrim(contact_phone) <> ''
        )::int as ready
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and not exists (
          select 1 from outreach_sequences s
          where s.lead_slug = preloaded_leads.lead_slug and s.status = 'active'
        )
      group by trade_type, trade_label
    `;
    return aggregate(rows);
  } catch (err) {
    if (!missingRelation(err)) throw err;
    try {
      const rows = await sql<{ trade_type: string; trade_label: string; ready: number }>`
        select trade_type, trade_label,
          count(*) filter (
            where btrim(contact_email) <> '' or btrim(contact_phone) <> ''
          )::int as ready
        from preloaded_leads
        where claimed = false
          and county = any(string_to_array(${counties.join("|")}, '|'))
        group by trade_type, trade_label
      `;
      return aggregate(rows);
    } catch {
      return [];
    }
  }
}

/** Today's batch is always the plumbing dataset (20,330 records). */
async function nextNicheBatch(sql: Sql): Promise<NicheBatch | null> {
  const ready = await readyCountsByTrade(sql);
  const picked = pickNextNicheBatch(ready, OUTREACH_ACTIVE_VERTICAL);
  const niche: OutreachNicheId = picked?.niche ?? OUTREACH_ACTIVE_VERTICAL;
  if (!isOutreachNicheId(niche) || niche !== OUTREACH_ACTIVE_VERTICAL) return null;

  const counties = [...HOME_REGION_COUNTIES];
  const matchers = tradeTypeMatchersForNiche(niche);
  let county = counties[0] ?? "";
  let readyCount = 0;
  try {
    const rows = await sql<{ county: string; ready: number }>`
      select county, count(*)::int as ready
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(trade_label)) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
      group by county
      order by count(*) desc, county asc
      limit 1
    `;
    const nextCounty = rows[0]?.county;
    if (nextCounty && (HOME_REGION_COUNTIES as readonly string[]).includes(nextCounty)) {
      county = nextCounty as HomeCounty;
    }
    readyCount = Number(rows[0]?.ready ?? 0) || 0;
  } catch {
    /* keep default */
  }
  if (readyCount < 1) {
    return nextNicheBatchForced(sql, OUTREACH_ACTIVE_VERTICAL);
  }
  return {
    niche,
    county,
    ready: readyCount,
    heroVideoUrl: outreachNicheHero(niche),
  };
}

async function nextNicheBatchForced(sql: Sql, niche: OutreachNicheId): Promise<NicheBatch | null> {
  const counties = [...HOME_REGION_COUNTIES];
  const matchers = tradeTypeMatchersForNiche(niche);
  try {
    const rows = await sql<{ county: string; ready: number }>`
      select county, count(*)::int as ready
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(trade_label)) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
      group by county
      order by count(*) desc, county asc
      limit 1
    `;
    if (!rows[0] || Number(rows[0].ready) < 1) return null;
    return {
      niche,
      county: rows[0].county,
      ready: Number(rows[0].ready) || 0,
      heroVideoUrl: outreachNicheHero(niche),
    };
  } catch {
    return null;
  }
}

function phoneLineOf(value: string | null | undefined): PhoneLine | "" {
  const line = String(value ?? "").trim().toLowerCase();
  return line === "mobile" || line === "landline" ? line : "";
}

async function loadLeadsForNiche(sql: Sql, niche: OutreachNicheId): Promise<AutopilotLead[]> {
  const counties = [...HOME_REGION_COUNTIES];
  const matchers = tradeTypeMatchersForNiche(niche);
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
      contact_name?: string | null;
      phone_line?: string | null;
    }[],
  ): AutopilotLead[] =>
    rows.map((row) => ({
      id: row.id,
      leadSlug: row.lead_slug,
      businessName: row.business_name,
      city: row.city,
      county: row.county,
      tradeType: niche,
      email: row.contact_email ?? "",
      phone: row.contact_phone ?? "",
      contactName: (row.contact_name ?? "").trim(),
      phoneLine: phoneLineOf(row.phone_line),
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
      contact_name: string | null;
      phone_line: string | null;
    }>`
      select id, lead_slug, business_name, city, county, trade_type, contact_email, contact_phone,
             coalesce(contact_name, '') as contact_name, coalesce(phone_line, '') as phone_line
      from preloaded_leads
      where claimed = false
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(trade_label)) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
        and not exists (
          select 1 from outreach_sequences s
          where s.lead_slug = preloaded_leads.lead_slug and s.status = 'active'
        )
      order by county asc, lead_slug asc
      limit ${BATCH_LIMIT}
    `;
    return map(rows);
  } catch (err) {
    if (!missingRelation(err) && !missingColumn(err, "contact_name") && !missingColumn(err, "phone_line")) throw err;
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
        and county = any(string_to_array(${counties.join("|")}, '|'))
        and (
          lower(trade_type) = any(string_to_array(${matchers.join("|")}, '|'))
          or lower(btrim(trade_label)) = any(string_to_array(${matchers.join("|")}, '|'))
        )
        and (btrim(contact_email) <> '' or btrim(contact_phone) <> '')
      order by county asc, lead_slug asc
      limit ${BATCH_LIMIT}
    `;
    return map(rows);
  }
}

function missingColumn(err: unknown, column: string): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return new RegExp(column, "i").test(message) && /does not exist|undefined column/i.test(message);
}

function toProposal(
  mode: OutreachMode,
  totals: { totalLeads: number; dailySent: number; remainingQueue: number },
  county: string,
  tradeType: string,
  emailCount: number,
  smsCount: number,
): AutopilotProposal {
  const label = tradeType ? outreachNicheLabel(tradeType) : "";
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
  const batch = await nextNicheBatch(sql);
  if (!batch) return toProposal(mode, totals, "", "", 0, 0);
  const split = balanceChannels(await loadLeadsForNiche(sql, batch.niche));
  return toProposal(mode, totals, batch.county, batch.niche, split.email.length, split.sms.length);
}

function messageFor(
  lead: AutopilotLead,
  channel: "email" | "sms",
  origin: string,
  niche: OutreachNicheId,
): { leadSlug: string; to: string; subject: string; body: string } {
  const nicheDraft = outreachTemplatesForNiche(niche);
  const draft = niche === "plumbing" ? nicheDraft : outreachStrategy("done-for-you");
  const media = founderOfferMedia(origin);
  const heroPath = outreachNicheHero(niche);
  const base = origin.replace(/\/$/, "");
  const heroUrl = heroPath.startsWith("http") ? heroPath : `${base}${heroPath}`;
  const posterUrl =
    niche === "plumbing" ? `${base}${PLUMBING_EMERGENCY_POSTER}` : media.thumbUrl;
  const demoPath = demoStorefrontPath({
    niche,
    businessName: lead.businessName,
    leadSlug: lead.leadSlug,
    leadId: lead.id,
    city: lead.city,
    county: lead.county,
    tradeLabel: outreachNicheLabel(niche),
  });
  const url =
    outreachDestination(origin, {
      businessName: lead.businessName,
      tradeType: niche,
      tradeLabel: outreachNicheLabel(niche),
      county: lead.county,
      leadSlug: lead.leadSlug,
      leadId: lead.id,
      city: lead.city,
      greet: true,
      trade: outreachNicheLabel(niche),
    }) ||
    `${base}${demoPath}` ||
    founderOfferPitchUrl(origin, { leadSlug: lead.leadSlug, county: lead.county });
  const tokens = {
    business: lead.businessName,
    url,
    trade: outreachNicheLabel(niche),
    county: lead.county,
    city: lead.city,
    owner: lead.businessName,
    reviews: "no public reviews",
    website: "no website listed",
    line: "listed number",
    video: heroUrl || media.videoUrl,
    video_thumb: posterUrl,
    videoThumb: posterUrl,
  };
  if (channel === "sms") {
    const dripUrl = smsDripStorefrontPath({
      niche,
      businessName: lead.businessName,
      leadSlug: lead.leadSlug,
      leadId: lead.id,
      city: lead.city,
      county: lead.county,
      tradeLabel: outreachNicheLabel(niche),
      origin,
    });
    const day1 = renderSmsDripBody("day1-preview", {
      firstName: firstNameFrom(lead.contactName ?? "", lead.businessName),
      business: lead.businessName,
      url: dripUrl || url,
      trade: outreachNicheLabel(niche),
      city: lead.city,
    });
    const body = appendFounderOfferAssets(day1, {
      videoUrl: heroUrl || media.videoUrl,
      thumbUrl: posterUrl,
      previewUrl: dripUrl || url,
    });
    return {
      leadSlug: lead.leadSlug,
      to: lead.phone,
      subject: "",
      body: finalizeOutreachBody(body, "sms"),
    };
  }
  const emailBody = appendFounderOfferAssets(renderOutreachMessage(draft.emailBody, tokens), {
    videoUrl: heroUrl || media.videoUrl,
    thumbUrl: posterUrl,
    previewUrl: url,
  });
  return {
    leadSlug: lead.leadSlug,
    to: lead.email,
    subject: renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200),
    body: finalizeOutreachBody(emailBody, "email"),
  };
}

export async function dispatchAutopilot(request: Request): Promise<
  AutopilotProposal & { queued: number; sequences: number; niche: string; heroVideoUrl: string }
> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const batch = await nextNicheBatch(sql);
  if (!batch) throw new AutopilotError(409, "No contactable leads are ready for a niche batch");
  const niche = batch.niche;
  const mode = modeNow();
  const engine = await import("./outbound-engine.server");
  const shot = await engine.readOutboundEngine(request);
  const { occupancyToday } = await import("./outreach-scheduler.server");
  const smsOcc = await occupancyToday(sql, "sms");
  const emailOcc = await occupancyToday(sql, "email");
  let split = balanceChannels(await loadLeadsForNiche(sql, niche));
  split = trimBatchToDailyCaps(split, {
    emailRemaining: Math.min(emailOcc.remaining, remainingCap(shot.metrics.emailSentToday, shot.state.emailDailyCap)),
    smsRemaining: Math.min(smsOcc.remaining, remainingCap(shot.metrics.smsSentToday, shot.state.smsDailyCap)),
  });
  const queued = split.email.length + split.sms.length;
  if (queued === 0) {
    throw new AutopilotError(409, `Daily caps are full or no ${outreachNicheLabel(niche)} leads remain today`);
  }

  const { readOutreachConfig, ensureOutreachWorker, drainOutreachQueue } = await import("./outreach-queue.server");
  const { resolvePublicAppOrigin } = await import("./public-app-url");
  const config = readOutreachConfig();
  const origin = resolvePublicAppOrigin(new URL(request.url).origin);
  const campaignId = newId("cmp");
  const draft = outreachStrategy("done-for-you");
  const totals = await metrics(sql);
  const proposal = toProposal(mode, totals, batch.county, niche, split.email.length, split.sms.length);

  await engine.setActiveOutreachNiche(request, niche);
  await sql`
    insert into outreach_campaigns (id, county, trade_type, lead_count, status, template)
    values (
      ${campaignId},
      ${batch.county},
      ${niche},
      ${queued},
      ${mode},
      ${JSON.stringify({
        strategy: draft.id,
        channel: "split",
        queue: "niche-day",
        niche,
        hero: batch.heroVideoUrl,
        mode,
        slots: config.slotLabels,
        caps: { sms: config.smsDailyCap, email: config.emailDailyCap },
      })}
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
    const dailyCap = channel === "sms" ? config.smsDailyCap : config.emailDailyCap;
    const chunks = planSmartSlotChunks(split[channel], {
      chunkSize: config.chunkSize,
      start: started,
      slots: config.slots,
      dailyCap,
      timing: "immediate",
    });
    for (const chunk of chunks) {
      planned.push({
        channel,
        messages: chunk.items.map((lead) => messageFor(lead, channel, origin, niche)),
        scheduledAt: chunk.scheduledAt,
        profile: chunk.profile,
        leads: chunk.items,
      });
    }
  }
  planned.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  let sequences = 0;
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
        ${"queued"}, ${chunk.scheduledAt}, ${batch.county}, ${"immediate"}, ${chunk.profile}
      )
    `;
    for (const lead of chunk.leads) {
      const sequenceId = newId("seq");
      const stopToken = newStopToken();
      const stopHash = await hashStopToken(stopToken);
      await sql`
        insert into outreach_sequences (
          id, lead_slug, campaign_id, channel, county, trade_type, strategy, status, stop_token_hash, timing
        ) values (
          ${sequenceId}, ${lead.leadSlug}, ${campaignId}, ${chunk.channel},
          ${lead.county || batch.county}, ${niche}, ${draft.id}, ${"active"}, ${stopHash}, ${"immediate"}
        )
      `;
      const anchorIso = chunk.scheduledAt;
      const anchor = new Date(anchorIso);
      const profile = timingProfileFor(niche);
      const dayZero = messageFor(lead, chunk.channel, origin, niche);

      if (chunk.channel === "sms") {
        // SMS-first 3-step drip: Day 1 preview → Day 3 check-in → Day 7 missed-call hook.
        const dripUrl = smsDripStorefrontPath({
          niche,
          businessName: lead.businessName,
          leadSlug: lead.leadSlug,
          leadId: lead.id,
          city: lead.city,
          county: lead.county,
          tradeLabel: outreachNicheLabel(niche),
          origin,
        });
        const dripTokens = {
          firstName: firstNameFrom(lead.contactName ?? "", lead.businessName),
          business: lead.businessName,
          url: dripUrl,
          trade: outreachNicheLabel(niche),
          city: lead.city,
        };
        for (const item of smsDripSchedule(anchor)) {
          const nominal = new Date(anchor.getTime() + item.step.offsetDays * 86_400_000);
          const scheduledAt =
            item.step.offsetDays === 0 || Number.isNaN(nominal.getTime())
              ? anchorIso
              : nextSendInstant(nominal, "immediate", profile).toISOString();
          const body =
            item.step.offsetDays === 0
              ? dayZero.body
              : finalizeOutreachBody(renderSmsDripBody(item.step, dripTokens), "sms");
          await sql`
            insert into outreach_touches (id, sequence_id, step, label, status, scheduled_at, body)
            values (
              ${newId("tch")}, ${sequenceId}, ${item.step.day}, ${item.step.label},
              ${"scheduled"}, ${scheduledAt}, ${body}
            )
          `;
        }
      } else {
        const plan = followUpSchedule(anchor);
        for (const step of plan) {
          const nominal = new Date(anchor.getTime() + step.day * 86_400_000);
          const scheduledAt =
            step.day === 0 || Number.isNaN(nominal.getTime())
              ? anchorIso
              : nextSendInstant(nominal, "immediate", profile).toISOString();
          const template = followUpBody(step.day, "email", {
            text: dayZero.body,
            emailSubject: dayZero.subject || draft.emailSubject,
            emailBody: dayZero.body,
          });
          const body =
            step.day === 0
              ? `${dayZero.subject}\n\n${dayZero.body}`
              : renderOutreachMessage(template, {
                  business: lead.businessName,
                  url: dayZero.body.match(/https?:\/\/\S+/)?.[0] ?? "",
                  trade: outreachNicheLabel(niche),
                  county: lead.county,
                  city: lead.city,
                  owner: lead.contactName || lead.businessName,
                  reviews: "no public reviews",
                  website: "no website listed",
                  line: "listed number",
                });
          await sql`
            insert into outreach_touches (id, sequence_id, step, label, status, scheduled_at, body)
            values (
              ${newId("tch")}, ${sequenceId}, ${step.day}, ${step.label},
              ${"scheduled"}, ${scheduledAt}, ${body}
            )
          `;
        }
      }
      sequences += 1;
    }
  }

  const queueRows = planned.flatMap((chunk) =>
    chunk.leads.map((lead) => ({
      businessName: lead.businessName,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      niche,
      channel: chunk.channel,
      leadSlug: lead.leadSlug,
      campaignId,
    })),
  );
  const { enqueueOutreachBatch, processOutreachQueue } = await import("./outreach-scheduler.server");
  await enqueueOutreachBatch(sql, queueRows).catch(() => 0);
  await processOutreachQueue(sql).catch(() => ({ processed: 0, sent: 0, failed: 0, rateLimited: 0 }));

  ensureOutreachWorker();
  // Manual dispatch: release due chunks now (simulation → mock logs only).
  for (let i = 0; i < 12; i += 1) {
    const released = await drainOutreachQueue(sql, origin).catch(() => ({ released: false }));
    if (!released.released) break;
  }
  const confirmed = toProposal(mode, proposal, batch.county, niche, split.email.length, split.sms.length);
  await import("./hero-motion-studio.server")
    .then((mod) => mod.tickArmedAiHeroes())
    .catch(() => 0);
  await import("./shop-autopilot.server")
    .then((mod) => mod.queueAutopilotSocialClips())
    .catch(() => ({ queued: 0 }));
  return { ...confirmed, queued, sequences, niche, heroVideoUrl: batch.heroVideoUrl };
}

/**
 * Single-click Automate: preload the sequence queue, open the trickle worker,
 * and (in simulation) process due chunks through mock logs only.
 */
export async function automateOutreach(request: Request): Promise<
  AutopilotProposal & {
    queued: number;
    sequences: number;
    worker: "started";
    simulation: boolean;
    slots: string[];
  }
> {
  await assertAutopilotDesk(request);
  const engine = await import("./outbound-engine.server");
  await engine.setOutboundPaused(request, false);
  const { ensureOutreachWorker, readOutreachConfig, drainOutreachQueue, drainNurtureTouches } = await import(
    "./outreach-queue.server"
  );
  ensureOutreachWorker();
  const dispatched = await dispatchAutopilot(request);
  const config = readOutreachConfig();
  const simulation = config.mode !== "live";
  if (simulation) {
    const sql = await getSql();
    // Walk due simulation chunks without calling Twilio/Resend.
    for (let i = 0; i < 8; i += 1) {
      const released = await drainOutreachQueue(sql).catch(() => ({ released: false }));
      if (!released.released) break;
    }
    await drainNurtureTouches(sql).catch(() => ({ released: 0 }));
  }
  return {
    ...dispatched,
    worker: "started",
    simulation,
    slots: config.slotLabels,
  };
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
