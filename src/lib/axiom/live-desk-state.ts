/** Live desk telemetry contract. Caps and sent counts are always live DB values. */

export type LiveDeskState = {
  paused: boolean;
  caps: number;
  sentToday: number;
};

export type LiveDeskEngine = {
  paused: boolean;
  strategyId?: string;
  smsDailyCap: number;
  emailDailyCap: number;
  smsSentToday: number;
  emailSentToday: number;
  smsTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  cronEnabled?: boolean;
  activeNiche?: string;
};

function num(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/** Build `{ paused, caps, sentToday }` from engine rows — never hardcoded catalog mocks. */
export function liveDeskState(input: {
  paused?: unknown;
  caps?: unknown;
  sentToday?: unknown;
  smsDailyCap?: unknown;
  emailDailyCap?: unknown;
  smsSentToday?: unknown;
  emailSentToday?: unknown;
} = {}): LiveDeskState {
  const smsCap = num(input.smsDailyCap);
  const emailCap = num(input.emailDailyCap);
  const smsSent = num(input.smsSentToday);
  const emailSent = num(input.emailSentToday);
  return {
    paused: input.paused === true,
    caps: num(input.caps) || smsCap + emailCap,
    sentToday: num(input.sentToday) || smsSent + emailSent,
  };
}

export function isLiveDeskState(value: unknown): value is LiveDeskState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.paused === "boolean" && typeof row.caps === "number" && typeof row.sentToday === "number";
}

type JsonBody = Record<string, unknown>;

function asObject(value: unknown): JsonBody {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonBody) : {};
}

/**
 * Desk payloads keep `state` as the three live KPIs and park operational
 * engine fields on `engine` so GET never returns `state: "ready"` or mock caps.
 */
export function decorateLiveDeskPayload(snapshot: JsonBody): JsonBody {
  const previousState = asObject(snapshot.state);
  const engineSource = Object.keys(asObject(snapshot.engine)).length
    ? asObject(snapshot.engine)
    : previousState;
  const metrics = asObject(snapshot.metrics);
  const engine: JsonBody = {
    ...engineSource,
    paused: engineSource.paused === true,
    smsDailyCap: num(engineSource.smsDailyCap ?? metrics.smsDailyCap),
    emailDailyCap: num(engineSource.emailDailyCap ?? metrics.emailDailyCap),
    smsSentToday: num(engineSource.smsSentToday ?? metrics.smsSentToday),
    emailSentToday: num(engineSource.emailSentToday ?? metrics.emailSentToday),
  };
  return {
    ...snapshot,
    engine,
    state: liveDeskState({
      paused: engine.paused,
      smsDailyCap: engine.smsDailyCap,
      emailDailyCap: engine.emailDailyCap,
      smsSentToday: engine.smsSentToday,
      emailSentToday: engine.emailSentToday,
      caps: previousState.caps,
      sentToday: previousState.sentToday,
    }),
  };
}
