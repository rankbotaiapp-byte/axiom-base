import { AutopilotError } from "@/lib/axiom/autopilot.server";
import { PLUMBING_LEAD_DATASET_SIZE } from "@/lib/axiom/outreach-niche-batch";
import {
  ENGINE_BATCH_TIMEOUT_MS,
  ENGINE_MICRO_CHUNK,
  ENGINE_ROUTE_TIMEOUT_MS,
  EngineBatchTimeoutError,
  chunkArray,
  coerceEngineBatch,
  emptyEngineBatch,
  engineErrorMessage,
  parseEnginePaging,
  withBatchTimeout,
  type EngineBatchError,
  type EngineBatchResult,
} from "@/lib/axiom/outbound-engine";
import { decorateLiveDeskPayload, liveDeskState } from "@/lib/axiom/live-desk-state";

type JsonBody = Record<string, unknown>;

type BatchResponse = {
  processed: number;
  queued: number;
  failed: number;
  remaining: number;
  hasMore: boolean;
  nextOffset: number;
  errors: Array<{ id: string; message: string }>;
  elapsedMs: number;
};

const DISPATCH_ACTIONS = new Set(["dispatch_today", "send_outreach", "send_trickle", "batch"]);

function publicErrors(errors: EngineBatchError[]): Array<{ id: string; message: string }> {
  return errors.map((item) => ({
    id: item.id || item.rowId,
    message: item.message,
  }));
}

