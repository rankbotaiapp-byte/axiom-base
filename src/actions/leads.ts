import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  isLeadReader,
  leadSearchSql,
  leadWithinRadius,
  planLeadSearch,
  type PreloadedLeadHit,
  type PreloadedLeadSearch,
} from "./leads-query.ts";
import {
  ACTIVE_SHOP_BILLING,
  canSearchConsumerLeads,
  consumerLeadSearchSql,
  planConsumerLeadSearch,
  rejectConsumerSearchPayload,
  type ConsumerLeadHit,
  type ConsumerLeadSearch,
  type ContactMeta,
} from "./consumer-leads-query.ts";

export {
  EARTH_MILES,
  NATIONWIDE_DIGITAL_NICHES,
  countySpellings,
  isLeadReader,
  leadReachForNiche,
  leadSearchSql,
  leadWithinRadius,
  milesBetween,
  planLeadSearch,
} from "./leads-query.ts";
export type { LeadQueryPlan, LeadReach, LeadSearchMode, PreloadedLeadHit, PreloadedLeadSearch } from "./leads-query.ts";
export {
  canSearchConsumerLeads,
  consumerLeadSearchSql,
  planConsumerLeadSearch,
} from "./consumer-leads-query.ts";
export type {
  ConsumerLeadHit,
  ConsumerLeadPlan,
  ConsumerLeadSearch,
  ConsumerSearchMode,
  HomeownerFilter,
} from "./consumer-leads-query.ts";

type LeadRow = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  niche: string;
  city: string;
  county: string;
  state: string;
  zip_code: string;
  miles: number | string | null;
};

function measuredMiles(value: number | string | null): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function mapLead(row: LeadRow): PreloadedLeadHit {
  const businessName = row.business_name?.trim() ?? "";
  const contact = row.contact_name?.trim() ?? "";
  const miles = measuredMiles(row.miles);
  return {
    id: row.id,
    name: contact || businessName,
    businessName,
    niche: row.niche,
    city: row.city ?? "",
    county: row.county ?? "",
    state: row.state ?? "",
    zipCode: row.zip_code ?? "",
    miles: miles == null ? null : Math.round(miles * 10) / 10,
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
  };
}

/**
 * profiles.role for the session user must be owner, employee, admin, or
 * platform_admin. A customer role or a missing row is rejected.
 */
