import { createFileRoute } from "@tanstack/react-router";
import { isDatabaseUnavailable } from "@/lib/db";
import { isDatabaseConfigFailure } from "@/lib/db-url";
import { publicJsonError } from "@/lib/axiom/public-api-error";
import {
  isAuthGetSessionPath,
  unavailableAuthSessionResponse,
} from "@/lib/auth/unavailable-session";

async function handleAuth(request: Request): Promise<Response> {
  try {
    const { auth } = await import("@/lib/auth/server");
    return await auth.handler(request);
  } catch (err) {
    const getSession = isAuthGetSessionPath(new URL(request.url).pathname);
    if ((isDatabaseUnavailable(err) || isDatabaseConfigFailure(err)) && getSession) {
      return unavailableAuthSessionResponse();
    }
    if (isDatabaseUnavailable(err) || isDatabaseConfigFailure(err)) {
      return publicJsonError(err, "Database is unavailable");
    }
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
