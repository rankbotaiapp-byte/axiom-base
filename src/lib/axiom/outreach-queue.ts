export type OutreachMode = "simulation" | "live";

export const DEFAULT_TRICKLE_SECONDS = 45;
export const DEFAULT_CHUNK_SIZE = 5;

/** Anything other than an explicit live value stays in simulation. */
export function parseOutreachMode(value: string | undefined | null): OutreachMode {
  return value?.trim().toLowerCase() === "live" ? "live" : "simulation";
}

/** Configurable gap between chunks. Values outside 30–60 seconds clamp into that range. */
export function parseTrickleSeconds(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_TRICKLE_SECONDS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_TRICKLE_SECONDS;
  return Math.min(60, Math.max(30, Math.round(n)));
}

/** Leads released together. Defaults to 5, and stays between 1 and 20. */
export function parseChunkSize(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_CHUNK_SIZE;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_CHUNK_SIZE;
  return Math.min(20, Math.max(1, Math.round(n)));
}

export type TrickleChunk<T> = {
  index: number;
  items: T[];
  scheduledAt: string;
};

/**
 * Chunk 0 is due at `start`. Each later chunk waits `intervalSeconds`.
 * An empty list produces no chunks, so a launch with nobody to contact queues nothing.
 */
export function planTrickleChunks<T>(
  items: T[],
  options: { chunkSize: number; intervalSeconds: number; start: Date },
): TrickleChunk<T>[] {
  const size = Math.max(1, Math.floor(options.chunkSize));
  const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1000;
  const chunks: TrickleChunk<T>[] = [];
  for (let offset = 0; offset < items.length; offset += size) {
    const index = chunks.length;
    chunks.push({
      index,
      items: items.slice(offset, offset + size),
      scheduledAt: new Date(options.start.getTime() + index * intervalMs).toISOString(),
    });
  }
  return chunks;
}

/** A later chunk may leave the queue only after the previous release has aged a full interval. */
export function trickleMayRelease(lastSentAt: string | null, now: Date, intervalSeconds: number): boolean {
  if (!lastSentAt) return true;
  const then = new Date(lastSentAt).getTime();
  if (!Number.isFinite(then)) return true;
  return now.getTime() - then >= intervalSeconds * 1000;
}

/** Simulation never calls a provider. Live is the only mode allowed to. */
export function outreachMayCallProviders(mode: OutreachMode): boolean {
  return mode === "live";
}
