/**
 * SMS-first onboarding drip + channel prioritization.
 *
 * Pure module: no DB, no Twilio. Autopilot enrolls sequences from these
 * templates; the outreach worker / inbound webhook / Stripe settle path
 * call the pause helpers when a lead replies or completes checkout.
 */

import { isEmailReady, isSmsReady, type PhoneLine } from "./funnel.ts";
import { demoStorefrontPath } from "./outreach-niche-batch.ts";
import { appendMessagingNotice } from "./legal-notices.ts";

export type OutreachChannel = "sms" | "email";

export type ChannelRouteLead = {
  email?: string | null;
  phone?: string | null;
  phoneLine?: PhoneLine | string | null;
  /** Office / desk emails (info@, office@, admin@) tip the lead toward email-first. */
  contactEmail?: string | null;
};

export type SmsDripStepId = "day1-preview" | "day3-checkin" | "day7-missed-call";

export type SmsDripStep = {
  id: SmsDripStepId;
  /** Calendar day label shown in admin / touch rows (1, 3, 7). */
  day: 1 | 3 | 7;
  /** Days after enrollment before this touch may send. Day 1 is immediate. */
  offsetDays: number;
  label: string;
  /** Body template. Tokens: {firstName} {business} {url} {trade} {city} */
  template: string;
};

export type SmsDripTokens = {
  firstName: string;
  business: string;
  url: string;
  trade?: string;
  city?: string;
};

export type SmsDripPauseEvent =
  | "reply"
  | "opt_out"
  | "stripe_checkout"
  | "subscribed"
  | "booked"
  | "claimed"
  | "clicked";

/** Mobile-verified numbers go SMS-first. Office / email-heavy desks go email-first. */
export function prioritizeOutreachChannel(lead: ChannelRouteLead): OutreachChannel | null {
  const email = (lead.contactEmail ?? lead.email ?? "").trim();
  const phone = (lead.phone ?? "").trim();
  const line = String(lead.phoneLine ?? "").trim().toLowerCase() as PhoneLine | "";
  const emailReady = isEmailReady(email);
  const digits = phone.replace(/\D/g, "");
  const hasPhone = digits.length >= 10;
  const mobile = isSmsReady(line) && hasPhone;
  const officeHeavy = emailReady && isOfficeHeavyEmail(email);

  if (mobile && !officeHeavy) return "sms";
  if (officeHeavy) return "email";
  if (mobile) return "sms";
  if (emailReady) return "email";
  // Unknown line type with a real phone still qualifies for SMS when there is no email.
  if (hasPhone && !emailReady) return "sms";
  if (hasPhone && emailReady) {
    // Dual-channel, line unknown: prefer SMS (mobile-first product posture).
    return "sms";
  }
  return null;
}

/** info@ / office@ / admin@ / contact@ addresses are treated as desk inboxes. */
export function isOfficeHeavyEmail(email: string): boolean {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  if (!local) return false;
  return /^(info|office|admin|contact|hello|support|service|sales|frontdesk|front.?desk|reception)$/i.test(
    local,
  );
}

/**
 * Route a batch: mobile-verified → SMS queue; office/email-heavy → email queue.
 * Dual-ready leads follow `prioritizeOutreachChannel` (no load balancing that
 * would shove a mobile lead onto email just to even the counts).
 */
export function splitLeadsByChannelPriority<T extends ChannelRouteLead>(leads: readonly T[]): {
  email: T[];
  sms: T[];
  skipped: T[];
} {
  const email: T[] = [];
  const sms: T[] = [];
  const skipped: T[] = [];
  for (const lead of leads) {
    const channel = prioritizeOutreachChannel(lead);
    if (channel === "sms") sms.push(lead);
    else if (channel === "email") email.push(lead);
    else skipped.push(lead);
  }
  return { email, sms, skipped };
}

