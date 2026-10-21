/** Earth radius used by the SQL distance expression. Keep the two in sync. */
export const EARTH_MILES = 3958.7613;

/**
 * Offerings sold without a service area. Every other niche is a local service
 * and must name a county or a ZIP before any rows come back.
 */
export const NATIONWIDE_DIGITAL_NICHES = ["creator", "prompt", "music", "studio"] as const;

const NATIONWIDE = new Set<string>(NATIONWIDE_DIGITAL_NICHES);
const NICHE_KEY = /^[a-z0-9][a-z0-9-]{0,79}$/;

export type LeadReach = "local" | "national";
export type LeadSearchMode = "national" | "county" | "zip" | "county-zip";

export type LeadQueryPlan = {
  reach: LeadReach;
  mode: LeadSearchMode;
  niche: string;
  state: string;
  counties: [string, string] | null;
  zipCode: string;
  radiusMiles: number;
  lat: number | null;
  lng: number | null;
  limit: number;
  segment: string;
};

export type PreloadedLeadHit = {
  id: string;
  name: string;
  businessName: string;
  niche: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
  miles: number | null;
  contactEmail: string;
  contactPhone: string;
};

export type PreloadedLeadSearch = {
  reach: LeadReach;
  niche: string;
  segment: string;
  count: number;
  leads: PreloadedLeadHit[];
};

/** Great-circle miles. Same formula as the SQL radius filter. */
export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_MILES * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function leadReachForNiche(niche: string): LeadReach {
  return NATIONWIDE.has(niche) ? "national" : "local";
}

const LEAD_READER_ROLES = new Set(["owner", "employee", "admin", "platform_admin"]);

/** True only for a profiles.role that may read leads. Customer and blank are not. */
export function isLeadReader(role: string | null | undefined): boolean {
  return typeof role === "string" && LEAD_READER_ROLES.has(role);
}

/** Local hits need a measured distance inside the radius. A missing point is out. */
export function leadWithinRadius(miles: number | null, radiusMiles: number): boolean {
  return miles != null && Number.isFinite(miles) && miles >= 0 && miles <= radiusMiles;
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") throw new Error("Lead search is required");
  return input as Record<string, unknown>;
}

function nicheOf(value: unknown): string {
  const niche = String(value ?? "").trim().toLowerCase();
  if (!NICHE_KEY.test(niche)) throw new Error("Niche is required");
  return niche;
}

function reachOf(value: unknown, niche: string): LeadReach {
  if (value == null || value === "") return leadReachForNiche(niche);
  const reach = String(value).trim().toLowerCase();
  if (reach === "local" || reach === "national") return reach;
  throw new Error("Reach must be local or national");
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

/** "Josephine" and "Josephine County" are the same county on the index. */
export function countySpellings(county: string): [string, string] {
  const stripped = county.replace(/\s+county$/i, "").trim();
  const withCounty = /\bcounty$/i.test(county) ? county : `${stripped} County`;
  return [stripped, withCounty];
}

function segmentFor(plan: {
  niche: string;
  mode: LeadSearchMode;
  state: string;
  counties: [string, string] | null;
  zipCode: string;
  radiusMiles: number;
}): string {
  if (plan.mode === "national") return `Active ${plan.niche} leads nationwide`;
  const place =
    plan.mode === "zip"
      ? `ZIP ${plan.zipCode}`
      : plan.mode === "county"
        ? `${plan.counties?.[1]}, ${plan.state}`
        : `${plan.counties?.[1]}, ${plan.state} ${plan.zipCode}`;
  return `Active ${plan.niche} leads within ${plan.radiusMiles} miles of ${place}`;
}

const SESSION_ONLY_KEYS = ["role", "userId", "user_id", "profileRole", "userRole"] as const;

/** Turn a search into the indexed query shape. Does not touch the database. */
export function planLeadSearch(input: unknown): LeadQueryPlan {
  const raw = asRecord(input);
  if (SESSION_ONLY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(raw, key))) {
    throw new Error("Role and user id come from the session");
  }
  const niche = nicheOf(raw.niche);
  const reach = reachOf(raw.reach, niche);
  const limit = limitOf(raw.limit);
  if (reach === "national") {
    return {
      reach,
      mode: "national",
      niche,
      state: "",
      counties: null,
      zipCode: "",
      radiusMiles: 0,
      lat: null,
      lng: null,
      limit,
      segment: segmentFor({ niche, mode: "national", state: "", counties: null, zipCode: "", radiusMiles: 0 }),
    };
  }
  const state = stateOf(raw.state);
  const county = countyOf(raw.county);
  const zipCode = zipOf(raw.zipCode ?? raw.zip);
  const radiusMiles = radiusOf(raw.radiusMiles);
  const point = pointOf(raw.lat, raw.lng);
  if (county && !state) throw new Error("A county search needs a state");
  const hasCounty = Boolean(state && county);
  const hasZip = Boolean(zipCode);
  if (!hasCounty && !hasZip) throw new Error("A local niche needs a state and county, or a ZIP code");
  const counties = hasCounty ? countySpellings(county) : null;
  const mode: LeadSearchMode = hasCounty && hasZip ? "county-zip" : hasCounty ? "county" : "zip";
  return {
    reach,
    mode,
    niche,
    state,
    counties,
    zipCode,
    radiusMiles,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    limit,
    segment: segmentFor({ niche, mode, state, counties, zipCode, radiusMiles }),
  };
}

const DISTANCE = `(${EARTH_MILES} * 2 * asin(least(1.0, sqrt(
      power(sin(radians(m.lat - o.lat) / 2), 2)
      + cos(radians(o.lat)) * cos(radians(m.lat)) * power(sin(radians(m.lng - o.lng) / 2), 2)
    ))))`;

const LOCAL_SELECT = `
    m.id,
    m.business_name,
    m.contact_name,
    m.contact_email,
    m.contact_phone,
    m.niche,
    m.city,
    m.county,
    m.state,
    m.zip_code,
    case
      when m.lat is null or m.lng is null or o.lat is null or o.lng is null then null
      else ${DISTANCE}
    end as miles`;

function localQuery(where: string, originLat: string, originLng: string, radius: string, limit: string): string {
  return `
    with matched as (
      select id, business_name, contact_name, contact_email, contact_phone,
             niche, city, county, state, zip_code, lat, lng
      from preloaded_leads
      where active = true
        and claimed = false
        and ${where}
    ),
    origin as (
      select
        coalesce(${originLat}::float8, avg(lat)) as lat,
        coalesce(${originLng}::float8, avg(lng)) as lng
      from matched
    )
    select ${LOCAL_SELECT}
    from matched m
    cross join origin o
    where m.lat is not null
      and m.lng is not null
      and o.lat is not null
      and o.lng is not null
      and ${DISTANCE} <= ${radius}::float8
    order by miles asc, m.business_name asc
    limit ${limit}::int`;
}

/** Parameterized SQL. Local branches name the composite and ZIP indexes. */
export function leadSearchSql(plan: LeadQueryPlan): { text: string; values: unknown[] } {
  if (plan.mode === "national") {
    return {
      text: `
        select id, business_name, contact_name, contact_email, contact_phone,
               niche, city, county, state, zip_code, null::float8 as miles
        from preloaded_leads
        where active = true
          and claimed = false
          and niche = $1
        order by created_at desc, business_name asc
        limit $2::int`,
      values: [plan.niche, plan.limit],
    };
  }
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
