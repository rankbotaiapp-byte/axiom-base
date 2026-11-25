export const DESK_CHECK_BUDGET_MS = 6_000;
export const DESK_CHECK_TIMEOUT_CODE = "DESK_CHECK_TIMEOUT";
export const DB_UNAVAILABLE_CODE = "DB_UNAVAILABLE";

export class SessionProbeError extends Error {
  readonly status = 503;
  readonly code: typeof DESK_CHECK_TIMEOUT_CODE | typeof DB_UNAVAILABLE_CODE;

  constructor(code: typeof DESK_CHECK_TIMEOUT_CODE | typeof DB_UNAVAILABLE_CODE, message: string) {
    super(message);
    this.name = "SessionProbeError";
    this.code = code;
  }
}

export function isAbortTimeoutError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
  const code = "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    code === "ABORT_ERR" ||
    code === DESK_CHECK_TIMEOUT_CODE
  );
}

export function abortBudget(ms = DESK_CHECK_BUDGET_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}

export async function runWithAbortBudget<T>(
  work: (signal: AbortSignal) => Promise<T>,
  ms = DESK_CHECK_BUDGET_MS,
): Promise<T> {
  const signal = abortBudget(ms);
  const timedOut = new Promise<never>((_, reject) => {
    const fail = () => {
      const err = new SessionProbeError(DESK_CHECK_TIMEOUT_CODE, "Desk check timed out");
      err.cause = signal.reason;
      reject(err);
    };
    if (signal.aborted) fail();
    else signal.addEventListener("abort", fail, { once: true });
  });
  try {
    return await Promise.race([work(signal), timedOut]);
  } catch (err) {
    if (err instanceof SessionProbeError) throw err;
    if (isAbortTimeoutError(err) || signal.aborted) {
      throw new SessionProbeError(DESK_CHECK_TIMEOUT_CODE, "Desk check timed out");
    }
    throw err;
  }
}
