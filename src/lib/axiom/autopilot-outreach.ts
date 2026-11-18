/**
 * Master Autopilot Outreach Engine — client-safe sequencing, caps, and stock rotation.
 * Server I/O lives in `autopilot-outreach.server.ts`.
 */

import {
  AUTOPILOT_EMAIL_DAILY_CAP,
  AUTOPILOT_SMS_DAILY_CAP,
  canDispatchNow,
  dailyCapForChannel,
  evaluateDispatchGate,
  getNextTrickleDelayMs,
  type DispatchGate,
} from "./autopilot-limits.ts";
import { parseOutreachMode, type OutreachMode } from "./outreach-queue.ts";

export type OutreachTradeId =
  | "plumbing"
  | "hvac"
  | "electrical"
  | "contractor"
  | "auto"
  | "welding";

export type OutreachCountyId = "jackson" | "josephine" | "douglas" | "klamath";

export type OutreachSequenceStep = {
  id: string;
  dayOffset: number;
  channel: "sms" | "email";
  templateId: string;
  /** Inject stock still / video from Pexels·Unsplash rotation */
  includeStockAsset: boolean;
};

export type OutreachLeadTarget = {
  leadSlug: string;
  businessName: string;
  trade: OutreachTradeId;
  county: OutreachCountyId;
  city: string;
  email: string;
  phone: string;
  contactName?: string;
};

export type OutreachBatchPlan = {
  mode: OutreachMode;
  batchId: string;
  county: OutreachCountyId;
  trade: OutreachTradeId;
  leads: OutreachLeadTarget[];
  smsQueued: number;
  emailQueued: number;
  smsCap: number;
  emailCap: number;
  smsRemaining: number;
  emailRemaining: number;
  sequence: OutreachSequenceStep[];
  stockQuery: string;
  summary: string;
  gate: DispatchGate;
};

export type OutreachEngineConfig = {
  mode: OutreachMode;
  smsDailyCap: number;
  emailDailyCap: number;
  counties: OutreachCountyId[];
  trades: OutreachTradeId[];
};

export const OUTREACH_COUNTIES: Record<
  OutreachCountyId,
  { id: OutreachCountyId; label: string; hubs: string[] }
> = {
  jackson: { id: "jackson", label: "Jackson County", hubs: ["Medford", "Ashland", "Central Point"] },
  josephine: { id: "josephine", label: "Josephine County", hubs: ["Grants Pass", "Cave Junction"] },
  douglas: { id: "douglas", label: "Douglas County", hubs: ["Roseburg"] },
  klamath: { id: "klamath", label: "Klamath County", hubs: ["Klamath Falls"] },
};

export const OUTREACH_TRADES: Record<
  OutreachTradeId,
  { id: OutreachTradeId; label: string; stockQueries: string[] }
> = {
  plumbing: {
    id: "plumbing",
    label: "Plumbing",
    stockQueries: ["emergency plumber", "burst pipe repair", "residential plumber van"],
  },
  hvac: {
    id: "hvac",
    label: "HVAC",
    stockQueries: ["hvac technician service", "furnace repair", "air conditioning service call"],
  },
  electrical: {
    id: "electrical",
    label: "Electrical",
    stockQueries: ["emergency electrician", "electrical panel work", "electrician service van"],
  },
  contractor: {
    id: "contractor",
    label: "General contractor",
    stockQueries: ["general contractor site", "home remodel crew", "construction tools"],
  },
  auto: {
    id: "auto",
    label: "Auto repair",
    stockQueries: ["auto repair garage", "mechanic workshop", "roadside vehicle repair"],
  },
  welding: {
    id: "welding",
    label: "Welding / fab",
    stockQueries: ["welding workshop", "metal fabrication shop", "custom steel weld"],
  },
};

