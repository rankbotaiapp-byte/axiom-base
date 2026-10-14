import { createServerFn } from "@tanstack/react-start";
import { masterAccessMiddleware } from "./master-access.ts";
import type { Sql } from "../db.ts";
import { newId } from "../utils.ts";
import { classifyFiling } from "./directory.ts";
import { isLeadSlug, leadSlugFrom, parsePhoneLine, type PhoneLine } from "./funnel.ts";

/**
 * Rows staged and promoted in one transaction.
 * 1,000 rows × 14 columns stays under Postgres' 65,535-parameter limit.
 */
export const IMPORT_BATCH = 1000;
const INVALID_SAMPLE = 40;

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

export type BulkImportResult = {
  leads: PreparedLead[];
  invalid: { line: number; reason: string }[];
  invalidCount: number;
  merged: number;
  inserted: number;
  updated: number;
  unchanged: number;
};

type HeaderField = "name" | "city" | "county" | "trade" | "email" | "phone" | "website" | "phoneLine";
type WriteShape = "full" | "no-website" | "core";

const HEADER_KEYS: Record<string, HeaderField> = {
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

function headerKey(cell: string): HeaderField | null {
  return HEADER_KEYS[cell.trim().toLowerCase().replace(/[\s_-]+/g, "")] ?? null;
}

type CsvState = {
  row: string[];
  cell: string;
  quoted: boolean;
  /** A closing quote landed at the end of a slice; the next character decides if it was escaped. */
  heldQuote: boolean;
  header: (HeaderField | null)[] | null;
  headed: boolean | null;
  line: number;
  pending: BulkLeadInput[];
  stripBom: boolean;
};

function blankState(): CsvState {
  return {
    row: [],
    cell: "",
    quoted: false,
    heldQuote: false,
    header: null,
    headed: null,
    line: 1,
    pending: [],
    stripBom: true,
  };
}

/**
 * Incremental CSV reader. `push` accepts a slice of a file; a quoted field
 * can span slices. Completed batches leave the reader so a county file is
 * not kept as one array.
 */
export function createLeadCsvReader(size = IMPORT_BATCH) {
  const state = blankState();
  const batchSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : size === Infinity ? Number.POSITIVE_INFINITY : IMPORT_BATCH;
  return {
    push(text: string) {
      return consumeCsv(state, text, batchSize);
    },
    finish() {
      return finishCsv(state, batchSize);
    },
  };
}

/** Quoted CSV, one batch at a time. A header row is used when two or more cells name known columns. */
export function* leadCsvChunks(text: string, size = IMPORT_BATCH): Generator<BulkLeadInput[]> {
  const reader = createLeadCsvReader(size);
  for (const batch of reader.push(text.replace(/^\uFEFF/, "").trim())) yield batch;
  const tail = reader.finish();
  if (tail.length > 0) yield tail;
}

export function parseLeadCsv(text: string): BulkLeadInput[] {
  const rows: BulkLeadInput[] = [];
  for (const chunk of leadCsvChunks(text, Number.POSITIVE_INFINITY)) rows.push(...chunk);
  return rows;
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

/** Stage a batch, promote it into preloaded_leads, then clear the batch. */
export async function upsertPreloadedLeads(leads: PreparedLead[]): Promise<{
  inserted: number;
  updated: number;
  unchanged: number;
}> {
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let shape: WriteShape = "full";
  for (let offset = 0; offset < leads.length; offset += IMPORT_BATCH) {
    const chunk = leads.slice(offset, offset + IMPORT_BATCH);
    const outcome = await stageChunk(chunk, shape);
    shape = outcome.shape;
    inserted += outcome.inserted;
    updated += outcome.updated;
    unchanged += outcome.unchanged;
  }
  return { inserted, updated, unchanged };
}

export const importBulkLeads = createServerFn({ method: "POST" })
  .middleware([masterAccessMiddleware])
  .validator((input: { csv?: string; leads?: BulkLeadInput[] }) => {
    const csv = typeof input?.csv === "string" ? input.csv : "";
    const leads = Array.isArray(input?.leads) ? input.leads : [];
    if (!csv.trim() && leads.length === 0) throw new Error("Add a CSV or a list of businesses");
    return { csv, leads };
  })
  .handler(async ({ data, context }): Promise<BulkImportResult> => {
    const { assertPlatformOwner } = await import("./platform-owner.server.ts");
    const { getSql } = await import("../db.ts");
    await assertPlatformOwner(context.userId);
    const sql = await getSql();
    await sweepOldStaging(sql);
    const totals = emptyResult();
    if (data.csv.trim()) {
      for (const chunk of leadCsvChunks(data.csv)) await takeChunk(chunk, totals);
    }
    for (let offset = 0; offset < data.leads.length; offset += IMPORT_BATCH) {
      await takeChunk(data.leads.slice(offset, offset + IMPORT_BATCH), totals);
    }
    return totals;
  });

export type RegistrySweepBatch = BulkImportResult & {
  nextOffset: number;
  total: number;
  done: boolean;
  county: string;
};

/** Stage one batch of the statewide filing sweep. The caller advances `offset`. */
export const importRegistrySweep = createServerFn({ method: "POST" })
  .middleware([masterAccessMiddleware])
  .validator((input: { offset?: number }) => {
    const offset = Number(input?.offset ?? 0);
    if (!Number.isFinite(offset) || offset < 0) throw new Error("Sweep offset is not usable");
    return { offset: Math.floor(offset) };
  })
  .handler(async ({ data, context }): Promise<RegistrySweepBatch> => {
    const { assertPlatformOwner } = await import("./platform-owner.server.ts");
    await assertPlatformOwner(context.userId);
    return runRegistrySweepBatch(data.offset);
  });

/** One staging batch of the statewide sweep. */
export async function runRegistrySweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { registryCountyAt, registrySweepSlice, registrySweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, registrySweepTotal, registrySweepSlice, registryCountyAt);
}

/** One staging batch of the California hub filings. */
export async function runCaliforniaSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { californiaCountyAt, californiaSweepSlice, californiaSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, californiaSweepTotal, californiaSweepSlice, californiaCountyAt);
}

