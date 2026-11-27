import { nationalDigits } from "./axiom-business-number";
import { appendMessagingNotice } from "./legal-notices";
import { mmsSenderMayUpdateProof } from "./mms-owner-gate";
import { toE164 } from "./notify-target";

const GOOGLE_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "search.google.com",
  "g.page",
  "maps.app.goo.gl",
  "goo.gl",
];

export function sanitizeGoogleReviewUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (!GOOGLE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return "";
    if (url.username || url.password) return "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

export function parseReviewCommand(body: string): string | null {
  const match = body.trim().match(/^review(?:\s+|:)(.+)$/i);
  if (!match?.[1]) return null;
  return toE164(match[1]) || (nationalDigits(match[1]).length === 10 ? toE164(match[1]) : null);
}

/** Pull a US phone from a proof caption that is not the owner's line. */
export function extractCustomerPhoneFromProofCaption(
  body: string,
  ownerPhones: Array<string | null | undefined>,
): string | null {
  const chunks = body.match(/(?:\+?1[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/g) ?? [];
  for (const chunk of chunks) {
    const e164 = toE164(chunk);
    if (!e164) continue;
    if (mmsSenderMayUpdateProof(e164, ownerPhones)) continue;
    return e164;
  }
  return null;
}

export type ReviewRequestDecision = {
  action: "send" | "simulate" | "skip";
  reason: string;
  customerE164: string;
  body: string;
};

export function decideReviewRequestSms(input: {
  ownerFrom: string;
  ownerPhones: Array<string | null | undefined>;
  customerRaw: string | null;
  googleReviewUrl: string;
  shopName: string;
  customerSuppressed: boolean;
  liveA2P: boolean;
}): ReviewRequestDecision {
  const empty = { customerE164: "", body: "" };
  if (!mmsSenderMayUpdateProof(input.ownerFrom, input.ownerPhones)) {
    return { action: "skip", reason: "not_owner", ...empty };
  }
  const customerE164 = input.customerRaw ? toE164(input.customerRaw) || "" : "";
  if (!customerE164) {
    return { action: "skip", reason: "missing_customer_phone", ...empty };
  }
  if (mmsSenderMayUpdateProof(customerE164, input.ownerPhones) || nationalDigits(customerE164) === nationalDigits(input.ownerFrom)) {
    return { action: "skip", reason: "customer_is_owner", customerE164, body: "" };
  }
  const url = sanitizeGoogleReviewUrl(input.googleReviewUrl);
  if (!url) {
    return { action: "skip", reason: "missing_google_review_url", customerE164, body: "" };
  }
  if (input.customerSuppressed) {
    return { action: "skip", reason: "opted_out", customerE164, body: "" };
  }
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const body = appendMessagingNotice(
    `${shop}: thanks for trusting us with the job. If it went well, a quick Google review helps neighbors find us: ${url}`,
    "sms",
  );
  if (!input.liveA2P) {
    return { action: "simulate", reason: "a2p_simulation", customerE164, body };
  }
  return { action: "send", reason: "send_review_request", customerE164, body };
}

export function ownerReviewReply(decision: ReviewRequestDecision): string {
  if (decision.action === "send") {
    return `Review request sent to ${decision.customerE164}.`;
  }
  if (decision.action === "simulate") {
    return `Simulation: would text a Google review link to ${decision.customerE164}. Live A2P is off.`;
  }
  if (decision.reason === "missing_google_review_url") {
    return "Add your Google review link in Admin → Google reviews, then text REVIEW and the customer number.";
  }
  if (decision.reason === "opted_out") {
    return "That number is on the opt-out list. No review text was sent.";
  }
  if (decision.reason === "missing_customer_phone") {
    return "Text REVIEW followed by the customer mobile, e.g. REVIEW 5415550148.";
  }
  if (decision.reason === "customer_is_owner") {
    return "That number is your shop line. Use the customer's mobile.";
  }
  return "";
}
