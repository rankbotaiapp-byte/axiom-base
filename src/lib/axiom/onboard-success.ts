/** Post-purchase PWA + permission handshake after Stripe territory checkout. */

export const ONBOARD_SUCCESS_PATH = "/onboard/success";
export const ONBOARD_SUCCESS_SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";

export function onboardSuccessHref(sessionId: string): string {
  const id = sessionId.trim();
  return `${ONBOARD_SUCCESS_PATH}?session_id=${encodeURIComponent(id)}`;
}

export function territoryCheckoutSuccessUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${ONBOARD_SUCCESS_PATH}?session_id=${ONBOARD_SUCCESS_SESSION_PLACEHOLDER}`;
}

export function shopAdminHref(slug: string, claimToken?: string): string {
  const path = `/${encodeURIComponent(slug)}/admin`;
  const token = (claimToken ?? "").trim();
  return token ? `${path}?claim=${encodeURIComponent(token)}` : path;
}

export function isCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[A-Za-z0-9_]{8,200}$/.test(value.trim());
}

export type OnboardSuccessRead = {
  sessionId: string;
  leadSlug: string;
  shopSlug: string;
  claimToken: string;
  businessName: string;
  city: string;
  phone: string;
  email: string;
};
