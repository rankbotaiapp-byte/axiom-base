import { isLeadSlug } from "./funnel.ts";

export type PlumbingCheckoutPlan = "trial" | "lifetime";

export type PlumbingCheckoutState = {
  busy: boolean;
  redirecting: boolean;
  error: string | null;
  plan: PlumbingCheckoutPlan | null;
};

export type PlumbingStripeCheckout = PlumbingCheckoutState & {
  onTrial: () => void | Promise<void>;
  onLifetime: () => void | Promise<void>;
};

export const PLUMBING_CHECKOUT_IDLE: PlumbingCheckoutState = {
  busy: false,
  redirecting: false,
  error: null,
  plan: null,
};

export type StripeCheckoutStart = {
  processor: "stripe" | "trial" | "desk" | "";
  url?: string;
  checkoutId?: string;
};

export function plumbingCheckoutLeadSlug(...candidates: Array<string | undefined>): string {
  for (const raw of candidates) {
    const slug = (raw ?? "").trim().toLowerCase();
    if (isLeadSlug(slug)) return slug;
  }
  return "";
}

/** `/t/accurate-plumbing` → `accurate-plumbing` so Stripe always has a territory id. */
export function plumbingCheckoutSlugFromPath(pathname: string): string {
  const path = pathname.split("?")[0] ?? "";
  const parts = path.split("/").filter(Boolean);
  const tenant = parts[0] === "t" ? (parts[1] ?? "") : "";
  return plumbingCheckoutLeadSlug(tenant);
}

/** Server-fn clients sometimes wrap the payload in `{ data }`. */
export function unwrapCheckoutPayload(input: unknown): {
  leadSlug: string;
  planId: string;
  namedPriceCents?: number;
  namedPriceDollars?: string;
} {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const nested = raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>) : raw;
  return {
    leadSlug: String(nested.leadSlug ?? raw.leadSlug ?? "").trim().toLowerCase(),
    planId: String(nested.planId ?? raw.planId ?? "").trim(),
    namedPriceCents: typeof nested.namedPriceCents === "number" ? nested.namedPriceCents : undefined,
    namedPriceDollars: typeof nested.namedPriceDollars === "string" ? nested.namedPriceDollars : undefined,
  };
}

export function describePlumbingCheckoutError(err: unknown): string {
  const raw = err instanceof Error ? err.message.trim() : "";
  if (/unknown business|not linked/i.test(raw)) {
    return "Stripe could not bind this storefront. Reload and choose $1 Trial again.";
  }
  if (raw) return raw.slice(0, 180);
  return "Checkout did not start";
}

/** After Stripe returns a session URL, keep the spinner up through the redirect. */
export function plumbingCheckoutRedirect(started: StripeCheckoutStart): string {
  if (started.processor === "stripe" && started.url?.startsWith("https://")) return started.url;
  throw new Error("Stripe did not return a checkout session");
}
