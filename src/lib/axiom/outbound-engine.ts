import { MASTER_FUNNELS, masterFunnel, type MasterFunnelId } from "./funnel.ts";

export const DEFAULT_SMS_DAILY_CAP = 40;
export const DEFAULT_EMAIL_DAILY_CAP = 80;
export const ENGINE_TICK_SIZE = 5;
/** One HTTP execution never loads the full 20,330 plumbing catalog. */
export const ENGINE_DATASET_BATCH_SIZE = 100;
export const ENGINE_DATASET_BATCH_MAX = 250;
export const ENGINE_BATCH_TIMEOUT_MS = 12_000;
export const ENGINE_ROUTE_TIMEOUT_MS = 20_000;
export const ENGINE_RECORD_TIMEOUT_MS = 5_000;
export const ENGINE_PROVIDER_TIMEOUT_MS = 4_000;
export const ENGINE_SNAPSHOT_TIMEOUT_MS = 5_000;
/** Parallel log/enqueue fan-out inside one page — never the full catalog. */
export const ENGINE_MICRO_CHUNK = 10;
export const ENGINE_ENQUEUE_CHUNK = 25;

export type EngineBatchError = { id: string; rowId: string; message: string };

export type EngineBatchResult = {
  ok: boolean;
  processed: number;
  queued: number;
  failed: number;
  remaining: number;
  hasMore: boolean;
  nextOffset: number;
  errors: EngineBatchError[];
  niche: string;
};

export class EngineBatchTimeoutError extends Error {
  readonly label: string;
  readonly timeoutMs: number;
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "EngineBatchTimeoutError";
    this.label = label;
    this.timeoutMs = timeoutMs;
  }
}

