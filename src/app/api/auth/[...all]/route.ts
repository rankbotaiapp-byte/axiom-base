import { isDatabaseUnavailable } from "@/lib/db";
import { isDatabaseConfigFailure } from "@/lib/db-url";
import { publicJsonError } from "@/lib/axiom/public-api-error";
import {
  isAuthGetSessionPath,
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
    const { auth } = await import("@/lib/auth/server");
    return await auth.handler(request);
  } catch (err) {
    if (isDbFailure(err) && isGetSession(request)) return unavailableAuthSessionResponse();
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
