import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, withTransaction } from "@/lib/db";
import { presetForShopNiche } from "@/config/nichePresets";
import { cityFromAddress, placeFromCityLine } from "./avatar";
import { campaignOutcome, consumerLeadChannel, consumerOutreachCopy } from "./consumer-outreach";
import { isPlatformOwner } from "./platform-owner.server";

const DAILY_BATCH = 25;

export type TenantLead = {
  id: string;
  consumerName: string;
  consumerContact: string;
  note: string;
  scannedOn: string;
  status: "new" | "contacted";
};

type LeadRow = {
  id: string;
  consumer_name: string;
  consumer_contact: string;
  note: string;
  scanned_on: string | Date;
  status: string | null;
};

function mapLead(row: LeadRow): TenantLead {
  const scanned = row.scanned_on instanceof Date ? row.scanned_on.toISOString().slice(0, 10) : String(row.scanned_on).slice(0, 10);
  return {
    id: row.id,
    consumerName: row.consumer_name,
    consumerContact: row.consumer_contact,
    note: row.note,
    scannedOn: scanned,
    status: row.status === "contacted" ? "contacted" : "new",
  };
}

type ShopGate = {
  id: string;
  name: string;
  niche: string;
  address: string;
  is_showcase: boolean;
  owner_user_id: string | null;
};

async function shopForScan(slug: string, userId: string): Promise<ShopGate & { city: string }> {
  const sql = await getSql();
  const shops = await sql<ShopGate>`
    select id, name, niche, address, is_showcase, owner_user_id
    from shops
    where slug = ${slug}
    limit 1
  `;
  const shop = shops[0];
  if (!shop) throw new Error("Shop not found");
  const members = await sql<{ role: string }>`
    select role from shop_members
    where shop_id = ${shop.id} and user_id = ${userId}
    limit 1
  `;
  const owner = members[0]?.role === "owner" || shop.owner_user_id === userId;
  const platform = owner ? false : await isPlatformOwner(userId);
  if (!owner && !platform && !shop.is_showcase) throw new Error("Forbidden");
  const city = placeFromCityLine(cityFromAddress(shop.address));
  if (!city) throw new Error("Add a city to the shop address before scanning");
  return { ...shop, city };
}

async function readQueue(slug: string): Promise<TenantLead[]> {
  const sql = await getSql();
  const rows = await sql<LeadRow>`
    select id::text as id,
           business_name as consumer_name,
           coalesce(nullif(consumer_contact, ''), nullif(email, ''), nullif(phone, ''), '') as consumer_contact,
           coalesce(note, '') as note,
           coalesce(scanned_on, created_at::date) as scanned_on,
           status
    from tenant_leads
    where tenant_slug = ${slug}
    order by created_at desc
    limit 40
  `;
  return rows.map(mapLead);
}

/** The shop's saved queue. Does not pull a new batch. */
export const listTenantLeads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((slug: string) => {
    const value = String(slug ?? "").trim();
    if (!value) throw new Error("Shop not found");
    return value;
  })
  .handler(async ({ data: slug, context }) => {
    const shop = await shopForScan(slug, context.userId);
    return { city: shop.city, niche: shop.niche, leads: await readQueue(slug) };
  });

/**
 * Pull today's prospects for this shop's niche and city into tenant_leads.
 * A prospect already on the queue is left as-is. The batch is the rows dated today.
 */
export const scanTenantProspects = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((slug: string) => {
    const value = String(slug ?? "").trim();
    if (!value) throw new Error("Shop not found");
    return value;
  })
  .handler(async ({ data: slug, context }) => {
    const shop = await shopForScan(slug, context.userId);
    const added = await withTransaction(async (sql) => {
      const rows = await sql<{ id: string }>`
        insert into tenant_leads (
          tenant_slug, business_name, category, phone, email, status,
          prospect_id, consumer_contact, note, scanned_on, niche, city
        )
        select ${slug},
               p.consumer_name,
               p.niche,
               case when position('@' in p.consumer_contact) = 0 then p.consumer_contact else null end,
               case when position('@' in p.consumer_contact) > 0 then p.consumer_contact else null end,
               'new',
               p.id,
               p.consumer_contact,
               p.note,
               current_date,
               p.niche,
               p.city
        from consumer_prospects p
        where lower(p.niche) = lower(${shop.niche})
          and lower(btrim(split_part(p.city, '·', 1))) = lower(${shop.city})
          and p.batch_date = current_date
          and not exists (
            select 1 from tenant_leads t
            where t.tenant_slug = ${slug} and t.prospect_id = p.id
          )
        order by p.created_at
        limit ${DAILY_BATCH}
        returning id::text as id
      `;
      return rows.length;
    });
    return {
      added,
      city: shop.city,
      niche: shop.niche,
      leads: await readQueue(slug),
    };
  });

