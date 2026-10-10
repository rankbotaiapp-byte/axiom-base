import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc--phiu8Av.mjs";
import { a as newId, o as slugify } from "./utils-BkNFIPfO.mjs";
import { n as isShopNiche } from "./types-TYGEZdcs.mjs";
import { C as parseIntroPreset, i as NICHES, t as DEFAULT_HOURS, w as priceUnitsFor } from "./intro-MrMOJI2L.mjs";
import { t as authMiddleware } from "./middleware-CYl_VtBx.mjs";
import { i as getSql } from "./db-BasGGAz9.mjs";
import { a as parseGlowEnabled, c as parseThemeProfile, l as parseWeek, o as parseLayout, s as parseNeonAccent } from "./storefront-6qzZj7oY.mjs";
import { a as parseDashboardConfig } from "./dashboard-BdvHoEL2.mjs";
import { n as toE164, t as isNotifyEmail } from "./notify-target-BTgSqjpY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-C2Pl9qkr.js
function parseOnboarding(raw) {
	const empty = {
		hero: false,
		service: false,
		employee: false,
		testBooked: false
	};
	try {
		const j = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!j || typeof j !== "object") return empty;
		return {
			hero: Boolean(j.hero),
			service: Boolean(j.service),
			employee: Boolean(j.employee),
			testBooked: Boolean(j.testBooked)
		};
	} catch {
		return empty;
	}
}
function parseHours(raw) {
	const hours = { ...DEFAULT_HOURS };
	try {
		const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return hours;
		for (const [key, value] of Object.entries(parsed)) if (typeof value === "string" && value.trim()) hours[key] = value;
	} catch {}
	return hours;
}
function finiteNumber(value, fallback) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}
function mapShop(r, acceptsCard = false, includeOwner = false) {
	const niche = isShopNiche(r.niche) ? r.niche : "location";
	return {
		id: r.id,
		slug: r.slug,
		name: r.name,
		niche,
		tagline: r.tagline,
		description: r.description,
		ringColor: r.ring_color || "#2EE6D6",
		heroImageUrl: r.hero_image_url || "",
		heroVideoUrl: r.hero_video_url || null,
		heroBlendPercent: finiteNumber(r.hero_blend_percent, 60),
		introPreset: parseIntroPreset(r.intro_preset),
		introSpeed: finiteNumber(r.intro_speed ?? 40, 40),
		introIntensity: finiteNumber(r.intro_intensity ?? 45, 45),
		primaryServiceId: r.primary_service_id,
		ownerUserId: includeOwner ? r.owner_user_id : null,
		isShowcase: Boolean(r.is_showcase),
		onboardingStep: r.onboarding_step || "generated",
		onboarding: parseOnboarding(r.onboarding_json),
		hours: parseHours(r.hours_json),
		address: r.address,
		acceptsCard,
		worksAlone: isOn(r.works_alone),
		dashboardOverride: isOn(r.dashboard_override),
		dashboardConfig: parseDashboardConfig(r.dashboard_config),
		themeProfile: parseThemeProfile(r.theme_profile, niche),
		neonAccent: parseNeonAccent(r.neon_accent),
		glowEnabled: parseGlowEnabled(r.glow_enabled),
		layout: parseLayout(r.layout_json),
		createdAt: String(r.created_at)
	};
}
function isOn(value) {
	return value === true || value === 1 || value === "t" || value === "true";
}
async function shopAcceptsCard(shopId) {
	try {
		const rows = await (await getSql())`
      select stripe_charges_enabled, stripe_account_id
      from shop_billing where shop_id = ${shopId}
    `;
		return isOn(rows[0]?.stripe_charges_enabled) && Boolean(rows[0]?.stripe_account_id);
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (/stripe_charges_enabled|stripe_account_id|does not exist/i.test(message)) return false;
		throw err;
	}
}
var OPEN_BOOKING_SQL = `
  status in ('pending', 'confirmed')
  and (
    payment_status in ('paid', 'unpaid')
    or (payment_status = 'processing' and created_at > now() - interval '30 minutes')
  )
`;
async function loadShopRow(slug) {
	return (await (await getSql())`select * from shops where slug = ${slug} limit 1`)[0] ?? null;
}
async function employeeServiceMap(shopId) {
	const rows = await (await getSql())`
    select es.employee_id, es.service_id
    from employee_services es
    join employees e on e.id = es.employee_id
    where e.shop_id = ${shopId}
  `;
	const map = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const list = map.get(r.employee_id) ?? [];
		list.push(r.service_id);
		map.set(r.employee_id, list);
	}
	return map;
}
async function loadEmployees(shopId) {
	const sql = await getSql();
	let rows;
	try {
		rows = await sql`
      select id, shop_id, display_name, title, bio, phone, avatar_url, invite_status, dashboard_config, availability_json
      from employees where shop_id = ${shopId} order by created_at asc
    `;
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (!/dashboard_config|availability_json/i.test(message)) throw err;
		rows = await sql`
      select id, shop_id, display_name, title, bio, phone, avatar_url, invite_status
      from employees where shop_id = ${shopId} order by created_at asc
    `;
	}
	const services = await employeeServiceMap(shopId);
	return rows.map((r) => ({
		id: r.id,
		shopId: r.shop_id,
		displayName: r.display_name,
		title: r.title,
		bio: r.bio,
		phone: r.phone,
		avatarUrl: r.avatar_url,
		inviteStatus: r.invite_status,
		serviceIds: services.get(r.id) ?? [],
		dashboardConfig: parseDashboardConfig(r.dashboard_config),
		availability: parseWeek(r.availability_json)
	}));
}
function mapServiceRow(r) {
	const unit = r.price_unit === "person" || r.price_unit === "boat" ? r.price_unit : "flat";
	return {
		id: r.id,
		shopId: r.shop_id,
		name: r.name,
		description: r.description,
		durationMin: Number(r.duration_min),
		priceCents: Number(r.price_cents),
		group: r.group_label ?? "",
		priceUnit: unit
	};
}
async function loadServices(shopId) {
	const sql = await getSql();
	try {
		return (await sql`
      select id, shop_id, name, description, duration_min, price_cents, group_label, price_unit
      from services where shop_id = ${shopId} order by sort_order asc, name asc
    `).map(mapServiceRow);
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (!/group_label|price_unit/i.test(message)) throw err;
		return (await sql`
      select id, shop_id, name, description, duration_min, price_cents
      from services where shop_id = ${shopId} order by sort_order asc, name asc
    `).map((r) => mapServiceRow(r));
	}
}
var getPublicShop_createServerFn_handler = createServerRpc({
	id: "30642a916957732ce0ede2e076fdb02b275425ecbb5a809f21665bb30ca990d6",
	name: "getPublicShop",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getPublicShop.__executeServer(opts));
var getPublicShop = createServerFn({ method: "GET" }).validator((slug) => slug).handler(getPublicShop_createServerFn_handler, async ({ data: slug }) => {
	const row = await loadShopRow(slug);
	if (!row) return null;
	const shop = mapShop(row, await shopAcceptsCard(row.id));
	const [services, employees] = await Promise.all([loadServices(shop.id), loadEmployees(shop.id)]);
	return {
		shop,
		services,
		employees
	};
});
var listShowcaseShops_createServerFn_handler = createServerRpc({
	id: "f72216c02755fa90557b16a345b8c00ab8c6d61d8c3c98b86380c8bee6b80dca",
	name: "listShowcaseShops",
	filename: "src/lib/axiom/server.ts"
}, (opts) => listShowcaseShops.__executeServer(opts));
var listShowcaseShops = createServerFn({ method: "GET" }).handler(listShowcaseShops_createServerFn_handler, async () => {
	return (await (await getSql())`
      select * from shops where is_showcase = true order by created_at asc
    `).map((row) => mapShop(row));
});
var listBookedStarts_createServerFn_handler = createServerRpc({
	id: "f829bacc015ea9c584d6ae5c326a97820f705785a12b391b88c3b47ee8419cba",
	name: "listBookedStarts",
	filename: "src/lib/axiom/server.ts"
}, (opts) => listBookedStarts.__executeServer(opts));
var listBookedStarts = createServerFn({ method: "GET" }).validator((d) => d).handler(listBookedStarts_createServerFn_handler, async ({ data }) => {
	const row = await loadShopRow(data.slug);
	if (!row) return [];
	return (await (await getSql()).query(`select starts_at from appointments
       where shop_id = $1
         and employee_id = $2
         and ${OPEN_BOOKING_SQL}
         and starts_at > now() - interval '1 day'`, [row.id, data.employeeId])).map((r) => String(r.starts_at));
});
var getPortfolio_createServerFn_handler = createServerRpc({
	id: "8c4f196bd44621e17aae1a5067f96ed468e28b603c84cc4704041cbe5288e416",
	name: "getPortfolio",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getPortfolio.__executeServer(opts));
var getPortfolio = createServerFn({ method: "GET" }).validator((employeeId) => employeeId).handler(getPortfolio_createServerFn_handler, async ({ data: employeeId }) => {
	return (await (await getSql())`
      select id, employee_id, image_url, caption
      from portfolio_items where employee_id = ${employeeId}
      order by created_at desc
    `).map((r) => ({
		id: r.id,
		employeeId: r.employee_id,
		imageUrl: r.image_url,
		caption: r.caption
	}));
});
var listShopEvents_createServerFn_handler = createServerRpc({
	id: "e6dfeb63056e67b41ebe7f194100e4e43214edcb391e3ee824cd5b7b1a130387",
	name: "listShopEvents",
	filename: "src/lib/axiom/server.ts"
}, (opts) => listShopEvents.__executeServer(opts));
var listShopEvents = createServerFn({ method: "GET" }).validator((d) => d).handler(listShopEvents_createServerFn_handler, async ({ data }) => {
	const row = await loadShopRow(data.slug);
	if (!row) return [];
	const sql = await getSql();
	return (data.after ? await sql`
          select id, type, appointment_id, payload, created_at from shop_events
          where shop_id = ${row.id} and created_at > ${data.after}
          order by created_at asc limit 40
        ` : await sql`
          select id, type, appointment_id, payload, created_at from shop_events
          where shop_id = ${row.id}
          order by created_at desc limit 12
        `).map((r) => ({
		id: r.id,
		type: r.type,
		appointmentId: r.appointment_id,
		payload: r.payload,
		createdAt: String(r.created_at)
	}));
});
var getAppointmentPublic_createServerFn_handler = createServerRpc({
	id: "ccae9bd556feaad5df260bf196d003143fa1bc3bd089df43dd943122bf3d3b6c",
	name: "getAppointmentPublic",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getAppointmentPublic.__executeServer(opts));
var getAppointmentPublic = createServerFn({ method: "GET" }).validator((d) => d).handler(getAppointmentPublic_createServerFn_handler, async ({ data }) => {
	const shop = await loadShopRow(data.slug);
	if (!shop) return null;
	const r = (await (await getSql())`
      select a.id, a.status, a.starts_at, e.display_name as employee_name, s.name as service_name
      from appointments a
      join employees e on e.id = a.employee_id
      join services s on s.id = a.service_id
      where a.id = ${data.id} and a.shop_id = ${shop.id}
      limit 1
    `)[0];
	if (!r) return null;
	return {
		id: r.id,
		status: r.status,
		startsAt: String(r.starts_at),
		employeeName: r.employee_name,
		serviceName: r.service_name
	};
});
function cleanGuestEmail(raw) {
	const email = (raw ?? "").trim().toLowerCase().slice(0, 120);
	if (!email) return "";
	if (!isNotifyEmail(email)) throw new Error("Enter a valid email");
	return email;
}
async function assertBookable(data) {
	const shop = await loadShopRow(data.slug);
	if (!shop) throw new Error("Shop not found");
	const name = data.customerName.trim();
	if (name.length < 2 || name.length > 80) throw new Error("Name required");
	const when = new Date(data.startsAt);
	if (Number.isNaN(when.getTime())) throw new Error("Invalid time");
	const sql = await getSql();
	const service = await sql`
    select name, price_cents from services
    where id = ${data.serviceId} and shop_id = ${shop.id}
    limit 1
  `;
	if (!service[0]) throw new Error("Service not found");
	const employee = await sql`
    select display_name from employees
    where id = ${data.employeeId} and shop_id = ${shop.id}
    limit 1
  `;
	if (!employee[0]) throw new Error("Specialist not found");
	if (!(await sql`
    select employee_id from employee_services
    where employee_id = ${data.employeeId} and service_id = ${data.serviceId}
  `)[0]) throw new Error("That specialist does not offer this service");
	if ((await sql.query(`select id from appointments
     where employee_id = $1 and starts_at = $2 and ${OPEN_BOOKING_SQL}
     limit 1`, [data.employeeId, data.startsAt]))[0]) throw new Error("That time was just taken");
	return {
		shop,
		name,
		phone: data.customerPhone.trim().slice(0, 20),
		email: cleanGuestEmail(data.customerEmail),
		serviceName: service[0].name,
		priceCents: Number(service[0].price_cents),
		employeeName: employee[0].display_name
	};
}
function isSlotTaken(err) {
	const queue = [err];
	const seen = /* @__PURE__ */ new Set();
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || typeof current !== "object" || seen.has(current)) continue;
		seen.add(current);
		const row = current;
		if (row.code === "23505") return true;
		if (typeof row.message === "string" && (row.message.includes("23505") || row.message.includes("appointments_no_double_booking"))) return true;
		if (row.cause) queue.push(row.cause);
	}
	return false;
}
var createBooking_createServerFn_handler = createServerRpc({
	id: "2c61f6c5d07f7ac5f6cfbdc53f8c7038bf8884f7c4a21cf7c5f5e5ab30064b8f",
	name: "createBooking",
	filename: "src/lib/axiom/server.ts"
}, (opts) => createBooking.__executeServer(opts));
var createBooking = createServerFn({ method: "POST" }).validator((d) => d).handler(createBooking_createServerFn_handler, async ({ data }) => {
	const booked = await assertBookable(data);
	const demo = data.paymentMode === "demo";
	if (demo) {
		if (!booked.shop.is_showcase) throw new Error("This shop does not use demo checkout");
		if (!data.paymentRef?.startsWith("gg_")) throw new Error("Demo payment was not completed");
	}
	const sql = await getSql();
	const id = newId("apt");
	try {
		await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone, customer_email,
          starts_at, status, payment_status, payment_ref, payment_cents
        ) values (
          ${id}, ${booked.shop.id}, ${data.employeeId}, ${data.serviceId}, ${booked.name},
          ${booked.phone}, ${booked.email}, ${data.startsAt}, 'pending', ${demo ? "paid" : "unpaid"},
          ${demo ? data.paymentRef ?? null : null}, ${booked.priceCents}
        )
      `;
	} catch (err) {
		if (isSlotTaken(err)) throw new Error("That time was just taken. Please choose another slot.");
		throw err;
	}
	await sql`
      insert into shop_events (id, shop_id, type, appointment_id)
      values (${newId("evt")}, ${booked.shop.id}, 'booking_request', ${id})
    `;
	const { notifyBookingParties } = await import("./notify.server-DYzUTjiz.mjs");
	await notifyBookingParties({
		shopId: booked.shop.id,
		shopName: booked.shop.name,
		employeeId: data.employeeId,
		guestName: booked.name,
		guestPhone: booked.phone,
		guestEmail: booked.email,
		serviceName: booked.serviceName,
		employeeName: booked.employeeName,
		startsAt: data.startsAt,
		phase: "request"
	});
	if (!booked.shop.is_showcase) {
		const flags = parseOnboarding(booked.shop.onboarding_json);
		flags.testBooked = true;
		await sql`
        update shops
        set onboarding_json = ${JSON.stringify(flags)},
            onboarding_step = 'complete'
        where id = ${booked.shop.id}
      `;
	}
	return { id };
});
async function membership(shopId, userId) {
	return (await (await getSql())`
    select role, employee_id from shop_members
    where shop_id = ${shopId} and user_id = ${userId}
    limit 1
  `)[0] ?? null;
}
var getShopAccess_createServerFn_handler = createServerRpc({
	id: "67aca4a0b4d0b1ed0ad5278149217973b9db21407da6f799cbe369b72cd9a1c2",
	name: "getShopAccess",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getShopAccess.__executeServer(opts));
var getShopAccess = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((slug) => slug).handler(getShopAccess_createServerFn_handler, async ({ data: slug, context }) => {
	const row = await loadShopRow(slug);
	if (!row) return {
		mode: "none",
		shop: null,
		employeeId: null
	};
	const mem = await membership(row.id, context.userId);
	const shop = mapShop(row, false, mem?.role === "owner" || row.owner_user_id === context.userId);
	if (mem?.role === "owner") return {
		mode: "owner",
		shop,
		employeeId: mem.employee_id
	};
	if (mem?.role === "employee") return {
		mode: "employee",
		shop,
		employeeId: mem.employee_id
	};
	if (shop.isShowcase) return {
		mode: "preview",
		shop,
		employeeId: null
	};
	return {
		mode: "none",
		shop,
		employeeId: null
	};
});
var listMyShops_createServerFn_handler = createServerRpc({
	id: "6521a92301daa18d33236f64eda487904d6acc18113b45e5197ee75e7633eb9a",
	name: "listMyShops",
	filename: "src/lib/axiom/server.ts"
}, (opts) => listMyShops.__executeServer(opts));
var listMyShops = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyShops_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select s.* from shops s
      join shop_members m on m.shop_id = s.id
      where m.user_id = ${context.userId}
      order by s.created_at desc
    `).map((row) => mapShop(row, false, row.owner_user_id === context.userId));
});
var createShopFromNiche_createServerFn_handler = createServerRpc({
	id: "fff0111b81048d2fdb01754712776e41b57112d20c9b14bd18695a7be91f7c9a",
	name: "createShopFromNiche",
	filename: "src/lib/axiom/server.ts"
}, (opts) => createShopFromNiche.__executeServer(opts));
var createShopFromNiche = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createShopFromNiche_createServerFn_handler, async ({ data, context }) => {
	const template = NICHES[data.niche];
	if (!template) throw new Error("Unknown niche");
	const sql = await getSql();
	const existing = await sql`
      select s.slug from shops s
      join shop_members m on m.shop_id = s.id
      where m.user_id = ${context.userId} and m.role = 'owner'
      order by s.created_at desc limit 1
    `;
	if (existing[0]) return {
		slug: existing[0].slug,
		created: false
	};
	const name = data.name.trim() || template.defaultName;
	let slug = slugify(name);
	if ((await sql`select slug from shops where slug = ${slug}`)[0]) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
	const shopId = newId("shop");
	const services = template.services.map((s, i) => ({
		...s,
		id: newId("svc"),
		sort: i
	}));
	const solo = Boolean(data.solo);
	const employees = (solo ? [{
		displayName: (data.ownerName ?? "").trim() || "You",
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
        ${context.userId}, false, 'tour', ${JSON.stringify({
		hero: false,
		service: false,
		employee: solo,
		testBooked: false
	})}, ${JSON.stringify(template.hours ?? DEFAULT_HOURS)}, ${template.address}, ${solo}
      )
    `;
	await sql`
      insert into shop_members (shop_id, user_id, role)
      values (${shopId}, ${context.userId}, 'owner')
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
	const leadSlug = (data.leadSlug ?? "").trim().toLowerCase();
	if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leadSlug)) {
		const claimed = await sql`
        update preloaded_leads
        set claimed = true, shop_id = ${shopId}
        where lead_slug = ${leadSlug} and claimed = false
        returning id, county
      `;
		if (claimed[0]) {
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
	}
	return {
		slug,
		created: true
	};
});
var updateShopBrand_createServerFn_handler = createServerRpc({
	id: "cc0942e921337ab38993c3c7b8c59f7e7f30bcf338e245618f83bafbfa582592",
	name: "updateShopBrand",
	filename: "src/lib/axiom/server.ts"
}, (opts) => updateShopBrand.__executeServer(opts));
var updateShopBrand = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateShopBrand_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	await assertCanModifyShop(row, context.userId);
	const flags = parseOnboarding(row.onboarding_json);
	if (data.markHero) flags.hero = true;
	if (data.markService) flags.service = true;
	const step = data.onboardingStep ?? row.onboarding_step;
	const sql = await getSql();
	await sql`
      update shops set
        ring_color = ${data.ringColor ?? row.ring_color},
        hero_blend_percent = ${data.heroBlendPercent ?? row.hero_blend_percent},
        intro_preset = ${data.introPreset ?? row.intro_preset ?? "kenburns"},
        intro_speed = ${data.introSpeed ?? row.intro_speed ?? 40},
        intro_intensity = ${data.introIntensity ?? row.intro_intensity ?? 45},
        hero_image_url = ${data.heroImageUrl ?? row.hero_image_url},
        name = ${data.name ?? row.name},
        tagline = ${data.tagline ?? row.tagline},
        primary_service_id = ${data.primaryServiceId ?? row.primary_service_id},
        onboarding_json = ${JSON.stringify(flags)},
        onboarding_step = ${step}
      where id = ${row.id}
    `;
	try {
		await sql`
        update shops set
          neon_accent = ${data.neonAccent ?? row.neon_accent ?? ""},
          glow_enabled = ${data.glowEnabled ?? row.glow_enabled ?? true},
          layout_json = ${JSON.stringify(data.layout ?? parseLayout(row.layout_json))}
        where id = ${row.id}
      `;
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (!/neon_accent|glow_enabled|layout_json/i.test(message)) throw err;
	}
	return {
		ok: true,
		onboarding: flags
	};
});
var WEEK_KEYS = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun"
];
var setEmployeeAvailability_createServerFn_handler = createServerRpc({
	id: "e256b950a0766221a6e2c6f17a7bc459515e17eb59663f2e8a6ce3cd8a45e918",
	name: "setEmployeeAvailability",
	filename: "src/lib/axiom/server.ts"
}, (opts) => setEmployeeAvailability.__executeServer(opts));
var setEmployeeAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(setEmployeeAvailability_createServerFn_handler, async ({ data, context }) => {
	if (!WEEK_KEYS.includes(data.day)) throw new Error("Unknown day");
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	const sql = await getSql();
	const employee = (await sql`
      select id, claimed_user_id, availability_json from employees
      where id = ${data.employeeId} and shop_id = ${row.id}
      limit 1
    `)[0];
	if (!employee) throw new Error("Staff profile not found");
	if (!(row.owner_user_id === context.userId) && employee.claimed_user_id !== context.userId) throw new Error("Forbidden");
	const week = parseWeek(employee.availability_json);
	week[data.day] = Boolean(data.on);
	await sql`
      update employees set availability_json = ${JSON.stringify(week)}
      where id = ${employee.id} and shop_id = ${row.id}
    `;
	return {
		ok: true,
		availability: week
	};
});
var setShopRingColor_createServerFn_handler = createServerRpc({
	id: "268101d8c1ff513f0bcf57bf86d08af52b0d4d53a698bc5f5e00ef0cc44640ab",
	name: "setShopRingColor",
	filename: "src/lib/axiom/server.ts"
}, (opts) => setShopRingColor.__executeServer(opts));
var setShopRingColor = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(setShopRingColor_createServerFn_handler, async ({ data, context }) => {
	const color = data.ringColor.trim().toUpperCase();
	if (!/^#[0-9A-F]{6}$/.test(color)) throw new Error("Invalid color");
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	await assertCanModifyShop(row, context.userId);
	const sql = await getSql();
	await sql`update shops set ring_color = ${color} where id = ${row.id}`;
	await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${row.id}, 'ring_color', ${color})
    `;
	return { ringColor: color };
});
var setShopIntro_createServerFn_handler = createServerRpc({
	id: "4a3d741f4ea25dc993998a4eaae63439307536b1d6b5945c33e0dde709b8cd62",
	name: "setShopIntro",
	filename: "src/lib/axiom/server.ts"
}, (opts) => setShopIntro.__executeServer(opts));
var setShopIntro = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(setShopIntro_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	await assertCanModifyShop(row, context.userId);
	const speed = Math.min(100, Math.max(1, Math.round(data.introSpeed)));
	const intensity = Math.min(100, Math.max(0, Math.round(data.introIntensity)));
	const preset = parseIntroPreset(data.introPreset);
	await (await getSql())`
      update shops set
        intro_preset = ${preset},
        intro_speed = ${speed},
        intro_intensity = ${intensity}
      where id = ${row.id}
    `;
	return {
		introPreset: preset,
		introSpeed: speed,
		introIntensity: intensity
	};
});
var inviteEmployee_createServerFn_handler = createServerRpc({
	id: "aa87097a34d8e3d2d957a7db6a1efd5ca2c14c54ff6a39c644c6fccb7b690014",
	name: "inviteEmployee",
	filename: "src/lib/axiom/server.ts"
}, (opts) => inviteEmployee.__executeServer(opts));
var inviteEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(inviteEmployee_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	if (!await allowOperator(row, context.userId)) throw new Error("Forbidden");
	const name = data.displayName.trim();
	if (name.length < 2) throw new Error("Name required");
	const sql = await getSql();
	const id = newId("emp");
	const token = crypto.randomUUID();
	const template = NICHES[row.niche] ?? NICHES.location;
	const avatar = template.employees[1]?.avatarUrl || template.employees[0]?.avatarUrl || "";
	await sql`
      insert into employees (
        id, shop_id, display_name, title, bio, phone, avatar_url, invite_token, invite_status
      ) values (
        ${id}, ${row.id}, ${name}, ${data.title?.trim() || "Specialist"},
        ${template.employees[1]?.bio ?? ""}, ${data.phone.trim()}, ${avatar},
        ${token}, 'pending'
      )
    `;
	const services = await sql`
      select id from services where shop_id = ${row.id} order by sort_order asc
    `;
	for (const s of services) await sql`
        insert into employee_services (employee_id, service_id)
        values (${id}, ${s.id})
        on conflict do nothing
      `;
	const flags = parseOnboarding(row.onboarding_json);
	flags.employee = true;
	await sql`
      update shops set onboarding_json = ${JSON.stringify(flags)}, onboarding_step = 'loop'
      where id = ${row.id}
    `;
	return {
		id,
		token,
		invitePath: `/invite/${token}`
	};
});
var claimInvite_createServerFn_handler = createServerRpc({
	id: "aada2037010cdf5753557f0d845ad8897b308055acf6464586ddf2bcfd422abf",
	name: "claimInvite",
	filename: "src/lib/axiom/server.ts"
}, (opts) => claimInvite.__executeServer(opts));
var claimInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((token) => token).handler(claimInvite_createServerFn_handler, async ({ data: token, context }) => {
	const sql = await getSql();
	const emp = (await sql`
      select e.id, e.shop_id, s.slug
      from employees e
      join shops s on s.id = e.shop_id
      where e.invite_token = ${token}
      limit 1
    `)[0];
	if (!emp) throw new Error("Invite expired");
	await sql`
      update employees
      set invite_status = 'claimed', claimed_user_id = ${context.userId}
      where id = ${emp.id}
    `;
	await sql`
      insert into shop_members (shop_id, user_id, role, employee_id)
      values (${emp.shop_id}, ${context.userId}, 'employee', ${emp.id})
      on conflict (shop_id, user_id) do update set role = 'employee', employee_id = ${emp.id}
    `;
	return { slug: emp.slug };
});
var getInvitePreview_createServerFn_handler = createServerRpc({
	id: "1efc849d468da8194dc28868fabb50e7a182b529ec1132c7635d2174be23f0e9",
	name: "getInvitePreview",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getInvitePreview.__executeServer(opts));
var getInvitePreview = createServerFn({ method: "GET" }).validator((token) => token).handler(getInvitePreview_createServerFn_handler, async ({ data: token }) => {
	return (await (await getSql())`
      select e.display_name, s.name as shop_name, s.slug, e.invite_status
      from employees e
      join shops s on s.id = e.shop_id
      where e.invite_token = ${token}
      limit 1
    `)[0] ?? null;
});
async function mapAppointments(shopId, employeeId) {
	const sql = await getSql();
	return (employeeId ? await sql`
        select a.id, a.shop_id, a.employee_id, e.display_name as employee_name,
               a.service_id, s.name as service_name, a.customer_name, a.customer_phone,
               a.starts_at, a.status, a.payment_status, a.payment_cents, a.payment_ref
        from appointments a
        join employees e on e.id = a.employee_id
        join services s on s.id = a.service_id
        where a.shop_id = ${shopId} and a.employee_id = ${employeeId}
        order by a.starts_at desc
        limit 80
      ` : await sql`
        select a.id, a.shop_id, a.employee_id, e.display_name as employee_name,
               a.service_id, s.name as service_name, a.customer_name, a.customer_phone,
               a.starts_at, a.status, a.payment_status, a.payment_cents, a.payment_ref
        from appointments a
        join employees e on e.id = a.employee_id
        join services s on s.id = a.service_id
        where a.shop_id = ${shopId}
        order by a.starts_at desc
        limit 80
      `).map((r) => ({
		id: r.id,
		shopId: r.shop_id,
		employeeId: r.employee_id,
		employeeName: r.employee_name,
		serviceId: r.service_id,
		serviceName: r.service_name,
		customerName: r.customer_name,
		customerPhone: r.customer_phone,
		startsAt: String(r.starts_at),
		status: r.status,
		paymentStatus: r.payment_status,
		paymentCents: Number(r.payment_cents),
		paymentRef: r.payment_ref
	}));
}
async function loadNotices(shopId, employeeId) {
	const sql = await getSql();
	const mapRow = (r) => ({
		id: r.id,
		channel: r.channel,
		kind: r.kind,
		employeeId: r.employee_id ?? null,
		destination: r.destination,
		subject: r.subject,
		body: r.body,
		status: r.status,
		detail: r.detail,
		createdAt: String(r.created_at)
	});
	try {
		return (employeeId ? await sql`
          select id, channel, kind, employee_id, destination, subject, body, status, detail, created_at
          from shop_notifications
          where shop_id = ${shopId} and employee_id = ${employeeId} and channel = 'inbox'
          order by created_at desc
          limit 30
        ` : await sql`
          select id, channel, kind, employee_id, destination, subject, body, status, detail, created_at
          from shop_notifications
          where shop_id = ${shopId}
          order by created_at desc
          limit 30
        `).map(mapRow);
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (!/employee_id/i.test(message)) throw err;
		if (employeeId) return [];
		return (await sql`
      select id, channel, kind, destination, subject, body, status, detail, created_at
      from shop_notifications
      where shop_id = ${shopId}
      order by created_at desc
      limit 30
    `).map(mapRow);
	}
}
var setShopDashboard_createServerFn_handler = createServerRpc({
	id: "de6828cc4319ed4f6704b049aa0e20f40cd340676ea3e080db1c59099bd4af49",
	name: "setShopDashboard",
	filename: "src/lib/axiom/server.ts"
}, (opts) => setShopDashboard.__executeServer(opts));
var setShopDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(setShopDashboard_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	await assertCanModifyShop(row, context.userId);
	const config = parseDashboardConfig(data.config);
	await (await getSql())`
      update shops
      set dashboard_override = ${Boolean(data.override)},
          dashboard_config = ${JSON.stringify(config)}
      where id = ${row.id}
    `;
	return {
		override: Boolean(data.override),
		config
	};
});
var setEmployeeDashboard_createServerFn_handler = createServerRpc({
	id: "4e6f49cb426b4aae6a99f63971060cf97c4a7031a2842d4c268b37a9829f7d6c",
	name: "setEmployeeDashboard",
	filename: "src/lib/axiom/server.ts"
}, (opts) => setEmployeeDashboard.__executeServer(opts));
var setEmployeeDashboard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(setEmployeeDashboard_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	const config = parseDashboardConfig(data.config);
	const sql = await getSql();
	if (!(await sql`
      select id from employees where id = ${data.employeeId} and shop_id = ${row.id} limit 1
    `)[0]) throw new Error("Staff not found");
	if (row.is_showcase) await assertCanModifyShop(row, context.userId);
	else {
		const mem = await membership(row.id, context.userId);
		const isOwner = await allowOperator(row, context.userId);
		const isSelf = mem?.role === "employee" && mem.employee_id === data.employeeId;
		if (!isOwner && !isSelf) throw new Error("Forbidden");
	}
	await sql`
      update employees
      set dashboard_config = ${JSON.stringify(config)}
      where id = ${data.employeeId}
    `;
	return { config };
});
async function allowOperator(row, userId) {
	if (row.owner_user_id && row.owner_user_id === userId) return true;
	if ((await membership(row.id, userId))?.role === "owner") return true;
	const { isPlatformOwner } = await import("./platform-owner.server-BSV0F2ax.mjs");
	return isPlatformOwner(userId);
}
async function assertCanModifyShop(row, userId) {
	if (row.is_showcase) {
		const { isPlatformOwner } = await import("./platform-owner.server-BSV0F2ax.mjs");
		if (!await isPlatformOwner(userId)) throw new Error("Showcase shops are read-only");
		return;
	}
	if (!await allowOperator(row, userId)) throw new Error("Forbidden");
}
async function requireOwnerShop(slug, userId) {
	const row = await loadShopRow(slug);
	if (!row) throw new Error("Shop not found");
	if (row.is_showcase) throw new Error("Showcase shops are read-only");
	if (!await allowOperator(row, userId)) throw new Error("Forbidden");
	return row;
}
var getOperatorData_createServerFn_handler = createServerRpc({
	id: "0448307bae57c4cb90c9e675e96ee95efc433358871a5d8a5cd71bfc73a3b4e7",
	name: "getOperatorData",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getOperatorData.__executeServer(opts));
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
}).handler(getOperatorData_createServerFn_handler, async ({ data, context }) => {
	const slug = data.slug;
	const row = await loadShopRow(slug);
	if (!row) throw new Error("Shop not found");
	const mem = await membership(row.id, context.userId);
	let stripeAccountId = null;
	let chargesEnabled = false;
	const shop = mapShop(row, false);
	let asMaster = false;
	if (data.desk === "master" && row.owner_user_id !== context.userId) {
		const { isPlatformOwner } = await import("./platform-owner.server-BSV0F2ax.mjs");
		asMaster = await isPlatformOwner(context.userId);
	}
	let mode = mem?.role === "owner" ? "owner" : mem?.role === "employee" ? "employee" : shop.isShowcase ? "preview" : "none";
	if (asMaster && !shop.isShowcase) mode = "owner";
	if (mode === "none") throw new Error("Forbidden");
	const appointments = mode === "preview" ? (await mapAppointments(shop.id)).map((a) => ({
		...a,
		customerName: a.status === "completed" ? a.customerName : "Guest",
		customerPhone: ""
	})) : await mapAppointments(shop.id, mode === "employee" ? mem?.employee_id : null);
	let billing = null;
	if (mode === "owner" || mode === "preview") {
		const b = await (await getSql())`
        select plan, status, price_cents, gear_guardian_bps, stripe_account_id, stripe_charges_enabled
        from shop_billing where shop_id = ${shop.id}
      `;
		if (b[0]) {
			billing = {
				plan: b[0].plan,
				status: b[0].status,
				priceCents: Number(b[0].price_cents),
				gearGuardianBps: Number(b[0].gear_guardian_bps)
			};
			stripeAccountId = b[0].stripe_account_id;
			chargesEnabled = isOn(b[0].stripe_charges_enabled) && Boolean(b[0].stripe_account_id);
		}
	}
	shop.acceptsCard = chargesEnabled;
	const [services, employees] = await Promise.all([loadServices(shop.id), loadEmployees(shop.id)]);
	const { stripeConfigured } = await import("./payments.server-FNgWcc17.mjs");
	const payments = {
		processorReady: stripeConfigured(),
		connected: Boolean(stripeAccountId),
		chargesEnabled
	};
	const notices = mode === "owner" ? await loadNotices(shop.id) : mode === "employee" && mem?.employee_id ? await loadNotices(shop.id, mem.employee_id) : [];
	return {
		mode,
		shop,
		appointments,
		billing,
		services,
		employees,
		employeeId: mem?.employee_id ?? null,
		notices,
		notifyEmail: mode === "owner" ? row.notify_email ?? "" : "",
		notifyPhone: mode === "owner" ? row.notify_phone ?? "" : "",
		payments,
		platformDesk: asMaster && mode === "owner"
	};
});
var acceptBooking_createServerFn_handler = createServerRpc({
	id: "9cc41ac852ee56a58d91c2414049c5468c0283109c3db342d38325ad9c449097",
	name: "acceptBooking",
	filename: "src/lib/axiom/server.ts"
}, (opts) => acceptBooking.__executeServer(opts));
var acceptBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(acceptBooking_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	const sql = await getSql();
	const booking = (await sql`
      select a.id, a.employee_id, a.customer_name, a.customer_phone, a.customer_email, a.starts_at,
        s.name as service_name, e.display_name as employee_name
      from appointments a
      join services s on s.id = a.service_id
      join employees e on e.id = a.employee_id
      where a.id = ${data.appointmentId} and a.shop_id = ${row.id} and a.status = 'pending'
      limit 1
    `)[0];
	if (!booking) throw new Error("Booking not found");
	if (row.is_showcase) await assertCanModifyShop(row, context.userId);
	else {
		const mem = await membership(row.id, context.userId);
		const isOwner = row.owner_user_id === context.userId || mem?.role === "owner" || await allowOperator(row, context.userId);
		const isAssignee = mem?.role === "employee" && mem.employee_id === booking.employee_id;
		if (!isOwner && !isAssignee) throw new Error("Forbidden");
	}
	if (!(await sql`
      update appointments
      set status = 'confirmed'
      where id = ${data.appointmentId} and shop_id = ${row.id} and status = 'pending'
      returning id
    `)[0]) throw new Error("Booking not found");
	await sql`
      insert into shop_events (id, shop_id, type, appointment_id)
      values (${newId("evt")}, ${row.id}, 'booking_confirmed', ${data.appointmentId})
    `;
	const { notifyBookingParties } = await import("./notify.server-DYzUTjiz.mjs");
	await notifyBookingParties({
		shopId: row.id,
		shopName: row.name,
		employeeId: booking.employee_id,
		guestName: booking.customer_name,
		guestPhone: booking.customer_phone,
		guestEmail: booking.customer_email ?? "",
		serviceName: booking.service_name,
		employeeName: booking.employee_name,
		startsAt: String(booking.starts_at),
		phase: "confirmed"
	});
	return { ok: true };
});
var addPortfolioItem_createServerFn_handler = createServerRpc({
	id: "9219cba4f202ba8cb97885c839c76493c7bbf25617b3f09ca632e6d252cfc222",
	name: "addPortfolioItem",
	filename: "src/lib/axiom/server.ts"
}, (opts) => addPortfolioItem.__executeServer(opts));
var addPortfolioItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(addPortfolioItem_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	const employeeId = (await membership(row.id, context.userId))?.employee_id ?? (await (await getSql())`
          select id from employees where shop_id = ${row.id} and claimed_user_id = ${context.userId} limit 1
        `)[0]?.id;
	if (!employeeId && row.owner_user_id !== context.userId) throw new Error("Forbidden");
	const empId = employeeId ?? (await (await getSql())`
          select id from employees where shop_id = ${row.id} order by created_at asc limit 1
        `)[0]?.id;
	if (!empId) throw new Error("No staff profile");
	if (!data.imageUrl.startsWith("data:image/") && !data.imageUrl.startsWith("/")) throw new Error("Invalid image");
	const sql = await getSql();
	const id = newId("pf");
	await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
      values (${id}, ${row.id}, ${empId}, ${data.imageUrl}, ${data.caption.trim().slice(0, 80)})
    `;
	return { id };
});
var updateShopProfile_createServerFn_handler = createServerRpc({
	id: "0b0ee8cfd8f4ea623a5e7ebb96d688e898edecb4c65d55d2b0e4568d8819b378",
	name: "updateShopProfile",
	filename: "src/lib/axiom/server.ts"
}, (opts) => updateShopProfile.__executeServer(opts));
var updateShopProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateShopProfile_createServerFn_handler, async ({ data, context }) => {
	const row = await requireOwnerShop(data.slug, context.userId);
	const name = data.name.trim();
	if (name.length < 2 || name.length > 80) throw new Error("Business name is required");
	await (await getSql())`
      update shops set
        name = ${name},
        tagline = ${data.tagline.trim().slice(0, 160)},
        description = ${data.description.trim().slice(0, 600)},
        address = ${data.address.trim().slice(0, 160)}
      where id = ${row.id}
    `;
	return { ok: true };
});
var updateNotifyChannels_createServerFn_handler = createServerRpc({
	id: "8c43e1a86657d19af0c2319a4cc90728dd9868b54e4c8c0350021f0ab388edc5",
	name: "updateNotifyChannels",
	filename: "src/lib/axiom/server.ts"
}, (opts) => updateNotifyChannels.__executeServer(opts));
var updateNotifyChannels = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateNotifyChannels_createServerFn_handler, async ({ data, context }) => {
	const row = await requireOwnerShop(data.slug, context.userId);
	const email = data.notifyEmail.trim().toLowerCase();
	if (email && !isNotifyEmail(email)) throw new Error("Enter a valid email");
	let phone = "";
	if (data.notifyPhone.trim()) {
		const normalized = toE164(data.notifyPhone);
		if (!normalized) throw new Error("Use a 10-digit mobile number");
		phone = normalized;
	}
	await (await getSql())`
      update shops set notify_email = ${email}, notify_phone = ${phone}
      where id = ${row.id}
    `;
	return {
		ok: true,
		notifyEmail: email,
		notifyPhone: phone
	};
});
var saveShopServices_createServerFn_handler = createServerRpc({
	id: "039e07f58fcc1f71947e1f7d7923d1a02cda45d6dd20042d44444e87aa7cc682",
	name: "saveShopServices",
	filename: "src/lib/axiom/server.ts"
}, (opts) => saveShopServices.__executeServer(opts));
var saveShopServices = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveShopServices_createServerFn_handler, async ({ data, context }) => {
	const row = await requireOwnerShop(data.slug, context.userId);
	if (data.services.length < 1 || data.services.length > 24) throw new Error("Add at least one service");
	const niche = isShopNiche(row.niche) ? row.niche : "location";
	const allowed = priceUnitsFor(niche);
	const sql = await getSql();
	const kept = [];
	for (const [index, service] of data.services.entries()) {
		const name = service.name.trim();
		if (name.length < 2 || name.length > 80) throw new Error("Service name is required");
		const description = service.description.trim().slice(0, 240);
		const group = (service.group ?? "").trim().slice(0, 40);
		const duration = Math.round(Number(service.durationMin));
		const price = Math.round(Number(service.priceCents));
		const priceUnit = service.priceUnit ?? "flat";
		if (!allowed.includes(priceUnit)) throw new Error("That charge does not fit this trade");
		if (!Number.isFinite(duration) || duration < 10 || duration > 480) throw new Error("Duration must be between 10 and 480 minutes");
		if (!Number.isFinite(price) || price < 0 || price > 1e6) throw new Error("Price is out of range");
		if (service.id) {
			if (!(await sql`
          update services
          set name = ${name},
              description = ${description},
              duration_min = ${duration},
              price_cents = ${price},
              sort_order = ${index},
              group_label = ${group},
              price_unit = ${priceUnit}
          where id = ${service.id} and shop_id = ${row.id}
          returning id
        `)[0]) throw new Error("Service not found");
			kept.push(service.id);
		} else {
			const id = newId("svc");
			await sql`
          insert into services (
            id, shop_id, name, description, duration_min, price_cents, sort_order, group_label, price_unit
          ) values (
            ${id}, ${row.id}, ${name}, ${description}, ${duration}, ${price}, ${index}, ${group}, ${priceUnit}
          )
        `;
			const employees = await sql`select id from employees where shop_id = ${row.id}`;
			for (const employee of employees) await sql`
            insert into employee_services (employee_id, service_id)
            values (${employee.id}, ${id})
            on conflict do nothing
          `;
			kept.push(id);
		}
	}
	const catalog = await sql`
      select id from services where shop_id = ${row.id}
    `;
	const ownedIds = new Set(catalog.map((service) => service.id));
	for (const removeId of data.removeIds) {
		if (kept.includes(removeId) || !ownedIds.has(removeId)) continue;
		if ((await sql`
        select id from appointments where service_id = ${removeId} and shop_id = ${row.id} limit 1
      `)[0]) throw new Error("That service already has bookings");
		await sql`
        delete from employee_services
        where service_id = ${removeId}
          and employee_id in (select id from employees where shop_id = ${row.id})
      `;
		await sql`delete from services where id = ${removeId} and shop_id = ${row.id}`;
	}
	if (!row.primary_service_id || !kept.includes(row.primary_service_id)) await sql`update shops set primary_service_id = ${kept[0] ?? null} where id = ${row.id}`;
	return { ok: true };
});
var submitInquiry_createServerFn_handler = createServerRpc({
	id: "a7ed0250a3e7c17f65127961361366f0fc7b21c0005a7f8bff38600dda622a86",
	name: "submitInquiry",
	filename: "src/lib/axiom/server.ts"
}, (opts) => submitInquiry.__executeServer(opts));
var submitInquiry = createServerFn({ method: "POST" }).validator((d) => d).handler(submitInquiry_createServerFn_handler, async ({ data }) => {
	const shop = await loadShopRow(data.slug);
	if (!shop) throw new Error("Shop not found");
	const name = data.name.trim();
	const message = data.message.trim();
	if (name.length < 2 || name.length > 80) throw new Error("Name required");
	if (message.length < 8 || message.length > 500) throw new Error("Write a short message");
	const { allowInquiry, notifyShop } = await import("./notify.server-DYzUTjiz.mjs");
	if (!allowInquiry(shop.id)) throw new Error("Too many messages. Call the shop instead.");
	const phone = data.phone.trim().slice(0, 20);
	await notifyShop(shop.id, {
		kind: "inquiry",
		subject: `Inquiry · ${name}`,
		body: `${name} wrote: ${message}${phone ? ` Phone: ${phone}` : ""}`
	});
	return { ok: true };
});
var startCardCheckout_createServerFn_handler = createServerRpc({
	id: "6449c06456f79fb0f1658616115ef3c36d3f2f343eab94f5239f1f30a47086e7",
	name: "startCardCheckout",
	filename: "src/lib/axiom/server.ts"
}, (opts) => startCardCheckout.__executeServer(opts));
var startCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(startCardCheckout_createServerFn_handler, async ({ data }) => {
	const booked = await assertBookable(data);
	if (booked.priceCents <= 0) throw new Error("This service has no card price");
	const sql = await getSql();
	const billing = await sql`
      select stripe_account_id, stripe_charges_enabled, gear_guardian_bps
      from shop_billing where shop_id = ${booked.shop.id}
    `;
	const account = billing[0]?.stripe_account_id;
	if (!account || !isOn(billing[0]?.stripe_charges_enabled)) throw new Error("This shop is not accepting cards yet");
	const id = newId("apt");
	try {
		await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone, customer_email,
          starts_at, status, payment_status, payment_cents
        ) values (
          ${id}, ${booked.shop.id}, ${data.employeeId}, ${data.serviceId}, ${booked.name},
          ${booked.phone}, ${booked.email}, ${data.startsAt}, 'pending', 'processing', ${booked.priceCents}
        )
      `;
	} catch (err) {
		if (isSlotTaken(err)) throw new Error("That time was just taken. Please choose another slot.");
		throw err;
	}
	const { createConnectCheckout, requestOrigin } = await import("./payments.server-FNgWcc17.mjs");
	const origin = requestOrigin();
	let fee = Math.round(booked.priceCents * Number(billing[0].gear_guardian_bps) / 1e4);
	if (fee >= booked.priceCents) fee = Math.max(0, booked.priceCents - 50);
	try {
		const session = await createConnectCheckout({
			destination: account,
			amountCents: booked.priceCents,
			feeCents: fee,
			serviceName: booked.serviceName,
			shopId: booked.shop.id,
			appointmentId: id,
			successUrl: `${origin}/${booked.shop.slug}/book?session={CHECKOUT_SESSION_ID}`,
			cancelUrl: `${origin}/${booked.shop.slug}/book?cancelled=${id}`
		});
		await sql`update appointments set payment_ref = ${session.id} where id = ${id}`;
		return { url: session.url };
	} catch (err) {
		await sql`delete from appointments where id = ${id} and payment_status = 'processing'`;
		throw err instanceof Error ? err : /* @__PURE__ */ new Error("Checkout failed");
	}
});
var confirmCardCheckout_createServerFn_handler = createServerRpc({
	id: "ee82a46cc2dddb66254bc92fe650406073296006db745cf220a3a27df3361c82",
	name: "confirmCardCheckout",
	filename: "src/lib/axiom/server.ts"
}, (opts) => confirmCardCheckout.__executeServer(opts));
var confirmCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(confirmCardCheckout_createServerFn_handler, async ({ data }) => {
	if (!data.sessionId.startsWith("cs_")) throw new Error("Invalid session");
	const shop = await loadShopRow(data.slug);
	if (!shop) throw new Error("Shop not found");
	const { settlePaidSession } = await import("./payments.server-FNgWcc17.mjs");
	const result = await settlePaidSession(data.sessionId);
	if (result.shopId !== shop.id) throw new Error("Payment does not match this shop");
	return { appointmentId: result.appointmentId };
});
var releaseCardCheckout_createServerFn_handler = createServerRpc({
	id: "18b5405c2a5624b6f4806f1b17ae09b0de2e7b9783a2dff0d3846f1f91a0cfa8",
	name: "releaseCardCheckout",
	filename: "src/lib/axiom/server.ts"
}, (opts) => releaseCardCheckout.__executeServer(opts));
var releaseCardCheckout = createServerFn({ method: "POST" }).validator((d) => d).handler(releaseCardCheckout_createServerFn_handler, async ({ data }) => {
	if (!data.appointmentId.startsWith("apt_")) throw new Error("Invalid booking");
	const shop = await loadShopRow(data.slug);
	if (!shop) throw new Error("Shop not found");
	await (await getSql())`
      update appointments
      set status = 'cancelled', payment_status = 'failed'
      where id = ${data.appointmentId}
        and shop_id = ${shop.id}
        and status = 'pending'
        and payment_status = 'processing'
    `;
	return { ok: true };
});
var beginStripeConnect_createServerFn_handler = createServerRpc({
	id: "798f47840901265d21ab12eae37aac780a541e71459ea1c6857c7262b671edad",
	name: "beginStripeConnect",
	filename: "src/lib/axiom/server.ts"
}, (opts) => beginStripeConnect.__executeServer(opts));
var beginStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(beginStripeConnect_createServerFn_handler, async ({ data: slug, context }) => {
	const row = await requireOwnerShop(slug, context.userId);
	const { beginConnect, requestOrigin, stripeConfigured } = await import("./payments.server-FNgWcc17.mjs");
	if (!stripeConfigured()) throw new Error("Card payments are not configured for this workspace");
	const billing = await (await getSql())`
      select stripe_account_id from shop_billing where shop_id = ${row.id}
    `;
	return beginConnect({
		shopId: row.id,
		slug: row.slug,
		accountId: billing[0]?.stripe_account_id ?? null,
		origin: requestOrigin()
	});
});
var refreshStripeConnect_createServerFn_handler = createServerRpc({
	id: "d9481c168a629af6d4109b308f80e786ed81cc90af91fc0c9359d4ab98f9ff22",
	name: "refreshStripeConnect",
	filename: "src/lib/axiom/server.ts"
}, (opts) => refreshStripeConnect.__executeServer(opts));
var refreshStripeConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((slug) => slug).handler(refreshStripeConnect_createServerFn_handler, async ({ data: slug, context }) => {
	const row = await requireOwnerShop(slug, context.userId);
	const sql = await getSql();
	const accountId = (await sql`
      select stripe_account_id from shop_billing where shop_id = ${row.id}
    `)[0]?.stripe_account_id;
	if (!accountId) return { chargesEnabled: false };
	const { syncConnectAccount } = await import("./payments.server-FNgWcc17.mjs");
	const synced = await syncConnectAccount(accountId);
	await sql`
      update shop_billing
      set stripe_charges_enabled = ${synced.chargesEnabled}, updated_at = now()
      where shop_id = ${row.id}
    `;
	return synced;
});
//#endregion
export { acceptBooking_createServerFn_handler, addPortfolioItem_createServerFn_handler, beginStripeConnect_createServerFn_handler, claimInvite_createServerFn_handler, confirmCardCheckout_createServerFn_handler, createBooking_createServerFn_handler, createShopFromNiche_createServerFn_handler, getAppointmentPublic_createServerFn_handler, getInvitePreview_createServerFn_handler, getOperatorData_createServerFn_handler, getPortfolio_createServerFn_handler, getPublicShop_createServerFn_handler, getShopAccess_createServerFn_handler, inviteEmployee_createServerFn_handler, listBookedStarts_createServerFn_handler, listMyShops_createServerFn_handler, listShopEvents_createServerFn_handler, listShowcaseShops_createServerFn_handler, refreshStripeConnect_createServerFn_handler, releaseCardCheckout_createServerFn_handler, saveShopServices_createServerFn_handler, setEmployeeAvailability_createServerFn_handler, setEmployeeDashboard_createServerFn_handler, setShopDashboard_createServerFn_handler, setShopIntro_createServerFn_handler, setShopRingColor_createServerFn_handler, startCardCheckout_createServerFn_handler, submitInquiry_createServerFn_handler, updateNotifyChannels_createServerFn_handler, updateShopBrand_createServerFn_handler, updateShopProfile_createServerFn_handler };
