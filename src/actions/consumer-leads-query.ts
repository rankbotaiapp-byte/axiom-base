import { countySpellings, EARTH_MILES, isLeadReader } from "./leads-query.ts";

const NICHE_KEY = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SESSION_KEY = /^(role|userid|user_id|profilerole|userrole)$/i;
const NATIONWIDE_REACH = new Set(["national", "nationwide", "global"]);

/** A tenant shop can search only while billing is one of these. */
export const ACTIVE_SHOP_BILLING = ["active", "trialing"] as const;

function rawZip(raw: Record<string, unknown>): unknown {
  return raw.zipCode ?? raw.zip ?? raw.zip_code;
}

function hasLocalPlace(raw: Record<string, unknown>): boolean {
  const zip = String(rawZip(raw) ?? "")
    .trim()
    .slice(0, 5);
  if (/^\d{5}$/.test(zip)) return true;
  const state = String(raw.state ?? "")
    .trim()
    .toUpperCase();
  const county = String(raw.county ?? "").trim();
  return /^[A-Z]{2}$/.test(state) && county.length > 0 && county.length <= 80;
}

/**
 * Throws before a consumer search is allowed to touch the database.
 * A missing place is nationwide: consumer search never runs without a county or ZIP.
 */
export function rejectConsumerSearchPayload(input: unknown): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Consumer lead search is required");
  }
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some((key) => SESSION_KEY.test(key))) {
    throw new Error("Role and user id come from the session");
  }
  const reach = String(raw.reach ?? "")
    .trim()
    .toLowerCase();
  if (NATIONWIDE_REACH.has(reach) || !hasLocalPlace(raw)) {
    throw new Error("Consumer prospects stay inside a radius");
  }
}

export type ConsumerSearchMode = "county" | "zip" | "county-zip";
export type HomeownerFilter = "homeowner" | "renter" | "unknown" | "any";

export type ConsumerLeadPlan = {
  niche: string;
  mode: ConsumerSearchMode;
  state: string;
  counties: [string, string] | null;
  zipCode: string;
  radiusMiles: number;
  lat: number | null;
  lng: number | null;
  limit: number;
  homeownerStatus: HomeownerFilter;
  segment: string;
};

export type ContactMeta = Record<string, string | number | boolean | null>;

export type ConsumerLeadHit = {
  id: string;
  niche: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
  miles: number | null;
  homeownerStatus: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    meta: ContactMeta;
  };
};

export type ConsumerLeadSearch = {
  niche: string;
  segment: string;
  count: number;
  leads: ConsumerLeadHit[];
};

/**
 * Tenant staff may search residential prospects for a niche on their own shop.
 * Platform admins may search any niche. Customers may not.
 */
export function canSearchConsumerLeads(input: {
  role: string | null | undefined;
  shopNiches: readonly string[];
  niche: string;
}): boolean {
  if (!isLeadReader(input.role)) return false;
  if (input.role === "admin" || input.role === "platform_admin") return true;
  return input.shopNiches.includes(input.niche);
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") throw new Error("Consumer lead search is required");
  return input as Record<string, unknown>;
}

function nicheOf(value: unknown): string {
  const niche = String(value ?? "").trim().toLowerCase();
  if (!NICHE_KEY.test(niche)) throw new Error("Niche is required");
  return niche;
}

function limitOf(value: unknown): number {
  if (value == null || value === "") return 50;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Limit must be from 1 to 100");
  return n;
}

function radiusOf(value: unknown): number {
  if (value == null || value === "") return 25;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 150) throw new Error("Radius must be from 1 to 150 miles");
  return n;
}

function stateOf(value: unknown): string {
  const state = String(value ?? "").trim().toUpperCase();
  if (!state) return "";
  if (!/^[A-Z]{2}$/.test(state)) throw new Error("State must be a 2-letter code");
  return state;
}

function countyOf(value: unknown): string {
  const county = String(value ?? "").trim().replace(/\s+/g, " ");
  if (county.length > 80) throw new Error("County is too long");
  return county;
}

function zipOf(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const zip = raw.slice(0, 5);
  if (!/^\d{5}$/.test(zip)) throw new Error("ZIP code must be 5 digits");
  return zip;
}

function pointOf(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const latBlank = lat == null || lat === "";
  const lngBlank = lng == null || lng === "";
  if (latBlank && lngBlank) return null;
  if (latBlank || lngBlank) throw new Error("A map point needs both latitude and longitude");
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Latitude is out of range");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Longitude is out of range");
  return { lat: latitude, lng: longitude };
}

function homeownerOf(value: unknown): "homeowner" {
  if (value == null || value === "") return "homeowner";
  if (String(value).trim().toLowerCase() === "homeowner") return "homeowner";
  throw new Error("Consumer search is limited to active homeowners");
}

