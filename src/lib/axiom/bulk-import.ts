import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "../auth/middleware.ts";
import type { Sql } from "../db.ts";
import { newId } from "../utils.ts";
import { classifyTrade } from "./directory.ts";
import { isLeadSlug, leadSlugFrom, parsePhoneLine, type PhoneLine } from "./funnel.ts";

const BATCH = 200;
const MAX_ROWS = 5000;
const MAX_CSV_CHARS = 1_500_000;

export type BulkLeadInput = {
  name?: string;
  businessName?: string;
  city?: string;
  county?: string;
  trade?: string;
  niche?: string;
  email?: string;
  phone?: string;
  website?: string;
  phoneLine?: string;
  line?: number;
};

export type PreparedLead = {
  line: number;
  businessName: string;
  tradeType: string;
  tradeLabel: string;
  city: string;
  county: string;
  leadSlug: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
};

export type BulkImportPlan = {
  leads: PreparedLead[];
  invalid: { line: number; reason: string }[];
  merged: number;
};

export type BulkImportResult = BulkImportPlan & {
  inserted: number;
  updated: number;
  unchanged: number;
};

const HEADER_KEYS: Record<string, "name" | "city" | "county" | "trade" | "email" | "phone" | "website" | "phoneLine"> = {
  name: "name",
  business: "name",
  businessname: "name",
  city: "city",
  county: "county",
  trade: "trade",
  niche: "trade",
  tradetype: "trade",
  email: "email",
  contactemail: "email",
  phone: "phone",
  contactphone: "phone",
  telephone: "phone",
  website: "website",
  url: "website",
  site: "website",
  phoneline: "phoneLine",
  line: "phoneLine",
};

function headerKey(cell: string): (typeof HEADER_KEYS)[string] | null {
  return HEADER_KEYS[cell.trim().toLowerCase().replace(/[\s_-]+/g, "")] ?? null;
}

/** Quoted CSV. A header row is used when two or more cells name known columns. */
export function parseLeadCsv(text: string): BulkLeadInput[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, "").trim());
  if (rows.length === 0) return [];
  const header = rows[0].map(headerKey);
  const known = header.filter(Boolean).length;
  if (known >= 2) {
    return rows.slice(1).flatMap((cells, index) => {
      if (cells.every((cell) => cell.trim() === "")) return [];
      const input: BulkLeadInput = { line: index + 2 };
      cells.forEach((cell, column) => {
        const key = header[column];
        if (key) input[key] = cell.trim();
      });
      return [input];
    });
  }
  return rows.flatMap((cells, index) => {
    if (cells.every((cell) => cell.trim() === "")) return [];
    return [{
      line: index + 1,
      name: cells[0]?.trim() ?? "",
      city: cells[1]?.trim() ?? "",
      county: cells[2]?.trim() ?? "",
      trade: cells[3]?.trim() ?? "",
      email: cells[4]?.trim() ?? "",
      phone: cells[5]?.trim() ?? "",
      website: cells[6]?.trim() ?? "",
    }];
  });
}

export function prepareBulkImport(records: BulkLeadInput[]): BulkImportPlan {
  const invalid: BulkImportPlan["invalid"] = [];
  const bySlug = new Map<string, PreparedLead>();
  let merged = 0;
  records.forEach((record, index) => {
    const line = record.line ?? index + 1;
    const prepared = prepareOne(record, line);
    if (!prepared.ok) {
      invalid.push({ line, reason: prepared.reason });
      return;
    }
    const previous = bySlug.get(prepared.lead.leadSlug);
    if (previous) {
      merged += 1;
      bySlug.set(prepared.lead.leadSlug, mergeLead(previous, prepared.lead));
      return;
    }
    bySlug.set(prepared.lead.leadSlug, prepared.lead);
  });
  return { leads: [...bySlug.values()], invalid, merged };
}

