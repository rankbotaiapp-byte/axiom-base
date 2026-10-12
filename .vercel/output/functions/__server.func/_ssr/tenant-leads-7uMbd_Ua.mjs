import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc--phiu8Av.mjs";
import { a as getSql, o as withTransaction } from "./db-BbGQAJUy.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { t as presetForShopNiche } from "./nichePresets-BKzyhpZr.mjs";
import { i as outreachMayCallProviders } from "./outreach-queue-DUpdF-PE.mjs";
import { c as placeFromCityLine, i as cityFromAddress } from "./avatar-D6Yygk0d.mjs";
import { n as toE164, t as isNotifyEmail } from "./notify-target-BTgSqjpY.mjs";
import { isPlatformOwner } from "./platform-owner.server-DcNyU0Zn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tenant-leads-7uMbd_Ua.js
function consumerOutreachCopy(input) {
	const shop = input.shopName.trim() || "your local shop";
	const city = input.city.trim();
	const first = input.consumerName.trim().split(/\s+/)[0] || "there";
	const cta = input.bookingCta.trim() || "Book a time";
	return {
		subject: city ? `${shop} in ${city}` : shop,
		body: `Hi ${first}, ${shop} has time${city ? ` in ${city}` : ""}. ${cta}: ${input.bookUrl}`
	};
}
/** Email when the contact looks like one. Otherwise a dialable phone. */
function consumerLeadChannel(email, phone, contact) {
	const mail = [email, contact].map((value) => value.trim()).find((value) => isNotifyEmail(value));
	if (mail) return {
		channel: "email",
		to: mail
	};
	const dial = [phone, contact].map((value) => toE164(value)).find((value) => Boolean(value));
	if (dial) return {
		channel: "sms",
		to: dial
	};
	return null;
}
/**
* Simulation counts every claimed lead as sent and leaves them contacted.
* Live keeps contacted only when the provider accepted the message.
*/
function campaignOutcome(mode, rows) {
	if (!outreachMayCallProviders(mode)) return {
		sent: rows.length,
		retryIds: []
	};
	const retryIds = rows.filter((row) => !row.delivered).map((row) => row.id);
	return {
		sent: rows.length - retryIds.length,
		retryIds
	};
}
var DAILY_BATCH = 25;
function mapLead(row) {
	const scanned = row.scanned_on instanceof Date ? row.scanned_on.toISOString().slice(0, 10) : String(row.scanned_on).slice(0, 10);
	return {
		id: row.id,
		consumerName: row.consumer_name,
		consumerContact: row.consumer_contact,
		note: row.note,
		scannedOn: scanned,
		status: row.status === "contacted" ? "contacted" : "new"
	};
}
async function shopForScan(slug, userId) {
	const sql = await getSql();
	const shop = (await sql`
    select id, name, niche, address, is_showcase, owner_user_id
    from shops
    where slug = ${slug}
    limit 1
  `)[0];
	if (!shop) throw new Error("Shop not found");
	const owner = (await sql`
    select role from shop_members
    where shop_id = ${shop.id} and user_id = ${userId}
    limit 1
  `)[0]?.role === "owner" || shop.owner_user_id === userId;
	const platform = owner ? false : await isPlatformOwner(userId);
	if (!owner && !platform && !shop.is_showcase) throw new Error("Forbidden");
	const city = placeFromCityLine(cityFromAddress(shop.address));
	if (!city) throw new Error("Add a city to the shop address before scanning");
	return {
		...shop,
		city
	};
}
async function readQueue(slug) {
	return (await (await getSql())`
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
  `).map(mapLead);
}
/** The shop's saved queue. Does not pull a new batch. */
var listTenantLeads_createServerFn_handler = createServerRpc({
	id: "ecfa25394cf5d784a6fb91bfcbeed789433bd7c7373ede3306679a14c5096ad2",
	name: "listTenantLeads",
	filename: "src/lib/axiom/tenant-leads.ts"
}, (opts) => listTenantLeads.__executeServer(opts));
var listTenantLeads = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((slug) => {
	const value = String(slug ?? "").trim();
	if (!value) throw new Error("Shop not found");
	return value;
}).handler(listTenantLeads_createServerFn_handler, async ({ data: slug, context }) => {
	const shop = await shopForScan(slug, context.userId);
	return {
		city: shop.city,
		niche: shop.niche,
		leads: await readQueue(slug)
	};
});
var scanTenantProspects_createServerFn_handler = createServerRpc({
	id: "9f6d7748de990b97071d62fb6bdfe3051819cfbabadaa4ea1f631a14866bdab9",
	name: "scanTenantProspects",
	filename: "src/lib/axiom/tenant-leads.ts"
}, (opts) => scanTenantProspects.__executeServer(opts));
var scanTenantProspects = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => {
	const value = String(slug ?? "").trim();
	if (!value) throw new Error("Shop not found");
	return value;
}).handler(scanTenantProspects_createServerFn_handler, async ({ data: slug, context }) => {
	const shop = await shopForScan(slug, context.userId);
	return {
		added: await withTransaction(async (sql) => {
			return (await sql`
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
      `).length;
		}),
		city: shop.city,
		niche: shop.niche,
		leads: await readQueue(slug)
	};
});
var CAMPAIGN_CAP = 100;
function claimedIds(rows) {
	return rows.map((row) => row.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).join(",");
}
async function releaseClaim(slug, rows) {
	const list = claimedIds(rows);
	if (!list) return;
	await (await getSql())`
    update tenant_leads
    set status = 'new'
    where tenant_slug = ${slug}
      and status = 'contacted'
      and id::text = any(string_to_array(${list}, ','))
  `;
}
async function bookUrlFor(slug) {
	try {
		const { requestOrigin } = await import("./payments.server-DqmmvqjP.mjs");
		const origin = requestOrigin().replace(/\/$/, "");
		if (origin) return `${origin}/${slug}/book`;
	} catch {}
	return `/${slug}/book`;
}
/**
* Send today's campaign to every new lead on this shop's queue.
* Simulation logs the send and marks them contacted. Live calls the provider,
* and a lead that does not go out stays new so the next click can try again.
*/
var sendTenantOutreach_createServerFn_handler = createServerRpc({
	id: "50a10f452a7f0df84d2acdb2eaf32dc430472aedfa14d78687f411048afca8cc",
	name: "sendTenantOutreach",
	filename: "src/lib/axiom/tenant-leads.ts"
}, (opts) => sendTenantOutreach.__executeServer(opts));
var sendTenantOutreach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => {
	const value = String(slug ?? "").trim();
	if (!value) throw new Error("Shop not found");
	return value;
}).handler(sendTenantOutreach_createServerFn_handler, async ({ data: slug, context }) => {
	const shop = await shopForScan(slug, context.userId);
	const claimed = await withTransaction(async (sql) => {
		return sql`
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
	if (claimed.length === 0) return {
		sent: 0,
		waiting: 0,
		leads: await readQueue(slug)
	};
	const { readOutreachConfig } = await import("./outreach-queue.server-BIx9OHZk.mjs");
	const mode = readOutreachConfig().mode;
	if (mode !== "live") return {
		sent: claimed.length,
		waiting: 0,
		leads: await readQueue(slug)
	};
	const { missingOutreachCredentials, deliverOutreachMessage } = await import("./notify.server-CC7V6aj_.mjs");
	const missing = missingOutreachCredentials();
	if (missing.length > 0) {
		await releaseClaim(slug, claimed);
		throw new Error(`Live outreach needs ${missing.join(", ")}`);
	}
	const cta = presetForShopNiche(shop.niche).bookingCta;
	const bookUrl = await bookUrlFor(slug);
	const outcomes = [];
	for (const lead of claimed) {
		const channel = consumerLeadChannel(lead.email ?? "", lead.phone ?? "", lead.consumer_contact ?? "");
		if (!channel) {
			outcomes.push({
				id: lead.id,
				delivered: false
			});
			continue;
		}
		const note = consumerOutreachCopy({
			shopName: shop.name,
			city: shop.city,
			consumerName: lead.consumer_name,
			bookingCta: cta,
			bookUrl
		});
		const result = await deliverOutreachMessage({
			channel: channel.channel,
			to: channel.to,
			subject: note.subject,
			body: note.body
		});
		outcomes.push({
			id: lead.id,
			delivered: result.status === "sent"
		});
	}
	const outcome = campaignOutcome(mode, outcomes);
	const retry = claimed.filter((lead) => outcome.retryIds.includes(lead.id));
	await releaseClaim(slug, retry);
	return {
		sent: outcome.sent,
		waiting: retry.length,
		leads: await readQueue(slug)
	};
});
//#endregion
export { listTenantLeads_createServerFn_handler, scanTenantProspects_createServerFn_handler, sendTenantOutreach_createServerFn_handler };
