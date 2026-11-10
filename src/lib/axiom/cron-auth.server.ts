import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

/**
 * Shared gate for automated queue / cron endpoints.
 * Accepts `CRON_SECRET` or legacy `OUTREACH_CRON_SECRET` via:
 *   - `Authorization: Bearer <secret>`
 *   - `x-cron-secret` / `x-outreach-cron` headers
 *   - `?cron_secret=` query (scheduler fallbacks only)
 *
 * Missing or invalid credentials always yield 401 — never open the drain.
 */

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function configuredCronSecrets(): string[] {
  const secrets = [env("CRON_SECRET"), env("OUTREACH_CRON_SECRET")];
  return secrets.filter((value): value is string => Boolean(value && value.trim()));
}

export function extractCronToken(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(\S+)$/i.exec(auth.trim())?.[1] ?? "";
  if (bearer) return bearer;
  const header =
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("x-outreach-cron")?.trim() ||
    "";
  if (header) return header;
  try {
    return new URL(request.url).searchParams.get("cron_secret")?.trim() ?? "";
  } catch {
    return "";
  }
}

export function cronTokenValid(request: Request): boolean {
  const token = extractCronToken(request);
  if (!token) return false;
  return configuredCronSecrets().some((secret) => safeEqual(token, secret));
}

/** Returns a 401 Response when the cron secret is missing/invalid; otherwise null. */
export function requireCronSecret(request: Request): Response | null {
  if (configuredCronSecrets().length === 0) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!cronTokenValid(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
