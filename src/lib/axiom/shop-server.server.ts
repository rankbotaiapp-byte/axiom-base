import { getSql } from "@/lib/db";
import { newId, slugify } from "@/lib/utils";
import { nicheForLead } from "./directory";
import { cleanCustomNiche, heroForCustomNiche } from "./media";
import { DEFAULT_HOURS, isPublicNiche, NICHES, priceUnitsFor } from "./niches";
import { isNotifyEmail, toE164 } from "./notify-target";
import { parseDashboardConfig, type DashboardConfig } from "./dashboard";
import { parseIntroPreset, type IntroPreset } from "./intro";
import { parseGlowEnabled, parseLayout, parseNeonAccent, parseThemeProfile, parseWeek, type LayoutBlock, type WeekKey } from "./storefront";
import { parseTradeProfile, type TradeProfile } from "./trade-layout";
import { dueNowCents, isCollectionMode, isPricingType, listPriceCents, type MerchantPrice } from "./merchant-pricing";
import { keepHeroBrand, parseHeroEffect, parseMorphDuration, readHeroBrandFallback } from "./hero-brand";
import { isShopNiche, type AccessMode, type Appointment, type Billing, type Employee, type PaymentSetup, type ShopNotice, type OnboardingStep, type PortfolioItem, type Service, type Shop, type ShopEvent, type PriceUnit, type ShopNiche, type ShopPublic } from "./types";
type ShopRow = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  custom_niche?: string | null;
  tagline: string;
  description: string;
  ring_color: string;
  hero_image_url: string;
  hero_video_url: string | null;
  hero_blend_percent: number;
  hero_effect_type?: string | null;
  hero_branding_tagline?: string | null;
  hero_prompt?: string | null;
  morph_duration_sec?: number | string | null;
  intro_preset?: string;
  intro_speed?: number;
  intro_intensity?: number;
  primary_service_id: string | null;
  owner_user_id: string | null;
  is_showcase: boolean;
  onboarding_step: string;
  onboarding_json: string;
  hours_json: string;
  address: string;
  works_alone?: boolean | number | string | null;
  notify_email?: string;
  notify_phone?: string;
  dashboard_override?: unknown;
  dashboard_config?: unknown;
  theme_profile?: string;
  neon_accent?: string;
  glow_enabled?: boolean | number | string | null;
  layout_json?: string;
  trade_profile?: string;
  created_at: string;
};
function parseOnboarding(raw: unknown): Shop["onboarding"] {
  const empty = {
    hero: false,
    service: false,
    employee: false,
    testBooked: false
  };
  try {
    const j = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<Shop["onboarding"]> | null;
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
function parseHours(raw: unknown): Record<string, string> {
  const hours = {
    ...DEFAULT_HOURS
  };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return hours;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) hours[key] = value;
    }
  } catch {
    /* keep the default week */
  }
  return hours;
}
function finiteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function mapShop(r: ShopRow, acceptsCard = false, includeOwner = false): Shop {
  const niche = isShopNiche(r.niche) ? r.niche : "location";
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    niche,
    customNiche: typeof r.custom_niche === "string" ? r.custom_niche.trim() : "",
    tagline: r.tagline,
    description: r.description,
    ringColor: r.ring_color || "#2EE6D6",
    heroImageUrl: r.hero_image_url || "",
    heroVideoUrl: r.hero_video_url || null,
    heroBlendPercent: finiteNumber(r.hero_blend_percent, 60),
    ...heroBrandFields(r),
    introPreset: parseIntroPreset(r.intro_preset),
    introSpeed: finiteNumber(r.intro_speed ?? 40, 40),
    introIntensity: finiteNumber(r.intro_intensity ?? 45, 45),
    primaryServiceId: r.primary_service_id,
    ownerUserId: includeOwner ? r.owner_user_id : null,
    isShowcase: Boolean(r.is_showcase),
    onboardingStep: r.onboarding_step as OnboardingStep || "generated",
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
    tradeProfile: parseTradeProfile(niche, r.trade_profile),
    createdAt: String(r.created_at)
  };
}
function heroBrandFields(row: ShopRow): {
  heroEffectType: Shop["heroEffectType"];
  heroBrandingTagline: string;
  heroPrompt: string;
  morphDurationSec: number;
} {
  const fallback = readHeroBrandFallback(row.trade_profile);
  const columnTagline = typeof row.hero_branding_tagline === "string" ? row.hero_branding_tagline : "";
  const columnEffect = typeof row.hero_effect_type === "string" ? parseHeroEffect(row.hero_effect_type) : null;
  const useFallback = !columnTagline.trim() && Boolean(fallback.tagline || fallback.prompt);
  const columnPrompt = typeof row.hero_prompt === "string" ? row.hero_prompt : "";
  const columnDuration = row.morph_duration_sec == null ? null : parseMorphDuration(row.morph_duration_sec);
  return {
    heroEffectType: useFallback ? fallback.effect : columnEffect ?? fallback.effect,
    heroBrandingTagline: useFallback ? fallback.tagline : columnTagline,
    heroPrompt: columnPrompt || fallback.prompt,
    morphDurationSec: columnDuration ?? fallback.morphDurationSec,
  };
}

