/** Shared compliance copy. Keep these short enough for SMS and checkout chrome. */

export const SUBSCRIPTION_NOTICE =
  "Payment is due at checkout. Recurring plans renew until cancelled from the shop desk or Stripe. Axiom supplies software and booking tools only — it is not a party to shop work, and is not liable for services, delays, or outcomes. Platform and processor fees are non-refundable except as required by law.";

export const STRIPE_CONNECT_NOTICE =
  "Card charges, payouts, and chargebacks are handled by Stripe Connect. Funds settle to this shop's connected Stripe account. Axiom does not store full card numbers and is not the merchant of record for this payment.";

export const SMS_TCPA_FOOTER =
  "Reply STOP to opt out. Msg frequency varies. Msg & data rates may apply. B2B informational messages from Axiom.";

export const EMAIL_TCPA_FOOTER =
  "This is a business-to-business message about a listing prepared for your company. Reply STOP or write unsubscribe to halt further notes. Axiom is a software platform, not a party to any services you offer.";

/** Short chrome for preview and send screens. Send path still appends the channel footer. */
export const MESSAGING_UI_NOTICE =
  "B2B informational messages. Reply STOP to opt out of texts. Reply STOP or write unsubscribe to halt email. Message frequency varies. Message and data rates may apply.";

const SMS_LIMIT = 640;
const EMAIL_LIMIT = 4000;

export function hasMessagingNotice(body: string, channel: "sms" | "email"): boolean {
  const text = body.toLowerCase();
  if (channel === "sms") return text.includes("reply stop");
  return text.includes("reply stop") || text.includes("unsubscribe");
}

export function appendMessagingNotice(body: string, channel: "sms" | "email"): string {
  const trimmed = body.trimEnd();
  if (!trimmed) return channel === "sms" ? SMS_TCPA_FOOTER : EMAIL_TCPA_FOOTER;
  if (hasMessagingNotice(trimmed, channel)) return trimmed;
  const footer = channel === "sms" ? SMS_TCPA_FOOTER : EMAIL_TCPA_FOOTER;
  return `${trimmed}\n\n${footer}`;
}

/** Keep the opt-out line even when the body is clipped to the carrier cap. */
export function finalizeOutreachBody(body: string, channel: "sms" | "email"): string {
  const noticed = appendMessagingNotice(body, channel);
  if (channel === "email") {
    if (noticed.length <= EMAIL_LIMIT) return noticed;
    const room = EMAIL_LIMIT - EMAIL_TCPA_FOOTER.length - 2;
    return `${noticed.slice(0, Math.max(0, room)).trimEnd()}\n\n${EMAIL_TCPA_FOOTER}`;
  }
  if (noticed.length <= SMS_LIMIT) return noticed;
  const room = SMS_LIMIT - SMS_TCPA_FOOTER.length - 2;
  return `${noticed.slice(0, Math.max(0, room)).trimEnd()}\n\n${SMS_TCPA_FOOTER}`;
}

export function isMessagingOptOut(body: string): boolean {
  const first = body
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)[0];
  return first === "stop" || first === "stopall" || first === "unsubscribe" || first === "end" || first === "quit" || first === "cancel";
}

export const OPT_OUT_CONFIRMATION =
  "You're unsubscribed from Axiom business messages. No further notes will be sent.";