/** Default 4-touch drip: SMS → email → SMS reminder → email close. */
export const DEFAULT_OUTREACH_SEQUENCE: OutreachSequenceStep[] = [
  {
    id: "day0-sms",
    dayOffset: 0,
    channel: "sms",
    templateId: "intro_sms",
    includeStockAsset: false,
  },
  {
    id: "day0-email",
    dayOffset: 0,
    channel: "email",
    templateId: "intro_email",
    includeStockAsset: true,
  },
  {
    id: "day2-sms",
    dayOffset: 2,
    channel: "sms",
    templateId: "nudge_sms",
    includeStockAsset: false,
  },
  {
    id: "day5-email",
    dayOffset: 5,
    channel: "email",
    templateId: "close_email",
    includeStockAsset: true,
  },
];

export function defaultOutreachConfig(mode?: string | null): OutreachEngineConfig {
  return {
    mode: parseOutreachMode(mode),
    smsDailyCap: AUTOPILOT_SMS_DAILY_CAP,
    emailDailyCap: AUTOPILOT_EMAIL_DAILY_CAP,
    counties: ["jackson", "josephine"],
    trades: ["plumbing", "hvac", "electrical", "contractor"],
  };
}

export function normalizeCounty(raw: string): OutreachCountyId | null {
  const h = raw.trim().toLowerCase();
  if (/josephine|grants\s*pass|cave\s*junction/.test(h)) return "josephine";
  if (/jackson|medford|ashland|central\s*point/.test(h)) return "jackson";
  if (/douglas|roseburg/.test(h)) return "douglas";
  if (/klamath/.test(h)) return "klamath";
  return null;
}

export function normalizeTrade(raw: string): OutreachTradeId {
  const h = raw.trim().toLowerCase();
  // HVAC before plumbing so "HVAC & Plumbing" shops route as HVAC (Vance pattern).
  if (/hvac|heat(?:ing)?|cool(?:ing)?|furnace|air\s*cond/.test(h)) return "hvac";
  if (/plumb/.test(h)) return "plumbing";
  if (/electr/.test(h)) return "electrical";
  if (/auto|mechanic|vehicle/.test(h)) return "auto";
  if (/weld|fab/.test(h)) return "welding";
  return "contractor";
}

/** Rotate Pexels/Unsplash query by day + lead slug for personalized assets. */
export function rotateStockQuery(trade: OutreachTradeId, seed: string, day = new Date()): string {
  const queries = OUTREACH_TRADES[trade].stockQueries;
  let hash = day.getUTCFullYear() * 1000 + day.getUTCMonth() * 40 + day.getUTCDate();
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  return queries[hash % queries.length] ?? queries[0]!;
}

export function renderOutreachTemplate(
  templateId: string,
  lead: OutreachLeadTarget,
  extras?: { previewUrl?: string; stockUrl?: string; shopName?: string },
): { subject: string; body: string } {
  const county = OUTREACH_COUNTIES[lead.county].label;
  const trade = OUTREACH_TRADES[lead.trade].label;
  const name = lead.contactName || lead.businessName;
  const preview = extras?.previewUrl || `https://axiom.shop/${lead.leadSlug}`;
  const stockLine = extras?.stockUrl ? `\n\nPreview still: ${extras.stockUrl}` : "";
  const brand = extras?.shopName || "Axiom";

  switch (templateId) {
    case "intro_sms":
      return {
        subject: "",
        body: `${name} — ${brand} built a 24/7 booking page for ${lead.businessName} in ${lead.city}. Missed after-hours calls book themselves: ${preview}`,
      };
    case "nudge_sms":
      return {
        subject: "",
        body: `${name}, quick nudge — your ${trade.toLowerCase()} booking link is live for ${county}. Tap to preview: ${preview}`,
      };
    case "intro_email":
      return {
        subject: `${lead.businessName}: 24/7 ${trade} booking for ${lead.city}`,
        body: `Hi ${name},\n\nContractors in ${county} keep losing evening emergency calls to voicemail. ${brand} spun up a live booking storefront for ${lead.businessName} — AI voice + SMS dispatch, no website rebuild.\n\nPreview: ${preview}${stockLine}\n\nReply YES and we'll text the claim link.\n\n— ${brand}`,
      };
    case "close_email":
      return {
        subject: `Last look — ${lead.businessName} 24/7 dispatcher`,
        body: `${name},\n\nClosing the loop on the ${trade.toLowerCase()} booking page for ${lead.city}. Name Your Price month 1 from $1, then $150/mo — cancel anytime from Admin Billing.\n\n${preview}${stockLine}\n\n— ${brand}`,
      };
    default:
      return {
        subject: `${lead.businessName} · Axiom outreach`,
        body: `Preview for ${lead.businessName}: ${preview}${stockLine}`,
      };
  }
}

