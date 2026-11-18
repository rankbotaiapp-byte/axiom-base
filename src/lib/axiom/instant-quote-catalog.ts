/** Demo-grade instant quote bands for storefront CRO (not binding estimates). */

export type InstantQuoteServiceId =
  | "plumbing_repair"
  | "roof_leak"
  | "ac_tuneup"
  | "drain_clear"
  | "panel_upgrade"
  | "general_dispatch";

export type InstantQuoteUrgencyId = "flexible" | "same_day" | "emergency";

export type InstantQuoteService = {
  id: InstantQuoteServiceId;
  label: string;
  detail: string;
  baseMin: number;
  baseMax: number;
};

export type InstantQuoteUrgency = {
  id: InstantQuoteUrgencyId;
  label: string;
  eta: string;
  multiplier: number;
};

export const INSTANT_QUOTE_URGENCIES: InstantQuoteUrgency[] = [
  { id: "flexible", label: "Flexible window", eta: "2–5 days", multiplier: 1 },
  { id: "same_day", label: "Same-day priority", eta: "Today", multiplier: 1.12 },
  { id: "emergency", label: "Emergency dispatch", eta: "Under 45 min", multiplier: 1.32 },
];

const CORE_SERVICES: InstantQuoteService[] = [
  {
    id: "plumbing_repair",
    label: "Plumbing Repair",
    detail: "Leaks, fixtures, shutoffs, line diagnostics.",
    baseMin: 149,
    baseMax: 420,
  },
  {
    id: "roof_leak",
    label: "Roof Leak",
    detail: "Active leak triage, tarp, patch, moisture trace.",
    baseMin: 225,
    baseMax: 890,
  },
  {
    id: "ac_tuneup",
    label: "AC Tune-Up",
    detail: "Seasonal tune, refrigerant check, airflow balance.",
    baseMin: 129,
    baseMax: 310,
  },
  {
    id: "drain_clear",
    label: "Drain Clearing",
    detail: "Mainline, kitchen, tub, camera when needed.",
    baseMin: 159,
    baseMax: 480,
  },
  {
    id: "panel_upgrade",
    label: "Electrical Panel",
    detail: "Breaker trips, sub-panel, EV-ready upgrades.",
    baseMin: 285,
    baseMax: 1200,
  },
  {
    id: "general_dispatch",
    label: "General Dispatch",
    detail: "Describe the job — Axiom routes the right tech.",
    baseMin: 99,
    baseMax: 350,
  },
];

export function quoteServicesForNiche(niche?: string | null): InstantQuoteService[] {
  const n = (niche || "").toLowerCase();
  if (n.includes("plumb")) {
    return [CORE_SERVICES[0], CORE_SERVICES[3], CORE_SERVICES[2], CORE_SERVICES[5]];
  }
  if (n.includes("roof") || n.includes("general")) {
    return [CORE_SERVICES[1], CORE_SERVICES[0], CORE_SERVICES[5]];
  }
  if (n.includes("hvac") || n.includes("electric")) {
    return [CORE_SERVICES[2], CORE_SERVICES[4], CORE_SERVICES[5]];
  }
  return [CORE_SERVICES[0], CORE_SERVICES[1], CORE_SERVICES[2], CORE_SERVICES[5]];
}

export type InstantQuoteSelection = {
  serviceId: InstantQuoteServiceId;
  urgencyId: InstantQuoteUrgencyId;
  min: number;
  max: number;
  serviceLabel: string;
  urgencyLabel: string;
};

export function computeInstantQuote(
  service: InstantQuoteService,
  urgency: InstantQuoteUrgency,
): { min: number; max: number } {
  const min = Math.round(service.baseMin * urgency.multiplier);
  const max = Math.round(service.baseMax * urgency.multiplier);
  return { min, max };
}

export function formatQuoteRange(min: number, max: number): string {
  return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
}

/** Stable “live dispatch” count for social proof (varies by city + day). */
export function dispatchedTodayCount(city: string, day = new Date()): number {
  const key = `${city.trim().toLowerCase()}:${day.toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return 2 + (Math.abs(hash) % 5);
}