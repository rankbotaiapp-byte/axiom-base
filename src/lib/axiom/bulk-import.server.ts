import { newId } from "../utils.ts";
import type { Sql } from "../db.ts";
import {
  IMPORT_BATCH,
  leadCsvChunks,
  prepareBulkImport,
  type BulkImportResult,
  type BulkLeadInput,
  type PreparedLead,
  type WriteShape,
} from "./bulk-import.ts";

const INVALID_SAMPLE = 40;

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

export async function importBulkLeadsForDesk(
  userId: string,
  data: { csv: string; leads: BulkLeadInput[] },
): Promise<BulkImportResult> {
  const { assertPlatformOwner } = await import("./platform-owner.server.ts");
  const { getSql } = await import("../db.ts");
  await assertPlatformOwner(userId);
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
}

export type RegistrySweepBatch = BulkImportResult & {
  nextOffset: number;
  total: number;
  done: boolean;
  county: string;
};

/** Stage one batch of the statewide filing sweep. The caller advances `offset`. */
export async function importRegistrySweepForDesk(userId: string, offset: number): Promise<RegistrySweepBatch> {
  const { assertPlatformOwner } = await import("./platform-owner.server.ts");
  await assertPlatformOwner(userId);
  return runRegistrySweepBatch(offset);
}

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

/** Late niches for the Oregon list and the Texas and Florida hubs. */
export async function runSupplementSweepBatch(offset: number): Promise<RegistrySweepBatch> {
  const { supplementCountyAt, supplementSweepSlice, supplementSweepTotal } = await import("./registry-sweep.ts");
  return writeSweepBatch(offset, supplementSweepTotal, supplementSweepSlice, supplementCountyAt);
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

function missingColumn(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_column|column/i.test(message);
}

function missingRelation(err: unknown, name: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.toLowerCase().includes(name.toLowerCase()) && /does not exist|undefined_table|relation/i.test(message);
}