export function planOutreachBatch(input: {
  mode?: OutreachMode | string | null;
  county: OutreachCountyId;
  trade: OutreachTradeId;
  leads: OutreachLeadTarget[];
  smsSentToday?: number;
  emailSentToday?: number;
  lastSentAt?: Date | string | null;
  batchId?: string;
  now?: Date;
}): OutreachBatchPlan {
  const mode = parseOutreachMode(typeof input.mode === "string" ? input.mode : input.mode ?? "simulation");
  const smsCap = AUTOPILOT_SMS_DAILY_CAP;
  const emailCap = AUTOPILOT_EMAIL_DAILY_CAP;
  const smsSent = Math.max(0, input.smsSentToday ?? 0);
  const emailSent = Math.max(0, input.emailSentToday ?? 0);
  const smsRemaining = Math.max(0, smsCap - smsSent);
  const emailRemaining = Math.max(0, emailCap - emailSent);

  const scoped = input.leads.filter((l) => l.county === input.county && l.trade === input.trade);
  const smsQueued = Math.min(
    smsRemaining,
    scoped.filter((l) => l.phone.replace(/\D/g, "").length >= 10).length,
  );
  const emailQueued = Math.min(
    emailRemaining,
    scoped.filter((l) => /@/.test(l.email)).length,
  );

  const gate = evaluateDispatchGate({
    now: input.now,
    channel: null,
    smsSentToday: smsSent,
    emailSentToday: emailSent,
    lastSentAt: input.lastSentAt,
  });

  const stockQuery = rotateStockQuery(input.trade, `${input.county}:${input.trade}`);
  const countyLabel = OUTREACH_COUNTIES[input.county].label;
  const tradeLabel = OUTREACH_TRADES[input.trade].label;
  const batchId = input.batchId || `ob_${input.county}_${input.trade}_${Date.now().toString(36)}`;

  return {
    mode,
    batchId,
    county: input.county,
    trade: input.trade,
    leads: scoped,
    smsQueued,
    emailQueued,
    smsCap,
    emailCap,
    smsRemaining,
    emailRemaining,
    sequence: DEFAULT_OUTREACH_SEQUENCE,
    stockQuery,
    gate,
    summary:
      mode === "live"
        ? `Live · ${countyLabel} ${tradeLabel}: queue ${smsQueued} SMS / ${emailQueued} email (caps ${smsCap}/${emailCap}). Gate: ${gate.reason}.`
        : `Simulation · ${countyLabel} ${tradeLabel}: would queue ${smsQueued} SMS / ${emailQueued} email. No carriers contacted.`,
  };
}

export function sequenceStepsForDay(dayOffset: number, sequence = DEFAULT_OUTREACH_SEQUENCE) {
  return sequence.filter((step) => step.dayOffset === dayOffset);
}

export {
  AUTOPILOT_SMS_DAILY_CAP,
  AUTOPILOT_EMAIL_DAILY_CAP,
  canDispatchNow,
  dailyCapForChannel,
  evaluateDispatchGate,
  getNextTrickleDelayMs,
  parseOutreachMode,
};
export type { OutreachMode, DispatchGate };