/** Insert new slugs. Refresh unclaimed rows. Leave a claimed or live territory as it is. */
export async function upsertPreloadedLeads(sql: Sql, leads: PreparedLead[]): Promise<{
  inserted: number;
  updated: number;
  unchanged: number;
}> {
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let shape: "full" | "no-website" | "core" = "full";
  for (let offset = 0; offset < leads.length; offset += BATCH) {
    const chunk = leads.slice(offset, offset + BATCH);
    const outcome = await writeChunk(sql, chunk, shape);
    shape = outcome.shape;
    inserted += outcome.inserted;
    updated += outcome.updated;
    unchanged += outcome.unchanged;
  }
  return { inserted, updated, unchanged };
}

export const importBulkLeads = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { csv?: string; leads?: BulkLeadInput[] }) => {
    const csv = typeof input?.csv === "string" ? input.csv : "";
    const leads = Array.isArray(input?.leads) ? input.leads : [];
    if (!csv.trim() && leads.length === 0) throw new Error("Add a CSV or a list of businesses");
    if (csv.length > MAX_CSV_CHARS) throw new Error("CSV is too large");
    if (leads.length > MAX_ROWS) throw new Error("Import up to 5000 businesses at a time");
    return { csv, leads };
  })
  .handler(async ({ data, context }): Promise<BulkImportResult> => {
    const { assertPlatformOwner } = await import("./platform-owner.server.ts");
    const { getSql } = await import("../db.ts");
    await assertPlatformOwner(context.userId);
    const fromCsv = data.csv.trim() ? parseLeadCsv(data.csv) : [];
    if (fromCsv.length + data.leads.length > MAX_ROWS) throw new Error("Import up to 5000 businesses at a time");
    const plan = prepareBulkImport([...fromCsv, ...data.leads]);
    const sql = await getSql();
    const written = await upsertPreloadedLeads(sql, plan.leads);
    return { ...plan, ...written };
  });

function prepareOne(record: BulkLeadInput, line: number): { ok: true; lead: PreparedLead } | { ok: false; reason: string } {
  const businessName = text(record.businessName || record.name, 80);
  const city = text(record.city, 80);
  const county = text(record.county, 80) || city;
  const trade = text(record.trade || record.niche, 80);
  if (businessName.length < 2) return { ok: false, reason: "Business name is required" };
  if (city.length < 2) return { ok: false, reason: "City is required" };
  if (trade.length < 2) return { ok: false, reason: "Trade is required" };
  let classified: { tradeType: string; tradeLabel: string };
  try {
    classified = classifyTrade(trade);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Trade is required" };
  }
  const email = text(record.email, 120).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: "Email is not usable" };
  const phone = text(record.phone, 40);
  if (phone && phone.replace(/\D/g, "").length < 7) return { ok: false, reason: "Phone is not usable" };
  let phoneLine: PhoneLine = "";
  if (record.phoneLine?.trim()) {
    try {
      phoneLine = parsePhoneLine(record.phoneLine);
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : "Phone line must be mobile or landline" };
    }
  }
  const site = readWebsite(record.website ?? "");
  if (!site.ok) return { ok: false, reason: site.reason };
  const leadSlug = leadSlugFrom(businessName, city);
  if (!isLeadSlug(leadSlug)) return { ok: false, reason: "Business name did not make a usable slug" };
  return {
    ok: true,
    lead: {
      line,
      businessName,
      tradeType: classified.tradeType,
      tradeLabel: classified.tradeLabel,
      city,
      county,
      leadSlug,
      contactEmail: email,
      contactPhone: phone,
      website: site.website,
      hasWebsite: site.hasWebsite,
      phoneLine,
    },
  };
}

function mergeLead(previous: PreparedLead, next: PreparedLead): PreparedLead {
  const cleared = next.hasWebsite === false && !next.website;
  const website = cleared ? "" : next.website || previous.website;
  return {
    ...next,
    contactEmail: next.contactEmail || previous.contactEmail,
    contactPhone: next.contactPhone || previous.contactPhone,
    phoneLine: next.phoneLine || previous.phoneLine,
    website,
    hasWebsite: cleared ? false : website ? true : next.hasWebsite ?? previous.hasWebsite,
  };
}

