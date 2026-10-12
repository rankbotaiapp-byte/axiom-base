import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { a as TSS_SERVER_FUNCTION, i as createServerFn, o as getServerFnById } from "./ssr.mjs";
import { a as newId, o as slugify } from "./utils-BkNFIPfO.mjs";
import { n as NICHES, t as DEFAULT_HOURS } from "./niches-Dq_P6CLw.mjs";
import { a as getSql } from "./db-BbGQAJUy.mjs";
import { t as authMiddleware } from "./middleware-SxfP7m2i.mjs";
import { i as nicheForLead } from "./directory-LRUyGbzu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-CiF75qCF.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var server_exports = /* @__PURE__ */ __exportAll({
	acceptBooking: () => acceptBooking,
	addPortfolioItem: () => addPortfolioItem,
	beginStripeConnect: () => beginStripeConnect,
	claimInvite: () => claimInvite,
	confirmCardCheckout: () => confirmCardCheckout,
	confirmLatestAudit: () => confirmLatestAudit,
	createBooking: () => createBooking,
	createShopFromNiche: () => createShopFromNiche,
	getAuditStatus: () => getAuditStatus,
	getInvitePreview: () => getInvitePreview,
	getOperatorData: () => getOperatorData,
	getPortfolio: () => getPortfolio,
	getPublicShop: () => getPublicShop,
	getShopAccess: () => getShopAccess,
	inviteEmployee: () => inviteEmployee,
	listBookedStarts: () => listBookedStarts,
	listMyShops: () => listMyShops,
	listShopEvents: () => listShopEvents,
	listShowcaseShops: () => listShowcaseShops,
	provisionShopFromNiche: () => provisionShopFromNiche,
	provisionTerritoryForPayer: () => provisionTerritoryForPayer,
	refreshStripeConnect: () => refreshStripeConnect,
	releaseCardCheckout: () => releaseCardCheckout,
	saveShopServices: () => saveShopServices,
	saveTradeProfile: () => saveTradeProfile,
	setEmployeeAvailability: () => setEmployeeAvailability,
	setEmployeeDashboard: () => setEmployeeDashboard,
	setShopDashboard: () => setShopDashboard,
	setShopIntro: () => setShopIntro,
	setShopRingColor: () => setShopRingColor,
	startCardCheckout: () => startCardCheckout,
	submitAudit: () => submitAudit,
	submitInquiry: () => submitInquiry,
	updateNotifyChannels: () => updateNotifyChannels,
	updateShopBrand: () => updateShopBrand,
	updateShopProfile: () => updateShopProfile
});
var getPublicShop = createServerFn({ method: "GET" }).validator((slug) => slug).handler(createSsrRpc("30642a916957732ce0ede2e076fdb02b275425ecbb5a809f21665bb30ca990d6"));
var listShowcaseShops = createServerFn({ method: "GET" }).handler(createSsrRpc("f72216c02755fa90557b16a345b8c00ab8c6d61d8c3c98b86380c8bee6b80dca"));
var listBookedStarts = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("f829bacc015ea9c584d6ae5c326a97820f705785a12b391b88c3b47ee8419cba"));
var getPortfolio = createServerFn({ method: "GET" }).validator((employeeId) => employeeId).handler(createSsrRpc("8c4f196bd44621e17aae1a5067f96ed468e28b603c84cc4704041cbe5288e416"));
var listShopEvents = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("e6dfeb63056e67b41ebe7f194100e4e43214edcb391e3ee824cd5b7b1a130387"));
createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("ccae9bd556feaad5df260bf196d003143fa1bc3bd089df43dd943122bf3d3b6c"));
var createBooking = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2c61f6c5d07f7ac5f6cfbdc53f8c7038bf8884f7c4a21cf7c5f5e5ab30064b8f"));
var getShopAccess = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("67aca4a0b4d0b1ed0ad5278149217973b9db21407da6f799cbe369b72cd9a1c2"));
var listMyShops = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6521a92301daa18d33236f64eda487904d6acc18113b45e5197ee75e7633eb9a"));
async function claimPreloadedLead(sql, leadSlug, shopId) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leadSlug)) return;
	const claimed = await sql`
    update preloaded_leads
    set claimed = true, shop_id = ${shopId}
    where lead_slug = ${leadSlug} and claimed = false
    returning id, county
  `;
	if (!claimed[0]) return;
	await sql`
    insert into funnel_visits (id, lead_slug, utm_source, county, landed_path, shop_id, verified)
    values (${newId("fun")}, ${leadSlug}, ${"onboarding"}, ${claimed[0].county}, ${"/onboard"}, ${shopId}, ${true})
  `;
	try {
		await sql`
      update outreach_sequences
      set status = 'stopped', stopped_reason = 'claimed'
      where lead_slug = ${leadSlug} and status = 'active'
    `;
		await sql`
      update outreach_touches
      set status = 'skipped'
      where status = 'scheduled'
        and sequence_id in (
          select id from outreach_sequences
          where lead_slug = ${leadSlug} and status = 'stopped' and stopped_reason = 'claimed'
        )
    `;
	} catch {}
	await sql`
    insert into shop_events (id, shop_id, type, payload)
    values (${newId("evt")}, ${shopId}, 'lead_claimed', ${leadSlug})
  `;
}
/** Copies a niche template into a shop owned by `userId`. One shop per account. */
async function provisionShopFromNiche(input) {
	const template = NICHES[input.niche];
	if (!template) throw new Error("Unknown niche");
	if (!input.userId) throw new Error("Sign in before opening this shop");
	const sql = await getSql();
	const existing = await sql`
    select s.id, s.slug from shops s
    join shop_members m on m.shop_id = s.id
    where m.user_id = ${input.userId} and m.role = 'owner'
    order by s.created_at desc limit 1
  `;
	const leadSlug = (input.leadSlug ?? "").trim().toLowerCase();
	if (existing[0]) {
		await claimPreloadedLead(sql, leadSlug, existing[0].id);
		return {
			slug: existing[0].slug,
			shopId: existing[0].id,
			created: false
		};
	}
	const name = input.name.trim() || template.defaultName;
	let slug = slugify(name);
	if ((await sql`select slug from shops where slug = ${slug}`)[0]) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
	const shopId = newId("shop");
	const services = template.services.map((s, i) => ({
		...s,
		id: newId("svc"),
		sort: i
	}));
	const solo = Boolean(input.solo);
	const employees = (solo ? [{
		displayName: (input.ownerName ?? "").trim() || "You",
		title: template.soloTitle || template.employees[0]?.title || "Owner",
		bio: "Clients book you. Confirm the time and the day is set.",
		avatarUrl: "",
		phone: "",
		serviceIndexes: template.services.map((_, index) => index)
	}] : template.employees).map((e) => ({
		...e,
		id: newId("emp"),
		token: crypto.randomUUID()
	}));
	const primary = services[template.primaryServiceIndex ?? 0] ?? services[0];
	await sql`
      insert into shops (
        id, slug, name, niche, tagline, description, ring_color,
        hero_image_url, hero_video_url, hero_blend_percent, primary_service_id,
        intro_preset, intro_speed, intro_intensity,
        owner_user_id, is_showcase, onboarding_step, onboarding_json, hours_json, address, works_alone
      ) values (
        ${shopId}, ${slug}, ${name}, ${template.niche}, ${template.tagline},
        ${template.description}, ${template.ringColor}, ${template.heroImageUrl},
        ${template.heroVideoUrl}, ${template.heroBlendPercent}, ${primary?.id ?? null},
        ${template.introPreset ?? "kenburns"}, ${template.introSpeed ?? 40}, ${template.introIntensity ?? 45},
        ${input.userId}, false, 'tour', ${JSON.stringify({
		hero: false,
		service: false,
		employee: solo,
		testBooked: false
	})}, ${JSON.stringify(template.hours ?? DEFAULT_HOURS)}, ${template.address}, ${solo}
      )
    `;
	await sql`
      insert into shop_members (shop_id, user_id, role)
      values (${shopId}, ${input.userId}, 'owner')
    `;
	await sql`
      insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps)
      values (${shopId}, 'axiom_pro', 'trialing', 4900, 150)
    `;
	for (const s of services) await sql`
        insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order, group_label, price_unit)
        values (${s.id}, ${shopId}, ${s.name}, ${s.description}, ${s.durationMin}, ${s.priceCents}, ${s.sort}, ${s.group ?? ""}, ${s.priceUnit === "person" || s.priceUnit === "boat" ? s.priceUnit : "flat"})
      `;
	for (const e of employees) {
		await sql`
        insert into employees (
          id, shop_id, display_name, title, bio, phone, avatar_url, invite_token, invite_status
        ) values (
          ${e.id}, ${shopId}, ${e.displayName}, ${e.title}, ${e.bio}, ${e.phone ?? ""}, ${e.avatarUrl},
          ${e.token}, ${solo ? "claimed" : "pending"}
        )
      `;
		for (const idx of e.serviceIndexes) {
			const svc = services[idx];
			if (!svc) continue;
			await sql`
          insert into employee_services (employee_id, service_id)
          values (${e.id}, ${svc.id})
        `;
		}
	}
	for (const p of solo ? [] : template.portfolio) {
		const emp = employees[p.employeeIndex];
		if (!emp) continue;
		await sql`
        insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
        values (${newId("pf")}, ${shopId}, ${emp.id}, ${p.imageUrl}, ${p.caption})
      `;
	}
	await claimPreloadedLead(sql, leadSlug, shopId);
	return {
		slug,
		shopId,
		created: true
	};
}
var createShopFromNiche = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("fff0111b81048d2fdb01754712776e41b57112d20c9b14bd18695a7be91f7c9a"));
/** After a verified territory payment, build that lead's shop for the paying account. */
async function provisionTerritoryForPayer(input) {
	if (!input.userId || input.userId === "dev-user") return null;
	const sql = await getSql();
	const lead = (await sql`
    select business_name, trade_type, trade_label, shop_id
    from preloaded_leads
    where lead_slug = ${input.leadSlug}
    limit 1
  `)[0];
	if (!lead) return null;
	if (lead.shop_id) {
		const shop = (await sql`
      select id, slug, owner_user_id from shops where id = ${lead.shop_id} limit 1
    `)[0];
		if (!shop) return null;
		if (shop.owner_user_id && shop.owner_user_id !== input.userId) return null;
		if (!shop.owner_user_id) {
			await sql`update shops set owner_user_id = ${input.userId} where id = ${shop.id}`;
			await sql`
        insert into shop_members (shop_id, user_id, role)
        values (${shop.id}, ${input.userId}, 'owner')
        on conflict (shop_id, user_id) do nothing
      `;
		}
		return {
			slug: shop.slug,
			shopId: shop.id,
			created: false
		};
	}
	return provisionShopFromNiche({
		userId: input.userId,
		niche: nicheForLead(lead.trade_type, lead.trade_label ?? ""),
		name: lead.business_name,
		leadSlug: input.leadSlug
	});
}
var updateShopBrand = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("cc0942e921337ab38993c3c7b8c59f7e7f30bcf338e245618f83bafbfa582592"));
var saveTradeProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("b56fd9f410f11b7866fbe1ef782ff762f231a82134dc906a9456cf9a1cf6e4a9"));
var setEmployeeAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("e256b950a0766221a6e2c6f17a7bc459515e17eb59663f2e8a6ce3cd8a45e918"));
var setShopRingColor = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("268101d8c1ff513f0bcf57bf86d08af52b0d4d53a698bc5f5e00ef0cc44640ab"));
var setShopIntro = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("4a3d741f4ea25dc993998a4eaae63439307536b1d6b5945c33e0dde709b8cd62"));
var inviteEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("aa87097a34d8e3d2d957a7db6a1efd5ca2c14c54ff6a39c644c6fccb7b690014"));
var claimInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((token) => token).handler(createSsrRpc("aada2037010cdf5753557f0d845ad8897b308055acf6464586ddf2bcfd422abf"));
var getInvitePreview = createServerFn({ method: "GET" }).validator((token) => token).handler(createSsrRpc("1efc849d468da8194dc28868fabb50e7a182b529ec1132c7635d2174be23f0e9"));
var setShopDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("de6828cc4319ed4f6704b049aa0e20f40cd340676ea3e080db1c59099bd4af49"));
var setEmployeeDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("4e6f49cb426b4aae6a99f63971060cf97c4a7031a2842d4c268b37a9829f7d6c"));
var getOperatorData = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => {
	if (typeof input === "string") return {
		slug: input,
		desk: void 0
	};
	if (!input || typeof input.slug !== "string") throw new Error("Shop not found");
	return {
		slug: input.slug,
		desk: input.desk === "master" ? "master" : void 0
	};
}).handler(createSsrRpc("0448307bae57c4cb90c9e675e96ee95efc433358871a5d8a5cd71bfc73a3b4e7"));
var acceptBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("9cc41ac852ee56a58d91c2414049c5468c0283109c3db342d38325ad9c449097"));
var confirmLatestAudit = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("a4345c2a3718d2273868ed990b24b3215682216dc7a134253e891246cf7d6d74"));
var getAuditStatus = createServerFn({ method: "GET" }).validator((id) => {
	const value = String(id ?? "");
	if (!/^aud_[a-z0-9]+$/i.test(value)) throw new Error("Unknown audit");
	return value;
}).handler(createSsrRpc("20919cb98baafbb222fc2b5123727f964f30b3a8157bd11b3aa71ae1ad8198fc"));
var addPortfolioItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("9219cba4f202ba8cb97885c839c76493c7bbf25617b3f09ca632e6d252cfc222"));
var updateShopProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("0b0ee8cfd8f4ea623a5e7ebb96d688e898edecb4c65d55d2b0e4568d8819b378"));
var updateNotifyChannels = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8c43e1a86657d19af0c2319a4cc90728dd9868b54e4c8c0350021f0ab388edc5"));
var saveShopServices = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("039e07f58fcc1f71947e1f7d7923d1a02cda45d6dd20042d44444e87aa7cc682"));
var submitInquiry = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("a7ed0250a3e7c17f65127961361366f0fc7b21c0005a7f8bff38600dda622a86"));
var submitAudit = createServerFn({ method: "POST" }).validator((d) => {
	const name = String(d?.name ?? "").trim();
	const channel = d?.channel === "email" ? "email" : d?.channel === "text" ? "text" : "";
	const contact = String(d?.contact ?? "").trim().slice(0, 120);
	const lane = String(d?.lane ?? "").trim().slice(0, 40);
	const lowCents = Math.round(Number(d?.lowCents));
	const highCents = Math.round(Number(d?.highCents));
	const impact = Math.round(Number(d?.impact));
	const shopSlug = String(d?.shopSlug ?? "").trim().toLowerCase();
	const leadSlug = String(d?.leadSlug ?? "").trim().toLowerCase();
	if (name.length < 2 || name.length > 80) throw new Error("Name required");
	if (!channel) throw new Error("Choose text or email");
	if (!lane) throw new Error("Pick a bracket first");
	if (!Number.isFinite(lowCents) || !Number.isFinite(highCents) || lowCents < 0 || highCents < lowCents) throw new Error("This menu has no priced lines yet");
	if (!Number.isFinite(impact) || impact < 1 || impact > 99) throw new Error("Run the audit again");
	if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw new Error("Email required");
	if (channel === "text" && contact.replace(/\D/g, "").length < 7) throw new Error("Phone required");
	if (shopSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shopSlug)) throw new Error("Shop not found");
	if (leadSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leadSlug)) throw new Error("Unknown business");
	if (!shopSlug && !leadSlug) throw new Error("Unknown business");
	return {
		shopSlug,
		leadSlug,
		name,
		channel,
		contact,
		lane,
		lowCents,
		highCents,
		impact
	};
}).handler(createSsrRpc("8931314c139c6302212b3b6f9a9ca94051f224a305c4f56eea6e60038045a64a"));
var startCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6449c06456f79fb0f1658616115ef3c36d3f2f343eab94f5239f1f30a47086e7"));
var confirmCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("ee82a46cc2dddb66254bc92fe650406073296006db745cf220a3a27df3361c82"));
var releaseCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("18b5405c2a5624b6f4806f1b17ae09b0de2e7b9783a2dff0d3846f1f91a0cfa8"));
var beginStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("798f47840901265d21ab12eae37aac780a541e71459ea1c6857c7262b671edad"));
var refreshStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(createSsrRpc("d9481c168a629af6d4109b308f80e786ed81cc90af91fc0c9359d4ab98f9ff22"));
//#endregion
export { startCardCheckout as A, saveTradeProfile as C, setShopDashboard as D, setEmployeeDashboard as E, updateShopProfile as F, createSsrRpc as I, submitInquiry as M, updateNotifyChannels as N, setShopIntro as O, updateShopBrand as P, saveShopServices as S, setEmployeeAvailability as T, listMyShops as _, confirmCardCheckout as a, refreshStripeConnect as b, createShopFromNiche as c, getOperatorData as d, getPortfolio as f, listBookedStarts as g, inviteEmployee as h, claimInvite as i, submitAudit as j, setShopRingColor as k, getAuditStatus as l, getShopAccess as m, addPortfolioItem as n, confirmLatestAudit as o, getPublicShop as p, beginStripeConnect as r, createBooking as s, acceptBooking as t, getInvitePreview as u, listShopEvents as v, server_exports as w, releaseCardCheckout as x, listShowcaseShops as y };