async function assertCanReadLeads(userId: string): Promise<void> {
  if (!userId.trim()) throw new Error("Forbidden");
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role
    from profiles
    where user_id = ${userId}
    limit 1
  `;
  if (!isLeadReader(rows[0]?.role)) throw new Error("Forbidden");
}

/**
 * The profiles lookup uses only `session.user.id` from `auth.api.getSession`.
 * `context.userId` and any id or role on the search payload are not read.
 */
async function sessionUserId(bearerToken?: string): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const { UnauthorizedError } = await import("@/lib/auth/verify.server");
  const { gateIdentityEnabled } = await import("@/lib/auth/gate-identity.server");
  const { auth, authConfigured } = await import("@/lib/auth/server");
  if (!authConfigured && !gateIdentityEnabled()) throw new UnauthorizedError();
  const request = getRequest();
  if (!request) throw new UnauthorizedError();
  let headers = request.headers;
  if (bearerToken) {
    headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  const session = await auth.api.getSession({ headers });
  const userId = session?.user?.id?.trim() ?? "";
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/**
 * Active, unclaimed leads from preloaded_leads.
 * Local niches filter on the state/county/niche index or the ZIP index, then
 * keep rows inside the radius (Grants Pass is ZIP 97537 in Josephine County, OR).
 * Nationwide digital niches match the niche only.
 */
export const searchPreloadedLeads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(planLeadSearch)
  .handler(async ({ data, context }): Promise<PreloadedLeadSearch> => {
    await assertCanReadLeads(await sessionUserId(context.bearerToken));
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const query = leadSearchSql(data);
    const rows = await sql.query<LeadRow>(query.text, query.values);
    const leads = rows
      .filter((row) => data.reach === "national" || leadWithinRadius(measuredMiles(row.miles), data.radiusMiles))
      .map(mapLead);
    return {
      reach: data.reach,
      niche: data.niche,
      segment: data.segment,
      count: leads.length,
      leads,
    };
  });

type ConsumerRow = {
  id: string;
  niche: string;
  city: string;
  county: string;
  state: string;
  zip_code: string;
  homeowner_status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_meta: unknown;
  miles: number | string | null;
};

function contactMeta(value: unknown): ContactMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const meta: ContactMeta = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) {
      meta[key] = item;
    } else if (item !== undefined) {
      meta[key] = JSON.stringify(item);
    }
  }
  return meta;
}

function mapConsumerLead(row: ConsumerRow): ConsumerLeadHit {
  const miles = measuredMiles(row.miles);
  return {
    id: row.id,
    niche: row.niche,
    city: row.city ?? "",
    county: row.county ?? "",
    state: row.state ?? "",
    zipCode: row.zip_code ?? "",
    miles: miles == null ? null : Math.round(miles * 10) / 10,
    homeownerStatus: row.homeowner_status,
    contact: {
      name: row.contact_name ?? "",
      email: row.contact_email ?? "",
      phone: row.contact_phone ?? "",
      meta: contactMeta(row.contact_meta),
    },
  };
}

/**
 * Owners and employees need a shop_memberships row for this niche on a shop
 * whose billing status is active or trialing. Canceled and unbilled shops
 * do not qualify. Admins and platform admins are not limited to one shop.
 */
async function assertCanSearchConsumerLeads(userId: string, niche: string): Promise<void> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const profiles = await sql<{ role: string }>`
    select role from profiles where user_id = ${userId} limit 1
  `;
  const role = profiles[0]?.role ?? null;
  if (!isLeadReader(role)) throw new Error("Forbidden");
  if (role === "admin" || role === "platform_admin") return;
  const memberships = await sql<{ trade: string }>`
    select m.trade
    from shop_memberships m
    join shop_billing b on b.shop_id = m.shop_id
    where m.user_id = ${userId}
      and m.role in ('owner', 'employee')
      and m.trade = ${niche}
      and b.status in (${ACTIVE_SHOP_BILLING[0]}, ${ACTIVE_SHOP_BILLING[1]})
  `;
  if (!canSearchConsumerLeads({ role, shopNiches: memberships.map((row) => row.trade), niche })) {
    throw new Error("Forbidden");
  }
}

/**
 * First server step. Rejects reach national, nationwide, and global, and any
 * payload with no state and county and no ZIP, before auth or a database query.
 */
const guardConsumerSearch = createMiddleware({ type: "function" }).server(async ({ data, next }) => {
  rejectConsumerSearchPayload(data);
  return next();
});

/**
 * Active homeowner prospects from consumer_leads.
 * Does not read preloaded_leads. Nationwide search is rejected.
 */
export const searchConsumerLeads = createServerFn({ method: "GET" })
  .middleware([guardConsumerSearch, authMiddleware])
  .validator(planConsumerLeadSearch)
  .handler(async ({ data, context }): Promise<ConsumerLeadSearch> => {
    const userId = await sessionUserId(context.bearerToken);
    await assertCanSearchConsumerLeads(userId, data.niche);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const query = consumerLeadSearchSql(data);
    if (/preloaded_leads/i.test(query.text)) {
      throw new Error("Consumer search is isolated from preloaded leads");
    }
    const rows = await sql.query<ConsumerRow>(query.text, query.values);
    const leads = rows
      .filter((row) => leadWithinRadius(measuredMiles(row.miles), data.radiusMiles))
      .map(mapConsumerLead);
    return {
      niche: data.niche,
      segment: data.segment,
      count: leads.length,
      leads,
    };
  });
