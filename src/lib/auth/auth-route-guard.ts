import { isDatabaseUnavailable } from "../../../scripts/db-availability.mjs";
import { isDatabaseConfigFailure } from "../db-url";
import { publicJsonError } from "../axiom/public-api-error";
import {
  DESK_CHECK_TIMEOUT_CODE,
  SessionProbeError,
  isAbortTimeoutError,
  runWithAbortBudget,
} from "./desk-budget";
import {
  isAuthGetSessionPath,
  timeoutAuthSessionResponse,
  unavailableAuthSessionResponse,
} from "./unavailable-session";

function isGetSession(request: Request): boolean {
  try {
    return isAuthGetSessionPath(new URL(request.url).pathname);
  } catch {
    return false;
  }
}

function isDbFailure(err: unknown): boolean {
  return isDatabaseUnavailable(err) || isDatabaseConfigFailure(err);
}

/** Better Auth get-session never throws through to HTML / unhandled rejection. */
export async function handleAuthRequest(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  const getSession = isGetSession(request);
  try {
    return getSession ? await runWithAbortBudget(() => run()) : await run();
  } catch (err) {
    if (getSession) {
      if (err instanceof SessionProbeError && err.code === DESK_CHECK_TIMEOUT_CODE) {
        return timeoutAuthSessionResponse();
      }
      if (isAbortTimeoutError(err)) return timeoutAuthSessionResponse();
      return unavailableAuthSessionResponse();
    }
    if (isDbFailure(err)) return publicJsonError(err, "Database is unavailable");
    return publicJsonError(err, "Authentication is unavailable");
  }
}