/** One staging batch of the Pennsylvania hub filings. */
export async function runPennsylvaniaSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { pennsylvaniaCountyAt, pennsylvaniaSweepSlice, pennsylvaniaSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, pennsylvaniaSweepTotal, pennsylvaniaSweepSlice, pennsylvaniaCountyAt);
}

/** One staging batch of the New York registry. */
export async function runNewYorkSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { newYorkCountyAt, newYorkSweepSlice, newYorkSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, newYorkSweepTotal, newYorkSweepSlice, newYorkCountyAt);
}

/** One staging batch of the Texas registry. */
export async function runTexasSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { texasCountyAt, texasSweepSlice, texasSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, texasSweepTotal, texasSweepSlice, texasCountyAt);
}

/** One staging batch of the Florida registry. */
export async function runFloridaSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { floridaCountyAt, floridaSweepSlice, floridaSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, floridaSweepTotal, floridaSweepSlice, floridaCountyAt);
}

/** One staging batch of the Illinois hub filings. */
export async function runIllinoisSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { illinoisCountyAt, illinoisSweepSlice, illinoisSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, illinoisSweepTotal, illinoisSweepSlice, illinoisCountyAt);
}

async function writeSweepBatch(
  offset: number,
  totalFor: () => number,
  sliceFor: (offset: number, limit: number) => BulkLeadInput[],
  countyFor: (offset: number) => string,
): Promise<RegistrySweepBatch> {
  const { getSql } = await import("../db.ts");
  const sql = await getSql();
  await sweepOldStaging(sql);
  const total = totalFor();
  const rows = sliceFor(offset, IMPORT_BATCH);
  const totals = emptyResult();
  await takeChunk(rows, totals);
  const nextOffset = offset + rows.length;
  return {
    ...totals,
    nextOffset,
    total,
    done: nextOffset >= total,
    county: countyFor(offset),
  };
}

