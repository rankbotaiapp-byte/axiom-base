import { DB_UNAVAILABLE_CODE, DESK_CHECK_TIMEOUT_CODE } from "./desk-budget";

export const AUTH_SESSION_UNAVAILABLE_CODE = DB_UNAVAILABLE_CODE;
export const AUTH_SESSION_TIMEOUT_CODE = DESK_CHECK_TIMEOUT_CODE;

export function unavailableAuthSessionBody() {
  return {
    session: null,
    user: null,
    code: AUTH_SESSION_UNAVAILABLE_CODE,
    error: "Database is unavailable",
  } as const;
}

export function unavailableAuthSessionResponse(): Response {
  return Response.json(unavailableAuthSessionBody(), {
    status: 503,
    headers: { "cache-control": "no-store" },
  });
}

export function timeoutAuthSessionBody() {
  return {
    session: null,
    user: null,
    code: AUTH_SESSION_TIMEOUT_CODE,
    error: "Desk check timed out",
  } as const;
}

export function timeoutAuthSessionResponse(): Response {
  return Response.json(timeoutAuthSessionBody(), {
    status: 503,
    headers: { "cache-control": "no-store" },
  });
}

export function isAuthGetSessionPath(pathname: string): boolean {
  return /\/api\/auth\/get-session\/?$/i.test(pathname);
}