export const SMS_DRIP_STEPS: readonly SmsDripStep[] = [
  {
    id: "day1-preview",
    day: 1,
    offsetDays: 0,
    label: "Day 1 Preview link",
    template:
      "Hey {firstName} — I built a live storefront for {business}. Preview it here (takes 20 seconds): {url}",
  },
  {
    id: "day3-checkin",
    day: 3,
    offsetDays: 3,
    label: "Day 3 Check-in / support",
    template:
      "{firstName}, quick check-in on the {business} page. Want me to walk you through the booking flow, or tweak anything before customers see it? {url}",
  },
  {
    id: "day7-missed-call",
    day: 7,
    offsetDays: 7,
    label: "Day 7 Missed-call conversion",
    template:
      "{firstName} — every missed call at {business} is a job walking away. The page texts callers back and books the next open slot. Claim it before we pull the demo: {url}",
  },
] as const;

/** Absolute schedule for the three SMS touches, anchored at enrollment. */
export function smsDripSchedule(from: Date = new Date()): {
  step: SmsDripStep;
  scheduledAt: string;
  status: "scheduled";
}[] {
  return SMS_DRIP_STEPS.map((step) => ({
    step,
    scheduledAt: new Date(from.getTime() + step.offsetDays * 86_400_000).toISOString(),
    status: "scheduled" as const,
  }));
}

export function firstNameFrom(contactName: string, businessName = ""): string {
  const raw = contactName.trim() || businessName.trim();
  if (!raw) return "there";
  const first = raw.split(/\s+/)[0]?.replace(/[^a-zA-Z'-]/g, "") ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function fillSmsDripTemplate(template: string, tokens: SmsDripTokens): string {
  const map: Record<string, string> = {
    firstName: tokens.firstName || "there",
    business: tokens.business || "your shop",
    url: tokens.url || "",
    trade: tokens.trade || "trade",
    city: tokens.city || "your city",
  };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in map ? map[key] : match));
}

export function renderSmsDripBody(step: SmsDripStep | SmsDripStepId, tokens: SmsDripTokens): string {
  const def =
    typeof step === "string" ? SMS_DRIP_STEPS.find((s) => s.id === step) : step;
  if (!def) throw new Error(`Unknown SMS drip step: ${String(step)}`);
  return appendMessagingNotice(fillSmsDripTemplate(def.template, tokens), "sms");
}

/** Storefront URL every drip step links — always carries greet=1 for the avatar intro. */
export function smsDripStorefrontPath(input: {
  niche: string;
  businessName: string;
  leadSlug?: string;
  leadId?: string;
  city?: string;
  county?: string;
  tradeLabel?: string;
  origin?: string;
}): string {
  const path = demoStorefrontPath({
    niche: input.niche,
    businessName: input.businessName,
    leadSlug: input.leadSlug,
    leadId: input.leadId,
    city: input.city,
    county: input.county,
    tradeLabel: input.tradeLabel,
  });
  if (!path.includes("greet=1")) {
    const join = path.includes("?") ? "&" : "?";
    const withGreet = `${path}${join}greet=1`;
    return absoluteUrl(input.origin, withGreet);
  }
  return absoluteUrl(input.origin, path);
}

function absoluteUrl(origin: string | undefined, path: string): string {
  if (!origin) return path;
  const base = origin.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Reply, STOP, or a completed Stripe subscription all freeze remaining touches. */
export function shouldPauseSmsDrip(event: SmsDripPauseEvent | string): boolean {
  const key = String(event).trim().toLowerCase();
  return (
    key === "reply" ||
    key === "replied" ||
    key === "opt_out" ||
    key === "opt-out" ||
    key === "stop" ||
    key === "stripe_checkout" ||
    key === "subscribed" ||
    key === "booked" ||
    key === "claimed" ||
    key === "clicked"
  );
}

/** Map a pause event onto the outreach_sequences halt reason. */
export function smsDripHaltReason(
  event: SmsDripPauseEvent | string,
): "replied" | "booked" | "claimed" | "clicked" {
  const key = String(event).trim().toLowerCase();
  if (key === "clicked") return "clicked";
  if (key === "claimed") return "claimed";
  if (key === "stripe_checkout" || key === "subscribed" || key === "booked") return "booked";
  return "replied";
}
