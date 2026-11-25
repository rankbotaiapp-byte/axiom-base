import { isDatabaseUnavailable } from "@/lib/db";
import { isDatabaseConfigFailure } from "@/lib/db-url";
import { publicJsonError } from "@/lib/axiom/public-api-error";
import {
  DESK_CHECK_TIMEOUT_CODE,
  SessionProbeError,
  isAbortTimeoutError,
  runWithAbortBudget,
} from "@/lib/auth/desk-budget";
import {
  isAuthGetSessionPath,
  timeoutAuthSessionResponse,
  unavailableAuthSessionResponse,
} from "@/lib/auth/unavailable-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function handle(request: Request): Promise<Response> {
  try {
    const run = async () => {
      const { auth } = await import("@/lib/auth/server");
      return await auth.handler(request);
    };
    const response = isGetSession(request) ? await runWithAbortBudget(() => run()) : await run();
    return response;
  } catch (err) {
    if (isGetSession(request)) {
      if (err instanceof SessionProbeError) {
        return err.code === DESK_CHECK_TIMEOUT_CODE
          ? timeoutAuthSessionResponse()
          : unavailableAuthSessionResponse();
      }
      if (isAbortTimeoutError(err)) return timeoutAuthSessionResponse();
      if (isDbFailure(err)) return unavailableAuthSessionResponse();
    }
    if (isDbFailure(err)) return publicJsonError(err, "Database is unavailable");
    return publicJsonError(err, "Authentication is unavailable");
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