function logRouteError(err: unknown, extra: JsonBody = {}) {
  const error = err instanceof Error ? err : new Error(engineErrorMessage(err));
  const failingRowIds =
    err && typeof err === "object" && "failingRowIds" in err
      ? (err as { failingRowIds?: string[] }).failingRowIds
      : extra.failingRowIds;
  console.error("[Outbound Engine Fatal Error]", {
    message: error.message,
    stack: error.stack,
    failingRowIds,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

async function logFailureChunks(errors: EngineBatchError[]) {
  for (const chunk of chunkArray(errors, ENGINE_MICRO_CHUNK)) {
    await Promise.allSettled(
      chunk.map(async (item) => {
        console.error(`[Outbound Engine] Row Failure [ID: ${item.id || item.rowId}]`, {
          rowId: item.rowId || item.id,
          message: item.message,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }
}

function toBatchResponse(batch: EngineBatchResult, elapsedMs: number): BatchResponse {
  return {
    processed: batch.processed,
    queued: batch.queued,
    failed: batch.failed,
    remaining: batch.remaining,
    hasMore: batch.hasMore,
    nextOffset: batch.nextOffset,
    errors: publicErrors(batch.errors),
    elapsedMs,
  };
}

function jsonWithBatch(
  batch: EngineBatchResult,
  extra: JsonBody,
  elapsedMs: number,
  status = 200,
): Response {
  const payload = toBatchResponse(batch, elapsedMs);
  return Response.json(
    decorateLiveDeskPayload({
      ...extra,
      ...payload,
      ok: batch.ok,
      dispatch: { ...batch, errors: payload.errors },
      state: extra.state ?? liveDeskState(),
    }),
    { status },
  );
}

function fail(err: unknown, extra: JsonBody = {}, elapsedMs = 0): Response {
  logRouteError(err, extra);
  const offset = Number(extra.offset ?? extra.nextOffset ?? 0) || 0;
  const batch = coerceEngineBatch(extra, emptyEngineBatch(offset));
  batch.ok = false;
  if (batch.failed === 0) batch.failed = 1;
  if (batch.errors.length === 0) {
    const message = engineErrorMessage(err);
    batch.errors = [{ id: "batch", rowId: "batch", message }];
  }
  if (err instanceof AutopilotError) {
    batch.errors = [{ id: "auth", rowId: "auth", message: err.message }];
    return jsonWithBatch(batch, { error: err.message }, elapsedMs, err.status);
  }
  const message = engineErrorMessage(err, "Internal server error");
  batch.hasMore = true;
  batch.nextOffset = offset;
  const status = err instanceof EngineBatchTimeoutError ? 200 : 500;
  return jsonWithBatch(
    batch,
    { error: "Outbound engine batch execution failed", message },
    elapsedMs,
    status,
  );
}

async function readJsonBody(request: Request): Promise<JsonBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType && !/json/i.test(contentType)) return {};
  try {
    const parsed = (await request.json()) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonBody) : {};
  } catch {
    return {};
  }
}

function shopSlugOf(request: Request, body: JsonBody = {}): string {
  try {
    const fromQuery = new URL(request.url).searchParams.get("shopSlug") || "";
    const fromBody = typeof body.shopSlug === "string" ? body.shopSlug : "";
    return (fromBody || fromQuery).trim().toLowerCase();
  } catch {
    return "";
  }
}

async function withShopTelemetry(snapshot: JsonBody, shopSlug: string): Promise<JsonBody> {
  const decorated = decorateLiveDeskPayload(snapshot);
  if (!shopSlug) return decorated;
  try {
    const { readShopLiveDesk } = await import("@/lib/axiom/live-desk.server");
    const shop = await readShopLiveDesk(shopSlug);
    if (!shop) return decorated;
    return {
      ...decorated,
      shopSlug: shop.shopSlug,
      shopId: shop.shopId,
      state: shop.state,
    };
  } catch {
    return decorated;
  }
}

/** Desk snapshot — never walks the 20,330-row catalog and never sends. */
export async function GET(request: Request): Promise<Response> {
  const started = Date.now();
  const paging = parseEnginePaging(request, {});
  try {
    const { readOutboundEngine } = await import("@/lib/axiom/outbound-engine.server");
    const snapshot = (await withBatchTimeout(
      () => readOutboundEngine(request),
      ENGINE_BATCH_TIMEOUT_MS,
      "GET readOutboundEngine",
    )) as JsonBody & { metrics?: JsonBody; mode?: string };
    const remaining = Math.max(0, PLUMBING_LEAD_DATASET_SIZE - paging.offset);
    return Response.json(
      await withShopTelemetry(
        {
          ...snapshot,
          status: "idle",
          ready: true,
          mode: snapshot.mode === "live" ? "live" : "simulation",
          totalCatalog: PLUMBING_LEAD_DATASET_SIZE,
          currentOffset: paging.offset,
          limit: paging.limit,
          remaining,
          metrics: {
            ...(snapshot.metrics && typeof snapshot.metrics === "object" ? snapshot.metrics : {}),
            totalCatalog: PLUMBING_LEAD_DATASET_SIZE,
          },
          elapsedMs: Date.now() - started,
        },
        shopSlugOf(request),
      ),
    );
  } catch (err) {
    return fail(err, { action: "GET", offset: paging.offset, limit: paging.limit }, Date.now() - started);
  }
}

/**
 * Dispatch one OFFSET/LIMIT page of preloaded_leads.
 * Auth is master-desk cookie or cron Bearer — not a substring check.
 */
export async function POST(request: Request): Promise<Response> {
  const started = Date.now();
  const body = await readJsonBody(request);
  const paging = parseEnginePaging(request, body);
  body.offset = paging.offset;
  body.batchSize = paging.limit;
  body.limit = paging.limit;
  const action = String(body.action ?? "tick");
  try {
    const { runOutboundEngine } = await import("@/lib/axiom/outbound-engine.server");
    const result = (await withBatchTimeout(
      () => runOutboundEngine(request, body),
      ENGINE_ROUTE_TIMEOUT_MS,
      `POST ${action}`,
    )) as JsonBody;
    const desk = await withShopTelemetry(result, shopSlugOf(request, body));
    if (!DISPATCH_ACTIONS.has(action)) return Response.json(desk);
    const batch = coerceEngineBatch(desk, emptyEngineBatch(paging.offset));
    if (batch.errors.length > 0) await logFailureChunks(batch.errors);
    return jsonWithBatch(batch, desk, Date.now() - started);
  } catch (err) {
    return fail(
      err,
      { action, offset: paging.offset, limit: paging.limit, nextOffset: paging.offset },
      Date.now() - started,
    );
  }
}
