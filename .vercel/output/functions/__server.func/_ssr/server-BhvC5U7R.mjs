import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { a as newId, o as slugify } from "./utils-BkNFIPfO.mjs";
import { n as NICHES, t as DEFAULT_HOURS } from "./niches-xjDAqwSv.mjs";
import { t as authMiddleware } from "./middleware-afsIutTA.mjs";
import { r as getSql } from "./db-BAk65YPB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-BhvC5U7R.js
function parseOnboarding(raw) {
	try {
		const j = JSON.parse(raw);
		return {
			hero: Boolean(j.hero),
			service: Boolean(j.service),
			employee: Boolean(j.employee),
			testBooked: Boolean(j.testBooked)
		};
	} catch {
		return {
			hero: false,
			service: false,
			employee: false,
			testBooked: false
		};
	}
}
function parseHours(raw) {
	try {
		const j = JSON.parse(raw);
		return {
			...DEFAULT_HOURS,
			...j
		};
	} catch {
		return { ...DEFAULT_HOURS };
	}
}
function mapShop(r) {
	return {
		id: r.id,
		slug: r.slug,
		name: r.name,
		niche: r.niche === "field" ? "field" : r.niche === "studio" ? "studio" : "location",
		tagline: r.tagline,
		description: r.description,
		ringColor: r.ring_color,
		heroImageUrl: r.hero_image_url,
		heroVideoUrl: r.hero_video_url,
		heroBlendPercent: Number(r.hero_blend_percent),
		primaryServiceId: r.primary_service_id,
		ownerUserId: r.owner_user_id,
		isShowcase: Boolean(r.is_showcase),
		onboardingStep: r.onboarding_step || "generated",
		onboarding: parseOnboarding(r.onboarding_json),
		hours: parseHours(r.hours_json),
		address: r.address,
		createdAt: String(r.created_at)
	};
}
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
	const rows = await (await getSql())`
    select id, shop_id, display_name, title, bio, phone, avatar_url, invite_status
    from employees where shop_id = ${shopId} order by created_at asc
  `;
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
		serviceIds: services.get(r.id) ?? []
	}));
}
async function loadServices(shopId) {
	return (await (await getSql())`
    select id, shop_id, name, description, duration_min, price_cents
    from services where shop_id = ${shopId} order by sort_order asc, name asc
  `).map((r) => ({
		id: r.id,
		shopId: r.shop_id,
		name: r.name,
		description: r.description,
		durationMin: Number(r.duration_min),
		priceCents: Number(r.price_cents)
	}));
}
var getPublicShop_createServerFn_handler = createServerRpc({
	id: "30642a916957732ce0ede2e076fdb02b275425ecbb5a809f21665bb30ca990d6",
	name: "getPublicShop",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getPublicShop.__executeServer(opts));
var getPublicShop = createServerFn({ method: "GET" }).validator((slug) => slug).handler(getPublicShop_createServerFn_handler, async ({ data: slug }) => {
	const row = await loadShopRow(slug);
	if (!row) return null;
	const shop = mapShop(row);
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
    `).map(mapShop);
});
var listBookedStarts_createServerFn_handler = createServerRpc({
	id: "f829bacc015ea9c584d6ae5c326a97820f705785a12b391b88c3b47ee8419cba",
	name: "listBookedStarts",
	filename: "src/lib/axiom/server.ts"
}, (opts) => listBookedStarts.__executeServer(opts));
var listBookedStarts = createServerFn({ method: "GET" }).validator((d) => d).handler(listBookedStarts_createServerFn_handler, async ({ data }) => {
	const row = await loadShopRow(data.slug);
	if (!row) return [];
	return (await (await getSql())`
      select starts_at from appointments
      where shop_id = ${row.id}
        and employee_id = ${data.employeeId}
        and status in ('pending', 'confirmed')
        and starts_at > now() - interval '1 day'
    `).map((r) => String(r.starts_at));
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
var createBooking_createServerFn_handler = createServerRpc({
	id: "2c61f6c5d07f7ac5f6cfbdc53f8c7038bf8884f7c4a21cf7c5f5e5ab30064b8f",
	name: "createBooking",
	filename: "src/lib/axiom/server.ts"
}, (opts) => createBooking.__executeServer(opts));
var createBooking = createServerFn({ method: "POST" }).validator((d) => d).handler(createBooking_createServerFn_handler, async ({ data }) => {
	const shop = await loadShopRow(data.slug);
	if (!shop) throw new Error("Shop not found");
	const name = data.customerName.trim();
	if (name.length < 2) throw new Error("Name required");
	const sql = await getSql();
	if (!(await sql`
      select employee_id from employee_services
      where employee_id = ${data.employeeId} and service_id = ${data.serviceId}
    `)[0]) throw new Error("That specialist does not offer this service");
	if ((await sql`
      select id from appointments
      where employee_id = ${data.employeeId}
        and starts_at = ${data.startsAt}
        and status in ('pending', 'confirmed')
      limit 1
    `)[0]) throw new Error("That time was just taken");
	const id = newId("apt");
	const eventId = newId("evt");
	await sql`
      insert into appointments (
        id, shop_id, employee_id, service_id, customer_name, customer_phone,
        starts_at, status, payment_status, payment_ref, payment_cents
      ) values (
        ${id}, ${shop.id}, ${data.employeeId}, ${data.serviceId}, ${name},
        ${data.customerPhone.trim()}, ${data.startsAt}, 'pending', 'paid',
        ${data.paymentRef}, ${data.paymentCents}
      )
    `;
	await sql`
      insert into shop_events (id, shop_id, type, appointment_id)
      values (${eventId}, ${shop.id}, 'booking_request', ${id})
    `;
	if (!shop.is_showcase) {
		const flags = parseOnboarding(shop.onboarding_json);
		flags.testBooked = true;
		await sql`
        update shops
        set onboarding_json = ${JSON.stringify(flags)},
            onboarding_step = 'complete'
        where id = ${shop.id}
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
	const shop = mapShop(row);
	const mem = await membership(shop.id, context.userId);
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
    `).map(mapShop);
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
	const employees = template.employees.map((e) => ({
		...e,
		id: newId("emp"),
		token: crypto.randomUUID()
	}));
	await sql`
      insert into shops (
        id, slug, name, niche, tagline, description, ring_color,
        hero_image_url, hero_video_url, hero_blend_percent, primary_service_id,
        owner_user_id, is_showcase, onboarding_step, onboarding_json, hours_json, address
      ) values (
        ${shopId}, ${slug}, ${name}, ${template.niche}, ${template.tagline},
        ${template.description}, ${template.ringColor}, ${template.heroImageUrl},
        ${template.heroVideoUrl}, ${template.heroBlendPercent}, ${services[0]?.id ?? null},
        ${context.userId}, false, 'tour', ${JSON.stringify({
		hero: false,
		service: false,
		employee: false,
		testBooked: false
	})}, ${JSON.stringify(DEFAULT_HOURS)}, ${template.address}
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
        insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order)
        values (${s.id}, ${shopId}, ${s.name}, ${s.description}, ${s.durationMin}, ${s.priceCents}, ${s.sort})
      `;
	for (const e of employees) {
		await sql`
        insert into employees (
          id, shop_id, display_name, title, bio, phone, avatar_url, invite_token, invite_status
        ) values (
          ${e.id}, ${shopId}, ${e.displayName}, ${e.title}, ${e.bio}, ${e.phone ?? ""}, ${e.avatarUrl},
          ${e.token}, 'pending'
        )
      `;
		const empTemplate = template.employees[employees.indexOf(e)];
		for (const idx of empTemplate.serviceIndexes) {
			const svc = services[idx];
			if (!svc) continue;
			await sql`
          insert into employee_services (employee_id, service_id)
          values (${e.id}, ${svc.id})
        `;
		}
	}
	for (const p of template.portfolio) {
		const emp = employees[p.employeeIndex];
		if (!emp) continue;
		await sql`
        insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
        values (${newId("pf")}, ${shopId}, ${emp.id}, ${p.imageUrl}, ${p.caption})
      `;
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
	if (row.owner_user_id !== context.userId) throw new Error("Forbidden");
	const flags = parseOnboarding(row.onboarding_json);
	if (data.markHero) flags.hero = true;
	if (data.markService) flags.service = true;
	const step = data.onboardingStep ?? row.onboarding_step;
	await (await getSql())`
      update shops set
        ring_color = ${data.ringColor ?? row.ring_color},
        hero_blend_percent = ${data.heroBlendPercent ?? row.hero_blend_percent},
        hero_image_url = ${data.heroImageUrl ?? row.hero_image_url},
        name = ${data.name ?? row.name},
        tagline = ${data.tagline ?? row.tagline},
        primary_service_id = ${data.primaryServiceId ?? row.primary_service_id},
        onboarding_json = ${JSON.stringify(flags)},
        onboarding_step = ${step}
      where id = ${row.id} and owner_user_id = ${context.userId}
    `;
	return {
		ok: true,
		onboarding: flags
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
	const mem = await membership(row.id, context.userId);
	if (!(row.owner_user_id === context.userId || mem?.role === "owner" || Boolean(row.is_showcase))) throw new Error("Forbidden");
	const sql = await getSql();
	await sql`update shops set ring_color = ${color} where id = ${row.id}`;
	await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${row.id}, 'ring_color', ${color})
    `;
	return { ringColor: color };
});
var inviteEmployee_createServerFn_handler = createServerRpc({
	id: "aa87097a34d8e3d2d957a7db6a1efd5ca2c14c54ff6a39c644c6fccb7b690014",
	name: "inviteEmployee",
	filename: "src/lib/axiom/server.ts"
}, (opts) => inviteEmployee.__executeServer(opts));
var inviteEmployee = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(inviteEmployee_createServerFn_handler, async ({ data, context }) => {
	const row = await loadShopRow(data.slug);
	if (!row) throw new Error("Shop not found");
	if (row.owner_user_id !== context.userId) throw new Error("Forbidden");
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
      where id = ${row.id} and owner_user_id = ${context.userId}
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
var getOperatorData_createServerFn_handler = createServerRpc({
	id: "0448307bae57c4cb90c9e675e96ee95efc433358871a5d8a5cd71bfc73a3b4e7",
	name: "getOperatorData",
	filename: "src/lib/axiom/server.ts"
}, (opts) => getOperatorData.__executeServer(opts));
var getOperatorData = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((slug) => slug).handler(getOperatorData_createServerFn_handler, async ({ data: slug, context }) => {
	const row = await loadShopRow(slug);
	if (!row) throw new Error("Shop not found");
	const shop = mapShop(row);
	const mem = await membership(shop.id, context.userId);
	const mode = mem?.role === "owner" ? "owner" : mem?.role === "employee" ? "employee" : shop.isShowcase ? "preview" : "none";
	if (mode === "none") throw new Error("Forbidden");
	const appointments = mode === "preview" ? (await mapAppointments(shop.id)).map((a) => ({
		...a,
		customerName: a.status === "completed" ? a.customerName : "Guest",
		customerPhone: ""
	})) : await mapAppointments(shop.id, mode === "employee" ? mem?.employee_id : null);
	let billing = null;
	if (mode === "owner" || mode === "preview") {
		const b = await (await getSql())`select plan, status, price_cents, gear_guardian_bps from shop_billing where shop_id = ${shop.id}`;
		if (b[0]) billing = {
			plan: b[0].plan,
			status: b[0].status,
			priceCents: Number(b[0].price_cents),
			gearGuardianBps: Number(b[0].gear_guardian_bps)
		};
	}
	const [services, employees] = await Promise.all([loadServices(shop.id), loadEmployees(shop.id)]);
	return {
		mode,
		shop,
		appointments,
		billing,
		services,
		employees,
		employeeId: mem?.employee_id ?? null
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
	if (!(await membership(row.id, context.userId) || row.owner_user_id === context.userId || Boolean(row.is_showcase))) throw new Error("Forbidden");
	const sql = await getSql();
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
//#endregion
export { acceptBooking_createServerFn_handler, addPortfolioItem_createServerFn_handler, claimInvite_createServerFn_handler, createBooking_createServerFn_handler, createShopFromNiche_createServerFn_handler, getAppointmentPublic_createServerFn_handler, getInvitePreview_createServerFn_handler, getOperatorData_createServerFn_handler, getPortfolio_createServerFn_handler, getPublicShop_createServerFn_handler, getShopAccess_createServerFn_handler, inviteEmployee_createServerFn_handler, listBookedStarts_createServerFn_handler, listMyShops_createServerFn_handler, listShopEvents_createServerFn_handler, listShowcaseShops_createServerFn_handler, setShopRingColor_createServerFn_handler, updateShopBrand_createServerFn_handler };
