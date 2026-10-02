import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId, slugify } from "@/lib/utils";
import { DEFAULT_HOURS, NICHES } from "./niches";
import type {
  AccessMode,
  Appointment,
  Billing,
  Employee,
  OnboardingStep,
  PortfolioItem,
  Service,
  Shop,
  ShopEvent,
  ShopNiche,
  ShopPublic,
} from "./types";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  tagline: string;
  description: string;
  ring_color: string;
  hero_image_url: string;
  hero_video_url: string | null;
  hero_blend_percent: number;
  primary_service_id: string | null;
  owner_user_id: string | null;
  is_showcase: boolean;
  onboarding_step: string;
  onboarding_json: string;
  hours_json: string;
  address: string;
  created_at: string;
};

function parseOnboarding(raw: string): Shop["onboarding"] {
  try {
    const j = JSON.parse(raw) as Partial<Shop["onboarding"]>;
    return {
      hero: Boolean(j.hero),
      service: Boolean(j.service),
      employee: Boolean(j.employee),
      testBooked: Boolean(j.testBooked),
    };
  } catch {
    return { hero: false, service: false, employee: false, testBooked: false };
  }
}

function parseHours(raw: string): Record<string, string> {
  try {
    const j = JSON.parse(raw) as Record<string, string>;
    return { ...DEFAULT_HOURS, ...j };
  } catch {
    return { ...DEFAULT_HOURS };
  }
}

function mapShop(r: ShopRow): Shop {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    niche: r.niche === "field" ? "field" : "location",
    tagline: r.tagline,
    description: r.description,
    ringColor: r.ring_color,
    heroImageUrl: r.hero_image_url,
    heroVideoUrl: r.hero_video_url,
    heroBlendPercent: Number(r.hero_blend_percent),
    primaryServiceId: r.primary_service_id,
    ownerUserId: r.owner_user_id,
    isShowcase: Boolean(r.is_showcase),
    onboardingStep: (r.onboarding_step as OnboardingStep) || "generated",
    onboarding: parseOnboarding(r.onboarding_json),
    hours: parseHours(r.hours_json),
    address: r.address,
    createdAt: String(r.created_at),
  };
}

async function loadShopRow(slug: string): Promise<ShopRow | null> {
  const sql = await getSql();
  const rows = await sql<ShopRow>`select * from shops where slug = ${slug} limit 1`;
  return rows[0] ?? null;
}

async function employeeServiceMap(shopId: string): Promise<Map<string, string[]>> {
  const sql = await getSql();
  const rows = await sql<{ employee_id: string; service_id: string }>`
    select es.employee_id, es.service_id
    from employee_services es
    join employees e on e.id = es.employee_id
    where e.shop_id = ${shopId}
  `;
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.employee_id) ?? [];
    list.push(r.service_id);
    map.set(r.employee_id, list);
  }
  return map;
}

