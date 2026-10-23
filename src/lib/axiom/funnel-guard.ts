export const FUNNEL_IP_LIMIT = 30;
export const FUNNEL_SLUG_LIMIT = 60;

export function newStopToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashStopToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare for two hex digests. An empty stored hash never matches. */
export function tokenHashMatches(actual: string, stored: string): boolean {
  if (!actual || !stored || actual.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

export function funnelBucketOpen(hitsInWindow: number, limit: number): boolean {
  return hitsInWindow < limit;
}

export function isDueNurtureStep(step: number): boolean {
  return step === 2 || step === 3 || step === 6;
}

/** Simulation logs the touch. Live sends only when both providers are configured. */
export function nurtureReleasePlan(
  mode: "simulation" | "live",
  credentialsReady: boolean,
): "log" | "send" | "hold" {
  if (mode !== "live") return "log";
  if (!credentialsReady) return "hold";
  return "send";
}

/** Day 3 and Day 6 emails are stored as subject, blank line, then body. */
export function splitOutreachEmail(body: string): { subject: string; text: string } {
  const breakAt = body.indexOf("\n\n");
  if (breakAt === -1) return { subject: body.slice(0, 140), text: body };
  return { subject: body.slice(0, breakAt).slice(0, 200), text: body.slice(breakAt + 2) };
}
