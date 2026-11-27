/** Pure growth engine: funnel rates, seasonal niche rules, Thompson sampling, treasury pause. */

import { OUTREACH_PITCH_ANGLE_IDS, type OutreachPitchAngleId } from "./outreach-pitch-angles.ts";

export const FUNNEL_EVENTS = [
  "sent",
  "clicked",
  "dwell_ms",
  "help_sim_used",
  "checkout_opened",
  "dollar_unlocked",
  "mrr_active",
  "unsubscribed",
] as const;

export type FunnelEventKind = (typeof FUNNEL_EVENTS)[number];

/** Client beacons only — paid and unsubscribe events stay on signed webhooks. */
export const PUBLIC_FUNNEL_EVENTS: FunnelEventKind[] = [
  "clicked",
  "dwell_ms",
  "help_sim_used",
  "checkout_opened",
];

export const FUNNEL_ORDER: FunnelEventKind[] = [
  "sent",
  "clicked",
  "help_sim_used",
  "checkout_opened",
  "dollar_unlocked",
  "mrr_active",
];

export type FunnelEventInput = {
  leadId: string;
  event: FunnelEventKind;
  trade?: string;
  state?: string;
  city?: string;
  variantId?: string;
  dwellMs?: number;
  revenueCents?: number;
};

export function parseFunnelEvent(raw: unknown): FunnelEventKind | null {
  const value = String(raw || "").trim();
  return (FUNNEL_EVENTS as readonly string[]).includes(value) ? (value as FunnelEventKind) : null;
}

export function revenueForEvent(event: FunnelEventKind, overrideCents = 0): number {
  if (overrideCents > 0) return Math.round(overrideCents);
  if (event === "dollar_unlocked") return 100;
  if (event === "mrr_active") return 15000;
  return 0;
}

export type FunnelCounts = Record<FunnelEventKind, number> & { revenueCents: number; leads: number };

export function emptyFunnelCounts(): FunnelCounts {
  return {
    sent: 0,
    clicked: 0,
    dwell_ms: 0,
    help_sim_used: 0,
    checkout_opened: 0,
    dollar_unlocked: 0,
    mrr_active: 0,
    unsubscribed: 0,
    revenueCents: 0,
    leads: 0,
  };
}

export function clickToUnlockRate(counts: Pick<FunnelCounts, "clicked" | "dollar_unlocked">): number {
  if (counts.clicked <= 0) return 0;
  return Math.min(1, counts.dollar_unlocked / counts.clicked);
}

export function dropOffPoint(counts: FunnelCounts): FunnelEventKind | "none" {
  let prev = counts.sent;
  for (const step of FUNNEL_ORDER.slice(1)) {
    const next = counts[step];
    if (prev > 0 && next / prev < 0.45) return step;
    prev = Math.max(prev, next);
  }
  return "none";
}

export function revenuePerLead(counts: FunnelCounts): number {
  if (counts.leads <= 0) return 0;
  return counts.revenueCents / counts.leads;
}

export type ClimateRegion = "cold" | "warm" | "mixed";

const COLD_STATES = new Set([
  "OR", "WA", "PA", "NY", "NJ", "MI", "MN", "WI", "IL", "MA", "CT", "OH", "CO", "ID", "MT", "ME", "NH", "VT", "AK",
]);
const WARM_STATES = new Set(["TX", "FL", "CA", "AZ", "NV", "GA", "LA", "AL", "SC", "NC", "HI", "NM"]);

export function climateRegionForState(state: string): ClimateRegion {
  const key = state.trim().toUpperCase().slice(0, 2);
  if (COLD_STATES.has(key)) return "cold";
  if (WARM_STATES.has(key)) return "warm";
  return "mixed";
}

export type SeasonalTrade = "plumbing" | "hvac" | "electrical" | "auto";

export function seasonalTrades(now: Date, state: string): SeasonalTrade[] {
  const month = now.getUTCMonth() + 1;
  const winter = month === 11 || month === 12 || month <= 3;
  const summer = month >= 6 && month <= 8;
  const climate = climateRegionForState(state);
  if (winter && climate === "cold") return ["plumbing", "hvac", "electrical"];
  if (winter && climate === "warm") return ["plumbing", "hvac", "auto"];
  if (summer && climate === "warm") return ["hvac", "plumbing", "electrical"];
  if (summer && climate === "cold") return ["plumbing", "hvac", "auto"];
  return ["plumbing", "hvac", "electrical"];
}