async function loadEmployees(shopId: string): Promise<Employee[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    display_name: string;
    title: string;
    bio: string;
    phone: string;
    avatar_url: string;
    invite_status: "pending" | "claimed";
  }>`
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
    serviceIds: services.get(r.id) ?? [],
  }));
}

async function loadServices(shopId: string): Promise<Service[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    shop_id: string;
    name: string;
    description: string;
    duration_min: number;
    price_cents: number;
  }>`
    select id, shop_id, name, description, duration_min, price_cents
    from services where shop_id = ${shopId} order by sort_order asc, name asc
  `;
  return rows.map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    description: r.description,
    durationMin: Number(r.duration_min),
    priceCents: Number(r.price_cents),
  }));
}

export const getPublicShop = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<ShopPublic | null> => {
    const row = await loadShopRow(slug);
    if (!row) return null;
    const shop = mapShop(row);
    const [services, employees] = await Promise.all([
      loadServices(shop.id),
      loadEmployees(shop.id),
    ]);
    return { shop, services, employees };
  });

export const listShowcaseShops = createServerFn({ method: "GET" }).handler(
  async (): Promise<Shop[]> => {
    const sql = await getSql();
    const rows = await sql<ShopRow>`
      select * from shops where is_showcase = true order by name asc
    `;
    return rows.map(mapShop);
  },
);

export const listBookedStarts = createServerFn({ method: "GET" })
  .validator((d: { slug: string; employeeId: string }) => d)
  .handler(async ({ data }): Promise<string[]> => {
    const row = await loadShopRow(data.slug);
    if (!row) return [];
    const sql = await getSql();
    const rows = await sql<{ starts_at: string }>`
      select starts_at from appointments
      where shop_id = ${row.id}
        and employee_id = ${data.employeeId}
        and status in ('pending', 'confirmed')
        and starts_at > now() - interval '1 day'
    `;
    return rows.map((r) => String(r.starts_at));
  });

export const getPortfolio = createServerFn({ method: "GET" })
  .validator((employeeId: string) => employeeId)
  .handler(async ({ data: employeeId }): Promise<PortfolioItem[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      employee_id: string;
      image_url: string;
      caption: string;
    }>`
      select id, employee_id, image_url, caption
      from portfolio_items where employee_id = ${employeeId}
      order by created_at desc
    `;
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      imageUrl: r.image_url,
      caption: r.caption,
    }));
  });

export const listShopEvents = createServerFn({ method: "GET" })
  .validator((d: { slug: string; after?: string }) => d)
  .handler(async ({ data }): Promise<ShopEvent[]> => {
    const row = await loadShopRow(data.slug);
    if (!row) return [];
    const sql = await getSql();
    const rows = data.after
      ? await sql<{
          id: string;
          type: ShopEvent["type"];
          appointment_id: string | null;
          created_at: string;
        }>`
          select id, type, appointment_id, created_at from shop_events
          where shop_id = ${row.id} and created_at > ${data.after}
          order by created_at asc limit 40
        `
      : await sql<{
          id: string;
          type: ShopEvent["type"];
          appointment_id: string | null;
          created_at: string;
        }>`
          select id, type, appointment_id, created_at from shop_events
          where shop_id = ${row.id}
          order by created_at desc limit 12
        `;
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      appointmentId: r.appointment_id,
      createdAt: String(r.created_at),
    }));
  });

export const getAppointmentPublic = createServerFn({ method: "GET" })
  .validator((d: { slug: string; id: string }) => d)
  .handler(async ({ data }) => {
    const shop = await loadShopRow(data.slug);
    if (!shop) return null;
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      status: Appointment["status"];
      starts_at: string;
      employee_name: string;
      service_name: string;
    }>`
      select a.id, a.status, a.starts_at, e.display_name as employee_name, s.name as service_name
      from appointments a
      join employees e on e.id = a.employee_id
      join services s on s.id = a.service_id
      where a.id = ${data.id} and a.shop_id = ${shop.id}
      limit 1
    `;
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      status: r.status,
      startsAt: String(r.starts_at),
      employeeName: r.employee_name,
      serviceName: r.service_name,
    };
  });

export const createBooking = createServerFn({ method: "POST" })
  .validator(
    (d: {
      slug: string;
      employeeId: string;
      serviceId: string;
      customerName: string;
      customerPhone: string;
      startsAt: string;
      paymentRef: string;
      paymentCents: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const shop = await loadShopRow(data.slug);
    if (!shop) throw new Error("Shop not found");
    const name = data.customerName.trim();
    if (name.length < 2) throw new Error("Name required");
    const sql = await getSql();
    const link = await sql<{ employee_id: string }>`
      select employee_id from employee_services
      where employee_id = ${data.employeeId} and service_id = ${data.serviceId}
    `;
    if (!link[0]) throw new Error("That specialist does not offer this service");
    const clash = await sql<{ id: string }>`
      select id from appointments
      where employee_id = ${data.employeeId}
        and starts_at = ${data.startsAt}
        and status in ('pending', 'confirmed')
      limit 1
    `;
    if (clash[0]) throw new Error("That time was just taken");
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

async function membership(shopId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: "owner" | "employee"; employee_id: string | null }>`
    select role, employee_id from shop_members
    where shop_id = ${shopId} and user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