const CAMPAIGN_CAP = 100;

type ClaimedLead = {
  id: string;
  consumer_name: string;
  email: string | null;
  phone: string | null;
  consumer_contact: string | null;
};

function claimedIds(rows: ClaimedLead[]): string {
  return rows
    .map((row) => row.id)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
    .join(",");
}

async function releaseClaim(slug: string, rows: ClaimedLead[]): Promise<void> {
  const list = claimedIds(rows);
  if (!list) return;
  const sql = await getSql();
  await sql`
    update tenant_leads
    set status = 'new'
    where tenant_slug = ${slug}
      and status = 'contacted'
      and id::text = any(string_to_array(${list}, ','))
  `;
}

async function bookUrlFor(slug: string): Promise<string> {
  try {
    const { requestOrigin } = await import("./payments.server");
    const origin = requestOrigin().replace(/\/$/, "");
    if (origin) return `${origin}/${slug}/book`;
  } catch {
    // A missing request still leaves a path the owner can recognize.
  }
  return `/${slug}/book`;
}

/**
 * Send today's campaign to every new lead on this shop's queue.
 * Simulation logs the send and marks them contacted. Live calls the provider,
 * and a lead that does not go out stays new so the next click can try again.
 */
export const sendTenantOutreach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((slug: string) => {
    const value = String(slug ?? "").trim();
    if (!value) throw new Error("Shop not found");
    return value;
  })
  .handler(async ({ data: slug, context }) => {
    const shop = await shopForScan(slug, context.userId);
    const claimed = await withTransaction(async (sql) => {
      return sql<ClaimedLead>`
        with picked as (
          select id from tenant_leads
          where tenant_slug = ${slug} and coalesce(status, 'new') = 'new'
          order by created_at
          limit ${CAMPAIGN_CAP}
          for update skip locked
        )
        update tenant_leads as lead
        set status = 'contacted'
        from picked
        where lead.id = picked.id
        returning lead.id::text as id,
                  lead.business_name as consumer_name,
                  lead.email,
                  lead.phone,
                  lead.consumer_contact
      `;
    });
    if (claimed.length === 0) {
      return { sent: 0, waiting: 0, leads: await readQueue(slug) };
    }

    const { readOutreachConfig } = await import("./outreach-queue.server");
    const mode = readOutreachConfig().mode;
    if (mode !== "live") {
      return { sent: claimed.length, waiting: 0, leads: await readQueue(slug) };
    }

    const { missingOutreachCredentials, deliverOutreachMessage } = await import("./notify.server");
    const missing = missingOutreachCredentials();
    if (missing.length > 0) {
      await releaseClaim(slug, claimed);
      throw new Error(`Live outreach needs ${missing.join(", ")}`);
    }

    const cta = presetForShopNiche(shop.niche).bookingCta;
    const bookUrl = await bookUrlFor(slug);
    const outcomes: { id: string; delivered: boolean }[] = [];
    for (const lead of claimed) {
      const channel = consumerLeadChannel(lead.email ?? "", lead.phone ?? "", lead.consumer_contact ?? "");
      if (!channel) {
        outcomes.push({ id: lead.id, delivered: false });
        continue;
      }
      const note = consumerOutreachCopy({
        shopName: shop.name,
        city: shop.city,
        consumerName: lead.consumer_name,
        bookingCta: cta,
        bookUrl,
      });
      const result = await deliverOutreachMessage({
        channel: channel.channel,
        to: channel.to,
        subject: note.subject,
        body: note.body,
      });
      outcomes.push({ id: lead.id, delivered: result.status === "sent" });
    }

    const outcome = campaignOutcome(mode, outcomes);
    const retry = claimed.filter((lead) => outcome.retryIds.includes(lead.id));
    await releaseClaim(slug, retry);
    return {
      sent: outcome.sent,
      waiting: retry.length,
      leads: await readQueue(slug),
    };
  });
