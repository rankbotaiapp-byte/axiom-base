/**
 * Capture `?key=` from the master desk URL and scrub it from the address bar
 * before POST /api/master/session. Other query params and the hash stay.
 *
 * Module-level capture survives React Strict Mode remounts after the URL is
 * already stripped, so the key is not lost and the claim is not posted twice.
 */

let capturedKey: string | undefined;
let claimStarted = false;

/** Pure: drop `key` from an href, keep every other param and the hash. */
export function stripMasterKeyFromHref(href: string): { key: string; next: string } {
  const url = new URL(href, "https://axiom.local");
  const key = url.searchParams.get("key")?.trim() ?? "";
  url.searchParams.delete("key");
  return { key, next: `${url.pathname}${url.search}${url.hash}` };
}

export function applyMasterKeyStripToWindow(): string {
  if (typeof window === "undefined") return "";
  const { key, next } = stripMasterKeyFromHref(window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) {
    window.history.replaceState(window.history.state, "", next);
  }
  return key;
}

/** First call reads + strips. Later calls return the same in-memory key. */
export function captureMasterUrlKeyOnce(): string {
  if (capturedKey !== undefined) return capturedKey;
  capturedKey = applyMasterKeyStripToWindow();
  return capturedKey;
}

/** True only for the first caller — Strict Mode's second mount gets false. */
export function beginMasterSessionClaimOnce(): boolean {
  if (claimStarted) return false;
  claimStarted = true;
  return true;
}

export function resetMasterUrlKeyCaptureForTests(): void {
  capturedKey = undefined;
  claimStarted = false;
}
