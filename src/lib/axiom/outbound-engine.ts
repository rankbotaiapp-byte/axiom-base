import { MASTER_FUNNELS, masterFunnel, type MasterFunnelId } from "./funnel.ts";

export const DEFAULT_SMS_DAILY_CAP = 40;
export const DEFAULT_EMAIL_DAILY_CAP = 80;
export const ENGINE_TICK_SIZE = 5;

export const ENGINE_REGIONS = ["Oregon", "Texas", "Florida"] as const;

export type OutboundEngineState = {
  paused: boolean;
  strategyId: MasterFunnelId;
  smsDailyCap: number;
  emailDailyCap: number;
  smsTemplate: string;
  emailSubject: string;
  emailBody: string;
  /** Catalog niche currently being trickled (empty = pick next in sequence). */
  activeNiche: string;
  /** When false, cron ticks hold — only manual Dispatch releases today's batch. */
  cronEnabled: boolean;
  /** Pacific YYYY-MM-DD the day-by-day slate began (Day 1 = Plumbing). */
  scheduleStartedOn: string;
};

export type OutboundEngineMetrics = {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  clicks: number;
  onboarded: number;
  deliveryRate: number;
  ctr: number;
  smsSentToday: number;
  emailSentToday: number;
  smsRemaining: number;
  emailRemaining: number;
};

export function clampDailyCap(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(500, Math.max(0, Math.round(n)));
}

export function remainingCap(sent: number, cap: number): number {
  return Math.max(0, cap - Math.max(0, sent));
}

export function throttleCount(want: number, remaining: number): number {
  return Math.max(0, Math.min(Math.floor(want), remaining));
}

/** Engine ticks never call Twilio or Resend. Live sends only go through the outreach drain. */
export function engineTickLine(input: {
  live: boolean;
  channel: "sms" | "email";
  business: string;
}): { status: "logged" | "queued"; summary: string } {
  if (input.live) {
    return { status: "queued", summary: `${input.channel} queued · ${input.business}` };
  }
  return { status: "logged", summary: `${input.channel} simulation · ${input.business}` };
}


export function deliveryRate(sent: number, failed: number): number {
  const total = sent + failed;
  if (total <= 0) return 0;
  return sent / total;
}

export function clickThroughRate(clicks: number, sent: number): number {
  if (sent <= 0) return 0;
  return Math.min(1, clicks / sent);
}

export function parseEngineStrategy(id: string | null | undefined): MasterFunnelId {
  return masterFunnel(id ?? "").id;
}

export function defaultEngineState(): OutboundEngineState {
  const funnel = MASTER_FUNNELS[0];
  return {
    paused: true,
    strategyId: funnel.id,
    smsDailyCap: DEFAULT_SMS_DAILY_CAP,
    emailDailyCap: DEFAULT_EMAIL_DAILY_CAP,
    smsTemplate: funnel.text,
    emailSubject: funnel.emailSubject,
    emailBody: funnel.emailBody,
    activeNiche: "plumbing",
    cronEnabled: true,
    scheduleStartedOn: "",
  };
}

export function regionForCounty(county: string): (typeof ENGINE_REGIONS)[number] | "Other" {
  const hay = county.toLowerCase();
  if (hay.includes("oregon") || hay.includes("jackson") || hay.includes("josephine") || hay.includes("douglas")) {
    return "Oregon";
  }
  if (hay.includes("texas") || hay.includes("travis") || hay.includes("harris") || hay.includes("dallas")) {
    return "Texas";
  }
  if (hay.includes("florida") || hay.includes("miami") || hay.includes("orange") || hay.includes("hillsborough")) {
    return "Florida";
  }
  return "Other";
}