function segmentFor(plan: {
  niche: string;
  mode: ConsumerSearchMode;
  state: string;
  counties: [string, string] | null;
  zipCode: string;
  radiusMiles: number;
  homeownerStatus: HomeownerFilter;
}): string {
  const who = plan.homeownerStatus === "any" ? "Residential" : "Homeowner";
  const place =
    plan.mode === "zip"
      ? `ZIP ${plan.zipCode}`
      : plan.mode === "county"
        ? `${plan.counties?.[1]}, ${plan.state}`
        : `${plan.counties?.[1]}, ${plan.state} ${plan.zipCode}`;
  return `${who} ${plan.niche} prospects within ${plan.radiusMiles} miles of ${place}`;
}

/** Residential search. Always names a place. Does not read preloaded_leads. */
export function planConsumerLeadSearch(input: unknown): ConsumerLeadPlan {
  rejectConsumerSearchPayload(input);
  const raw = asRecord(input);
  const niche = nicheOf(raw.niche);
  const state = stateOf(raw.state);
  const county = countyOf(raw.county);
  const zipCode = zipOf(rawZip(raw));
  const radiusMiles = radiusOf(raw.radiusMiles);
  const point = pointOf(raw.lat, raw.lng);
  const homeownerStatus = homeownerOf(raw.homeownerStatus);
  const limit = limitOf(raw.limit);
  if (county && !state) throw new Error("A county search needs a state");
  const hasCounty = Boolean(state && county);
  const hasZip = Boolean(zipCode);
  if (!hasCounty && !hasZip) throw new Error("A consumer search needs a state and county, or a ZIP code");
  const counties = hasCounty ? countySpellings(county) : null;
  const mode: ConsumerSearchMode = hasCounty && hasZip ? "county-zip" : hasCounty ? "county" : "zip";
  return {
    niche,
    mode,
    state,
    counties,
    zipCode,
    radiusMiles,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    limit,
    homeownerStatus,
    segment: segmentFor({ niche, mode, state, counties, zipCode, radiusMiles, homeownerStatus }),
  };
}

const DISTANCE = `(${EARTH_MILES} * 2 * asin(least(1.0, sqrt(
      power(sin(radians(m.lat - o.lat) / 2), 2)
      + cos(radians(o.lat)) * cos(radians(m.lat)) * power(sin(radians(m.lng - o.lng) / 2), 2)
    ))))`;

function localQuery(where: string, originLat: string, originLng: string, radius: string, limit: string): string {
  return `
    with matched as (
      select id::text as id, niche, state, county, city, zip_code, lat, lng,
             homeowner_status, contact_name, contact_email, contact_phone, contact_meta
      from consumer_leads
      where active = true
        and homeowner_status = 'homeowner'
        and lat is not null
        and lng is not null
        and ${where}
    ),
    origin as (
      select
        coalesce(${originLat}::float8, avg(lat)) as lat,
        coalesce(${originLng}::float8, avg(lng)) as lng
      from matched
    )
    select
      m.id,
      m.niche,
      m.city,
      m.county,
      m.state,
      m.zip_code,
      m.homeowner_status,
      m.contact_name,
      m.contact_email,
      m.contact_phone,
      m.contact_meta,
      ${DISTANCE} as miles
    from matched m
    cross join origin o
    where m.lat is not null
      and m.lng is not null
      and o.lat is not null
      and o.lng is not null
      and ${DISTANCE} <= ${radius}::float8
    order by miles asc, m.contact_name asc
    limit ${limit}::int`;
}

/** Parameterized SQL against consumer_leads. Never names preloaded_leads. */
export function consumerLeadSearchSql(plan: ConsumerLeadPlan): { text: string; values: unknown[] } {
  const [countyA, countyB] = plan.counties ?? ["", ""];
  if (plan.mode === "county-zip") {
    return {
      text: localQuery(
        `niche = $1
         and state = $2
         and lower(county) in (lower($3), lower($4))
         and zip_code = $5
         and state <> ''
         and zip_code <> ''`,
        "$6",
        "$7",
        "$8",
        "$9",
      ),
      values: [plan.niche, plan.state, countyA, countyB, plan.zipCode, plan.lat, plan.lng, plan.radiusMiles, plan.limit],
    };
  }
  if (plan.mode === "county") {
    return {
      text: localQuery(
        `niche = $1
         and state = $2
         and lower(county) in (lower($3), lower($4))
         and state <> ''`,
        "$5",
        "$6",
        "$7",
        "$8",
      ),
      values: [plan.niche, plan.state, countyA, countyB, plan.lat, plan.lng, plan.radiusMiles, plan.limit],
    };
  }
  return {
    text: localQuery(
      `niche = $1
       and zip_code = $2
       and zip_code <> ''`,
      "$3",
      "$4",
      "$5",
      "$6",
    ),
    values: [plan.niche, plan.zipCode, plan.lat, plan.lng, plan.radiusMiles, plan.limit],
  };
}
