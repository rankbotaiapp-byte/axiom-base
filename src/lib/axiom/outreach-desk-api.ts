import { masterDeskError, masterDeskFetch } from "./master-desk-client";
import type { CommandLeadFilter, CommandLeadNiche } from "./lead-verification";
import type { DatasetBatchRow, DatasetInspectorFilter, DatasetLeadRecord } from "./outreach-desk";

export type InspectorPage = {
  lead: DatasetLeadRecord | null;
  index: number;
  total: number;
  batchId: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await masterDeskError(res));
  return (await res.json()) as T;
}

export async function fetchDatasetBatches(): Promise<DatasetBatchRow[]> {
  const res = await masterDeskFetch("/api/master/outreach-desk?view=batches");
  const json = await readJson<{ batches: DatasetBatchRow[] }>(res);
  return json.batches ?? [];
}

export async function fetchInspectorLead(
  input: { batchId?: string; leadId?: string; index?: number } & DatasetInspectorFilter,
): Promise<InspectorPage> {
  const query = new URLSearchParams();
  query.set("view", "lead");
  if (input.batchId) query.set("batchId", input.batchId);
  if (input.leadId) query.set("leadId", input.leadId);
  if (typeof input.index === "number") query.set("index", String(input.index));
  if (input.hasPhone) query.set("hasPhone", "1");
  if (input.hasDatasetImages) query.set("hasDatasetImages", "1");
  if (input.unverified) query.set("unverified", "1");
  const res = await masterDeskFetch(`/api/master/outreach-desk?${query.toString()}`);
  return readJson<InspectorPage>(res);
}

export async function saveInspectorPhone(leadId: string, phone: string): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "save-phone", leadId, phone }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function uploadInspectorImage(leadId: string, imageUrl: string): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "upload-image", leadId, imageUrl }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function recreateInspectorHero(leadId: string, imageUrl?: string): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "recreate-hero", leadId, imageUrl }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function fetchCommandLeads(
  filter: CommandLeadFilter,
  limit = 40,
  opts: { niche?: CommandLeadNiche; search?: string } = {},
): Promise<DatasetLeadRecord[]> {
  const query = new URLSearchParams({ view: "command", filter, limit: String(limit), niche: opts.niche ?? "plumbing" });
  if (opts.search?.trim()) query.set("q", opts.search.trim());
  const res = await masterDeskFetch(`/api/master/outreach-desk?${query.toString()}`);
  const json = await readJson<{ leads: DatasetLeadRecord[] }>(res);
  return json.leads ?? [];
}

export async function saveLeadIdentityFields(
  leadId: string,
  patch: { businessName?: string; city?: string; phone?: string },
): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "save-identity", leadId, ...patch }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function saveLeadQa(leadId: string, qaApproved: boolean): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "save-qa", leadId, qaApproved }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function verifyMasterLead(leadId: string, opts?: { useCallerName?: boolean }): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/verify-lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leadId, useCallerName: opts?.useCallerName === true }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export async function verifyMasterLeadBatch(batchIds: string[]): Promise<DatasetLeadRecord[]> {
  const res = await masterDeskFetch("/api/master/verify-lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ batchIds }),
  });
  const json = await readJson<{ leads: DatasetLeadRecord[] }>(res);
  return json.leads ?? [];
}

export async function compileMasterHero(
  leadId: string,
  imageUrl?: string,
  meta?: { shopName?: string; city?: string; niche?: string },
): Promise<DatasetLeadRecord> {
  const res = await masterDeskFetch("/api/master/hero-studio/compile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leadId, imageUrl, ...meta }),
  });
  const json = await readJson<{ lead: DatasetLeadRecord }>(res);
  return json.lead;
}

export type PrimeBatchResult = {
  selected: DatasetLeadRecord[];
  heroes: DatasetLeadRecord[];
  fallbacks: DatasetLeadRecord[];
  queued: number;
  skippedOutreach: Array<{ id: string; reason: string }>;
  mode: "simulation" | "live";
  errors: Array<{ id: string; error: string }>;
};

export async function pullPrimeConversionBatch(input: {
  niche?: CommandLeadNiche;
  limit?: number;
  leadIds?: string[];
  compileHero?: boolean;
  assignFallback?: boolean;
  queueOutreach?: boolean;
}): Promise<PrimeBatchResult> {
  const res = await masterDeskFetch("/api/master/outreach-desk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "prime-batch", ...input }),
  });
  return readJson<PrimeBatchResult>(res);
}
