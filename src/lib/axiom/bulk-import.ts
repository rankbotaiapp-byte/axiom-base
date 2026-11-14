import { createServerFn } from "@tanstack/react-start";
import { masterAccessMiddleware } from "./master-access.ts";
import { classifyFiling } from "./directory.ts";
import { isLeadSlug, leadSlugFrom, parsePhoneLine, type PhoneLine } from "./funnel.ts";

/**
 * Rows staged and promoted in one transaction.
 * 1,000 rows × 14 columns stays under Postgres' 65,535-parameter limit.
 */
export const IMPORT_BATCH = 1000;

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
export type WriteShape = "full" | "no-website" | "core";

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

export const importBulkLeads = createServerFn({ method: "POST" })
  .middleware([masterAccessMiddleware])
  .validator((input: { csv?: string; leads?: BulkLeadInput[] }) => {
    const csv = typeof input?.csv === "string" ? input.csv : "";
    const leads = Array.isArray(input?.leads) ? input.leads : [];
    if (!csv.trim() && leads.length === 0) throw new Error("Add a CSV or a list of businesses");
    return { csv, leads };
  })
  .handler(async ({ data, context }) => {
    const { importBulkLeadsForDesk } = await import("./bulk-import.server");
    return importBulkLeadsForDesk(context.userId, data);
  });

/** Stage one batch of the statewide filing sweep. The caller advances `offset`. */
export const importRegistrySweep = createServerFn({ method: "POST" })
  .middleware([masterAccessMiddleware])
  .validator((input: { offset?: number }) => {
    const offset = Number(input?.offset ?? 0);
    if (!Number.isFinite(offset) || offset < 0) throw new Error("Sweep offset is not usable");
    return { offset: Math.floor(offset) };
  })
  .handler(async ({ data, context }) => {
    const { importRegistrySweepForDesk } = await import("./bulk-import.server");
    return importRegistrySweepForDesk(context.userId, data.offset);
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