function emptyResult(): BulkImportResult {
  return { leads: [], invalid: [], invalidCount: 0, merged: 0, inserted: 0, updated: 0, unchanged: 0 };
}

async function takeChunk(records: BulkLeadInput[], totals: BulkImportResult) {
  if (records.length === 0) return;
  const plan = prepareBulkImport(records);
  totals.merged += plan.merged;
  totals.invalidCount += plan.invalid.length;
  for (const row of plan.invalid) {
    if (totals.invalid.length < INVALID_SAMPLE) totals.invalid.push(row);
  }
  if (plan.leads.length === 0) return;
  const written = await upsertPreloadedLeads(plan.leads);
  totals.inserted += written.inserted;
  totals.updated += written.updated;
  totals.unchanged += written.unchanged;
}

async function sweepOldStaging(sql: Sql) {
  try {
    await sql.query("delete from preloaded_leads_staging where created_at < now() - interval '1 day'");
  } catch (err) {
    if (!missingRelation(err, "preloaded_leads_staging")) throw err;
  }
}

async function stageChunk(
  chunk: PreparedLead[],
  shape: WriteShape,
): Promise<{ inserted: number; updated: number; unchanged: number; shape: WriteShape }> {
  const { withTransaction } = await import("../db.ts");
  const batchId = newId("batch");
  const ids = chunk.map(() => newId("lead"));
  try {
    const counts = await withTransaction(async (tx) => {
      await insertStaging(tx, batchId, chunk, ids);
      const rows = await promoteStaging(tx, batchId, shape);
      await tx.query("delete from preloaded_leads_staging where batch_id = $1", [batchId]);
      return tally(ids, rows, chunk.length);
    });
    return { ...counts, shape };
  } catch (err) {
    if (missingRelation(err, "preloaded_leads_staging")) {
      throw new Error("Lead staging is not ready. Apply the latest database migration, then import again.");
    }
    if (shape === "full" && missingColumn(err, "website")) return stageChunk(chunk, "no-website");
    if (shape !== "core" && (missingColumn(err, "source") || missingColumn(err, "account_mode") || missingColumn(err, "trade_label"))) {
      return stageChunk(chunk, "core");
    }
    throw err;
  }
}

async function insertStaging(sql: Sql, batchId: string, chunk: PreparedLead[], ids: string[]) {
  const columns = [
    "id",
    "batch_id",
    "business_name",
    "trade_type",
    "trade_label",
    "city",
    "county",
    "lead_slug",
    "contact_email",
    "contact_phone",
    "website",
    "has_website",
    "phone_line",
    "source",
  ];
  const width = columns.length;
  const params: unknown[] = [];
  const tuples = chunk.map((lead, index) => {
    const values = [
      ids[index],
      batchId,
      lead.businessName,
      lead.tradeType,
      lead.tradeLabel,
      lead.city,
      lead.county,
      lead.leadSlug,
      lead.contactEmail,
      lead.contactPhone,
      lead.website,
      lead.hasWebsite,
      lead.phoneLine,
      "import",
    ];
    params.push(...values);
    const marks = values.map((_, column) => `$${index * width + column + 1}`);
    return `(${marks.join(", ")})`;
  });
  await sql.query(
    `insert into preloaded_leads_staging (${columns.join(", ")})
     values ${tuples.join(", ")}
     on conflict (batch_id, lead_slug) do update set
       business_name = excluded.business_name,
       trade_type = excluded.trade_type,
       trade_label = excluded.trade_label,
       city = excluded.city,
       county = excluded.county,
       contact_email = excluded.contact_email,
       contact_phone = excluded.contact_phone,
       website = excluded.website,
       has_website = excluded.has_website,
       phone_line = excluded.phone_line,
       source = excluded.source`,
    params,
  );
}

