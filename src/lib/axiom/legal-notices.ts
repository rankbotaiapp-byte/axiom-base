/** Shared compliance copy. Keep these short enough for SMS and checkout chrome. */

export const SUBSCRIPTION_NOTICE =
  "Payment is due at checkout. Recurring plans renew until cancelled from the shop desk or Stripe. Axiom supplies software and booking tools only — it is not a party to shop work, and is not liable for services, delays, or outcomes. Platform and processor fees are non-refundable except as required by law.";

/** Canonical $1 unlock offer — landing, drawer, Stripe chrome, privacy, and terms. */
export const UNLOCK_OFFER_COPY =
  "$1.00 today unlocks your storefront for 14 days. Then $150.00/month until you cancel, or $1,500 once for a lifetime license. Cancel anytime in Axiom Admin Billing. Online card bookings include a 1.5% Gear Guardian LLC platform fee (0% on cash and checks logged in the field).";

/** Shown immediately above the $1 trial payment button. */
export const TRIAL_CHECKOUT_DISCLOSURE =
  "By starting your $1 unlock, you authorize Gear Guardian LLC to charge your card $1.00 today for 14 days of full access. If you do not cancel before those 14 days end, billing continues at $150.00/month until canceled, unless you choose the $1,500 lifetime license. You can cancel instantly in Axiom Admin Billing. Online card bookings include a 1.5% platform fee (0% on cash and checks logged in the field). Reply STOP to opt out of texts, HELP for help, START to resume.";

export const TERMS_RENEWAL_CLAUSE =
  "Gear Guardian LLC bills the Axiom $1 unlock at $1.00 today for 14 days of full access. If you do not cancel before those 14 days end, the subscription automatically renews at $150.00 per month until you cancel, unless you purchase the $1,500 lifetime license (no monthly bill). You can cancel in Axiom Admin Billing. Online card bookings include a 1.5% platform fee (0% on cash and checks logged in the field). Except where the law requires a refund, trial, unlock, and subscription charges are not refundable once billed.";

export const TERMS_PLATFORM_FEE_CLAUSE =
  "Online transactions processed through Stripe Connect include a platform fee of 150 basis points (1.5%), collected by Gear Guardian LLC. Cash and check amounts logged from the field carry a 0% platform fee and are not split.";

export const TERMS_AUTOPILOT_LIABILITY_CLAUSE =
  "Autopilot can publish to Google Business Profile, Facebook, and Instagram. Those platforms control their own algorithms and local search ranking. Gear Guardian LLC is not liable for third-party algorithm updates, distribution changes, or fluctuations in local search ranking on Google Business, Facebook, or Instagram.";

export const LEGAL_ENTITY_LINE =
  "Axiom is a product of Gear Guardian LLC, doing business as New Era Apps / Axiom.";

export const TERMS_SMS_PROGRAM_CLAUSE =
  "By providing a mobile number you agree to receive automated booking, dispatch, quote, payment, and service texts from Axiom and the shop using Axiom. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out, HELP for help, or START to resume. We process opt-outs promptly and do not send further marketing or outreach texts to that number.";

export const PRIVACY_SMS_OPTOUT_CLAUSE =
  "Text STOP to any Axiom or shop dispatch number to opt out. You will receive a confirmation and no further Axiom texts to that number. Text HELP for help (program identity, rates, and how to opt out). Text START to resume. Carriers are not liable for delayed or undelivered messages.";

export const PRIVACY_MOBILE_NO_SALE_CLAUSE =
  "Gear Guardian LLC does not sell mobile phone numbers. We do not share, rent, or disclose mobile numbers to unaffiliated third parties for their own marketing or promotional use. Numbers are used only to operate booking, dispatch, quotes, receipts, and support for the shop you contacted, and by infrastructure processors (such as Twilio) solely to deliver those messages. We do not share mobile numbers with data brokers.";

export const PRIVACY_DATA_USE_CLAUSE =
  "We collect names, mobile numbers, emails, booking details, and message content so shops can confirm jobs and so Axiom can run the dispatch line. Card data is handled by Stripe, not stored as full PAN on Axiom. We keep records as needed to provide the service, honor opt-outs, and meet legal duties.";

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

function firstMessagingToken(body: string): string {
  return body
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)[0] || "";
}

export function isMessagingOptOut(body: string): boolean {
  const first = firstMessagingToken(body);
  return first === "stop" || first === "stopall" || first === "unsubscribe" || first === "end" || first === "quit" || first === "cancel";
}

export function isMessagingHelp(body: string): boolean {
  const first = firstMessagingToken(body);
  return first === "help" || first === "info";
}

export const OPT_OUT_CONFIRMATION =
  "You're unsubscribed from Axiom business messages. No further notes will be sent. Reply START to resume. Help: reply HELP.";

export function smsHelpReply(origin?: string): string {
  const base = (origin || "").replace(/\/$/, "");
  const privacy = base ? `${base}/privacy` : "rankbotapp.com/privacy";
  return `Axiom (Gear Guardian LLC / New Era Apps): booking and dispatch texts. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, START to resume. We do not sell or share mobile numbers for third-party marketing. Privacy: ${privacy}`;
}