function isOn(value: unknown) {
  return value === true || value === 1 || value === "t" || value === "true";
}
async function shopAcceptsCard(shopId: string) {
  try {
    const sql = await getSql();
    const rows = await sql<{
      stripe_charges_enabled: unknown;
      stripe_account_id: string | null;
    }>`
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
const OPEN_BOOKING_SQL = `
  status in ('pending', 'confirmed')
  and (
    payment_status in ('paid', 'unpaid')
    or (payment_status = 'processing' and created_at > now() - interval '30 minutes')
  )
`;
async function loadShopRow(slug: string): Promise<ShopRow | null> {
  const sql = await getSql();
  const rows = await sql<ShopRow>`select * from shops where slug = ${slug} limit 1`;
  return rows[0] ?? null;
}
async function employeeServiceMap(shopId: string): Promise<Map<string, string[]>> {
  const sql = await getSql();
  const rows = await sql<{
    employee_id: string;
    service_id: string;
  }>`
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
  type EmpRow = {
    id: string;
    shop_id: string;
    display_name: string;
    title: string;
    bio: string;
    phone: string;
    avatar_url: string;
    invite_status: "pending" | "claimed";
    dashboard_config?: unknown;
    availability_json?: string;
  };
  let rows: EmpRow[];
  try {
    rows = await sql<EmpRow>`
      select id, shop_id, display_name, title, bio, phone, avatar_url, invite_status, dashboard_config, availability_json
      from employees where shop_id = ${shopId} order by created_at asc
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/dashboard_config|availability_json/i.test(message)) throw err;
    rows = await sql<EmpRow>`
      select id, shop_id, display_name, title, bio, phone, avatar_url, invite_status
      from employees where shop_id = ${shopId} order by created_at asc
    `;
  }
  const services = await employeeServiceMap(shopId);
  return rows.map(r => ({
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
function mapServiceRow(r: {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
  group_label?: string | null;
  price_unit?: string | null;
}): Service {
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
async function loadServices(shopId: string): Promise<Service[]> {
  const sql = await getSql();
  try {
    const rows = await sql<{
      id: string;
      shop_id: string;
      name: string;
      description: string;
      duration_min: number;
      price_cents: number;
      group_label: string | null;
      price_unit: string | null;
    }>`
      select id, shop_id, name, description, duration_min, price_cents, group_label, price_unit
      from services where shop_id = ${shopId} order by sort_order asc, name asc
    `;
    return rows.map(mapServiceRow);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/group_label|price_unit/i.test(message)) throw err;
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
    return rows.map(r => mapServiceRow(r));
  }
}
export const getPublicShopHandler = async ({
  data: slug
}: any): Promise<ShopPublic | null> => {
  const row = await loadShopRow(slug);
  if (!row) return null;
  const shop = mapShop(row, await shopAcceptsCard(row.id));
  const [services, employees] = await Promise.all([loadServices(shop.id), loadEmployees(shop.id)]);
  return {
    shop,
    services,
    employees
  };
};
export const listShowcaseShopsHandler = async (_ctx?: unknown): Promise<Shop[]> => {
  const sql = await getSql();
  const rows = await sql<ShopRow>`
      select * from shops where is_showcase = true order by created_at asc
    `;
  return rows.map(row => mapShop(row));
};
export const listBookedStartsHandler = async ({
  data
}: any): Promise<string[]> => {
  const row = await loadShopRow(data.slug);
  if (!row) return [];
  const sql = await getSql();
  const rows = await sql.query<{
    starts_at: string;
  }>(`select starts_at from appointments
       where shop_id = $1
         and employee_id = $2
         and ${OPEN_BOOKING_SQL}
         and starts_at > now() - interval '1 day'`, [row.id, data.employeeId]);
  return rows.map(r => String(r.starts_at));
};
export const getPortfolioHandler = async ({
  data: employeeId
}: any): Promise<PortfolioItem[]> => {
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
  return rows.map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    imageUrl: r.image_url,
    caption: r.caption
  }));
};
export const listShopEventsHandler = async ({
  data
}: any): Promise<ShopEvent[]> => {
  const row = await loadShopRow(data.slug);
  if (!row) return [];
  const sql = await getSql();
  const rows = data.after ? await sql<{
    id: string;
    type: ShopEvent["type"];
    appointment_id: string | null;
    employee_id: string | null;
    payload: string | null;
    created_at: string;
  }>`
          select e.id, e.type, e.appointment_id, a.employee_id, e.payload, e.created_at
          from shop_events e
          left join appointments a on a.id = e.appointment_id
          where e.shop_id = ${row.id} and e.created_at > ${data.after}
          order by e.created_at asc limit 40
        ` : await sql<{
    id: string;
    type: ShopEvent["type"];
    appointment_id: string | null;
    employee_id: string | null;
    payload: string | null;
    created_at: string;
  }>`
          select e.id, e.type, e.appointment_id, a.employee_id, e.payload, e.created_at
          from shop_events e
          left join appointments a on a.id = e.appointment_id
          where e.shop_id = ${row.id}
          order by e.created_at desc limit 12
        `;
  return rows.map(r => ({
    id: r.id,
    type: r.type,
    appointmentId: r.appointment_id,
    employeeId: r.employee_id,
    payload: r.payload,
    createdAt: String(r.created_at)
  }));
};
export const getAppointmentPublicHandler = async ({
  data
}: any) => {
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
    serviceName: r.service_name
  };
};
function cleanGuestEmail(raw: string | undefined): string {
  const email = (raw ?? "").trim().toLowerCase().slice(0, 120);
  if (!email) return "";
  if (!isNotifyEmail(email)) throw new Error("Enter a valid email");
  return email;
}
async function assertBookable(data: {
  slug: string;
  employeeId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startsAt: string;
}) {
  const shop = await loadShopRow(data.slug);
  if (!shop) throw new Error("Shop not found");
  const name = data.customerName.trim();
  if (name.length < 2 || name.length > 80) throw new Error("Name required");
  const when = new Date(data.startsAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid time");
  const sql = await getSql();
  const service = await sql<{
    name: string;
    price_cents: number;
  }>`
    select name, price_cents from services
    where id = ${data.serviceId} and shop_id = ${shop.id}
    limit 1
  `;
  if (!service[0]) throw new Error("Service not found");
  const employee = await sql<{
    display_name: string;
  }>`
    select display_name from employees
    where id = ${data.employeeId} and shop_id = ${shop.id}
    limit 1
  `;
  if (!employee[0]) throw new Error("Specialist not found");
  const link = await sql<{
    employee_id: string;
  }>`
    select employee_id from employee_services
    where employee_id = ${data.employeeId} and service_id = ${data.serviceId}
  `;
  if (!link[0]) throw new Error("That specialist does not offer this service");
  const clash = await sql.query<{
    id: string;
  }>(`select id from appointments
     where employee_id = $1 and starts_at = $2 and ${OPEN_BOOKING_SQL}
     limit 1`, [data.employeeId, data.startsAt]);
  if (clash[0]) throw new Error("That time was just taken");
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
function isSlotTaken(err: unknown): boolean {
  const queue: unknown[] = [err];
  const seen = new Set<unknown>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const row = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    if (row.code === "23505") return true;
    if (typeof row.message === "string" && (row.message.includes("23505") || row.message.includes("appointments_no_double_booking"))) {
      return true;
    }
    if (row.cause) queue.push(row.cause);
  }
  return false;
}
async function merchantQuote(shopSlug: string, serviceName: string, serviceCents: number) {
  const sql = await getSql();
  let rows: {
    id: string;
    pricing_type: string;
    price_amount: string | number;
    active_deals_banner: string;
    collection_mode: string;
    updated_at: string | Date;
  }[] = [];
  try {
    rows = await sql<{
      id: string;
      pricing_type: string;
      price_amount: string | number;
      active_deals_banner: string;
      collection_mode: string;
      updated_at: string | Date;
    }>`
      select id, pricing_type, price_amount, active_deals_banner, collection_mode, updated_at
      from merchant_pricing_settings
      where shop_slug = ${shopSlug} and lower(service_name) = lower(${serviceName})
      limit 1
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/merchant_pricing_settings|collection_mode|does not exist/i.test(message)) throw err;
  }
  const found = rows[0];
  if (!found || !isPricingType(found.pricing_type)) {
    return {
      dueNowCents: Math.max(0, serviceCents),
      listCents: Math.max(0, serviceCents),
      collection: "online" as const
    };
  }
  const price: MerchantPrice = {
    id: found.id,
    shopSlug,
    serviceName,
    pricingType: found.pricing_type,
    priceAmount: Number(found.price_amount),
    activeDealsBanner: found.active_deals_banner ?? "",
    collectionMode: isCollectionMode(found.collection_mode) ? found.collection_mode : "online",
    updatedAt: new Date(found.updated_at).toISOString()
  };
  return {
    dueNowCents: dueNowCents(price, serviceCents),
    listCents: listPriceCents(price, serviceCents),
    collection: price.collectionMode
  };
}
export const createBookingHandler = async ({
  data
}: any) => {
  const booked = await assertBookable(data);
  const demo = data.paymentMode === "demo";
  const quote = await merchantQuote(booked.shop.slug, booked.serviceName, booked.priceCents);
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
          ${demo ? data.paymentRef ?? null : null}, ${quote.listCents}
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
  const {
    notifyBookingParties
  } = await import("./notify.server");
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
  return {
    id
  };
};
async function membership(shopId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    role: "owner" | "employee";
    employee_id: string | null;
  }>`
    select role, employee_id from shop_members
    where shop_id = ${shopId} and user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}
export const getShopAccessHandler = async ({
  data: slug,
  context
}: any) => {
  const row = await loadShopRow(slug);
  if (!row) return {
    mode: "none" as AccessMode,
    shop: null,
    employeeId: null as string | null
  };
  const mem = await membership(row.id, context.userId);
  const shop = mapShop(row, false, mem?.role === "owner" || row.owner_user_id === context.userId);
  if (mem?.role === "owner") return {
    mode: "owner" as AccessMode,
    shop,
    employeeId: mem.employee_id
  };
  if (mem?.role === "employee") return {
    mode: "employee" as AccessMode,
    shop,
    employeeId: mem.employee_id
  };
  if (shop.isShowcase) return {
    mode: "preview" as AccessMode,
    shop,
    employeeId: null
  };
  return {
    mode: "none" as AccessMode,
    shop,
    employeeId: null
  };
};
export const listMyShopsHandler = async ({
  context
}: any) => {
  const sql = await getSql();
  const rows = await sql<ShopRow>`
      select s.* from shops s
      join shop_members m on m.shop_id = s.id
      where m.user_id = ${context.userId}
      order by s.created_at desc
    `;
  return rows.map(row => mapShop(row, false, row.owner_user_id === context.userId));
};
type ShopSql = Awaited<ReturnType<typeof getSql>>;
async function claimPreloadedLead(sql: ShopSql, leadSlug: string, shopId: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leadSlug)) return;
  const claimed = await sql<{
    id: string;
    county: string;
  }>`
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
  } catch {
    // A shop can be claimed before nurture tables exist.
  }
  await sql`
    insert into shop_events (id, shop_id, type, payload)
    values (${newId("evt")}, ${shopId}, 'lead_claimed', ${leadSlug})
  `;
}