export const getShopAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((slug: string) => slug)
  .handler(async ({ data: slug, context }) => {
    const row = await loadShopRow(slug);
    if (!row) return { mode: "none" as AccessMode, shop: null, employeeId: null as string | null };
    const shop = mapShop(row);
    const mem = await membership(shop.id, context.userId);
    if (mem?.role === "owner") return { mode: "owner" as AccessMode, shop, employeeId: mem.employee_id };
    if (mem?.role === "employee") return { mode: "employee" as AccessMode, shop, employeeId: mem.employee_id };
    if (shop.isShowcase) return { mode: "preview" as AccessMode, shop, employeeId: null };
    return { mode: "none" as AccessMode, shop, employeeId: null };
  });

export const listMyShops = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ShopRow>`
      select s.* from shops s
      join shop_members m on m.shop_id = s.id
      where m.user_id = ${context.userId}
      order by s.created_at desc
    `;
    return rows.map(mapShop);
  });

export const createShopFromNiche = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { niche: ShopNiche; name: string }) => d)
  .handler(async ({ data, context }) => {
    const template = NICHES[data.niche];
    if (!template) throw new Error("Unknown niche");
    const sql = await getSql();
    const existing = await sql<{ slug: string }>`
      select s.slug from shops s
      join shop_members m on m.shop_id = s.id
      where m.user_id = ${context.userId} and m.role = 'owner'
      order by s.created_at desc limit 1
    `;
    if (existing[0]) return { slug: existing[0].slug, created: false };

    const name = data.name.trim() || template.defaultName;
    let slug = slugify(name);
    const taken = await sql<{ slug: string }>`select slug from shops where slug = ${slug}`;
    if (taken[0]) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;

    const shopId = newId("shop");
    const services = template.services.map((s, i) => ({
      ...s,
      id: newId("svc"),
      sort: i,
    }));
    const employees = template.employees.map((e) => ({
      ...e,
      id: newId("emp"),
      token: crypto.randomUUID(),
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
          testBooked: false,
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
    for (const s of services) {
      await sql`
        insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order)
        values (${s.id}, ${shopId}, ${s.name}, ${s.description}, ${s.durationMin}, ${s.priceCents}, ${s.sort})
      `;
    }
    for (const e of employees) {
      await sql`
        insert into employees (
          id, shop_id, display_name, title, bio, phone, avatar_url, invite_token, invite_status
        ) values (
          ${e.id}, ${shopId}, ${e.displayName}, ${e.title}, ${e.bio}, '', ${e.avatarUrl},
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
    return { slug, created: true };
  });

export const updateShopBrand = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      slug: string;
      ringColor?: string;
      heroBlendPercent?: number;
      heroImageUrl?: string;
      name?: string;
      tagline?: string;
      primaryServiceId?: string;
      markHero?: boolean;
      markService?: boolean;
      onboardingStep?: OnboardingStep;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const row = await loadShopRow(data.slug);
    if (!row) throw new Error("Shop not found");
    if (row.owner_user_id !== context.userId) throw new Error("Forbidden");
    const flags = parseOnboarding(row.onboarding_json);
    if (data.markHero) flags.hero = true;
    if (data.markService) flags.service = true;
    const step = data.onboardingStep ?? row.onboarding_step;
    const sql = await getSql();
    await sql`
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
    return { ok: true as const, onboarding: flags };
  });

export const inviteEmployee = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string; displayName: string; phone: string; title?: string }) => d)
  .handler(async ({ data, context }) => {
    const row = await loadShopRow(data.slug);
    if (!row) throw new Error("Shop not found");
    if (row.owner_user_id !== context.userId) throw new Error("Forbidden");
    const name = data.displayName.trim();
    if (name.length < 2) throw new Error("Name required");
    const sql = await getSql();
    const id = newId("emp");
    const token = crypto.randomUUID();
    const template = NICHES[row.niche === "field" ? "field" : "location"];
    const avatar =
      row.niche === "field" ? "/media/gabe.jpg" : "/media/marco.jpg";
    await sql`
      insert into employees (
        id, shop_id, display_name, title, bio, phone, avatar_url, invite_token, invite_status
      ) values (
        ${id}, ${row.id}, ${name}, ${data.title?.trim() || "Specialist"},
        ${template.employees[1]?.bio ?? ""}, ${data.phone.trim()}, ${avatar},
        ${token}, 'pending'
      )
    `;
    const services = await sql<{ id: string }>`
      select id from services where shop_id = ${row.id} order by sort_order asc
    `;
    for (const s of services) {
      await sql`
        insert into employee_services (employee_id, service_id)
        values (${id}, ${s.id})
        on conflict do nothing
      `;
    }
    const flags = parseOnboarding(row.onboarding_json);
    flags.employee = true;
    await sql`
      update shops set onboarding_json = ${JSON.stringify(flags)}, onboarding_step = 'loop'
      where id = ${row.id} and owner_user_id = ${context.userId}
    `;
    return { id, token, invitePath: `/invite/${token}` };
  });

export const claimInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((token: string) => token)
  .handler(async ({ data: token, context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      shop_id: string;
      slug: string;
    }>`
      select e.id, e.shop_id, s.slug
      from employees e
      join shops s on s.id = e.shop_id
      where e.invite_token = ${token}
      limit 1
    `;
    const emp = rows[0];
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

export const getInvitePreview = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(async ({ data: token }) => {
    const sql = await getSql();
    const rows = await sql<{
      display_name: string;
      shop_name: string;
      slug: string;
      invite_status: string;
    }>`
      select e.display_name, s.name as shop_name, s.slug, e.invite_status
      from employees e
      join shops s on s.id = e.shop_id
      where e.invite_token = ${token}
      limit 1
    `;
    return rows[0] ?? null;
  });

async function mapAppointments(shopId: string, employeeId?: string | null): Promise<Appointment[]> {
  const sql = await getSql();
  const rows = employeeId
    ? await sql<{
        id: string;
        shop_id: string;
        employee_id: string;
        employee_name: string;
        service_id: string;
        service_name: string;
        customer_name: string;
        customer_phone: string;
        starts_at: string;
        status: Appointment["status"];
        payment_status: string;
        payment_cents: number;
        payment_ref: string | null;
      }>`
        select a.id, a.shop_id, a.employee_id, e.display_name as employee_name,
               a.service_id, s.name as service_name, a.customer_name, a.customer_phone,
               a.starts_at, a.status, a.payment_status, a.payment_cents, a.payment_ref
        from appointments a
        join employees e on e.id = a.employee_id
        join services s on s.id = a.service_id
        where a.shop_id = ${shopId} and a.employee_id = ${employeeId}
        order by a.starts_at desc
        limit 80
      `
    : await sql<{
        id: string;
        shop_id: string;
        employee_id: string;
        employee_name: string;
        service_id: string;
        service_name: string;
        customer_name: string;
        customer_phone: string;
        starts_at: string;
        status: Appointment["status"];
        payment_status: string;
        payment_cents: number;
        payment_ref: string | null;
      }>`
        select a.id, a.shop_id, a.employee_id, e.display_name as employee_name,
               a.service_id, s.name as service_name, a.customer_name, a.customer_phone,
               a.starts_at, a.status, a.payment_status, a.payment_cents, a.payment_ref
        from appointments a
        join employees e on e.id = a.employee_id
        join services s on s.id = a.service_id
        where a.shop_id = ${shopId}
        order by a.starts_at desc
        limit 80
      `;
  return rows.map((r) => ({
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
    paymentRef: r.payment_ref,
  }));
}

export const getOperatorData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((slug: string) => slug)
  .handler(async ({ data: slug, context }) => {
    const row = await loadShopRow(slug);
    if (!row) throw new Error("Shop not found");
    const shop = mapShop(row);
    const mem = await membership(shop.id, context.userId);
    const mode: AccessMode = mem?.role === "owner"
      ? "owner"
      : mem?.role === "employee"
        ? "employee"
        : shop.isShowcase
          ? "preview"
          : "none";
    if (mode === "none") throw new Error("Forbidden");

    const hidePii = mode === "preview";
    const appointments = hidePii
      ? (await mapAppointments(shop.id)).map((a) => ({
          ...a,
          customerName: a.status === "completed" ? a.customerName : "Guest",
          customerPhone: "",
        }))
      : await mapAppointments(shop.id, mode === "employee" ? mem?.employee_id : null);

    let billing: Billing | null = null;
    if (mode === "owner" || mode === "preview") {
      const sql = await getSql();
      const b = await sql<{
        plan: string;
        status: string;
        price_cents: number;
        gear_guardian_bps: number;
      }>`select plan, status, price_cents, gear_guardian_bps from shop_billing where shop_id = ${shop.id}`;
      if (b[0]) {
        billing = {
          plan: b[0].plan,
          status: b[0].status,
          priceCents: Number(b[0].price_cents),
          gearGuardianBps: Number(b[0].gear_guardian_bps),
        };
      }
    }

    const [services, employees] = await Promise.all([
      loadServices(shop.id),
      loadEmployees(shop.id),
    ]);

    return {
      mode,
      shop,
      appointments,
      billing,
      services,
      employees,
      employeeId: mem?.employee_id ?? null,
    };
  });

export const acceptBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string; appointmentId: string }) => d)
  .handler(async ({ data, context }) => {
    const row = await loadShopRow(data.slug);
    if (!row) throw new Error("Shop not found");
    const mem = await membership(row.id, context.userId);
    const allowed = mem || row.owner_user_id === context.userId;
    if (!allowed) throw new Error("Forbidden");
    const sql = await getSql();
    const updated = await sql<{ id: string }>`
      update appointments
      set status = 'confirmed'
      where id = ${data.appointmentId} and shop_id = ${row.id} and status = 'pending'
      returning id
    `;
    if (!updated[0]) throw new Error("Booking not found");
    await sql`
      insert into shop_events (id, shop_id, type, appointment_id)
      values (${newId("evt")}, ${row.id}, 'booking_confirmed', ${data.appointmentId})
    `;
    return { ok: true as const };
  });

export const addPortfolioItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string; imageUrl: string; caption: string }) => d)
  .handler(async ({ data, context }) => {
    const row = await loadShopRow(data.slug);
    if (!row) throw new Error("Shop not found");
    const mem = await membership(row.id, context.userId);
    const employeeId =
      mem?.employee_id ??
      (
        await (await getSql())<{ id: string }>`
          select id from employees where shop_id = ${row.id} and claimed_user_id = ${context.userId} limit 1
        `
      )[0]?.id;
    if (!employeeId && row.owner_user_id !== context.userId) throw new Error("Forbidden");
    const empId =
      employeeId ??
      (
        await (await getSql())<{ id: string }>`
          select id from employees where shop_id = ${row.id} order by created_at asc limit 1
        `
      )[0]?.id;
    if (!empId) throw new Error("No staff profile");
    if (!data.imageUrl.startsWith("data:image/") && !data.imageUrl.startsWith("/")) {
      throw new Error("Invalid image");
    }
    const sql = await getSql();
    const id = newId("pf");
    await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
      values (${id}, ${row.id}, ${empId}, ${data.imageUrl}, ${data.caption.trim().slice(0, 80)})
    `;
    return { id };
  });
