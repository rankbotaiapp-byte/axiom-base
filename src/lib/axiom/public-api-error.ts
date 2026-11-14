/**
 * Mask internal failures on public `/api/**` handlers.
 * Auth / validation errors (4xx with an intentional status) keep their message.
 * Everything else collapses to a generic JSON body — no stacks, paths, or DSNs.
 */

const SENSITIVE = /postgres:\/\/|DATABASE_URL|sk_(live|test)_|Bearer\s+\S+|password|connection string|ECONN|ENOTFOUND|\/Users\/|\/home\/|node_modules|at\s+\S+\s+\(/i;

export function publicApiError(
  err: unknown,
  fallback = "Internal server error",
): { status: number; body: { error: string } } {
  const statusRaw =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status: unknown }).status)
      : 500;
  const status = Number.isFinite(statusRaw) && statusRaw >= 400 && statusRaw < 600 ? statusRaw : 500;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : fallback;

  if (status >= 400 && status < 500 && raw && !SENSITIVE.test(raw)) {
    return { status, body: { error: raw.slice(0, 200) } };
  }
  return { status: status >= 500 ? status : 500, body: { error: fallback } };
}

export function publicJsonError(err: unknown, fallback = "Internal server error"): Response {
  const { status, body } = publicApiError(err, fallback);
  return Response.json(body, { status });
}