/** Copies a niche template into a shop owned by `userId`. One shop per account. */
export async function provisionShopFromNiche(input: {
  userId: string;
  niche: ShopNiche;
  name: string;
  solo?: boolean;
  ownerName?: string;
  leadSlug?: string;
  customNiche?: string;
}): Promise<{
  slug: string;
  shopId: string;
  created: boolean;
}> {
  const template = NICHES[input.niche];
  if (!template) throw new Error("Unknown niche");
  if (!input.userId) throw new Error("Sign in before opening this shop");
  const sql = await getSql();
  const existing = await sql<{
    id: string;
    slug: string;
  }>`
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
  const customNiche = input.niche === "trade" ? cleanCustomNiche(input.customNiche ?? "") : "";
  const customFilm = customNiche ? heroForCustomNiche(customNiche) : null;
  const name = input.name.trim() || customNiche || template.defaultName;
  let slug = slugify(name);
  const taken = await sql<{
    slug: string;
  }>`select slug from shops where slug = ${slug}`;
  if (taken[0]) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
  const shopId = newId("shop");
  const services = template.services.map((s, i) => ({
    ...s,
    id: newId("svc"),
    sort: i
  }));
  const solo = Boolean(input.solo);
  const roster = solo ? [{
    displayName: (input.ownerName ?? "").trim() || "You",
    title: template.soloTitle || template.employees[0]?.title || "Owner",
    bio: "Clients book you. Confirm the time and the day is set.",
    avatarUrl: "",
    phone: "",
    serviceIndexes: template.services.map((_, index) => index)
  }] : template.employees;
  const employees = roster.map(e => ({
    ...e,
    id: newId("emp"),
    token: crypto.randomUUID()
  }));
  const primary = services[template.primaryServiceIndex ?? 0] ?? services[0];
  const heroImageUrl = customFilm?.heroImageUrl || template.heroImageUrl;
  const heroVideoUrl = customFilm?.heroVideoUrl || template.heroVideoUrl;
  await sql`
      insert into shops (
        id, slug, name, niche, custom_niche, tagline, description, ring_color,
        hero_image_url, hero_video_url, hero_blend_percent, primary_service_id,
        intro_preset, intro_speed, intro_intensity,
        owner_user_id, is_showcase, onboarding_step, onboarding_json, hours_json, address, works_alone
      ) values (
        ${shopId}, ${slug}, ${name}, ${template.niche}, ${customNiche}, ${template.tagline},
        ${template.description}, ${template.ringColor}, ${heroImageUrl},
        ${heroVideoUrl}, ${template.heroBlendPercent}, ${primary?.id ?? null},
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
  for (const s of services) {
    await sql`
        insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order, group_label, price_unit)
        values (${s.id}, ${shopId}, ${s.name}, ${s.description}, ${s.durationMin}, ${s.priceCents}, ${s.sort}, ${s.group ?? ""}, ${s.priceUnit === "person" || s.priceUnit === "boat" ? s.priceUnit : "flat"})
      `;
  }
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
  if (customNiche) {
    await sql`
        update tenants
        set custom_niche = ${customNiche}
        where shop_id = ${shopId} or user_id::text = ${input.userId}
      `;
  }
  return {
    slug,
    shopId,
    created: true
  };
}
export const createShopFromNicheHandler = async ({
  data,
  context
}: any) => {
  return provisionShopFromNiche({
    userId: context.userId,
    niche: data.niche,
    name: data.name,
    solo: data.solo,
    ownerName: data.ownerName,
    leadSlug: data.leadSlug,
    customNiche: data.customNiche
  });
};
/** After a verified territory payment, build that lead's shop for the paying account. */
export async function provisionTerritoryForPayer(input: {
  leadSlug: string;
  userId: string;
}): Promise<{
  slug: string;
  shopId: string;
  created: boolean;
} | null> {
  if (!input.userId || input.userId === "dev-user") return null;
  const sql = await getSql();
  const leads = await sql<{
    business_name: string;
    trade_type: string;
    trade_label: string;
    shop_id: string | null;
  }>`
    select business_name, trade_type, trade_label, shop_id
    from preloaded_leads
    where lead_slug = ${input.leadSlug}
    limit 1
  `;
  const lead = leads[0];
  if (!lead) return null;
  if (lead.shop_id) {
    const shops = await sql<{
      id: string;
      slug: string;
      owner_user_id: string | null;
    }>`
      select id, slug, owner_user_id from shops where id = ${lead.shop_id} limit 1
    `;
    const shop = shops[0];
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
export const updateShopBrandHandler = async ({
  data,
  context
}: any) => {
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
  if (typeof data.catalogFilm === "string") {
    const { isCatalogHeroUrl } = await import("./hero-films");
    const next = data.catalogFilm.trim();
    if (next === "default") {
      if (isCatalogHeroUrl(row.hero_video_url)) {
        await sql`update shops set hero_video_url = null where id = ${row.id}`;
      }
    } else if (isCatalogHeroUrl(next)) {
      await sql`update shops set hero_video_url = ${next} where id = ${row.id}`;
    }
  }
  if (data.clearHeroVideo === true) {
    await sql`update shops set hero_video_url = null where id = ${row.id}`;
  }
  return {
    ok: true as const,
    onboarding: flags
  };
};
export const saveTradeProfileHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  await assertCanModifyShop(row, context.userId);
  const niche = isShopNiche(row.niche) ? row.niche : "location";
  const profile = parseTradeProfile(niche, data.profile);
  const sql = await getSql();
  try {
    await sql`update shops set trade_profile = ${keepHeroBrand(profile, row.trade_profile)} where id = ${row.id}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/trade_profile/i.test(message)) throw new Error("Trade profile is not on this database yet");
    throw err;
  }
  return {
    ok: true as const,
    profile
  };
};
const WEEK_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const setEmployeeAvailabilityHandler = async ({
  data,
  context
}: any) => {
  if (!WEEK_KEYS.includes(data.day as WeekKey)) throw new Error("Unknown day");
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  const sql = await getSql();
  const staff = await sql<{
    id: string;
    claimed_user_id: string | null;
    availability_json: string;
  }>`
      select id, claimed_user_id, availability_json from employees
      where id = ${data.employeeId} and shop_id = ${row.id}
      limit 1
    `;
  const employee = staff[0];
  if (!employee) throw new Error("Staff profile not found");
  const owner = row.owner_user_id === context.userId;
  if (!owner && employee.claimed_user_id !== context.userId) throw new Error("Forbidden");
  const week = parseWeek(employee.availability_json);
  week[data.day as WeekKey] = Boolean(data.on);
  await sql`
      update employees set availability_json = ${JSON.stringify(week)}
      where id = ${employee.id} and shop_id = ${row.id}
    `;
  return {
    ok: true as const,
    availability: week
  };
};
export const setShopRingColorHandler = async ({
  data,
  context
}: any) => {
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
  return {
    ringColor: color
  };
};
export const setShopIntroHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  await assertCanModifyShop(row, context.userId);
  const speed = Math.min(100, Math.max(1, Math.round(data.introSpeed)));
  const intensity = Math.min(100, Math.max(0, Math.round(data.introIntensity)));
  const preset = parseIntroPreset(data.introPreset);
  const sql = await getSql();
  await sql`
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
};
export const setShopNicheHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  if (!isPublicNiche(data.niche)) throw new Error("Pick a listed trade");
  const sql = await getSql();
  await sql`update shops set niche = ${data.niche} where id = ${row.id}`;
  return { ok: true as const, niche: data.niche as ShopNiche };
};
export const updateEmployeeHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  const name = String(data.displayName ?? "").trim();
  if (name.length < 2 || name.length > 80) throw new Error("Name is required");
  const title = String(data.title ?? "").trim().slice(0, 80) || "Specialist";
  const bio = String(data.bio ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 400);
  const phone = String(data.phone ?? "").trim().slice(0, 40);
  const sql = await getSql();
  const updated = await sql<{ id: string }>`
      update employees
      set display_name = ${name}, title = ${title}, bio = ${bio}, phone = ${phone}
      where id = ${data.employeeId} and shop_id = ${row.id}
      returning id
    `;
  if (!updated[0]) throw new Error("Staff not found");
  return { ok: true as const };
};
export const removeEmployeeHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  const sql = await getSql();
  const booked = await sql<{ n: number }>`
      select count(*)::int as n from appointments
      where employee_id = ${data.employeeId} and shop_id = ${row.id}
    `;
  if ((booked[0]?.n ?? 0) > 0) throw new Error("This person still has appointments");
  await sql`delete from employee_services where employee_id = ${data.employeeId}`;
  const removed = await sql<{ id: string }>`
      delete from employees where id = ${data.employeeId} and shop_id = ${row.id} returning id
    `;
  if (!removed[0]) throw new Error("Staff not found");
  return { ok: true as const };
};
export const inviteEmployeeHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  if (!(await allowOperator(row, context.userId))) throw new Error("Forbidden");
  const name = data.displayName.trim();
  if (name.length < 2) throw new Error("Name required");
  const sql = await getSql();
  const id = newId("emp");
  const token = crypto.randomUUID();
  const template = NICHES[row.niche as ShopNiche] ?? NICHES.location;
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
  const services = await sql<{
    id: string;
  }>`
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
      where id = ${row.id}
    `;
  return {
    id,
    token,
    invitePath: `/invite/${token}`
  };
};
export const claimInviteHandler = async ({
  data: token,
  context
}: any) => {
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
  return {
    slug: emp.slug
  };
};
export const getInvitePreviewHandler = async ({
  data: token
}: any) => {
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
};
async function mapAppointments(shopId: string, employeeId?: string | null): Promise<Appointment[]> {
  const sql = await getSql();
  const rows = employeeId ? await sql<{
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
      ` : await sql<{
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
  return rows.map(r => ({
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
async function loadNotices(shopId: string, employeeId?: string | null): Promise<ShopNotice[]> {
  const sql = await getSql();
  type NoticeRow = {
    id: string;
    channel: ShopNotice["channel"];
    kind: ShopNotice["kind"];
    employee_id?: string | null;
    destination: string;
    subject: string;
    body: string;
    status: ShopNotice["status"];
    detail: string;
    created_at: string;
  };
  const mapRow = (r: NoticeRow): ShopNotice => ({
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
    const rows = employeeId ? await sql<NoticeRow>`
          select id, channel, kind, employee_id, destination, subject, body, status, detail, created_at
          from shop_notifications
          where shop_id = ${shopId} and employee_id = ${employeeId} and channel = 'inbox'
          order by created_at desc
          limit 30
        ` : await sql<NoticeRow>`
          select id, channel, kind, employee_id, destination, subject, body, status, detail, created_at
          from shop_notifications
          where shop_id = ${shopId}
          order by created_at desc
          limit 30
        `;
    return rows.map(mapRow);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/employee_id/i.test(message)) throw err;
    if (employeeId) return [];
    const rows = await sql<NoticeRow>`
      select id, channel, kind, destination, subject, body, status, detail, created_at
      from shop_notifications
      where shop_id = ${shopId}
      order by created_at desc
      limit 30
    `;
    return rows.map(mapRow);
  }
}
async function deliverPendingAudits(shopId: string) {
  try {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      customer_name: string;
      summary: string;
    }>`
      select a.id, a.customer_name, a.summary
      from lead_audits a
      left join preloaded_leads l on l.lead_slug = a.lead_slug
      where a.delivered = false
        and (a.shop_id = ${shopId} or l.shop_id = ${shopId})
      order by a.created_at asc
      limit 20
    `;
    if (rows.length === 0) return;
    const {
      notifyShop
    } = await import("./notify.server");
    for (const row of rows) {
      await notifyShop(shopId, {
        kind: "inquiry",
        subject: `Audit · ${row.customer_name}`,
        body: row.summary
      });
      await sql`update lead_audits set delivered = true, shop_id = ${shopId} where id = ${row.id}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/lead_audits/i.test(message)) return;
    console.error("audit delivery failed", shopId, message);
  }
}
export const setShopDashboardHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  await assertCanModifyShop(row, context.userId);
  const config = parseDashboardConfig(data.config);
  const sql = await getSql();
  await sql`
      update shops
      set dashboard_override = ${Boolean(data.override)},
          dashboard_config = ${JSON.stringify(config)}
      where id = ${row.id}
    `;
  return {
    override: Boolean(data.override),
    config
  };
};
export const setEmployeeDashboardHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  const config = parseDashboardConfig(data.config);
  const sql = await getSql();
  const emp = await sql<{
    id: string;
  }>`
      select id from employees where id = ${data.employeeId} and shop_id = ${row.id} limit 1
    `;
  if (!emp[0]) throw new Error("Staff not found");
  if (row.is_showcase) {
    await assertCanModifyShop(row, context.userId);
  } else {
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
  return {
    config
  };
};
async function allowOperator(row: {
  id: string;
  owner_user_id: string | null;
}, userId: string) {
  if (row.owner_user_id && row.owner_user_id === userId) return true;
  const mem = await membership(row.id, userId);
  if (mem?.role === "owner") return true;
  const {
    isPlatformOwner
  } = await import("./platform-owner.server");
  return isPlatformOwner(userId);
}
export async function assertCanModifyShopById(shopId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<ShopRow>`select * from shops where id = ${shopId} limit 1`;
  const row = rows[0];
  if (!row) throw new Error("Shop not found");
  await assertCanModifyShop(row, userId);
  return row;
}

