export const AUTH_SESSION_UNAVAILABLE_CODE = "DB_UNAVAILABLE";

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

export function isAuthGetSessionPath(pathname: string): boolean {
  return /\/api\/auth\/get-session\/?$/i.test(pathname);
}
