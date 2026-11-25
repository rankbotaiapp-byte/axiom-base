import { createFileRoute } from "@tanstack/react-router";
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

function isDbFailure(err: unknown): boolean {
  return isDatabaseUnavailable(err) || isDatabaseConfigFailure(err);
}

async function handleAuth(request: Request): Promise<Response> {
  const getSession = isAuthGetSessionPath(new URL(request.url).pathname);
  try {
    const run = async () => {
      const { auth } = await import("@/lib/auth/server");
      return await auth.handler(request);
    };
    return getSession ? await runWithAbortBudget(() => run()) : await run();
  } catch (err) {
    if (getSession) {
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

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