async function assertCanModifyShop(row: {
  id: string;
  owner_user_id: string | null;
  is_showcase: boolean;
}, userId: string) {
  if (row.is_showcase) {
    const {
      isPlatformOwner
    } = await import("./platform-owner.server");
    if (!(await isPlatformOwner(userId))) throw new Error("Showcase shops are read-only");
    return;
  }
  if (!(await allowOperator(row, userId))) throw new Error("Forbidden");
}
async function requireOwnerShop(slug: string, userId: string) {
  const row = await loadShopRow(slug);
  if (!row) throw new Error("Shop not found");
  if (row.is_showcase) throw new Error("Showcase shops are read-only");
  if (!(await allowOperator(row, userId))) throw new Error("Forbidden");
  return row;
}
export const getOperatorDataHandler = async ({
  data,
  context
}: any) => {
  const slug = data.slug;
  const row = await loadShopRow(slug);
  if (!row) throw new Error("Shop not found");
  const mem = await membership(row.id, context.userId);
  let stripeAccountId: string | null = null;
  let chargesEnabled = false;
  const shop = mapShop(row, false);
  let asMaster = false;
  if (data.desk === "master" && row.owner_user_id !== context.userId) {
    const {
      isPlatformOwner
    } = await import("./platform-owner.server");
    asMaster = await isPlatformOwner(context.userId);
  }
  let mode: AccessMode = mem?.role === "owner" ? "owner" : mem?.role === "employee" ? "employee" : shop.isShowcase ? "preview" : "none";
  if (asMaster && !shop.isShowcase) mode = "owner";
  if (mode === "none") throw new Error("Forbidden");
  const hidePii = mode === "preview";
  const appointments = hidePii ? (await mapAppointments(shop.id)).map(a => ({
    ...a,
    customerName: a.status === "completed" ? a.customerName : "Guest",
    customerPhone: ""
  })) : await mapAppointments(shop.id, mode === "employee" ? mem?.employee_id : null);
  let billing: Billing | null = null;
  if (mode === "owner" || mode === "preview") {
    const sql = await getSql();
    const applyBilling = (row: {
      plan: string;
      status: string;
      price_cents: number;
      gear_guardian_bps: number;
      stripe_account_id: string | null;
      stripe_charges_enabled: boolean;
    }) => {
      billing = {
        plan: row.plan,
        status: row.status,
        priceCents: Number(row.price_cents),
        gearGuardianBps: Number(row.gear_guardian_bps)
      };
      stripeAccountId = row.stripe_account_id;
      chargesEnabled = isOn(row.stripe_charges_enabled) && Boolean(row.stripe_account_id);
    };
    try {
      const b = await sql<{
        plan: string;
        status: string;
        price_cents: number;
        gear_guardian_bps: number;
        stripe_account_id: string | null;
        stripe_charges_enabled: boolean;
        stripe_connect_status: string | null;
      }>`
          select plan, status, price_cents, gear_guardian_bps, stripe_account_id, stripe_charges_enabled, stripe_connect_status
          from shop_billing where shop_id = ${shop.id}
        `;
      if (b[0]) applyBilling(b[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/stripe_connect_status|does not exist/i.test(message)) throw err;
      const b = await sql<{
        plan: string;
        status: string;
        price_cents: number;
        gear_guardian_bps: number;
        stripe_account_id: string | null;
        stripe_charges_enabled: boolean;
      }>`
          select plan, status, price_cents, gear_guardian_bps, stripe_account_id, stripe_charges_enabled
          from shop_billing where shop_id = ${shop.id}
        `;
      if (b[0]) applyBilling(b[0]);
    }
  }
  shop.acceptsCard = chargesEnabled;
  const [services, employees] = await Promise.all([loadServices(shop.id), loadEmployees(shop.id)]);
  const {
    stripeConfigured
  } = await import("./payments.server");
  const {
    connectStanding
  } = await import("./merchant-pricing");
  const payments: PaymentSetup = {
    processorReady: stripeConfigured(),
    connected: Boolean(stripeAccountId),
    chargesEnabled,
    connectStatus: connectStanding({
      accountId: stripeAccountId,
      chargesEnabled
    })
  };
  if (mode === "owner") await deliverPendingAudits(shop.id);
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
};
export const acceptBookingHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  const sql = await getSql();
  const pending = await sql<{
    id: string;
    employee_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    starts_at: string;
    service_name: string;
    employee_name: string;
  }>`
      select a.id, a.employee_id, a.customer_name, a.customer_phone, a.customer_email, a.starts_at,
        s.name as service_name, e.display_name as employee_name
      from appointments a
      join services s on s.id = a.service_id
      join employees e on e.id = a.employee_id
      where a.id = ${data.appointmentId} and a.shop_id = ${row.id} and a.status = 'pending'
      limit 1
    `;
  const booking = pending[0];
  if (!booking) throw new Error("Booking not found");
  if (row.is_showcase) {
    await assertCanModifyShop(row, context.userId);
  } else {
    const mem = await membership(row.id, context.userId);
    const isOwner = row.owner_user_id === context.userId || mem?.role === "owner" || (await allowOperator(row, context.userId));
    const isAssignee = mem?.role === "employee" && mem.employee_id === booking.employee_id;
    if (!isOwner && !isAssignee) throw new Error("Forbidden");
  }
  const updated = await sql<{
    id: string;
  }>`
      update appointments
      set status = 'confirmed'
      where id = ${data.appointmentId} and shop_id = ${row.id} and status = 'pending'
      returning id
    `;
  if (!updated[0]) throw new Error("Booking not found");
  const when = new Date(String(booking.starts_at)).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  const detail = `${booking.service_name} · ${when}`;
  await sql`
      insert into shop_events (id, shop_id, type, appointment_id, payload)
      values (${newId("evt")}, ${row.id}, 'booking_confirmed', ${data.appointmentId}, ${detail})
    `;
  const {
    notifyBookingParties
  } = await import("./notify.server");
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
  return {
    ok: true as const,
    detail
  };
};
export const confirmLatestAuditHandler = async ({
  data: slug,
  context
}: any) => {
  const row = await loadShopRow(slug);
  if (!row) throw new Error("Shop not found");
  const sql = await getSql();
  if (row.is_showcase) {
    await assertCanModifyShop(row, context.userId);
  } else {
    const mem = await membership(row.id, context.userId);
    const isOwner = row.owner_user_id === context.userId || mem?.role === "owner" || (await allowOperator(row, context.userId));
    const isEmployee = mem?.role === "employee";
    if (!isOwner && !isEmployee) throw new Error("Forbidden");
  }
  const open = await sql<{
    id: string;
    customer_name: string;
    lane: string;
  }>`
      select a.id, a.customer_name, a.lane
      from lead_audits a
      where a.shop_id = ${row.id}
        and not exists (
          select 1 from shop_events e
          where e.shop_id = a.shop_id
            and e.type = 'audit_confirmed'
            and e.payload like a.id || '|%'
        )
      order by a.created_at desc
      limit 1
    `;
  const audit = open[0];
  if (!audit) throw new Error("No open estimate");
  const detail = `${audit.customer_name} · ${audit.lane}`;
  try {
    await sql`update lead_audits set status = 'confirmed' where id = ${audit.id}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/status/i.test(message)) throw error;
  }
  await sql`
      insert into shop_events (id, shop_id, type, payload)
      values (${newId("evt")}, ${row.id}, 'audit_confirmed', ${`${audit.id}|${detail}`})
    `;
  return {
    ok: true as const,
    id: audit.id,
    detail
  };
};
export const getAuditStatusHandler = async ({
  data
}: any) => {
  const sql = await getSql();
  const rows = await sql<{
    payload: string;
  }>`
      select payload from shop_events
      where type = 'audit_confirmed' and payload like ${`${data}|%`}
      order by created_at desc
      limit 1
    `;
  const payload = rows[0]?.payload ?? "";
  if (!payload.startsWith(`${data}|`)) return {
    status: "open" as const,
    detail: ""
  };
  return {
    status: "confirmed" as const,
    detail: payload.slice(data.length + 1)
  };
};
export const addPortfolioItemHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  if (row.is_showcase) throw new Error("Showcase shops are read-only");
  const mem = await membership(row.id, context.userId);
  const employeeId = mem?.employee_id ?? (await (await getSql())<{
    id: string;
  }>`
          select id from employees where shop_id = ${row.id} and claimed_user_id = ${context.userId} limit 1
        `)[0]?.id;
  if (!employeeId && row.owner_user_id !== context.userId) throw new Error("Forbidden");
  const empId = employeeId ?? (await (await getSql())<{
    id: string;
  }>`
          select id from employees where shop_id = ${row.id} order by created_at asc limit 1
        `)[0]?.id;
  if (!empId) throw new Error("No staff profile");
  if (!data.imageUrl.startsWith("data:image/") && !data.imageUrl.startsWith("/")) {
    throw new Error("Invalid image");
  }
  if (data.imageUrl.startsWith("data:") && data.imageUrl.length > 1_200_000) {
    throw new Error("Image is too large");
  }
  const sql = await getSql();
  if (data.imageUrl.startsWith("data:")) {
    const counted = await sql<{
      n: number;
    }>`
        select count(*)::int as n from portfolio_items
        where shop_id = ${row.id} and image_url like 'data:%'
      `;
    if (Number(counted[0]?.n ?? 0) >= 12) throw new Error("Gallery is full");
  }
  const id = newId("pf");
  await sql`
      insert into portfolio_items (id, shop_id, employee_id, image_url, caption)
      values (${id}, ${row.id}, ${empId}, ${data.imageUrl}, ${data.caption.trim().slice(0, 80)})
    `;
  return {
    id
  };
};
export const listShopPortfolioHandler = async ({
  data: slug
}: any) => {
  const row = await loadShopRow(slug);
  if (!row) return [];
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    image_url: string;
    caption: string;
  }>`
      select id, image_url, caption
      from portfolio_items
      where shop_id = ${row.id}
      order by created_at desc
      limit 24
    `;
  return rows.map(item => ({
    id: item.id,
    imageUrl: item.image_url,
    caption: item.caption
  }));
};
export const removePortfolioItemHandler = async ({
  data,
  context
}: any) => {
  const row = await loadShopRow(data.slug);
  if (!row) throw new Error("Shop not found");
  if (row.is_showcase) throw new Error("Showcase shops are read-only");
  const mem = await membership(row.id, context.userId);
  if (!mem && row.owner_user_id !== context.userId) throw new Error("Forbidden");
  const sql = await getSql();
  await sql`
      delete from portfolio_items
      where id = ${data.id} and shop_id = ${row.id}
    `;
  return {
    ok: true as const
  };
};
export const updateShopProfileHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  const name = data.name.trim();
  if (name.length < 2 || name.length > 80) throw new Error("Business name is required");
  const sql = await getSql();
  await sql`
      update shops set
        name = ${name},
        tagline = ${data.tagline.trim().slice(0, 160)},
        description = ${data.description.trim().slice(0, 600)},
        address = ${data.address.trim().slice(0, 160)}
      where id = ${row.id}
    `;
  return {
    ok: true as const
  };
};
export const updateNotifyChannelsHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  const email = data.notifyEmail.trim().toLowerCase();
  if (email && !isNotifyEmail(email)) throw new Error("Enter a valid email");
  let phone = "";
  if (data.notifyPhone.trim()) {
    const normalized = toE164(data.notifyPhone);
    if (!normalized) throw new Error("Use a 10-digit mobile number");
    phone = normalized;
  }
  const sql = await getSql();
  await sql`
      update shops set notify_email = ${email}, notify_phone = ${phone}
      where id = ${row.id}
    `;
  return {
    ok: true as const,
    notifyEmail: email,
    notifyPhone: phone
  };
};
export const saveShopServicesHandler = async ({
  data,
  context
}: any) => {
  const row = await requireOwnerShop(data.slug, context.userId);
  if (data.services.length < 1 || data.services.length > 24) throw new Error("Add at least one service");
  const niche = isShopNiche(row.niche) ? row.niche : "location";
  const allowed = priceUnitsFor(niche);
  const sql = await getSql();
  const kept: string[] = [];
  for (const [index, service] of data.services.entries()) {
    const name = service.name.trim();
    if (name.length < 2 || name.length > 80) throw new Error("Service name is required");
    const description = service.description.trim().slice(0, 240);
    const group = (service.group ?? "").trim().slice(0, 40);
    const duration = Math.round(Number(service.durationMin));
    const price = Math.round(Number(service.priceCents));
    const priceUnit = service.priceUnit ?? "flat";
    if (!allowed.includes(priceUnit)) throw new Error("That charge does not fit this trade");
    if (!Number.isFinite(duration) || duration < 10 || duration > 480) {
      throw new Error("Duration must be between 10 and 480 minutes");
    }
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) throw new Error("Price is out of range");
    if (service.id) {
      const updated = await sql<{
        id: string;
      }>`
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
        `;
      if (!updated[0]) throw new Error("Service not found");
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
      const employees = await sql<{
        id: string;
      }>`select id from employees where shop_id = ${row.id}`;
      for (const employee of employees) {
        await sql`
            insert into employee_services (employee_id, service_id)
            values (${employee.id}, ${id})
            on conflict do nothing
          `;
      }
      kept.push(id);
    }
  }
  const catalog = await sql<{
    id: string;
  }>`
      select id from services where shop_id = ${row.id}
    `;
  const ownedIds = new Set(catalog.map(service => service.id));
  for (const removeId of data.removeIds) {
    if (kept.includes(removeId) || !ownedIds.has(removeId)) continue;
    const used = await sql<{
      id: string;
    }>`
        select id from appointments where service_id = ${removeId} and shop_id = ${row.id} limit 1
      `;
    if (used[0]) throw new Error("That service already has bookings");
    await sql`
        delete from employee_services
        where service_id = ${removeId}
          and employee_id in (select id from employees where shop_id = ${row.id})
      `;
    await sql`delete from services where id = ${removeId} and shop_id = ${row.id}`;
  }
  if (!row.primary_service_id || !kept.includes(row.primary_service_id)) {
    await sql`update shops set primary_service_id = ${kept[0] ?? null} where id = ${row.id}`;
  }
  return {
    ok: true as const
  };
};
export const submitInquiryHandler = async ({
  data
}: any) => {
  const shop = await loadShopRow(data.slug);
  if (!shop) throw new Error("Shop not found");
  const name = data.name.trim();
  const message = data.message.trim();
  if (name.length < 2 || name.length > 80) throw new Error("Name required");
  if (message.length < 8 || message.length > 500) throw new Error("Write a short message");
  const {
    allowInquiry,
    notifyShop
  } = await import("./notify.server");
  if (!allowInquiry(shop.id)) throw new Error("Too many messages. Call the shop instead.");
  const phone = data.phone.trim().slice(0, 20);
  await notifyShop(shop.id, {
    kind: "inquiry",
    subject: `Inquiry · ${name}`,
    body: `${name} wrote: ${message}${phone ? ` Phone: ${phone}` : ""}`
  });
  return {
    ok: true as const
  };
};
export const submitAuditHandler = async ({
  data
}: any) => {
  const {
    allowInquiry,
    notifyShop
  } = await import("./notify.server");
  const {
    formatAuditReport
  } = await import("./storefront");
  const sql = await getSql();
  let shopId = "";
  if (data.shopSlug) {
    const shop = await loadShopRow(data.shopSlug);
    if (!shop) throw new Error("Shop not found");
    shopId = shop.id;
  } else if (data.leadSlug) {
    try {
      const linked = await sql<{
        shop_id: string | null;
      }>`
          select shop_id from preloaded_leads where lead_slug = ${data.leadSlug} limit 1
        `;
      shopId = linked[0]?.shop_id ?? "";
    } catch {
      shopId = "";
    }
  }
  const key = shopId || `lead:${data.leadSlug}`;
  if (!allowInquiry(key)) throw new Error("Too many reports. Call the shop instead.");
  const channel = data.channel === "email" ? "email" : "text";
  const summary = formatAuditReport({
    name: data.name,
    channel,
    contact: data.contact,
    lane: data.lane,
    lowCents: data.lowCents,
    highCents: data.highCents,
    impact: data.impact
  });
  const id = newId("aud");
  const delivered = Boolean(shopId);
  await sql`
      insert into lead_audits (
        id, lead_slug, shop_id, customer_name, channel, contact, lane,
        low_cents, high_cents, impact, summary, delivered
      ) values (
        ${id}, ${data.leadSlug}, ${shopId || null}, ${data.name}, ${data.channel}, ${data.contact},
        ${data.lane}, ${data.lowCents}, ${data.highCents}, ${data.impact}, ${summary}, ${delivered}
      )
    `;
  if (shopId) {
    await notifyShop(shopId, {
      kind: "inquiry",
      subject: `Audit · ${data.name}`,
      body: summary
    });
    await sql`
        insert into shop_events (id, shop_id, type, payload)
        values (${newId("evt")}, ${shopId}, 'audit_request', ${`${data.name} · ${data.lane}`})
      `;
  }
  return {
    ok: true as const,
    delivered,
    id
  };
};
export const startCardCheckoutHandler = async ({
  data
}: any) => {
  const booked = await assertBookable(data);
  const quote = await merchantQuote(booked.shop.slug, booked.serviceName, booked.priceCents);
  if (quote.collection === "in_person") throw new Error("This visit is paid in person");
  if (quote.dueNowCents <= 0) throw new Error("This service has no card price");
  const sql = await getSql();
  const billing = await sql<{
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
    gear_guardian_bps: number;
  }>`
      select stripe_account_id, stripe_charges_enabled, gear_guardian_bps
      from shop_billing where shop_id = ${booked.shop.id}
    `;
  const account = billing[0]?.stripe_account_id;
  if (!account || !isOn(billing[0]?.stripe_charges_enabled)) {
    throw new Error("This shop is not accepting cards yet");
  }
  const id = newId("apt");
  try {
    await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone, customer_email,
          starts_at, status, payment_status, payment_cents
        ) values (
          ${id}, ${booked.shop.id}, ${data.employeeId}, ${data.serviceId}, ${booked.name},
          ${booked.phone}, ${booked.email}, ${data.startsAt}, 'pending', 'processing', ${quote.dueNowCents}
        )
      `;
  } catch (err) {
    if (isSlotTaken(err)) throw new Error("That time was just taken. Please choose another slot.");
    throw err;
  }
  const {
    createConnectCheckout,
    requestOrigin
  } = await import("./payments.server");
  const origin = requestOrigin();
  let fee = Math.round(quote.dueNowCents * Number(billing[0].gear_guardian_bps) / 10000);
  if (fee >= quote.dueNowCents) fee = Math.max(0, quote.dueNowCents - 50);
  try {
    const session = await createConnectCheckout({
      destination: account,
      amountCents: quote.dueNowCents,
      feeCents: fee,
      serviceName: booked.serviceName,
      shopId: booked.shop.id,
      appointmentId: id,
      successUrl: `${origin}/${booked.shop.slug}/book?session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${booked.shop.slug}/book?cancelled=${id}`
    });
    await sql`update appointments set payment_ref = ${session.id} where id = ${id}`;
    return {
      url: session.url
    };
  } catch (err) {
    await sql`delete from appointments where id = ${id} and payment_status = 'processing'`;
    throw err instanceof Error ? err : new Error("Checkout failed");
  }
};
export const beginCardElementsHandler = async ({
  data
}: any) => {
  const booked = await assertBookable(data);
  const quote = await merchantQuote(booked.shop.slug, booked.serviceName, booked.priceCents);
  if (quote.collection === "in_person") throw new Error("This visit is paid in person");
  if (quote.dueNowCents <= 0) throw new Error("This service has no card price");
  const sql = await getSql();
  const billing = await sql<{
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
    gear_guardian_bps: number;
  }>`
      select stripe_account_id, stripe_charges_enabled, gear_guardian_bps
      from shop_billing where shop_id = ${booked.shop.id}
    `;
  const account = billing[0]?.stripe_account_id;
  if (!account || !isOn(billing[0]?.stripe_charges_enabled)) {
    throw new Error("This shop is not accepting cards yet");
  }
  const {
    createConnectPaymentIntent,
    stripePublishableKey
  } = await import("./payments.server");
  const publishableKey = stripePublishableKey();
  if (!publishableKey) throw new Error("Card fields are not configured");
  const id = newId("apt");
  try {
    await sql`
        insert into appointments (
          id, shop_id, employee_id, service_id, customer_name, customer_phone, customer_email,
          starts_at, status, payment_status, payment_cents
        ) values (
          ${id}, ${booked.shop.id}, ${data.employeeId}, ${data.serviceId}, ${booked.name},
          ${booked.phone}, ${booked.email}, ${data.startsAt}, 'pending', 'processing', ${quote.dueNowCents}
        )
      `;
  } catch (err) {
    if (isSlotTaken(err)) throw new Error("That time was just taken. Please choose another slot.");
    throw err;
  }
  let fee = Math.round(quote.dueNowCents * Number(billing[0].gear_guardian_bps) / 10000);
  if (fee >= quote.dueNowCents) fee = Math.max(0, quote.dueNowCents - 50);
  try {
    const intent = await createConnectPaymentIntent({
      destination: account,
      amountCents: quote.dueNowCents,
      feeCents: fee,
      shopId: booked.shop.id,
      appointmentId: id
    });
    await sql`update appointments set payment_ref = ${intent.id} where id = ${id}`;
    return {
      clientSecret: intent.clientSecret,
      publishableKey,
      appointmentId: id
    };
  } catch (err) {
    await sql`delete from appointments where id = ${id} and payment_status = 'processing'`;
    throw err instanceof Error ? err : new Error("Checkout failed");
  }
};
export const confirmCardCheckoutHandler = async ({
  data
}: any) => {
  if (!data.sessionId.startsWith("cs_")) throw new Error("Invalid session");
  const shop = await loadShopRow(data.slug);
  if (!shop) throw new Error("Shop not found");
  const {
    settlePaidSession
  } = await import("./payments.server");
  const result = await settlePaidSession(data.sessionId);
  if (result.shopId !== shop.id) throw new Error("Payment does not match this shop");
  return {
    appointmentId: result.appointmentId
  };
};
export const confirmCardPaymentHandler = async ({
  data
}: any) => {
  if (!data.paymentIntentId.startsWith("pi_")) throw new Error("Invalid payment");
  const shop = await loadShopRow(data.slug);
  if (!shop) throw new Error("Shop not found");
  const {
    settlePaidIntent
  } = await import("./payments.server");
  const result = await settlePaidIntent(data.paymentIntentId);
  if (result.shopId !== shop.id) throw new Error("Payment does not match this shop");
  return {
    appointmentId: result.appointmentId
  };
};
export const releaseCardCheckoutHandler = async ({
  data
}: any) => {
  if (!data.appointmentId.startsWith("apt_")) throw new Error("Invalid booking");
  const shop = await loadShopRow(data.slug);
  if (!shop) throw new Error("Shop not found");
  const sql = await getSql();
  await sql`
      update appointments
      set status = 'cancelled', payment_status = 'failed'
      where id = ${data.appointmentId}
        and shop_id = ${shop.id}
        and status = 'pending'
        and payment_status = 'processing'
    `;
  return {
    ok: true as const
  };
};
export const beginStripeConnectHandler = async ({
  data: slug,
  context
}: any) => {
  const row = await requireOwnerShop(slug, context.userId);
  const {
    beginConnect,
    requestOrigin,
    stripeConfigured
  } = await import("./payments.server");
  if (!stripeConfigured()) throw new Error("Card payments are not configured for this workspace");
  const sql = await getSql();
  const billing = await sql<{
    stripe_account_id: string | null;
  }>`
      select stripe_account_id from shop_billing where shop_id = ${row.id}
    `;
  return beginConnect({
    shopId: row.id,
    slug: row.slug,
    accountId: billing[0]?.stripe_account_id ?? null,
    origin: requestOrigin()
  });
};
export const refreshStripeConnectHandler = async ({
  data: slug,
  context
}: any) => {
  const row = await requireOwnerShop(slug, context.userId);
  const sql = await getSql();
  const billing = await sql<{
    stripe_account_id: string | null;
  }>`
      select stripe_account_id from shop_billing where shop_id = ${row.id}
    `;
  const accountId = billing[0]?.stripe_account_id;
  if (!accountId) return {
    chargesEnabled: false
  };
  const {
    syncConnectAccount
  } = await import("./payments.server");
  return syncConnectAccount(accountId);
};
