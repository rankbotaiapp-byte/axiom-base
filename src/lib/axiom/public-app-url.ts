/**
 * Canonical public origin for outbound SMS / email / preview links.
 *
 * Prefer an explicit app URL; then Vercel host (always HTTPS); never emit
 * localhost in production even if the inbound request was loopback.
 */

function trim(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

/** Normalize a configured base into `https://host` / `http://host:port` origin. */
export function normalizePublicOrigin(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  try {
    const url = new URL(withScheme);
    if (isProductionRuntime() && isLoopbackHost(url.hostname)) return "";
    return url.origin;
  } catch {
    return "";
  }
}

/**
 * Resolve the origin that must appear in Resend / Twilio bodies.
 * Order: NEXT_PUBLIC_APP_URL → VITE_APP_URL → APP_URL → VERCEL_URL (HTTPS) → request origin (non-prod only).
 */
export function resolvePublicAppOrigin(requestOrigin?: string | null): string {
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VITE_APP_URL,
    process.env.APP_URL,
  ];
  for (const candidate of configured) {
    const origin = normalizePublicOrigin(trim(candidate));
    if (origin) return origin;
  }

  const vercel = trim(process.env.VERCEL_URL);
  if (vercel) {
    const origin = normalizePublicOrigin(vercel.startsWith("http") ? vercel : `https://${vercel}`);
    if (origin) return origin;
  }

  const fromRequest = normalizePublicOrigin(trim(requestOrigin ?? ""));
  if (fromRequest) return fromRequest;

  if (isProductionRuntime()) {
    throw new Error(
      "Public app URL is not configured. Set NEXT_PUBLIC_APP_URL or deploy with VERCEL_URL.",
    );
  }
  return "http://127.0.0.1:8080";
}
