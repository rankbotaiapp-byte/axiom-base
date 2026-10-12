import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc--phiu8Av.mjs";
import { a as newId } from "./utils-BkNFIPfO.mjs";
import { a as getSql, t as dbSource } from "./db-BbGQAJUy.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { a as nicheLabel, n as classifyTrade, r as isTradeKey, t as classifyFiling } from "./directory-LRUyGbzu.mjs";
import { C as parseReviewScore, E as strategyLabelFromPackage, S as parseReviewCount, T as renderOutreachMessage, _ as packOutreachPackage, a as followUpBody, b as parseHasWebsite, c as isEmailReady, g as outreachStrategy, h as outreachPublicTokens, i as deskPreviewPath, l as isLeadSlug, m as nurtureStatus, o as followUpSchedule, p as leadSlugFrom, r as channelFromPackage, s as funnelUrl, u as isSmsReady, v as parseFunnelQuery, w as publicLeadFromRow, x as parsePhoneLine } from "./funnel-DCLKTLeU.mjs";
import { f as timingProfileFor, r as nextSendInstant, s as parseSendTiming, u as planSmartChunks } from "./outreach-queue-DUpdF-PE.mjs";
import { i as newStopToken, n as hashStopToken } from "./funnel-guard-BnfVmfEx.mjs";
import { n as HOME_REGION_LABEL, r as homeRegionLeads, t as HOME_REGION_COUNTIES } from "./regional-roster-BfxQXRAf.mjs";
import { n as toE164 } from "./notify-target-BTgSqjpY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/master-g9etQQRW.js
function stamp(value) {
	if (value instanceof Date) return value.toISOString();
	return String(value ?? "");
}
async function requestOrigin() {
	const { getRequest } = await import("./ssr.mjs").then((n) => n.l).then((n) => n.n);
	return new URL(getRequest().url).origin;
}
function num(value) {
	if (typeof value === "bigint") return Number(value);
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
async function assertPlatformOwner(userId) {
	return (await import("./platform-owner.server-DcNyU0Zn.mjs")).assertPlatformOwner(userId);
}
function tradeLabel(id, stored = "") {
	const label = stored.trim();
	if (label) return label;
	return nicheLabel(id);
}
function missingRelation(err, name) {
	const message = err instanceof Error ? err.message : "";
	return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}
function mergeWire(shopEvents, campaigns) {
	return [...shopEvents.map((event) => ({
		id: event.id,
		type: event.type,
		shopName: event.shop_name,
		slug: event.slug,
		createdAt: stamp(event.created_at)
	})), ...campaigns].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 24);
}
async function loadCampaigns(sql) {
	try {
		return (await sql`
      select id, county, trade_type, lead_count, status, template, created_at
      from outreach_campaigns
      order by created_at desc
      limit 24
    `).map((row) => {
			const count = num(row.lead_count);
			const hook = strategyLabelFromPackage(row.template ?? "");
			const channel = channelFromPackage(row.template ?? "");
			const channelLabel = channel === "email" ? "Email trickle" : channel === "sms" ? "SMS trickle" : "";
			const modeLabel = row.status === "live" ? "live" : "simulation";
			const parts = [
				row.county,
				tradeLabel(row.trade_type),
				channelLabel,
				hook,
				`${count} ${count === 1 ? "lead" : "leads"}`,
				modeLabel
			].filter(Boolean);
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
async function loadDispatchWire(sql) {
	try {
		return (await sql`
      select id, county, channel, chunk_index, chunk_count, lead_count, status, sent_at
      from outreach_dispatches
      where status in ('logged', 'sent', 'failed', 'skipped')
      order by sent_at desc
      limit 24
    `).map((row) => {
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
async function loadNurtureWire(sql) {
	try {
		return (await sql`
      select id, county, channel, summary, status, created_at
      from outreach_events
      order by created_at desc
      limit 24
    `).map((row) => {
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
		return await (await import("./territory.server-CXYj0I9E.mjs")).listActivations();
	} catch (err) {
		if (missingRelation(err, "territory_activations")) return [];
		throw err;
	}
}
var masterGate_createServerFn_handler = createServerRpc({
	id: "25f0e0bdcc66f9ac529ba34007dc7f691a379b30ab4170eb2166a320b8b710ef",
	name: "masterGate",
	filename: "src/lib/axiom/master.ts"
}, (opts) => masterGate.__executeServer(opts));
var masterGate = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(masterGate_createServerFn_handler, async ({ context }) => {
	const { isPlatformOwner } = await import("./platform-owner.server-DcNyU0Zn.mjs");
	return { open: await isPlatformOwner(context.userId) };
});
var getMasterDesk_createServerFn_handler = createServerRpc({
	id: "5624f699119e3f57dd0f89aed9a663864d25ef72d40ab8e3a7022c6b9dff71ca",
	name: "getMasterDesk",
	filename: "src/lib/axiom/master.ts"
}, (opts) => getMasterDesk.__executeServer(opts));
var getMasterDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMasterDesk_createServerFn_handler, async ({ context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	let outreach = {
		mode: "simulation",
		intervalSeconds: 45,
		chunkSize: 5
	};
	try {
		const queue = await import("./outreach-queue.server-BIx9OHZk.mjs");
		outreach = queue.readOutreachConfig();
		queue.ensureOutreachWorker();
		await queue.drainOutreachQueue(sql);
		await queue.drainNurtureTouches(sql);
	} catch (err) {
		if (!missingRelation(err, "outreach_dispatches") && !missingRelation(err, "outreach_events") && !missingRelation(err, "attempts")) throw err;
	}
	const [counts, events, shops, counties, recentHits] = await Promise.all([
		sql`
        select
          (select count(*) from shops where is_showcase = false and owner_user_id is not null) as active_shops,
          (select count(*) from appointments where status <> 'cancelled') as bookings,
          (select coalesce(sum(payment_cents), 0) from appointments where payment_status = 'paid') as revenue_cents
      `,
		sql`
        select e.id, e.type, s.name as shop_name, s.slug, e.created_at
        from shop_events e
        join shops s on s.id = e.shop_id
        order by e.created_at desc
        limit 24
      `,
		sql`
        select s.id, s.slug, s.name, s.niche, s.is_showcase,
          b.status as billing_status, u."email" as owner_email, s.created_at
        from shops s
        left join shop_billing b on b.shop_id = s.id
        left join "user" u on u.id = s.owner_user_id
        order by s.created_at desc
        limit 200
      `,
		sql`
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
      `,
		sql`
        select id, lead_slug, utm_source, county, shop_id, created_at
        from funnel_visits
        order by created_at desc
        limit 12
      `
	]);
	const row = counts[0];
	const activations = await loadActivationList();
	return {
		kpis: {
			activeShops: num(row?.active_shops),
			bookings: num(row?.bookings),
			revenueCents: num(row?.revenue_cents)
		},
		events: mergeWire(events, [
			...await loadCampaigns(sql),
			...await loadDispatchWire(sql),
			...await loadNurtureWire(sql),
			...activations.map((activation) => ({
				id: activation.id,
				type: "territory_live",
				shopName: `${activation.businessName} · ${activation.planName} · live`,
				slug: activation.leadSlug,
				createdAt: activation.createdAt
			}))
		]),
		activations,
		outreach,
		database: dbSource === "neon" ? "postgres" : "memory",
		shops: shops.map((shop) => ({
			id: shop.id,
			slug: shop.slug,
			name: shop.name,
			niche: shop.niche,
			showcase: Boolean(shop.is_showcase),
			status: shop.is_showcase ? "showcase" : shop.billing_status ?? "no billing",
			ownerEmail: shop.owner_email ?? "",
			createdAt: stamp(shop.created_at)
		})),
		attribution: counties.map((county) => ({
			county: county.county,
			tradeType: county.trade_type,
			tradeLabel: tradeLabel(county.trade_type, county.trade_label ?? ""),
			leads: num(county.leads),
			claimed: num(county.claimed),
			hits: num(county.hits)
		})),
		hits: recentHits.map((hit) => ({
			id: hit.id,
			leadSlug: hit.lead_slug,
			utmSource: hit.utm_source,
			county: hit.county,
			becameShop: Boolean(hit.shop_id),
			createdAt: stamp(hit.created_at)
		}))
	};
});
function cleanLead(input) {
	const businessName = (input.businessName ?? "").trim().slice(0, 80);
	const city = (input.city ?? "").trim().slice(0, 80);
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (businessName.length < 2) throw new Error("Business name is required");
	if (city.length < 2) throw new Error("City is required");
	if (county.length < 2) throw new Error("County is required");
	const classified = classifyFiling(businessName, trade);
	const requested = (input.leadSlug ?? "").trim().toLowerCase();
	const leadSlug = requested ? requested : leadSlugFrom(businessName, city);
	if (!isLeadSlug(leadSlug)) throw new Error("Lead slug must be lowercase letters, numbers, and hyphens");
	return {
		businessName,
		tradeType: classified.tradeType,
		tradeLabel: classified.tradeLabel,
		city,
		county,
		leadSlug,
		contactEmail: (input.contactEmail ?? "").trim().toLowerCase().slice(0, 120),
		contactPhone: (input.contactPhone ?? "").trim().slice(0, 40),
		contactName: (input.contactName ?? "").trim().slice(0, 80),
		reviewScore: parseReviewScore(input.reviewScore),
		reviewCount: parseReviewCount(input.reviewCount),
		hasWebsite: parseHasWebsite(input.hasWebsite),
		phoneLine: parsePhoneLine(input.phoneLine)
	};
}
var addPreloadedLeads_createServerFn_handler = createServerRpc({
	id: "1657405ce36a9728aef08b3fa66bfaccdd216476322818c662342a2b03e11fb3",
	name: "addPreloadedLeads",
	filename: "src/lib/axiom/master.ts"
}, (opts) => addPreloadedLeads.__executeServer(opts));
var addPreloadedLeads = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.leads) || input.leads.length === 0) throw new Error("Add at least one business");
	if (input.leads.length > 40) throw new Error("Add up to 40 businesses at a time");
	return { leads: input.leads.map(cleanLead) };
}).handler(addPreloadedLeads_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	const saved = [];
	for (const lead of data.leads) {
		let slug = lead.leadSlug;
		for (let n = 2; n < 50; n += 1) {
			if (!(await sql`
          select lead_slug from preloaded_leads where lead_slug = ${slug} limit 1
        `)[0]) break;
			slug = `${lead.leadSlug.slice(0, 58)}-${n}`;
		}
		await writePreloadedLead(sql, lead, slug);
		saved.push({
			...lead,
			leadSlug: slug
		});
	}
	return { leads: saved };
});
var createOutreachFunnel_createServerFn_handler = createServerRpc({
	id: "6172ae183243a885e65a1b480a2fe058ded31ff69b1bd6726db21406af78894b",
	name: "createOutreachFunnel",
	filename: "src/lib/axiom/master.ts"
}, (opts) => createOutreachFunnel.__executeServer(opts));
var createOutreachFunnel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const businessName = String(input?.businessName ?? "").trim();
	const niche = String(input?.niche ?? "").trim();
	const contact = String(input?.contact ?? "").trim().slice(0, 120);
	const city = String(input?.city ?? "").trim();
	const county = String(input?.county ?? "").trim() || city;
	const email = contact.includes("@") ? contact.toLowerCase() : "";
	const phone = email ? "" : contact;
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email required");
	if (!email && phone.replace(/\D/g, "").length < 7) throw new Error("Email or phone is required");
	return {
		businessName,
		niche,
		email,
		phone,
		city,
		county
	};
}).handler(createOutreachFunnel_createServerFn_handler, async ({ data, context }) => {
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
		if (!(await sql`
        select lead_slug from preloaded_leads where lead_slug = ${slug} limit 1
      `)[0]) break;
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
});
var listOutreachFunnels_createServerFn_handler = createServerRpc({
	id: "25aac99d9d6c41b17f829c31947aa784c57b81b505a660a6ebf5a09aadf38a53",
	name: "listOutreachFunnels",
	filename: "src/lib/axiom/master.ts"
}, (opts) => listOutreachFunnels.__executeServer(opts));
var listOutreachFunnels = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOutreachFunnels_createServerFn_handler, async ({ context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	try {
		return (await sql`
        select l.lead_slug, l.business_name, l.trade_label, l.trade_type, l.contact_email, l.contact_phone,
          l.city, l.county, l.claimed, l.account_mode, l.created_at,
          (select count(*)::int from funnel_visits v where v.lead_slug = l.lead_slug) as opens,
          (select count(*)::int from funnel_visits v where v.lead_slug = l.lead_slug and v.utm_source = 'snap') as trials,
          (select count(*)::int from lead_audits a where a.lead_slug = l.lead_slug) as audits,
          exists(select 1 from territory_activations t where t.lead_slug = l.lead_slug) as subscribed
        from preloaded_leads l
        where l.source = 'desk'
        order by l.created_at desc
        limit 40
      `).map((row) => ({
			leadSlug: row.lead_slug,
			businessName: row.business_name,
			niche: row.trade_label || row.trade_type,
			contact: row.contact_email || row.contact_phone,
			city: row.city,
			path: deskPreviewPath({
				leadSlug: row.lead_slug,
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
		if (missingRelation(err, "source") || missingRelation(err, "lead_audits") || missingRelation(err, "account_mode") || missingRelation(err, "territory_activations")) return [];
		throw err;
	}
});
async function writePreloadedLead(sql, lead, slug) {
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
		if (missingRelation(err, "contact_name")) try {
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
		else await sql`
        insert into preloaded_leads (
          id, business_name, trade_type, city, county, lead_slug, claimed
        ) values (
          ${newId("lead")}, ${lead.businessName}, ${lead.tradeType}, ${lead.city},
          ${lead.county}, ${slug}, false
        )
      `;
	}
}
async function writePreloadedLeadLegacy(sql, lead, slug) {
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
var preloadRegionalRoster_createServerFn_handler = createServerRpc({
	id: "7ce0b5f5c0b136fb8438d5c59127d37136ea6e6d43f8c0a054dd519980156ea4",
	name: "preloadRegionalRoster",
	filename: "src/lib/axiom/master.ts"
}, (opts) => preloadRegionalRoster.__executeServer(opts));
var preloadRegionalRoster = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(preloadRegionalRoster_createServerFn_handler, async ({ context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	const leads = homeRegionLeads().map((lead) => cleanLead(lead));
	let inserted = 0;
	let skipped = 0;
	for (const lead of leads) {
		if ((await sql`
        select lead_slug from preloaded_leads where lead_slug = ${lead.leadSlug} limit 1
      `)[0]) {
			skipped += 1;
			if (lead.contactEmail) try {
				await sql`
              update preloaded_leads
              set contact_email = ${lead.contactEmail}
              where lead_slug = ${lead.leadSlug} and contact_email = ''
            `;
			} catch (err) {
				if (!missingRelation(err, "contact_email")) throw err;
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
		niches: new Set(leads.map((lead) => lead.tradeType)).size
	};
});
var generateRegionalFunnel_createServerFn_handler = createServerRpc({
	id: "ad9b78312bd633e05d837f9c4e72348bb4f198db9b029c944d73009a252f1ac5",
	name: "generateRegionalFunnel",
	filename: "src/lib/axiom/master.ts"
}, (opts) => generateRegionalFunnel.__executeServer(opts));
var generateRegionalFunnel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (county.length < 2) throw new Error("County is required");
	return {
		county,
		tradeType: classifyTrade(trade).tradeType
	};
}).handler(generateRegionalFunnel_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformOwner(context.userId);
	const rows = await (await getSql())`
      select business_name, city, county, trade_type, lead_slug
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
		links: rows.map((row) => ({
			businessName: row.business_name,
			city: row.city,
			county: row.county,
			tradeType: row.trade_type,
			leadSlug: row.lead_slug,
			url: funnelUrl(origin, {
				leadSlug: row.lead_slug,
				county: row.county
			})
		}))
	};
});
function readRegion(input, allowAll = false) {
	const county = (input.county ?? "").trim().slice(0, 80);
	const trade = (input.tradeType ?? "").trim();
	if (county.length < 2) throw new Error("County is required");
	if (allowAll && (trade === "all" || trade === "")) return {
		county,
		tradeType: "all"
	};
	if (!isTradeKey(trade)) throw new Error("Pick a trade");
	return {
		county,
		tradeType: trade
	};
}
async function leadsInRegion(sql, county, tradeType, origin) {
	const map = (rows) => rows.map((row) => {
		const facts = publicLeadFromRow(row);
		return {
			businessName: row.business_name,
			city: row.city,
			county: row.county,
			tradeType: row.trade_type,
			tradeLabel: tradeLabel(row.trade_type, row.trade_label ?? ""),
			leadSlug: row.lead_slug,
			url: funnelUrl(origin, {
				leadSlug: row.lead_slug,
				county: row.county
			}),
			contactEmail: row.contact_email ?? "",
			contactPhone: row.contact_phone ?? "",
			...facts,
			claimed: Boolean(row.claimed),
			accountMode: row.account_mode === "live" ? "live" : "simulation"
		};
	});
	try {
		return map(await sql`
      select business_name, city, county, trade_type, trade_label, lead_slug, claimed,
        contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line,
        account_mode
      from preloaded_leads
      where lower(county) = lower(${county})
        and (${tradeType} = 'all' or trade_type = ${tradeType})
      order by business_name asc
      limit 500
    `);
	} catch (err) {
		if (missingRelation(err, "trade_label")) return map(await sql`
        select business_name, city, county, trade_type, lead_slug, claimed,
          contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line,
          account_mode
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 500
      `);
		if (missingRelation(err, "account_mode")) return map(await sql`
        select business_name, city, county, trade_type, lead_slug, claimed,
          contact_email, contact_phone, contact_name, review_score, review_count, has_website, phone_line
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 200
      `);
		if (missingRelation(err, "contact_name")) return map(await sql`
        select business_name, city, county, trade_type, lead_slug, claimed, contact_email, contact_phone
        from preloaded_leads
        where lower(county) = lower(${county})
          and (${tradeType} = 'all' or trade_type = ${tradeType})
        order by business_name asc
        limit 200
      `);
		if (!missingRelation(err, "contact_email")) throw err;
		return map(await sql`
      select business_name, city, county, trade_type, lead_slug, claimed
      from preloaded_leads
      where lower(county) = lower(${county})
        and (${tradeType} = 'all' or trade_type = ${tradeType})
      order by business_name asc
      limit 200
    `);
	}
}
function slugList(slugs) {
	return [...new Set(slugs.filter((slug) => isLeadSlug(slug)))].join(",");
}
async function reconcileFollowUps(sql, slugs) {
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
async function loadFollowUps(sql, slugs) {
	const grouped = /* @__PURE__ */ new Map();
	const list = slugList(slugs);
	if (!list) return grouped;
	try {
		await reconcileFollowUps(sql, slugs);
	} catch (err) {
		if (missingRelation(err, "outreach_sequences") || missingRelation(err, "outreach_touches")) return grouped;
		throw err;
	}
	const clickedRows = await sql`
    select distinct lead_slug from funnel_visits
    where verified = true
      and lead_slug <> ''
      and lead_slug = any(string_to_array(${list}, ','))
  `;
	const clicked = new Set(clickedRows.map((row) => row.lead_slug));
	const rows = await sql`
    select s.id, s.lead_slug, s.channel, s.status, s.stopped_reason, s.strategy,
      t.step, t.label, t.status as touch_status, t.scheduled_at
    from outreach_sequences s
    join outreach_touches t on t.sequence_id = s.id
    where s.lead_slug = any(string_to_array(${list}, ','))
    order by s.created_at asc, t.step asc
  `;
	const byId = /* @__PURE__ */ new Map();
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
		const ready = {
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
async function enrollFollowUps(sql, input) {
	const slugs = slugList(input.leads).split(",").filter(Boolean);
	if (slugs.length === 0) return {
		enrolled: 0,
		skippedClicked: 0,
		alreadyLooping: 0
	};
	await reconcileFollowUps(sql, slugs);
	const list = slugs.join(",");
	const clickedRows = await sql`
    select distinct lead_slug from funnel_visits
    where verified = true
      and lead_slug <> ''
      and lead_slug = any(string_to_array(${list}, ','))
  `;
	const clicked = new Set(clickedRows.map((row) => row.lead_slug));
	const activeRows = await sql`
    select lead_slug from outreach_sequences
    where status = 'active'
      and channel = ${input.channel}
      and lead_slug = any(string_to_array(${list}, ','))
  `;
	const active = new Set(activeRows.map((row) => row.lead_slug));
	const timing = parseSendTiming(input.timing);
	const plan = followUpSchedule(/* @__PURE__ */ new Date());
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
		const lead = input.audience?.find((item) => item.leadSlug === slug);
		const leadTrade = lead?.tradeType || input.tradeType;
		const profile = timing === "smart" ? timingProfileFor(leadTrade) : "general";
		const anchorIso = input.releaseAt?.get(slug) ?? plan[0]?.scheduledAt ?? (/* @__PURE__ */ new Date()).toISOString();
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
			const nominal = new Date(anchor.getTime() + step.day * 864e5);
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
var previewOutreach_createServerFn_handler = createServerRpc({
	id: "eba6b1256b54f5e888a20aeae4b537e1f860b277d18aefcdce44e24f9550a6da",
	name: "previewOutreach",
	filename: "src/lib/axiom/master.ts"
}, (opts) => previewOutreach.__executeServer(opts));
var previewOutreach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => readRegion(input, true)).handler(previewOutreach_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	const leads = await leadsInRegion(sql, data.county, data.tradeType, await requestOrigin());
	const loops = await loadFollowUps(sql, leads.map((lead) => lead.leadSlug));
	return {
		county: data.county,
		tradeType: data.tradeType,
		leads: leads.map((lead) => ({
			...lead,
			followUps: loops.get(lead.leadSlug) ?? []
		}))
	};
});
function outboundFor(lead, channel, draft) {
	const tokens = {
		business: lead.businessName,
		url: lead.url,
		trade: tradeLabel(lead.tradeType, lead.tradeLabel),
		county: lead.county,
		city: lead.city,
		...outreachPublicTokens(lead, lead.businessName)
	};
	if (channel === "sms") return {
		leadSlug: lead.leadSlug,
		to: toE164(lead.contactPhone) ?? lead.contactPhone,
		subject: "",
		body: renderOutreachMessage(draft.text, tokens).slice(0, 640)
	};
	return {
		leadSlug: lead.leadSlug,
		to: lead.contactEmail,
		subject: renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200),
		body: renderOutreachMessage(draft.emailBody, tokens).slice(0, 4e3)
	};
}
var launchOutreachBatch_createServerFn_handler = createServerRpc({
	id: "6f95e4a4a8d9a276a33faa8df724bf173a741a4708c33bd70b6c0219ec535e0f",
	name: "launchOutreachBatch",
	filename: "src/lib/axiom/master.ts"
}, (opts) => launchOutreachBatch.__executeServer(opts));
var launchOutreachBatch = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const region = readRegion(input, true);
	const rawChannel = input.channel === "email" || input.channel === "sms" ? input.channel : "";
	if (rawChannel !== "email" && rawChannel !== "sms") throw new Error("Pick a channel");
	const channel = rawChannel;
	const text = (input.text ?? "").trim().slice(0, 1e3);
	const emailSubject = (input.emailSubject ?? "").trim().slice(0, 200);
	const emailBody = (input.emailBody ?? "").trim().slice(0, 4e3);
	if (channel === "sms" && text.length < 2) throw new Error("Write a text first");
	if (channel === "email" && (emailSubject.length < 2 || emailBody.length < 2)) throw new Error("Write the email first");
	const strategy = outreachStrategy(input.strategy ?? "").id;
	return {
		...region,
		channel,
		strategy,
		text,
		emailSubject,
		emailBody,
		template: packOutreachPackage({
			strategy,
			text,
			emailSubject,
			emailBody,
			channel
		}),
		timing: parseSendTiming(input.timing)
	};
}).handler(launchOutreachBatch_createServerFn_handler, async ({ data, context }) => {
	await assertPlatformOwner(context.userId);
	const queue = await import("./outreach-queue.server-BIx9OHZk.mjs");
	const config = queue.readOutreachConfig();
	if (config.mode === "live") {
		const { missingOutreachCredentials } = await import("./notify.server-CC7V6aj_.mjs");
		const missing = missingOutreachCredentials();
		if (missing.length > 0) throw new Error(`Live outreach needs ${missing.join(", ")}`);
	}
	const sql = await getSql();
	const leads = await leadsInRegion(sql, data.county, data.tradeType, await requestOrigin());
	const channel = data.channel === "sms" ? "sms" : "email";
	const batch = leads.filter((lead) => {
		if (lead.claimed) return false;
		return channel === "sms" ? isSmsReady(lead.phoneLine) : isEmailReady(lead.contactEmail);
	});
	if (batch.length === 0) throw new Error(channel === "sms" ? "No SMS-ready leads in that list" : "No email-ready leads in that list");
	const origin = await requestOrigin();
	const stopTokens = new Map(batch.map((lead) => [lead.leadSlug, newStopToken()]));
	const tracked = batch.map((lead) => ({
		...lead,
		url: funnelUrl(origin, {
			leadSlug: lead.leadSlug,
			county: lead.county,
			stopToken: stopTokens.get(lead.leadSlug),
			greet: true,
			businessName: lead.businessName,
			trade: tradeLabel(lead.tradeType, lead.tradeLabel),
			city: lead.city
		})
	}));
	const started = /* @__PURE__ */ new Date();
	const chunks = planSmartChunks(tracked, {
		chunkSize: config.chunkSize,
		intervalSeconds: config.intervalSeconds,
		start: started,
		timing: data.timing
	}).map((chunk) => ({
		...chunk,
		messages: chunk.items.map((lead) => outboundFor(lead, channel, {
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
	for (const chunk of chunks) await sql`
        insert into outreach_dispatches (
          id, campaign_id, channel, mode, chunk_index, chunk_count, lead_count,
          interval_seconds, payload, status, scheduled_at, county, timing, profile
        ) values (
          ${newId("dsp")}, ${id}, ${channel}, ${config.mode}, ${chunk.index}, ${chunks.length},
          ${chunk.messages.length}, ${config.intervalSeconds}, ${JSON.stringify(chunk.messages)},
          ${"queued"}, ${chunk.scheduledAt}, ${data.county}, ${data.timing}, ${chunk.profile}
        )
      `;
	const releaseAt = new Map(chunks.flatMap((chunk) => chunk.items.map((lead) => [lead.leadSlug, chunk.scheduledAt])));
	const nurture = await enrollFollowUps(sql, {
		campaignId: id,
		channel,
		county: data.county,
		tradeType: data.tradeType,
		strategy: data.strategy,
		text: data.text,
		emailSubject: data.emailSubject,
		emailBody: data.emailBody,
		leads: tracked.map((lead) => lead.leadSlug),
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
		queue: "trickle",
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
});
var quietHit = {
	logged: false,
	businessName: "",
	tradeType: "",
	county: "",
	city: "",
	claimed: false,
	limited: false
};
var ensureFunnelSession_createServerFn_handler = createServerRpc({
	id: "b19422a4a01c081349d7be298a91341f84c834a405334af7fbd1671af476111c",
	name: "ensureFunnelSession",
	filename: "src/lib/axiom/master.ts"
}, (opts) => ensureFunnelSession.__executeServer(opts));
var ensureFunnelSession = createServerFn({ method: "POST" }).handler(ensureFunnelSession_createServerFn_handler, async () => {
	(await import("./funnel-guard.server-BOf1H-MT.mjs")).ensureFunnelCookie();
	return { ready: true };
});
var recordFunnelHit_createServerFn_handler = createServerRpc({
	id: "820f9d0c90440fce6be84c7237481eb461570abab4896925ad6f27c5a9e54eea",
	name: "recordFunnelHit",
	filename: "src/lib/axiom/master.ts"
}, (opts) => recordFunnelHit.__executeServer(opts));
var recordFunnelHit = createServerFn({ method: "POST" }).validator((input) => {
	return parseFunnelQuery({
		b: input?.leadSlug,
		utm_source: input?.utmSource,
		county: input?.county,
		t: input?.stopToken
	});
}).handler(recordFunnelHit_createServerFn_handler, async ({ data }) => {
	if (!data.leadSlug && !data.utmSource && !data.county) return quietHit;
	const { getRequest } = await import("./ssr.mjs").then((n) => n.l).then((n) => n.n);
	const guard = await import("./funnel-guard.server-BOf1H-MT.mjs");
	const request = getRequest();
	if (!guard.requestHasFunnelSession(request)) return quietHit;
	const sql = await getSql();
	const key = guard.clientKey(request);
	if (!await guard.funnelHitAllowed(sql, key, data.leadSlug)) return {
		...quietHit,
		limited: true
	};
	const lead = (data.leadSlug ? await sql`
          select business_name, trade_type, county, city, claimed
          from preloaded_leads
          where lead_slug = ${data.leadSlug}
          limit 1
        ` : [])[0];
	const county = data.county || lead?.county || "";
	let verified = false;
	if (data.leadSlug && data.stopToken) try {
		verified = await guard.stopSequencesForToken(sql, data.leadSlug, data.stopToken) > 0;
	} catch (err) {
		if (!missingRelation(err, "stop_token_hash") && !missingRelation(err, "outreach_sequences")) throw err;
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
});
var recordMasterDeskOpen_createServerFn_handler = createServerRpc({
	id: "3ced656494e31ea1642e9193d1ef20073eb05eaedaaf4f9dd08f7df17271e018",
	name: "recordMasterDeskOpen",
	filename: "src/lib/axiom/master.ts"
}, (opts) => recordMasterDeskOpen.__executeServer(opts));
var recordMasterDeskOpen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug.trim()).handler(recordMasterDeskOpen_createServerFn_handler, async ({ data: slug, context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	const shop = (await sql`
      select id from shops where slug = ${slug} limit 1
    `)[0];
	if (!shop) throw new Error("Shop not found");
	await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${shop.id}, 'master_desk', ${"open"})
    `;
	return { ok: true };
});
var getLeadPreview_createServerFn_handler = createServerRpc({
	id: "eae2583b6326e6c757210ab39a75b70a29abe38acefc49085f43acdfa5f86df8",
	name: "getLeadPreview",
	filename: "src/lib/axiom/master.ts"
}, (opts) => getLeadPreview.__executeServer(opts));
var getLeadPreview = createServerFn({ method: "POST" }).validator((leadSlug) => {
	const slug = String(leadSlug ?? "").trim().toLowerCase();
	if (!isLeadSlug(slug)) throw new Error("Unknown business");
	return slug;
}).handler(getLeadPreview_createServerFn_handler, async ({ data }) => {
	const lead = await (await import("./territory.server-CXYj0I9E.mjs")).readLeadPreview(data);
	if (!lead) throw new Error("Unknown business");
	return lead;
});
var beginTerritoryCheckout_createServerFn_handler = createServerRpc({
	id: "533135ce7d5eec3875c191f959caba10e53b833331ace11336fc51ccbc4f05d2",
	name: "beginTerritoryCheckout",
	filename: "src/lib/axiom/master.ts"
}, (opts) => beginTerritoryCheckout.__executeServer(opts));
var beginTerritoryCheckout = createServerFn({ method: "POST" }).validator((input) => {
	const leadSlug = String(input?.leadSlug ?? "").trim().toLowerCase();
	const planId = String(input?.planId ?? "").trim();
	if (!isLeadSlug(leadSlug)) throw new Error("Unknown business");
	if (planId !== "trial" && planId !== "growth" && planId !== "lifetime") throw new Error("Unknown plan");
	return {
		leadSlug,
		planId
	};
}).handler(beginTerritoryCheckout_createServerFn_handler, async ({ data }) => {
	const { getRequest } = await import("./ssr.mjs").then((n) => n.l).then((n) => n.n);
	if (!(await import("./funnel-guard.server-BOf1H-MT.mjs")).requestHasFunnelSession(getRequest())) throw new Error("Reload this page, then choose a plan again");
	const { territoryPlan } = await import("./pricing-BxirjfBG.mjs").then((n) => n.i);
	const plan = territoryPlan(data.planId);
	if (!plan) throw new Error("Unknown plan");
	const payments = await import("./payments.server-DqmmvqjP.mjs");
	if (!payments.stripeConfigured()) throw new Error("Card checkout is not configured");
	const processor = "stripe";
	const opened = await (await import("./territory.server-CXYj0I9E.mjs")).openTerritoryCheckout(data.leadSlug, plan.id, processor);
	try {
		const origin = await requestOrigin();
		let userId = "";
		try {
			const { getSessionUser } = await import("./verify.server-FRBaqr68.mjs");
			const buyer = await getSessionUser();
			if (buyer?.id && buyer.id !== "dev-user") userId = buyer.id;
		} catch {}
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
		await (await getSql())`delete from territory_checkouts where id = ${opened.checkoutId} and status = 'pending'`;
		throw err instanceof Error ? err : /* @__PURE__ */ new Error("Card checkout did not start");
	}
});
var finishTerritoryCheckout_createServerFn_handler = createServerRpc({
	id: "18918988fb06c6da077e07ca93dadcf3c24f014bed4c5f909832b29572a1a90f",
	name: "finishTerritoryCheckout",
	filename: "src/lib/axiom/master.ts"
}, (opts) => finishTerritoryCheckout.__executeServer(opts));
var finishTerritoryCheckout = createServerFn({ method: "POST" }).validator((input) => {
	const checkoutId = String(input?.checkoutId ?? "").trim();
	const paymentRef = String(input?.paymentRef ?? "").trim();
	if (!/^chk_[a-z0-9]{8,32}$/.test(checkoutId)) throw new Error("Checkout expired");
	return {
		checkoutId,
		paymentRef
	};
}).handler(finishTerritoryCheckout_createServerFn_handler, async ({ data }) => {
	const { getRequest } = await import("./ssr.mjs").then((n) => n.l).then((n) => n.n);
	if (!(await import("./funnel-guard.server-BOf1H-MT.mjs")).requestHasFunnelSession(getRequest())) throw new Error("Reload this page, then choose a plan again");
	return (await import("./territory.server-CXYj0I9E.mjs")).finishDeskCheckout(data.checkoutId, data.paymentRef);
});
var confirmTerritorySession_createServerFn_handler = createServerRpc({
	id: "9d92570641b61199c336ae9ef8f4d708444908294fa01e098f9727f39828fb45",
	name: "confirmTerritorySession",
	filename: "src/lib/axiom/master.ts"
}, (opts) => confirmTerritorySession.__executeServer(opts));
var confirmTerritorySession = createServerFn({ method: "POST" }).validator((sessionId) => {
	const id = String(sessionId ?? "").trim();
	if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error("Invalid session");
	return id;
}).handler(confirmTerritorySession_createServerFn_handler, async ({ data }) => {
	return (await import("./payments.server-DqmmvqjP.mjs")).settleTerritorySession(data);
});
var listPlatformPulse_createServerFn_handler = createServerRpc({
	id: "94db8e265ded376e8ded8c0babbc78337d0ad1dfad7ef5a766821cb209cb2a65",
	name: "listPlatformPulse",
	filename: "src/lib/axiom/master.ts"
}, (opts) => listPlatformPulse.__executeServer(opts));
var listPlatformPulse = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPlatformPulse_createServerFn_handler, async ({ context }) => {
	await assertPlatformOwner(context.userId);
	const sql = await getSql();
	try {
		return (await sql`
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
    `).map((row) => ({
			id: row.id,
			type: row.type,
			shopName: row.shop_name,
			detail: (row.detail ?? "").replace(/^aud_[a-z0-9]+\|/i, ""),
			createdAt: stamp(row.created_at)
		}));
	} catch {
		return [];
	}
});
//#endregion
export { addPreloadedLeads_createServerFn_handler, beginTerritoryCheckout_createServerFn_handler, confirmTerritorySession_createServerFn_handler, createOutreachFunnel_createServerFn_handler, ensureFunnelSession_createServerFn_handler, finishTerritoryCheckout_createServerFn_handler, generateRegionalFunnel_createServerFn_handler, getLeadPreview_createServerFn_handler, getMasterDesk_createServerFn_handler, launchOutreachBatch_createServerFn_handler, listOutreachFunnels_createServerFn_handler, listPlatformPulse_createServerFn_handler, masterGate_createServerFn_handler, preloadRegionalRoster_createServerFn_handler, previewOutreach_createServerFn_handler, recordFunnelHit_createServerFn_handler, recordMasterDeskOpen_createServerFn_handler };
