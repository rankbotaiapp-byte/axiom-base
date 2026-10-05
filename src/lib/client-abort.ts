/** True when the browser closed the request. Node reports that as `aborted` / ECONNRESET. */
export function isClientAbort(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: unknown; name?: unknown; code?: unknown };
  if (err.name === "AbortError" || err.code === "ABORT_ERR") return true;
  return err.message === "aborted" || err.message === "The operation was aborted";
}