function readWebsite(raw: string): { ok: true; website: string; hasWebsite: boolean | null } | { ok: false; reason: string } {
  const value = raw.trim().slice(0, 200);
  if (!value || value.toLowerCase() === "unknown") return { ok: true, website: "", hasWebsite: null };
  const lower = value.toLowerCase();
  if (lower === "no" || lower === "false" || lower === "none") return { ok: true, website: "", hasWebsite: false };
  if (lower === "yes" || lower === "true" || lower === "y") return { ok: true, website: "", hasWebsite: true };
  if (/^(javascript|data):/i.test(value)) return { ok: false, reason: "Website is not usable" };
  return { ok: true, website: value, hasWebsite: true };
}

function text(value: string | undefined, max: number): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

async function writeChunk(
  sql: Sql,
  chunk: PreparedLead[],
  shape: "full" | "no-website" | "core",
): Promise<{ inserted: number; updated: number; unchanged: number; shape: "full" | "no-website" | "core" }> {
  try {
    return { ...(await insertChunk(sql, chunk, shape)), shape };
  } catch (err) {
    if (shape === "full" && missingColumn(err, "website")) return writeChunk(sql, chunk, "no-website");
    if (shape !== "core" && (missingColumn(err, "source") || missingColumn(err, "account_mode") || missingColumn(err, "trade_label"))) {
      return writeChunk(sql, chunk, "core");
    }
    throw err;
  }
}

async function insertChunk(
  sql: Sql,
  chunk: PreparedLead[],
  shape: "full" | "no-website" | "core",
): Promise<{ inserted: number; updated: number; unchanged: number }> {
  const ids = chunk.map(() => newId("lead"));
  const rich = shape !== "core";
  const columns = [
    "id",
    "business_name",
    "trade_type",
    ...(rich ? ["trade_label"] : []),
    "city",
    "county",
    "lead_slug",
    "claimed",
    "contact_email",
    "contact_phone",
    "has_website",
    "phone_line",
    ...(rich ? ["source"] : []),
    ...(shape === "full" ? ["website"] : []),
  ];
  const width = columns.length;
  const params: unknown[] = [];
  const tuples = chunk.map((lead, index) => {
    const values = [
      ids[index],
      lead.businessName,
      lead.tradeType,
      ...(rich ? [lead.tradeLabel] : []),
      lead.city,
      lead.county,
      lead.leadSlug,
      false,
      lead.contactEmail,
      lead.contactPhone,
      lead.hasWebsite,
      lead.phoneLine,
      ...(rich ? ["import"] : []),
      ...(shape === "full" ? [lead.website] : []),
    ];
    params.push(...values);
    const marks = values.map((_, column) => `$${index * width + column + 1}`);
    return `(${marks.join(", ")})`;
  });
  const assignments = [
    "business_name = excluded.business_name",
    "trade_type = excluded.trade_type",
    ...(rich ? ["trade_label = excluded.trade_label"] : []),
    "city = excluded.city",
    "county = excluded.county",
    "contact_email = case when excluded.contact_email <> '' then excluded.contact_email else preloaded_leads.contact_email end",
    "contact_phone = case when excluded.contact_phone <> '' then excluded.contact_phone else preloaded_leads.contact_phone end",
    "has_website = coalesce(excluded.has_website, preloaded_leads.has_website)",
    "phone_line = case when excluded.phone_line <> '' then excluded.phone_line else preloaded_leads.phone_line end",
    ...(shape === "full"
      ? ["website = case when excluded.website <> '' then excluded.website else preloaded_leads.website end"]
      : []),
  ];
  const guard = shape === "core"
    ? "preloaded_leads.claimed = false"
    : "preloaded_leads.claimed = false and preloaded_leads.account_mode is distinct from 'live'";
  const rows = await sql.query<{ lead_slug: string; id: string }>(
    `insert into preloaded_leads (${columns.join(", ")})
     values ${tuples.join(", ")}
     on conflict (lead_slug) do update set ${assignments.join(", ")}
     where ${guard}
     returning lead_slug, id`,
    params,
  );
  const fresh = new Set(ids);
  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    if (fresh.has(row.id)) inserted += 1;
    else updated += 1;
  }
  return { inserted, updated, unchanged: chunk.length - rows.length };
}

function missingColumn(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}

function parseCsv(text: string): string[][] {
  if (!text) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
