import { getSql } from "@/lib/db";
import {
  BUSINESS_PAGE_CAP,
  clampPageLimit,
  decodePageCursor,
  mapBusinessToTemplateBrand,
  normalizeAccent,
  pageWindow,
  parseBusinessRef,
  parseKeyList,
  previewUrlForBusiness,
  slugPrefixBounds,
  type BusinessBrandRecord,
  type BusinessRef,
  type PageOrder,
  type TemplateBrandProps,
} from "./business-brand.ts";
import { sanitizeContactLine } from "./prospect-brand.ts";

/**
 * Business rows are `preloaded_leads`.
 * Lookup uses the primary key (`id`) and `preloaded_leads_slug_idx` (`lead_slug`).
 * There is no logo or accent column on this table, so those fields stay null.
 */

type LeadRow = {
  id: string;
  lead_slug: string;
  business_name: string;
  trade_type: string;
  trade_label: string | null;
  city: string | null;
  county: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

export class BusinessLookupError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type BusinessBrandPayload = BusinessBrandRecord & {
  brand: TemplateBrandProps;
};

export type BusinessPage = {
  businesses: BusinessBrandPayload[];
  nextCursor: string | null;
};

export type PreviewLink = {
  id: string;
  slug: string;
  url: string;
};

export type PreviewLinkPage = {
  links: PreviewLink[];
  nextCursor: string | null;
};

function rowToRecord(row: LeadRow): BusinessBrandRecord {
  const city = sanitizeContactLine(row.city, 80);
  const county = sanitizeContactLine(row.county, 80);
  const category = sanitizeContactLine(row.trade_type, 80);
  const categoryLabel = sanitizeContactLine(row.trade_label, 80);
  return {
    id: row.id,
    slug: row.lead_slug,
    businessName: sanitizeContactLine(row.business_name, 80),
    category,
    categoryLabel,
    city,
    county,
    location: [city, county].filter(Boolean).join(" · "),
    phone: sanitizeContactLine(row.contact_phone, 40),
    email: sanitizeContactLine(row.contact_email, 120),
    contactName: sanitizeContactLine(row.contact_name, 80),
    logoUrl: null,
    accent: normalizeAccent(null),
  };
}

function payload(record: BusinessBrandRecord): BusinessBrandPayload {
  return { ...record, brand: mapBusinessToTemplateBrand(record) };
}

function lookupFailed(err: unknown): never {
  if (err instanceof BusinessLookupError) throw err;
  const message = err instanceof Error ? err.message : "";
  if (
    message === "Unknown business" ||
    message === "Pass a business id or a slug" ||
    message === "Batch must be a list of ids" ||
    message === "Batch must be a list of slugs" ||
    message.startsWith("Batch is capped")
  ) {
    throw new BusinessLookupError(400, message);
  }
  throw new BusinessLookupError(500, "Lookup failed");
}

export async function readBusinessBrand(ref: BusinessRef): Promise<BusinessBrandRecord | null> {
  try {
    const sql = await getSql();
    const rows =
      "id" in ref
        ? await sql<LeadRow>`
            select id, lead_slug, business_name, trade_type, trade_label, city, county,
              contact_name, contact_phone, contact_email
            from preloaded_leads
            where id = ${ref.id}
            limit 1
          `
        : await sql<LeadRow>`
            select id, lead_slug, business_name, trade_type, trade_label, city, county,
              contact_name, contact_phone, contact_email
            from preloaded_leads
            where lead_slug = ${ref.slug}
            limit 1
          `;
    const row = rows[0];
    return row ? rowToRecord(row) : null;
  } catch (err) {
    lookupFailed(err);
  }
}

async function listById(cursor: string, limit: number): Promise<LeadRow[]> {
  const sql = await getSql();
  if (!cursor) {
    return sql<LeadRow>`
      select id, lead_slug, business_name, trade_type, trade_label, city, county,
        contact_name, contact_phone, contact_email
      from preloaded_leads
      order by id
      limit ${limit}
    `;
  }
  return sql<LeadRow>`
    select id, lead_slug, business_name, trade_type, trade_label, city, county,
      contact_name, contact_phone, contact_email
    from preloaded_leads
    where id > ${cursor}
    order by id
    limit ${limit}
  `;
}

async function listBySlug(start: string, end: string, cursor: string, limit: number): Promise<LeadRow[]> {
  const sql = await getSql();
  if (!cursor) {
    return sql<LeadRow>`
      select id, lead_slug, business_name, trade_type, trade_label, city, county,
        contact_name, contact_phone, contact_email
      from preloaded_leads
      where lead_slug >= ${start} and lead_slug < ${end}
      order by lead_slug
      limit ${limit}
    `;
  }
  return sql<LeadRow>`
    select id, lead_slug, business_name, trade_type, trade_label, city, county,
      contact_name, contact_phone, contact_email
    from preloaded_leads
    where lead_slug >= ${start} and lead_slug < ${end} and lead_slug > ${cursor}
    order by lead_slug
    limit ${limit}
  `;
}

async function rowsForKeys(ids: string[], slugs: string[]): Promise<LeadRow[]> {
  const sql = await getSql();
  const byId = new Map<string, LeadRow>();
  if (ids.length > 0) {
    const list = ids.join("|");
    const rows = await sql<LeadRow>`
      select id, lead_slug, business_name, trade_type, trade_label, city, county,
        contact_name, contact_phone, contact_email
      from preloaded_leads
      where id = any(string_to_array(${list}, '|'))
      limit ${BUSINESS_PAGE_CAP}
    `;
    for (const row of rows) byId.set(row.id, row);
  }
  if (slugs.length > 0) {
    const list = slugs.join("|");
    const rows = await sql<LeadRow>`
      select id, lead_slug, business_name, trade_type, trade_label, city, county,
        contact_name, contact_phone, contact_email
      from preloaded_leads
      where lead_slug = any(string_to_array(${list}, '|'))
      limit ${BUSINESS_PAGE_CAP}
    `;
    for (const row of rows) byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export async function listBusinessPage(input: {
  limit?: unknown;
  cursor?: unknown;
  q?: unknown;
}): Promise<BusinessPage> {
  try {
    const limit = clampPageLimit(input.limit);
    const q = String(input.q ?? "").trim().toLowerCase();
    const bounds = q ? slugPrefixBounds(q) : null;
    if (q && !bounds) throw new BusinessLookupError(400, "Search by the start of a business slug");
    const order: PageOrder = bounds ? "slug" : "id";
    const cursorRaw = String(input.cursor ?? "").trim();
    if (cursorRaw && !decodePageCursor(cursorRaw, order)) {
      throw new BusinessLookupError(400, "Page cursor does not match this search");
    }
    const cursor = decodePageCursor(cursorRaw, order) ?? "";
    const fetched = bounds
      ? await listBySlug(bounds.start, bounds.end, cursor, limit + 1)
      : await listById(cursor, limit + 1);
    const window = pageWindow(fetched.map(rowToRecord), limit, order);
    return {
      businesses: window.rows.map(payload),
      nextCursor: window.nextCursor,
    };
  } catch (err) {
    lookupFailed(err);
  }
}

export async function previewLinksForBusinesses(
  origin: string,
  input: { limit?: unknown; cursor?: unknown; q?: unknown; ids?: unknown; slugs?: unknown },
): Promise<PreviewLinkPage> {
  try {
    const ids = parseKeyList(input.ids, "id");
    const slugs = parseKeyList(input.slugs, "slug");
    if (ids.length > 0 || slugs.length > 0) {
      const rows = await rowsForKeys(ids, slugs);
      return {
        links: rows.map((row) => {
          const record = rowToRecord(row);
          return { id: record.id, slug: record.slug, url: previewUrlForBusiness(origin, record) };
        }),
        nextCursor: null,
      };
    }
    const page = await listBusinessPage(input);
    return {
      links: page.businesses.map((record) => ({
        id: record.id,
        slug: record.slug,
        url: previewUrlForBusiness(origin, record),
      })),
      nextCursor: page.nextCursor,
    };
  } catch (err) {
    lookupFailed(err);
  }
}

function readCookie(request: Request, name: string): string {
  const part = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((piece) => piece.trim())
    .find((piece) => piece.startsWith(`${name}=`));
  if (!part) return "";
  const value = part.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Same gate the master desk uses: owner cookie, or a signed-in platform owner. */
export async function assertMasterDesk(request: Request): Promise<void> {
  const origin = request.headers.get("origin");
  if (origin) {
    let same = false;
    try {
      same = new URL(origin).host === new URL(request.url).host;
    } catch {
      same = false;
    }
    if (!same) throw new BusinessLookupError(403, "Forbidden");
  }
  const { verifyMasterPass } = await import("./master-bypass");
  const { bypassSecret } = await import("./master-bypass.server");
  const { MASTER_COOKIE } = await import("./master-owner");
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const { isPlatformOwner } = await import("./platform-owner.server");
  const secret = bypassSecret();
  const token = readCookie(request, MASTER_COOKIE);
  if (secret && token && verifyMasterPass(secret, token, Math.floor(Date.now() / 1000))) return;
  const user = await getSessionUser();
  if (user && (await isPlatformOwner(user.id))) return;
  throw new BusinessLookupError(401, "Unauthorized");
}

function statusFor(err: unknown): { status: number; error: string } {
  if (err instanceof BusinessLookupError) return { status: err.status, error: err.message };
  const message = err instanceof Error ? err.message : "";
  if (message === "Forbidden" || message === "Master admin is not configured") {
    return { status: 403, error: "Forbidden" };
  }
  if (message === "Unauthorized") return { status: 401, error: "Unauthorized" };
  if (message === "Unknown business" || message === "Pass a business id or a slug") {
    return { status: 400, error: message };
  }
  if (message.startsWith("Batch is capped")) return { status: 400, error: message };
  return { status: 500, error: "Lookup failed" };
}

function jsonError(err: unknown): Response {
  const { status, error } = statusFor(err);
  return Response.json({ error }, { status });
}

export async function handleBusinessBrandGet(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id") ?? "";
    const slug = url.searchParams.get("slug") ?? "";
    if (!id && !slug) return Response.json({ error: "Pass a business id or a slug" }, { status: 400 });
    const ref = parseBusinessRef({ id, slug });
    const record = await readBusinessBrand(ref);
    if (!record) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(payload(record));
  } catch (err) {
    return jsonError(err);
  }
}

export async function handleBusinessBrandsGet(request: Request): Promise<Response> {
  try {
    await assertMasterDesk(request);
    const url = new URL(request.url);
    const page = await listBusinessPage({
      limit: url.searchParams.get("limit"),
      cursor: url.searchParams.get("cursor"),
      q: url.searchParams.get("q"),
    });
    return Response.json(page);
  } catch (err) {
    return jsonError(err);
  }
}

export async function handlePreviewLinksPost(request: Request): Promise<Response> {
  try {
    await assertMasterDesk(request);
    let body: { limit?: unknown; cursor?: unknown; q?: unknown; ids?: unknown; slugs?: unknown } = {};
    const text = await request.text();
    if (text.trim()) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new BusinessLookupError(400, "Send a JSON object");
        }
        body = parsed as typeof body;
      } catch (err) {
        if (err instanceof BusinessLookupError) throw err;
        throw new BusinessLookupError(400, "Send a JSON object");
      }
    }
    const page = await previewLinksForBusinesses(new URL(request.url).origin, body);
    return Response.json(page);
  } catch (err) {
    return jsonError(err);
  }
}

export async function listBusinessPageForDesk(
  userId: string,
  input: { limit?: unknown; cursor?: unknown; q?: unknown },
): Promise<BusinessPage> {
  const { assertPlatformOwner } = await import("./platform-owner.server");
  await assertPlatformOwner(userId);
  return listBusinessPage(input);
}

export async function previewLinksForDesk(
  userId: string,
  origin: string,
  input: { limit?: unknown; cursor?: unknown; q?: unknown; ids?: unknown; slugs?: unknown },
): Promise<PreviewLinkPage> {
  const { assertPlatformOwner } = await import("./platform-owner.server");
  await assertPlatformOwner(userId);
  return previewLinksForBusinesses(origin, input);
}