async function promoteStaging(sql: Sql, batchId: string, shape: WriteShape) {
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
  const select = columns.map((column) => (column === "claimed" ? "false" : column)).join(", ");
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
  return sql.query<{ lead_slug: string; id: string }>(
    `insert into preloaded_leads (${columns.join(", ")})
     select ${select}
     from preloaded_leads_staging
     where batch_id = $1
     on conflict (lead_slug) do update set ${assignments.join(", ")}
     where ${guard}
     returning lead_slug, id`,
    [batchId],
  );
}

function tally(ids: string[], rows: { id: string }[], total: number) {
  const fresh = new Set(ids);
  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    if (fresh.has(row.id)) inserted += 1;
    else updated += 1;
  }
  return { inserted, updated, unchanged: total - rows.length };
}

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
    classified = classifyFiling(businessName, trade);
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

function missingColumn(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}

function missingRelation(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_table|relation/i.test(message);
}

function consumeCsv(state: CsvState, text: string, batchSize: number): BulkLeadInput[][] {
  let source = text;
  if (state.stripBom) {
    source = source.replace(/^\uFEFF/, "");
    state.stripBom = false;
  }
  const batches: BulkLeadInput[][] = [];
  if (state.heldQuote) {
    state.heldQuote = false;
    if (source.startsWith('"')) {
      state.cell += '"';
      source = source.slice(1);
    } else state.quoted = false;
  }
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (state.quoted) {
      if (ch === '"') {
        if (i + 1 >= source.length) {
          state.heldQuote = true;
          continue;
        }
        if (source[i + 1] === '"') {
          state.cell += '"';
          i += 1;
        } else state.quoted = false;
      } else state.cell += ch;
      continue;
    }
    if (ch === '"') {
      state.quoted = true;
      continue;
    }
    if (ch === ",") {
      state.row.push(state.cell);
      state.cell = "";
      continue;
    }
    if (ch === "\n") {
      state.row.push(state.cell);
      acceptRow(state, state.row, batches, batchSize);
      state.row = [];
      state.cell = "";
      continue;
    }
    if (ch === "\r") continue;
    state.cell += ch;
  }
  return batches;
}

function finishCsv(state: CsvState, batchSize: number): BulkLeadInput[] {
  if (state.heldQuote) {
    state.heldQuote = false;
    state.quoted = false;
  }
  const batches: BulkLeadInput[][] = [];
  if (state.cell.length > 0 || state.row.length > 0) {
    state.row.push(state.cell);
    acceptRow(state, state.row, batches, batchSize);
    state.row = [];
    state.cell = "";
  }
  if (state.pending.length > 0) {
    const tail = state.pending;
    state.pending = [];
    return batches.flat().concat(tail);
  }
  return batches.flat();
}

function acceptRow(state: CsvState, cells: string[], batches: BulkLeadInput[][], batchSize: number) {
  if (state.headed === null) {
    const header = cells.map(headerKey);
    state.headed = header.filter(Boolean).length >= 2;
    state.header = state.headed ? header : null;
    state.line = state.headed ? 2 : 1;
    if (state.headed) return;
  }
  const line = state.line;
  state.line += 1;
  if (cells.every((cell) => cell.trim() === "")) return;
  const input: BulkLeadInput = { line };
  if (state.headed && state.header) {
    cells.forEach((cell, column) => {
      const key = state.header?.[column];
      if (key) input[key] = cell.trim();
    });
  } else {
    input.name = cells[0]?.trim() ?? "";
    input.city = cells[1]?.trim() ?? "";
    input.county = cells[2]?.trim() ?? "";
    input.trade = cells[3]?.trim() ?? "";
    input.email = cells[4]?.trim() ?? "";
    input.phone = cells[5]?.trim() ?? "";
    input.website = cells[6]?.trim() ?? "";
  }
  state.pending.push(input);
  if (state.pending.length >= batchSize) {
    batches.push(state.pending);
    state.pending = [];
  }
}
