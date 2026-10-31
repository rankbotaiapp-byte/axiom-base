import { dbSource, getSql } from "@/lib/db";
import { cleanLead } from "./master";
import { newId } from "@/lib/utils";
import { channelFromPackage, followUpBody, followUpSchedule, deskPreviewPath, isEmailReady, isLeadSlug, isSmsReady, leadSlugFrom, nurtureStatus, outreachPublicTokens, outreachStrategy, packOutreachPackage, renderOutreachMessage, parseFunnelQuery, parseHasWebsite, parsePhoneLine, parseReviewCount, parseReviewScore, publicLeadFromRow, strategyLabelFromPackage, type PhoneLine } from "./funnel";
import { outreachDestination } from "./preview-link";
import { hashStopToken, newStopToken } from "./funnel-guard";
import { nextSendInstant, parseSendTiming, planSmartChunks, timingProfileFor, type SendTiming } from "./outreach-queue";
import { toE164 } from "./notify-target";
import { HOME_REGION_COUNTIES, HOME_REGION_LABEL, homeRegionLeads } from "./regional-roster";
import { classifyFiling, classifyTrade, isTradeKey, nicheLabel } from "./directory";
function stamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}
async function requestOrigin(): Promise<string> {
  const {
    getRequest
  } = await import("@tanstack/react-start/server");
  return new URL(getRequest().url).origin;
}
function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
async function assertPlatformOwner(userId: string) {
  const gate = await import("./platform-owner.server");
  return gate.assertPlatformOwner(userId);
}
function tradeLabel(id: string, stored = ""): string {
  const label = stored.trim();
  if (label) return label;
  return nicheLabel(id);
}
function missingRelation(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}
type WireEvent = {
  id: string;
  type: string;
  shopName: string;
  slug: string;
  createdAt: string;
};
function mergeWire(shopEvents: {
  id: string;
  type: string;
  shop_name: string;
  slug: string;
  created_at: unknown;
}[], campaigns: WireEvent[]): WireEvent[] {
  const shop = shopEvents.map(event => ({
    id: event.id,
    type: event.type,
    shopName: event.shop_name,
    slug: event.slug,
    createdAt: stamp(event.created_at)
  }));
  return [...shop, ...campaigns].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 24);
}
async function loadCampaigns(sql: Awaited<ReturnType<typeof getSql>>): Promise<WireEvent[]> {
  try {
    const rows = await sql<{
      id: string;
      county: string;
      trade_type: string;
      lead_count: number;
      status: string;
      template: string;
      created_at: unknown;
    }>`
      select id, county, trade_type, lead_count, status, template, created_at
      from outreach_campaigns
      order by created_at desc
      limit 24
    `;
    return rows.map(row => {
      const count = num(row.lead_count);
      const hook = strategyLabelFromPackage(row.template ?? "");
      const channel = channelFromPackage(row.template ?? "");
      const channelLabel = channel === "email" ? "Email trickle" : channel === "sms" ? "SMS trickle" : "";
      const modeLabel = row.status === "live" ? "live" : "simulation";
      const parts = [row.county, tradeLabel(row.trade_type), channelLabel, hook, `${count} ${count === 1 ? "lead" : "leads"}`, modeLabel].filter(Boolean);
      const type = channel === "email" ? "email_trickle" : channel === "sms" ? "sms_trickle" : "outreach_simulated";
      return {
        id: row.id,
        type,
        shopName: parts.join(" · "),
        slug: "",
        createdAt: stamp(row.created_at)
      };
    });
  } catch (err) {
    if (missingRelation(err, "outreach_campaigns")) return [];
    throw err;
  }
}
async function loadDispatchWire(sql: Awaited<ReturnType<typeof getSql>>): Promise<WireEvent[]> {
  try {
    const rows = await sql<{
      id: string;
      county: string;
      channel: string;
      chunk_index: number;
      chunk_count: number;
      lead_count: number;
      status: string;
      sent_at: unknown;
    }>`
      select id, county, channel, chunk_index, chunk_count, lead_count, status, sent_at
      from outreach_dispatches
      where status in ('logged', 'sent', 'failed', 'skipped')
      order by sent_at desc
      limit 24
    `;
    return rows.map(row => {
      const channel = row.channel === "sms" ? "SMS" : "Email";
      const outcome = row.status === "logged" ? "simulation log" : row.status === "sent" ? "sent" : row.status;
      const index = num(row.chunk_index) + 1;
      const count = num(row.chunk_count);
      const leads = num(row.lead_count);
      return {
        id: row.id,
        type: "outreach_log",
        shopName: `${row.county} · ${channel} chunk ${index}/${count} · ${leads} ${leads === 1 ? "lead" : "leads"} · ${outcome}`,
        slug: "",
        createdAt: stamp(row.sent_at)
      };
    });
  } catch (err) {
    if (missingRelation(err, "outreach_dispatches")) return [];
    throw err;
  }
}
async function loadNurtureWire(sql: Awaited<ReturnType<typeof getSql>>): Promise<WireEvent[]> {
  try {
    const rows = await sql<{
      id: string;
      county: string;
      channel: string;
      summary: string;
      status: string;
      created_at: unknown;
    }>`
      select id, county, channel, summary, status, created_at
      from outreach_events
      order by created_at desc
      limit 24
    `;
    return rows.map(row => {
      const channel = row.channel === "sms" ? "SMS" : "Email";
      const outcome = row.status === "logged" ? "simulation log" : row.status === "sent" ? "sent" : row.status;
      return {
        id: row.id,
        type: "nurture_dispatch",
        shopName: `${row.county} · ${channel} nurture · ${outcome} · ${row.summary}`,
        slug: "",
        createdAt: stamp(row.created_at)
      };
    });
  } catch (err) {
    if (missingRelation(err, "outreach_events")) return [];
    throw err;
  }
}
async function loadActivationList() {
  try {
    const territory = await import("./territory.server");
    return await territory.listActivations();
  } catch (err) {
    if (missingRelation(err, "territory_activations")) return [];
    throw err;
  }
}
export const masterGateHandler = async ({
  context
}: any) => {
  const {
    isPlatformOwner
  } = await import("./platform-owner.server");
  return {
    open: await isPlatformOwner(context.userId)
  };
};
export const masterEntryHandler = async (_ctx?: unknown) => {
  const bypass = await import("./master-bypass.server");
  return bypass.readMasterEntry();
};
export const claimMasterBypassHandler = async ({
  data
}: any) => {
  const bypass = await import("./master-bypass.server");
  if (!bypass.bypassConfigured()) throw new Error("Master bypass is not configured");
  if (!bypass.acceptMasterKey(data.key)) {
    await new Promise(resolve => setTimeout(resolve, 400));
    throw new Error("That key does not open the desk.");
  }
  bypass.refreshMasterCookie();
  return {
    ok: true as const
  };
};
export const getMasterDeskHandler = async ({
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  let outreach: {
    mode: "simulation" | "live";
    intervalSeconds: number;
    chunkSize: number;
  } = {
    mode: "simulation",
    intervalSeconds: 45,
    chunkSize: 5
  };
  try {
    const queue = await import("./outreach-queue.server");
    outreach = queue.readOutreachConfig();
    queue.ensureOutreachWorker();
    await queue.drainOutreachQueue(sql);
    await queue.drainNurtureTouches(sql);
  } catch (err) {
    if (!missingRelation(err, "outreach_dispatches") && !missingRelation(err, "outreach_events") && !missingRelation(err, "attempts")) throw err;
  }
  const [counts, events, shops, counties, recentHits] = await Promise.all([sql<{
    active_shops: number;
    bookings: number;
    revenue_cents: number;
  }>`
        select
          (select count(*) from shops where is_showcase = false and owner_user_id is not null) as active_shops,
          (select count(*) from appointments where status <> 'cancelled') as bookings,
          (select coalesce(sum(payment_cents), 0) from appointments where payment_status = 'paid') as revenue_cents
      `, sql<{
    id: string;
    type: string;
    shop_name: string;
    slug: string;
    created_at: unknown;
  }>`
        select e.id, e.type, s.name as shop_name, s.slug, e.created_at
        from shop_events e
        join shops s on s.id = e.shop_id
        order by e.created_at desc
        limit 24
      `, sql<{
    id: string;
    slug: string;
    name: string;
    niche: string;
    is_showcase: boolean;
    billing_status: string | null;
    owner_email: string | null;
    created_at: unknown;
  }>`
        select s.id, s.slug, s.name, s.niche, s.is_showcase,
          b.status as billing_status, u."email" as owner_email, s.created_at
        from shops s
        left join shop_billing b on b.shop_id = s.id
        left join "user" u on u.id = s.owner_user_id
        order by s.created_at desc
        limit 200
      `, sql<{
    county: string;
    trade_type: string;
    trade_label: string;
    leads: number;
    claimed: number;
    hits: number;
  }>`
        select l.county, l.trade_type,
          max(l.trade_label) as trade_label,
          count(*)::int as leads,
          (count(*) filter (where l.claimed))::int as claimed,
          (
            select count(*)::int from funnel_visits v
            where v.lead_slug in (
              select p.lead_slug from preloaded_leads p
              where lower(p.county) = lower(l.county) and p.trade_type = l.trade_type
            )
          ) as hits
        from preloaded_leads l
        group by l.county, l.trade_type
        order by l.county asc, l.trade_type asc
      `, sql<{
    id: string;
    lead_slug: string;
    utm_source: string;
    county: string;
    shop_id: string | null;
    created_at: unknown;
  }>`
        select id, lead_slug, utm_source, county, shop_id, created_at
        from funnel_visits
        order by created_at desc
        limit 12
      `]);
  const row = counts[0];
  const activations = await loadActivationList();
  return {
    kpis: {
      activeShops: num(row?.active_shops),
      bookings: num(row?.bookings),
      revenueCents: num(row?.revenue_cents)
    },
    events: mergeWire(events, [...(await loadCampaigns(sql)), ...(await loadDispatchWire(sql)), ...(await loadNurtureWire(sql)), ...activations.map(activation => ({
      id: activation.id,
      type: "territory_live",
      shopName: `${activation.businessName} · ${activation.planName} · live`,
      slug: activation.leadSlug,
      createdAt: activation.createdAt
    }))]),
    activations,
    outreach,
    database: dbSource === "neon" ? "postgres" as const : "memory" as const,
    shops: shops.map(shop => ({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      niche: shop.niche,
      showcase: Boolean(shop.is_showcase),
      status: shop.is_showcase ? "showcase" : shop.billing_status ?? "no billing",
      ownerEmail: shop.owner_email ?? "",
      createdAt: stamp(shop.created_at)
    })),
    attribution: counties.map(county => ({
      county: county.county,
      tradeType: county.trade_type,
      tradeLabel: tradeLabel(county.trade_type, county.trade_label ?? ""),
      leads: num(county.leads),
      claimed: num(county.claimed),
      hits: num(county.hits)
    })),
    hits: recentHits.map(hit => ({
      id: hit.id,
      leadSlug: hit.lead_slug,
      utmSource: hit.utm_source,
      county: hit.county,
      becameShop: Boolean(hit.shop_id),
      createdAt: stamp(hit.created_at)
    }))
  };
};
type LeadDraft = {
  businessName: string;
  tradeType: string;
  city: string;
  county: string;
  leadSlug: string;
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  reviewScore: number | null;
  reviewCount: number | null;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
  tradeLabel: string;
};
export const addPreloadedLeadsHandler = async ({
  data,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  const saved: LeadDraft[] = [];
  for (const lead of data.leads) {
    let slug = lead.leadSlug;
    for (let n = 2; n < 50; n += 1) {
      const taken = await sql<{
        lead_slug: string;
      }>`
          select lead_slug from preloaded_leads where lead_slug = ${slug} limit 1
        `;
      if (!taken[0]) break;
      slug = `${lead.leadSlug.slice(0, 58)}-${n}`;
    }
    await writePreloadedLead(sql, lead, slug);
    saved.push({
      ...lead,
      leadSlug: slug
    });
  }
  return {
    leads: saved
  };
};
export type OutreachFunnelRow = {
  id?: string;
  leadSlug: string;
  businessName: string;
  niche: string;
  contact: string;
  city: string;
  path: string;
  opened: boolean;
  tested: boolean;
  converted: boolean;
  createdAt: string;
};
export const createOutreachFunnelHandler = async ({
  data,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const lead = cleanLead({
    businessName: data.businessName,
    tradeType: data.niche,
    city: data.city,
    county: data.county,
    contactEmail: data.email,
    contactPhone: data.phone
  });
  const sql = await getSql();
  let slug = lead.leadSlug;
  for (let n = 2; n < 50; n += 1) {
    const taken = await sql<{
      lead_slug: string;
    }>`
        select lead_slug from preloaded_leads where lead_slug = ${slug} limit 1
      `;
    if (!taken[0]) break;
    slug = `${lead.leadSlug.slice(0, 58)}-${n}`;
  }
  try {
    await sql`
        insert into preloaded_leads (
          id, business_name, trade_type, trade_label, city, county, lead_slug, claimed,
          contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line, source
        ) values (
          ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.tradeLabel}, ${lead.city},
          ${lead.county}, ${slug}, false, ${lead.contactEmail}, ${lead.contactPhone},
          ${lead.contactName}, ${lead.reviewScore}, ${lead.reviewCount}, ${lead.hasWebsite}, ${lead.phoneLine},
          ${"desk"}
        )
      `;
  } catch (err) {
    if (!missingRelation(err, "source")) throw err;
    await writePreloadedLead(sql, lead, slug);
  }
  const path = deskPreviewPath({
    leadSlug: slug,
    county: lead.county,
    city: lead.city,
    businessName: lead.businessName,
    trade: lead.tradeLabel || lead.tradeType
  });
  return {
    leadSlug: slug,
    path,
    businessName: lead.businessName,
    niche: lead.tradeLabel || lead.tradeType
  };
};
export const listOutreachFunnelsHandler = async ({
  context
}: any): Promise<OutreachFunnelRow[]> => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  try {
    const rows = await sql<{
      lead_slug: string;
      business_name: string;
      trade_label: string;
      trade_type: string;
      contact_email: string;
      contact_phone: string;
      city: string;
      county: string;
      id: string;
      claimed: boolean;
      account_mode: string;
      created_at: string;
      opens: number;
      trials: number;
      audits: number;
      subscribed: boolean;
    }>`
        select l.id, l.lead_slug, l.business_name, l.trade_label, l.trade_type, l.contact_email, l.contact_phone,
          l.city, l.county, l.claimed, l.account_mode, l.created_at,
          (select count(*)::int from funnel_visits v where v.lead_slug = l.lead_slug) as opens,
          (select count(*)::int from funnel_visits v where v.lead_slug = l.lead_slug and v.utm_source = 'snap') as trials,
          (select count(*)::int from lead_audits a where a.lead_slug = l.lead_slug) as audits,
          exists(select 1 from territory_activations t where t.lead_slug = l.lead_slug) as subscribed
        from preloaded_leads l
        where l.source = 'desk'
        order by l.created_at desc
        limit 40
      `;
    return rows.map(row => ({
      id: row.id,
      leadSlug: row.lead_slug,
      businessName: row.business_name,
      niche: row.trade_label || row.trade_type,
      contact: row.contact_email || row.contact_phone,
      city: row.city,
      path: deskPreviewPath({
        leadSlug: row.lead_slug,
        leadId: row.id,
        county: row.county,
        city: row.city,
        businessName: row.business_name,
        trade: row.trade_label || row.trade_type
      }),
      opened: Number(row.opens) > 0,
      tested: Number(row.trials) > 0 || Number(row.audits) > 0,
      converted: Boolean(row.claimed) || Boolean(row.subscribed) || row.account_mode === "live",
      createdAt: stamp(row.created_at)
    }));
  } catch (err) {
    if (missingRelation(err, "source") || missingRelation(err, "lead_audits") || missingRelation(err, "account_mode") || missingRelation(err, "territory_activations")) {
      return [];
    }
    throw err;
  }
};
async function writePreloadedLead(sql: Awaited<ReturnType<typeof getSql>>, lead: LeadDraft, slug: string) {
  try {
    await sql`
      insert into preloaded_leads (
        id, business_name, trade_type, trade_label, city, county, lead_slug, claimed,
        contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line
      ) values (
        ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.tradeLabel}, ${lead.city},
        ${lead.county}, ${slug}, false, ${lead.contactEmail}, ${lead.contactPhone},
        ${lead.contactName}, ${lead.reviewScore}, ${lead.reviewCount}, ${lead.hasWebsite}, ${lead.phoneLine}
      )
    `;
  } catch (err) {
    if (missingRelation(err, "trade_label")) {
      await writePreloadedLeadLegacy(sql, lead, slug);
      return;
    }
    if (!missingRelation(err, "contact_name") && !missingRelation(err, "contact_email")) throw err;
    if (missingRelation(err, "contact_name")) {
      try {
        await sql`
          insert into preloaded_leads (
            id, business_name, trade_type, city, county, lead_slug, claimed, contact_email, contact_phone
          ) values (
            ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
            ${lead.county}, ${slug}, false, ${lead.contactEmail}, ${lead.contactPhone}
          )
        `;
      } catch (older) {
        if (!missingRelation(older, "contact_email")) throw older;
        await sql`
          insert into preloaded_leads (
            id, business_name, trade_type, city, county, lead_slug, claimed
          ) values (
            ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
            ${lead.county}, ${slug}, false
          )
        `;
      }
    } else {
      await sql`
        insert into preloaded_leads (
          id, business_name, trade_type, city, county, lead_slug, claimed
        ) values (
          ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
          ${lead.county}, ${slug}, false
        )
      `;
    }
  }
}
async function writePreloadedLeadLegacy(sql: Awaited<ReturnType<typeof getSql>>, lead: LeadDraft, slug: string) {
  try {
    await sql`
      insert into preloaded_leads (
        id, business_name, trade_type, city, county, lead_slug, claimed,
        contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line
      ) values (
        ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
        ${lead.county}, ${slug}, false, ${lead.contactEmail}, ${lead.contactPhone},
        ${lead.contactName}, ${lead.reviewScore}, ${lead.reviewCount}, ${lead.hasWebsite}, ${lead.phoneLine}
      )
    `;
  } catch (err) {
    if (!missingRelation(err, "contact_name") && !missingRelation(err, "contact_email")) throw err;
    if (missingRelation(err, "contact_name")) {
      try {
        await sql`
          insert into preloaded_leads (
            id, business_name, trade_type, city, county, lead_slug, claimed, contact_email, contact_phone
          ) values (
            ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
            ${lead.county}, ${slug}, false, ${lead.contactEmail}, ${lead.contactPhone}
          )
        `;
      } catch (older) {
        if (!missingRelation(older, "contact_email")) throw older;
        await sql`
          insert into preloaded_leads (
            id, business_name, trade_type, city, county, lead_slug, claimed
          ) values (
            ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
            ${lead.county}, ${slug}, false
          )
        `;
      }
      return;
    }
    await sql`
      insert into preloaded_leads (
        id, business_name, trade_type, city, county, lead_slug, claimed
      ) values (
        ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
        ${lead.county}, ${slug}, false
      )
    `;
  }
}
export const preloadRegionalRosterHandler = async ({
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  const leads = homeRegionLeads().map(lead => cleanLead(lead));
  let inserted = 0;
  let skipped = 0;
  for (const lead of leads) {
    const taken = await sql<{
      lead_slug: string;
    }>`
        select lead_slug from preloaded_leads where lead_slug = ${lead.leadSlug} limit 1
      `;
    if (taken[0]) {
      skipped += 1;
      if (lead.contactEmail) {
        try {
          await sql`
              update preloaded_leads
              set contact_email = ${lead.contactEmail}
              where lead_slug = ${lead.leadSlug} and contact_email = ''
            `;
        } catch (err) {
          if (!missingRelation(err, "contact_email")) throw err;
        }
      }
      continue;
    }
    await writePreloadedLead(sql, lead, lead.leadSlug);
    inserted += 1;
  }
  return {
    region: HOME_REGION_LABEL,
    county: HOME_REGION_COUNTIES[0],
    counties: [...HOME_REGION_COUNTIES],
    inserted,
    skipped,
    total: leads.length,
    niches: new Set(leads.map(lead => lead.tradeType)).size
  };
};
export const generateRegionalFunnelHandler = async ({
  data,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    business_name: string;
    city: string;
    county: string;
    trade_type: string;
    lead_slug: string;
  }>`
      select id, business_name, city, county, trade_type, lead_slug
      from preloaded_leads
      where claimed = false
        and trade_type = ${data.tradeType}
        and lower(county) = lower(${data.county})
      order by business_name asc
      limit 200
    `;
  const origin = await requestOrigin();
  return {
    county: data.county,
    tradeType: data.tradeType,
    links: rows.map(row => ({
      id: row.id,
      businessName: row.business_name,
      city: row.city,
      county: row.county,
      tradeType: row.trade_type,
      leadSlug: row.lead_slug,
      url: outreachDestination(origin, {
        businessName: row.business_name,
        tradeType: row.trade_type,
        county: row.county,
        leadSlug: row.lead_slug,
        leadId: row.id,
        city: row.city
      })
    }))
  };
};
type OutreachLead = {
  id?: string;
  businessName: string;
  city: string;
  county: string;
  tradeType: string;
  leadSlug: string;
  url: string;
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  reviewScore: number | null;
  reviewCount: number | null;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
  claimed: boolean;
  accountMode: "simulation" | "live";
  tradeLabel: string;
};
async function leadsInRegion(sql: Awaited<ReturnType<typeof getSql>>, county: string, tradeType: string, origin: string): Promise<OutreachLead[]> {
  const map = (rows: {
    id?: string;
    business_name: string;
    city: string;
    county: string;
    trade_type: string;
    lead_slug: string;
    claimed: boolean;
    contact_email?: string;
    contact_phone?: string;
    contact_name?: string | null;
    review_score?: unknown;
    review_count?: unknown;
    has_website?: unknown;
    phone_line?: string | null;
    account_mode?: string | null;
    trade_label?: string | null;
  }[]) => rows.map(row => {
    const facts = publicLeadFromRow(row);
    return {
      id: row.id,
      businessName: row.business_name,
      city: row.city,
      county: row.county,
      tradeType: row.trade_type,
      tradeLabel: tradeLabel(row.trade_type, row.trade_label ?? ""),
      leadSlug: row.lead_slug,
      url: outreachDestination(origin, {
        businessName: row.business_name,
        tradeType: row.trade_type,
        tradeLabel: row.trade_label ?? "",
        county: row.county,
        leadSlug: row.lead_slug,
        leadId: row.id,
        city: row.city,
        trade: tradeLabel(row.trade_type, row.trade_label ?? ""),
        greet: true
      }),
      contactEmail: row.contact_email ?? "",
      contactPhone: row.contact_phone ?? "",
      ...facts,
      claimed: Boolean(row.claimed),
      accountMode: row.account_mode === "live" ? "live" as const : "simulation" as const
    };
  });
  try {
    const rows = await sql<{
      id: string;
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      lead_slug: string;
      claimed: boolean;
      contact_email: string;
      contact_phone: string;
      contact_name: string;
      review_score: unknown;
      review_count: unknown;
      has_website: boolean | null;
      phone_line: string;
      account_mode: string;
      trade_label: string;
    }>`
      select id, business_name, city, county, trade_type, trade_label, lead_slug, claimed,
        contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line,
        account_mode
      from preloaded_leads
      where lower(county) = lower(${county})
        and (${tradeType} = 'all' or trade_type = ${tradeType})
      order by business_name asc
      limit 500
    `;
    return map(rows);
  } catch (err) {
    if (missingRelation(err, "trade_label")) {
      const rows = await sql<{
        business_name: string;
        city: string;
        county: string;
        trade_type: string;
        lead_slug: string;
        claimed: boolean;
        contact_email: string;
        contact_phone: string;
        contact_name: string;
        review_score: unknown;
        review_count: unknown;
        has_website: boolean | null;
        phone_line: string;
        account_mode: string;
      }>`
        select business_name, city, county, trade_type, lead_slug, claimed,
          contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line,
          account_mode
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 500
      `;
      return map(rows);
    }
    if (missingRelation(err, "account_mode")) {
      const rows = await sql<{
        business_name: string;
        city: string;
        county: string;
        trade_type: string;
        lead_slug: string;
        claimed: boolean;
        contact_email: string;
        contact_phone: string;
        contact_name: string;
        review_score: unknown;
        review_count: unknown;
        has_website: boolean | null;
        phone_line: string;
      }>`
        select business_name, city, county, trade_type, lead_slug, claimed,
          contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 200
      `;
      return map(rows);
    }
    if (missingRelation(err, "contact_name")) {
      const rows = await sql<{
        business_name: string;
        city: string;
        county: string;
        trade_type: string;
        lead_slug: string;
        claimed: boolean;
        contact_email: string;
        contact_phone: string;
      }>`
        select business_name, city, county, trade_type, lead_slug, claimed, contact_email, contact_phone
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 200
      `;
      return map(rows);
    }
    if (!missingRelation(err, "contact_email")) throw err;
    const rows = await sql<{
      business_name: string;
      city: string;
      county: string;
      trade_type: string;
      lead_slug: string;
      claimed: boolean;
    }>`
      select business_name, city, county, trade_type, lead_slug, claimed
      from preloaded_leads
      where lower(county) = lower(${county})
        and (${tradeType} = 'all' or trade_type = ${tradeType})
      order by business_name asc
      limit 200
    `;
    return map(rows);
  }
}
type FollowLoop = {
  id: string;
  channel: "email" | "sms";
  status: "active" | "stopped" | "complete";
  reason: string;
  strategy: string;
  touches: {
    day: number;
    label: string;
    status: "sent" | "scheduled" | "skipped";
    scheduledAt: string;
  }[];
};
function slugList(slugs: string[]): string {
  return [...new Set(slugs.filter(slug => isLeadSlug(slug)))].join(",");
}
async function reconcileFollowUps(sql: Awaited<ReturnType<typeof getSql>>, slugs: string[]) {
  const list = slugList(slugs);
  if (!list) return;
  await sql`
    update outreach_touches
    set status = 'skipped'
    where status = 'scheduled'
      and sequence_id in (
        select id from outreach_sequences
        where status = 'stopped'
          and lead_slug = any(string_to_array(${list}, ','))
      )
  `;
  await sql`
    update outreach_sequences s
    set status = 'complete', stopped_reason = ''
    where s.status = 'active'
      and s.lead_slug = any(string_to_array(${list}, ','))
      and not exists (
        select 1 from outreach_touches t
        where t.sequence_id = s.id and t.status = 'scheduled'
      )
  `;
}
async function loadFollowUps(sql: Awaited<ReturnType<typeof getSql>>, slugs: string[]): Promise<Map<string, FollowLoop[]>> {
  const grouped = new Map<string, FollowLoop[]>();
  const list = slugList(slugs);
  if (!list) return grouped;
  try {
    await reconcileFollowUps(sql, slugs);
  } catch (err) {
    if (missingRelation(err, "outreach_sequences") || missingRelation(err, "outreach_touches")) return grouped;
    throw err;
  }
  const clickedRows = await sql<{
    lead_slug: string;
  }>`
    select distinct lead_slug from funnel_visits
    where verified = true
      and lead_slug <> ''
      and lead_slug = any(string_to_array(${list}, ','))
  `;
  const clicked = new Set(clickedRows.map(row => row.lead_slug));
  const rows = await sql<{
    id: string;
    lead_slug: string;
    channel: string;
    status: string;
    stopped_reason: string;
    strategy: string;
    step: number;
    label: string;
    touch_status: string;
    scheduled_at: unknown;
  }>`
    select s.id, s.lead_slug, s.channel, s.status, s.stopped_reason, s.strategy,
      t.step, t.label, t.status as touch_status, t.scheduled_at
    from outreach_sequences s
    join outreach_touches t on t.sequence_id = s.id
    where s.lead_slug = any(string_to_array(${list}, ','))
    order by s.created_at asc, t.step asc
  `;
  const byId = new Map<string, FollowLoop & {
    leadSlug: string;
  }>();
  for (const row of rows) {
    const channel = row.channel === "sms" ? "sms" : "email";
    const touchStatus = row.touch_status === "sent" || row.touch_status === "skipped" ? row.touch_status : "scheduled";
    let loop = byId.get(row.id);
    if (!loop) {
      loop = {
        id: row.id,
        leadSlug: row.lead_slug,
        channel,
        status: row.status === "stopped" ? "stopped" : "active",
        reason: row.stopped_reason,
        strategy: row.strategy,
        touches: []
      };
      byId.set(row.id, loop);
    }
    loop.touches.push({
      day: num(row.step),
      label: row.label,
      status: touchStatus,
      scheduledAt: stamp(row.scheduled_at)
    });
  }
  for (const loop of byId.values()) {
    const status = loop.status === "stopped" || clicked.has(loop.leadSlug) ? "stopped" : nurtureStatus({
      clicked: false,
      touches: loop.touches
    });
    if (status === "none") continue;
    const ready: FollowLoop = {
      id: loop.id,
      channel: loop.channel,
      status,
      reason: status === "stopped" ? "clicked" : loop.reason,
      strategy: loop.strategy,
      touches: loop.touches
    };
    const listForLead = grouped.get(loop.leadSlug) ?? [];
    listForLead.push(ready);
    grouped.set(loop.leadSlug, listForLead);
  }
  return grouped;
}
async function enrollFollowUps(sql: Awaited<ReturnType<typeof getSql>>, input: {
  campaignId: string;
  channel: "email" | "sms";
  county: string;
  tradeType: string;
  strategy: string;
  text: string;
  emailSubject: string;
  emailBody: string;
  leads: string[];
  releaseAt?: Map<string, string>;
  audience?: OutreachLead[];
  stopTokens?: Map<string, string>;
  timing?: SendTiming;
}): Promise<{
  enrolled: number;
  skippedClicked: number;
  alreadyLooping: number;
}> {
  const slugs = slugList(input.leads).split(",").filter(Boolean);
  if (slugs.length === 0) return {
    enrolled: 0,
    skippedClicked: 0,
    alreadyLooping: 0
  };
  await reconcileFollowUps(sql, slugs);
  const list = slugs.join(",");
  const clickedRows = await sql<{
    lead_slug: string;
  }>`
    select distinct lead_slug from funnel_visits
    where verified = true
      and lead_slug <> ''
      and lead_slug = any(string_to_array(${list}, ','))
  `;
  const clicked = new Set(clickedRows.map(row => row.lead_slug));
  const activeRows = await sql<{
    lead_slug: string;
  }>`
    select lead_slug from outreach_sequences
    where status = 'active'
      and channel = ${input.channel}
      and lead_slug = any(string_to_array(${list}, ','))
  `;
  const active = new Set(activeRows.map(row => row.lead_slug));
  const timing = parseSendTiming(input.timing);
  const plan = followUpSchedule(new Date());
  let enrolled = 0;
  let skippedClicked = 0;
  let alreadyLooping = 0;
  for (const slug of slugs) {
    if (clicked.has(slug)) {
      skippedClicked += 1;
      continue;
    }
    if (active.has(slug)) {
      alreadyLooping += 1;
      continue;
    }
    const sequenceId = newId("seq");
    const stopToken = input.stopTokens?.get(slug) ?? "";
    const stopHash = stopToken ? await hashStopToken(stopToken) : "";
    const lead = input.audience?.find(item => item.leadSlug === slug);
    const leadTrade = lead?.tradeType || input.tradeType;
    const profile = timing === "smart" ? timingProfileFor(leadTrade) : "general";
    const anchorIso = input.releaseAt?.get(slug) ?? plan[0]?.scheduledAt ?? new Date().toISOString();
    const anchor = new Date(anchorIso);
    await sql`
      insert into outreach_sequences (
        id, lead_slug, campaign_id, channel, county, trade_type, strategy, status, stop_token_hash, timing
      ) values (
        ${sequenceId}, ${slug}, ${input.campaignId}, ${input.channel},
        ${input.county}, ${leadTrade}, ${input.strategy}, ${"active"}, ${stopHash}, ${timing}
      )
    `;
    for (const step of plan) {
      const nominal = new Date(anchor.getTime() + step.day * 86_400_000);
      const scheduledAt = step.day === 0 || Number.isNaN(nominal.getTime()) ? anchorIso : nextSendInstant(nominal, timing, profile).toISOString();
      const status = step.day === 0 ? "scheduled" : step.status;
      const template = followUpBody(step.day, input.channel, input);
      const body = lead ? renderOutreachMessage(template, {
        business: lead.businessName,
        url: lead.url,
        trade: tradeLabel(lead.tradeType, lead.tradeLabel),
        county: lead.county,
        city: lead.city,
        ...outreachPublicTokens(lead, lead.businessName)
      }) : template;
      await sql`
        insert into outreach_touches (id, sequence_id, step, label, status, scheduled_at, body)
        values (
          ${newId("tch")}, ${sequenceId}, ${step.day}, ${step.label}, ${status},
          ${scheduledAt}, ${body}
        )
      `;
    }
    enrolled += 1;
  }
  return {
    enrolled,
    skippedClicked,
    alreadyLooping
  };
}
export const previewOutreachHandler = async ({
  data,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  const leads = await leadsInRegion(sql, data.county, data.tradeType, await requestOrigin());
  const loops = await loadFollowUps(sql, leads.map(lead => lead.leadSlug));
  return {
    county: data.county,
    tradeType: data.tradeType,
    leads: leads.map(lead => ({
      ...lead,
      followUps: loops.get(lead.leadSlug) ?? []
    }))
  };
};
function outboundFor(lead: OutreachLead, channel: "email" | "sms", draft: {
  text: string;
  emailSubject: string;
  emailBody: string;
}): {
  leadSlug: string;
  to: string;
  subject: string;
  body: string;
} {
  const tokens = {
    business: lead.businessName,
    url: lead.url,
    trade: tradeLabel(lead.tradeType, lead.tradeLabel),
    county: lead.county,
    city: lead.city,
    ...outreachPublicTokens(lead, lead.businessName)
  };
  if (channel === "sms") {
    return {
      leadSlug: lead.leadSlug,
      to: toE164(lead.contactPhone) ?? lead.contactPhone,
      subject: "",
      body: renderOutreachMessage(draft.text, tokens).slice(0, 640)
    };
  }
  return {
    leadSlug: lead.leadSlug,
    to: lead.contactEmail,
    subject: renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200),
    body: renderOutreachMessage(draft.emailBody, tokens).slice(0, 4000)
  };
}
export const launchOutreachBatchHandler = async ({
  data,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const queue = await import("./outreach-queue.server");
  const config = queue.readOutreachConfig();
  if (config.mode === "live") {
    const {
      missingOutreachCredentials
    } = await import("./notify.server");
    const missing = missingOutreachCredentials();
    if (missing.length > 0) throw new Error(`Live outreach needs ${missing.join(", ")}`);
  }
  const sql = await getSql();
  const leads = await leadsInRegion(sql, data.county, data.tradeType, await requestOrigin());
  const channel = data.channel === "sms" ? "sms" : "email";
  const batch = leads.filter(lead => {
    if (lead.claimed) return false;
    return channel === "sms" ? isSmsReady(lead.phoneLine) : isEmailReady(lead.contactEmail);
  });
  if (batch.length === 0) {
    throw new Error(channel === "sms" ? "No SMS-ready leads in that list" : "No email-ready leads in that list");
  }
  const origin = await requestOrigin();
  const stopTokens = new Map(batch.map(lead => [lead.leadSlug, newStopToken()] as const));
  const tracked = batch.map(lead => ({
    ...lead,
    url: outreachDestination(origin, {
      businessName: lead.businessName,
      tradeType: lead.tradeType,
      tradeLabel: lead.tradeLabel,
      county: lead.county,
      leadSlug: lead.leadSlug,
      city: lead.city,
      stopToken: stopTokens.get(lead.leadSlug),
      greet: true,
      trade: tradeLabel(lead.tradeType, lead.tradeLabel)
    })
  }));
  const started = new Date();
  const chunks = planSmartChunks(tracked, {
    chunkSize: config.chunkSize,
    intervalSeconds: config.intervalSeconds,
    start: started,
    timing: data.timing
  }).map(chunk => ({
    ...chunk,
    messages: chunk.items.map(lead => outboundFor(lead, channel, {
      text: data.text,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody
    }))
  }));
  const id = newId("cmp");
  await sql`
      insert into outreach_campaigns (id, county, trade_type, lead_count, status, template)
      values (${id}, ${data.county}, ${data.tradeType}, ${batch.length}, ${config.mode}, ${data.template})
    `;
  for (const chunk of chunks) {
    await sql`
        insert into outreach_dispatches (
          id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
          interval_seconds, payload, status, scheduled_at, county, timing, profile
        ) values (
          ${newId("dsp")}, ${id}, ${channel}, ${config.mode}, ${chunk.index}, ${chunks.length},
          ${chunk.messages.length}, ${config.intervalSeconds}, ${JSON.stringify(chunk.messages)},
          ${"queued"}, ${chunk.scheduledAt}, ${data.county}, ${data.timing}, ${chunk.profile}
        )
      `;
  }
  const releaseAt = new Map(chunks.flatMap(chunk => chunk.items.map(lead => [lead.leadSlug, chunk.scheduledAt] as const)));
  const nurture = await enrollFollowUps(sql, {
    campaignId: id,
    channel,
    county: data.county,
    tradeType: data.tradeType,
    strategy: data.strategy,
    text: data.text,
    emailSubject: data.emailSubject,
    emailBody: data.emailBody,
    leads: tracked.map(lead => lead.leadSlug),
    releaseAt,
    audience: tracked,
    stopTokens,
    timing: data.timing
  });
  queue.ensureOutreachWorker();
  const drained = await queue.drainOutreachQueue(sql);
  return {
    id,
    county: data.county,
    tradeType: data.tradeType,
    channel,
    leadCount: batch.length,
    strategy: data.strategy,
    queue: "trickle" as const,
    status: config.mode,
    mode: config.mode,
    intervalSeconds: config.intervalSeconds,
    chunkSize: config.chunkSize,
    chunks: chunks.length,
    timing: data.timing,
    firstAt: chunks[0]?.scheduledAt ?? null,
    released: drained.released ? 1 : 0,
    enrolled: nurture.enrolled,
    skippedClicked: nurture.skippedClicked,
    alreadyLooping: nurture.alreadyLooping
  };
};
const quietHit = {
  logged: false,
  businessName: "",
  tradeType: "",
  county: "",
  city: "",
  claimed: false,
  limited: false
};
export const ensureFunnelSessionHandler = async (_ctx?: unknown) => {
  const guard = await import("./funnel-guard.server");
  guard.ensureFunnelCookie();
  return {
    ready: true as const
  };
};
export const recordFunnelHitHandler = async ({
  data
}: any) => {
  if (!data.leadSlug && !data.utmSource && !data.county) return quietHit;
  const {
    getRequest
  } = await import("@tanstack/react-start/server");
  const guard = await import("./funnel-guard.server");
  const request = getRequest();
  if (!guard.requestHasFunnelSession(request)) return quietHit;
  const sql = await getSql();
  const key = guard.clientKey(request);
  if (!(await guard.funnelHitAllowed(sql, key, data.leadSlug))) return {
    ...quietHit,
    limited: true
  };
  const known = data.leadSlug ? await sql<{
    business_name: string;
    trade_type: string;
    county: string;
    city: string;
    claimed: boolean;
  }>`
          select business_name, trade_type, county, city, claimed
          from preloaded_leads
          where lead_slug = ${data.leadSlug}
          limit 1
        ` : [];
  const lead = known[0];
  const county = data.county || lead?.county || "";
  let verified = false;
  if (data.leadSlug && data.stopToken) {
    try {
      verified = (await guard.stopSequencesForToken(sql, data.leadSlug, data.stopToken)) > 0;
    } catch (err) {
      if (!missingRelation(err, "stop_token_hash") && !missingRelation(err, "outreach_sequences")) throw err;
    }
  }
  await sql`
      insert into funnel_visits (id, lead_slug, utm_source, county, landed_path, verified, client_key)
      values (
        ${newId("fun")},
        ${data.leadSlug},
        ${data.utmSource},
        ${county},
        ${"/"},
        ${verified},
        ${key}
      )
    `;
  return {
    logged: true,
    businessName: lead?.business_name ?? "",
    tradeType: lead?.trade_type ?? "",
    county,
    city: lead?.city ?? "",
    claimed: Boolean(lead?.claimed),
    limited: false
  };
};
export const recordMasterDeskOpenHandler = async ({
  data: slug,
  context
}: any) => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  const shops = await sql<{
    id: string;
  }>`
      select id from shops where slug = ${slug} limit 1
    `;
  const shop = shops[0];
  if (!shop) throw new Error("Shop not found");
  await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${shop.id}, 'master_desk', ${"open"})
    `;
  return {
    ok: true as const
  };
};
export const getLeadPreviewHandler = async ({
  data
}: any) => {
  const territory = await import("./territory.server");
  const lead = await territory.readLeadPreview(data);
  if (!lead) throw new Error("Unknown business");
  return lead;
};
export const beginTerritoryCheckoutHandler = async ({
  data
}: any) => {
  const {
    getRequest
  } = await import("@tanstack/react-start/server");
  const guard = await import("./funnel-guard.server");
  if (!guard.requestHasFunnelSession(getRequest())) {
    throw new Error("Reload this page, then choose a plan again");
  }
  const {
    territoryPlan
  } = await import("./pricing");
  const plan = territoryPlan(data.planId);
  if (!plan) throw new Error("Unknown plan");
  const payments = await import("./payments.server");
  if (!payments.stripeConfigured()) throw new Error("Card checkout is not configured");
  const processor = "stripe" as const;
  const territory = await import("./territory.server");
  const opened = await territory.openTerritoryCheckout(data.leadSlug, plan.id, processor);
  try {
    const origin = await requestOrigin();
    let userId = "";
    try {
      const {
        getSessionUser
      } = await import("@/lib/auth/verify.server");
      const buyer = await getSessionUser();
      if (buyer?.id && buyer.id !== "dev-user") userId = buyer.id;
    } catch {
      // A signed-out buyer can still pay. The shop opens once their account matches.
    }
    const session = await payments.createTerritoryCheckout({
      leadSlug: data.leadSlug,
      checkoutId: opened.checkoutId,
      planId: plan.id,
      planName: plan.name,
      amountCents: plan.amountCents,
      cadence: plan.cadence,
      origin,
      userId
    });
    return {
      checkoutId: opened.checkoutId,
      processor,
      url: session.url
    };
  } catch (err) {
    const sql = await getSql();
    await sql`delete from territory_checkouts where id = ${opened.checkoutId} and status = 'pending'`;
    throw err instanceof Error ? err : new Error("Card checkout did not start");
  }
};
export const finishTerritoryCheckoutHandler = async ({
  data
}: any) => {
  const {
    getRequest
  } = await import("@tanstack/react-start/server");
  const guard = await import("./funnel-guard.server");
  if (!guard.requestHasFunnelSession(getRequest())) {
    throw new Error("Reload this page, then choose a plan again");
  }
  const territory = await import("./territory.server");
  return territory.finishDeskCheckout(data.checkoutId, data.paymentRef);
};
export const confirmTerritorySessionHandler = async ({
  data
}: any) => {
  const payments = await import("./payments.server");
  return payments.settleTerritorySession(data);
};
export type PlatformPulse = {
  id: string;
  type: string;
  shopName: string;
  detail: string;
  createdAt: string;
};
export const listPlatformPulseHandler = async ({
  context
}: any): Promise<PlatformPulse[]> => {
  await assertPlatformOwner(context.userId);
  const sql = await getSql();
  try {
    const rows = await sql<{
      id: string;
      type: string;
      shop_name: string;
      detail: string | null;
      created_at: string;
    }>`
      select id, type, shop_name, detail, created_at from (
        select e.id, e.type, s.name as shop_name, e.payload as detail, e.created_at
        from shop_events e
        join shops s on s.id = e.shop_id
        where e.type in (
          'booking_request', 'booking_confirmed', 'payment_received', 'audit_request', 'audit_confirmed'
        )
        union all
        select a.id, 'audit_request', coalesce(s.name, a.lead_slug), a.summary, a.created_at
        from lead_audits a
        left join shops s on s.id = a.shop_id
        where a.shop_id is null
      ) pulse
      order by created_at desc
      limit 12
    `;
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      shopName: row.shop_name,
      detail: (row.detail ?? "").replace(/^aud_[a-z0-9]+\|/i, ""),
      createdAt: stamp(row.created_at)
    }));
  } catch {
    return [];
  }
};
