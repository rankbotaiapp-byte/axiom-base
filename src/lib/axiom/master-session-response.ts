import { NextResponse } from "next/server";
import {
  DB_UNAVAILABLE_CODE,
  DESK_CHECK_TIMEOUT_CODE,
  SessionProbeError,
  isAbortTimeoutError,
} from "@/lib/auth/desk-budget";
import { isDatabaseConfigFailure } from "@/lib/db-url";
import { isDatabaseUnavailable } from "../../../scripts/db-availability.mjs";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

function errorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object" || !("status" in err)) return undefined;
  const status = Number((err as { status: unknown }).status);
  return Number.isFinite(status) ? status : undefined;
}

function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("code" in err)) return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export function masterSessionUnavailable(
  code: typeof DB_UNAVAILABLE_CODE | typeof DESK_CHECK_TIMEOUT_CODE,
  configured = false,
) {
  const timeout = code === DESK_CHECK_TIMEOUT_CODE;
  return noStoreJson(
    {
      attached: false,
      configured,
      access: "signed-out",
      session: null,
      user: null,
      code,
      error: timeout ? "Desk check timed out" : "Database is unavailable",
    },
    503,
  );
}

export function emptyMasterSessionJson(configured: boolean) {
  return noStoreJson({
    attached: false,
    configured,
    access: "signed-out",
    session: null,
    user: null,
  });
}

export function failClosedMasterSession(err: unknown, configured = false) {
  if (err instanceof SessionProbeError) return masterSessionUnavailable(err.code, configured);
  const status = errorStatus(err);
  if (status === 503) {
    const code = errorCode(err) === DESK_CHECK_TIMEOUT_CODE ? DESK_CHECK_TIMEOUT_CODE : DB_UNAVAILABLE_CODE;
    return masterSessionUnavailable(code, configured);
  }
  if (isAbortTimeoutError(err)) return masterSessionUnavailable(DESK_CHECK_TIMEOUT_CODE, configured);
  if (isDatabaseUnavailable(err) || isDatabaseConfigFailure(err)) {
    return masterSessionUnavailable(DB_UNAVAILABLE_CODE, configured);
  }
  return noStoreJson(
    { error: "Master session failed.", session: null, user: null },
    status && status >= 400 ? status : 500,
  );
}