export function parseDatasetOffset(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function parseDatasetBatchSize(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return ENGINE_DATASET_BATCH_SIZE;
  return Math.min(ENGINE_DATASET_BATCH_MAX, Math.max(1, Math.round(n)));
}

export function parseEnginePaging(request: Request, body: Record<string, unknown> = {}) {
  let search: URLSearchParams;
  try {
    search = new URL(request.url).searchParams;
  } catch {
    search = new URLSearchParams();
  }
  const offset = parseDatasetOffset(body.offset ?? search.get("offset"));
  const limit = parseDatasetBatchSize(
    body.limit ?? body.batchSize ?? search.get("limit") ?? search.get("batchSize"),
  );
  return { offset, limit, range: engineSupabaseRange(offset, limit) };
}

/** Inclusive PostgREST/Supabase `.range(from, to)` window for one execution batch. */
export function engineSupabaseRange(offset: unknown, batchSize: unknown): { from: number; to: number } {
  const from = parseDatasetOffset(offset);
  const size = parseDatasetBatchSize(batchSize);
  return { from, to: from + size - 1 };
}

export function engineBatchHasMore(fetched: number, batchSize: number): boolean {
  return fetched > parseDatasetBatchSize(batchSize);
}

export async function withBatchTimeout<T>(
  work: Promise<T> | (() => Promise<T>),
  ms: number,
  label: string,
): Promise<T> {
  const timeoutMs = Math.max(1, Math.floor(ms));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new EngineBatchTimeoutError(label, timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([typeof work === "function" ? work() : work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function emptyEngineBatch(offset = 0, niche = "plumbing"): EngineBatchResult {
  return {
    ok: true,
    processed: 0,
    queued: 0,
    failed: 0,
    remaining: 0,
    hasMore: false,
    nextOffset: parseDatasetOffset(offset),
    errors: [],
    niche,
  };
}

export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const n = Math.max(1, Math.floor(size) || 1);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n));
  return out;
}

export function pickEngineChannel(input: {
  canSms: boolean;
  canEmail: boolean;
  smsRemaining: number;
  emailRemaining: number;
}): "sms" | "email" | null {
  const sms = input.canSms && input.smsRemaining > 0;
  const email = input.canEmail && input.emailRemaining > 0;
  if (!sms && !email) return null;
  if (sms && (!email || input.smsRemaining >= input.emailRemaining)) return "sms";
  return "email";
}

export function engineErrorMessage(err: unknown, fallback = "row failed"): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim().slice(0, 240);
  if (typeof err === "string" && err.trim()) return err.trim().slice(0, 240);
  return fallback;
}

export function engineRowError(id: string, err: unknown): EngineBatchError {
  return { id, rowId: id, message: engineErrorMessage(err) };
}

/**
 * Cursor math for one execution page. `visited` is every row we finished
 * considering (queued, skipped, or failed) so a bad row never stalls nextOffset.
 */
export function aggregateEngineBatch(input: {
  offset: number;
  batchSize: number;
  catalogSize: number;
  fetched: number;
  visited: number;
  queued: number;
  failed: number;
  errors?: EngineBatchError[];
  niche?: string;
}): EngineBatchResult {
  const offset = parseDatasetOffset(input.offset);
  const batchSize = parseDatasetBatchSize(input.batchSize);
  const visited = Math.max(0, Math.floor(input.visited) || 0);
  const queued = Math.max(0, Math.floor(input.queued) || 0);
  const failed = Math.max(0, Math.floor(input.failed) || 0);
  const fetched = Math.max(0, Math.floor(input.fetched) || 0);
  const page = Math.min(fetched, batchSize);
  const nextOffset = offset + visited;
  const hasMore = fetched > batchSize || visited < page;
  return {
    ok: failed === 0,
    processed: visited,
    queued,
    failed,
    remaining: Math.max(0, Math.floor(input.catalogSize) - nextOffset),
    hasMore,
    nextOffset,
    errors: (input.errors ?? []).map((item) => ({
      id: item.id || item.rowId,
      rowId: item.rowId || item.id,
      message: item.message,
    })),
    niche: input.niche ?? "plumbing",
  };
}

export function coerceEngineBatch(value: unknown, fallback: EngineBatchResult = emptyEngineBatch()): EngineBatchResult {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const src =
    row.dispatch && typeof row.dispatch === "object"
      ? { ...fallback, ...row, ...(row.dispatch as Record<string, unknown>) }
      : { ...fallback, ...row };
  const errors = (Array.isArray(src.errors) ? (src.errors as EngineBatchError[]) : fallback.errors).map((item) => ({
    id: item.id || item.rowId,
    rowId: item.rowId || item.id,
    message: item.message,
  }));
  const failed = Math.max(0, Math.floor(Number(src.failed ?? errors.length)) || 0);
  return {
    ok: src.ok !== false && failed === 0,
    processed: Math.max(0, Math.floor(Number(src.processed ?? fallback.processed)) || 0),
    queued: Math.max(0, Math.floor(Number(src.queued ?? fallback.queued)) || 0),
    failed,
    remaining: Math.max(0, Math.floor(Number(src.remaining ?? fallback.remaining)) || 0),
    hasMore: Boolean(src.hasMore ?? fallback.hasMore),
    nextOffset: parseDatasetOffset(src.nextOffset ?? fallback.nextOffset),
    errors,
    niche: typeof src.niche === "string" && src.niche ? src.niche : fallback.niche,
  };
}

export const ENGINE_REGIONS = ["Oregon", "Texas", "Florida"] as const;

export type OutboundEngineState = {
  paused: boolean;
  strategyId: MasterFunnelId;
  smsDailyCap: number;
  emailDailyCap: number;
  smsTemplate: string;
  emailSubject: string;
  emailBody: string;
  /** Catalog niche currently being trickled (empty = pick next in sequence). */
  activeNiche: string;
  /** When false, cron ticks hold — only manual Dispatch releases today's batch. */
  cronEnabled: boolean;
  /** Pacific YYYY-MM-DD the day-by-day slate began (Day 1 = Plumbing). */
  scheduleStartedOn: string;
};

export type OutboundEngineMetrics = {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  clicks: number;
  onboarded: number;
  deliveryRate: number;
  ctr: number;
  smsSentToday: number;
  emailSentToday: number;
  smsRemaining: number;
  emailRemaining: number;
};

export function clampDailyCap(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(500, Math.max(0, Math.round(n)));
}

export function remainingCap(sent: number, cap: number): number {
  return Math.max(0, cap - Math.max(0, sent));
}

export function throttleCount(want: number, remaining: number): number {
  return Math.max(0, Math.min(Math.floor(want), remaining));
}

/** Engine ticks never call Twilio or Resend. Live sends only go through the outreach drain. */
export function engineTickLine(input: {
  live: boolean;
  channel: "sms" | "email";
  business: string;
}): { status: "logged" | "queued"; summary: string } {
  if (input.live) {
    return { status: "queued", summary: `${input.channel} queued · ${input.business}` };
  }
  return { status: "logged", summary: `${input.channel} simulation · ${input.business}` };
}


export function deliveryRate(sent: number, failed: number): number {
  const total = sent + failed;
  if (total <= 0) return 0;
  return sent / total;
}

export function clickThroughRate(clicks: number, sent: number): number {
  if (sent <= 0) return 0;
  return Math.min(1, clicks / sent);
}

export function parseEngineStrategy(id: string | null | undefined): MasterFunnelId {
  return masterFunnel(id ?? "").id;
}

export function defaultEngineState(): OutboundEngineState {
  const funnel = MASTER_FUNNELS[0];
  return {
    paused: true,
    strategyId: funnel.id,
    smsDailyCap: DEFAULT_SMS_DAILY_CAP,
    emailDailyCap: DEFAULT_EMAIL_DAILY_CAP,
    smsTemplate: funnel.text,
    emailSubject: funnel.emailSubject,
    emailBody: funnel.emailBody,
    activeNiche: "plumbing",
    cronEnabled: true,
    scheduleStartedOn: "",
  };
}

export function regionForCounty(county: string): (typeof ENGINE_REGIONS)[number] | "Other" {
  const hay = county.toLowerCase();
  if (hay.includes("oregon") || hay.includes("jackson") || hay.includes("josephine") || hay.includes("douglas")) {
    return "Oregon";
  }
  if (hay.includes("texas") || hay.includes("travis") || hay.includes("harris") || hay.includes("dallas")) {
    return "Texas";
  }
  if (hay.includes("florida") || hay.includes("miami") || hay.includes("orange") || hay.includes("hillsborough")) {
    return "Florida";
  }
  return "Other";
}