export function pickSeasonalNiche(now: Date, states: string[]): SeasonalTrade {
  const scores: Record<SeasonalTrade, number> = { plumbing: 0.4, hvac: 0, electrical: 0, auto: 0 };
  const sample = states.length ? states : ["OR"];
  for (const state of sample) {
    seasonalTrades(now, state).forEach((trade, index) => {
      scores[trade] += 3 - index;
    });
  }
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as SeasonalTrade) || "plumbing";
}

export type BanditArm = {
  variantId: string;
  alpha: number;
  beta: number;
  impressions: number;
  conversions: number;
};

function gaussian(rng: () => number): number {
  const u = Math.max(1e-9, 1 - rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function sampleGamma(shape: number, rng: () => number): number {
  const k = Math.max(0.01, shape);
  if (k < 1) return sampleGamma(k + 1, rng) * Math.pow(Math.max(1e-9, rng()), 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (let i = 0; i < 40; i += 1) {
    let x = 0;
    let v = 0;
    do {
      x = gaussian(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
  return d;
}

export function sampleBeta(alpha: number, beta: number, rng: () => number): number {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  const sum = x + y;
  return sum <= 0 ? 0.5 : x / sum;
}

export function defaultBanditArms(): BanditArm[] {
  return OUTREACH_PITCH_ANGLE_IDS.map((variantId) => ({
    variantId,
    alpha: 1,
    beta: 1,
    impressions: 0,
    conversions: 0,
  }));
}

export function thompsonPick(arms: BanditArm[], rng: () => number): BanditArm {
  const list = arms.length ? arms : defaultBanditArms();
  let best = list[0]!;
  let bestScore = -1;
  for (const arm of list) {
    const score = sampleBeta(arm.alpha, arm.beta, rng);
    if (score > bestScore) {
      best = arm;
      bestScore = score;
    }
  }
  return best;
}

export function applyBanditReward(arm: BanditArm, converted: boolean): BanditArm {
  return {
    ...arm,
    impressions: arm.impressions + 1,
    conversions: arm.conversions + (converted ? 1 : 0),
    alpha: arm.alpha + (converted ? 1 : 0),
    beta: arm.beta + (converted ? 0 : 1),
  };
}

export function parsePitchVariant(raw: unknown): OutreachPitchAngleId {
  const id = String(raw || "").trim();
  return OUTREACH_PITCH_ANGLE_IDS.includes(id as OutreachPitchAngleId)
    ? (id as OutreachPitchAngleId)
    : "founder_video";
}

export const DEFAULT_TREASURY_CAPS = {
  twilioDailyCapCents: 4000,
  resendDailyCapCents: 1000,
  aiDailyCapCents: 2500,
  totalDailyCapCents: 6000,
};

export type TreasurySpend = {
  twilioCents: number;
  resendCents: number;
  aiCents: number;
  inflowCents: number;
};

export type TreasuryDecision = {
  pause: boolean;
  reason: string;
  totalSpendCents: number;
  marginCents: number;
};

export function treasuryDecision(
  spend: TreasurySpend,
  caps = DEFAULT_TREASURY_CAPS,
): TreasuryDecision {
  const totalSpendCents = spend.twilioCents + spend.resendCents + spend.aiCents;
  const marginCents = spend.inflowCents - totalSpendCents;
  if (spend.twilioCents > caps.twilioDailyCapCents) {
    return { pause: true, reason: "Twilio daily spend cap", totalSpendCents, marginCents };
  }
  if (spend.resendCents > caps.resendDailyCapCents) {
    return { pause: true, reason: "Resend daily spend cap", totalSpendCents, marginCents };
  }
  if (spend.aiCents > caps.aiDailyCapCents) {
    return { pause: true, reason: "AI daily spend cap", totalSpendCents, marginCents };
  }
  if (totalSpendCents > caps.totalDailyCapCents) {
    return { pause: true, reason: "Total daily spend cap", totalSpendCents, marginCents };
  }
  return { pause: false, reason: "", totalSpendCents, marginCents };
}

export const TWILIO_SMS_CENTS = 1;
export const RESEND_EMAIL_CENTS = 1;
export const AI_TURN_CENTS = 4;
