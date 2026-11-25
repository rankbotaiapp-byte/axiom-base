/** Dataset inspector + outreach presentation + storefront neon schemes. */

export const VISUAL_MODE_CUSTOM = "custom_hero";
export const VISUAL_MODE_SAMPLE = "sample_loop";
export const VISUAL_STATUS_APPROVED = "approved";
export const VISUAL_STATUS_UNVERIFIED = "unverified";

export type LeadVisualMode = typeof VISUAL_MODE_CUSTOM | typeof VISUAL_MODE_SAMPLE;
export type LeadVisualStatus = typeof VISUAL_STATUS_APPROVED | typeof VISUAL_STATUS_UNVERIFIED | "pending";

export type DatasetInspectorFilter = {
  hasPhone?: boolean;
  hasDatasetImages?: boolean;
  unverified?: boolean;
};

export type DatasetBatchRow = {
  id: string;
  source: string;
  county: string;
  tradeType: string;
  leadCount: number;
};

export type DatasetLeadRecord = {
  id: string;
  leadSlug: string;
  businessName: string;
  tradeType: string;
  tradeLabel: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  streetAddress: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
  website: string;
  source: string;
  claimed: boolean;
  datasetImages: string[];
  heroImageUrl: string;
  heroVideoUrl: string;
  visualMode: LeadVisualMode;
  visualStatus: LeadVisualStatus;
  phoneE164?: string;
  lineType?: string;
  carrierName?: string;
  verifiedCallerName?: string;
  phoneVerifiedAt?: string;
  heroImageStatus?: string;
  heroImageWidth?: number | null;
  primeScore?: number;
  qaApproved?: boolean;
  qaNotes?: string;
};

export const SHOWCASE_THEME_IDS = ["solar_gold", "pure_cyan", "emergency_amber", "cobalt_ice"] as const;
export type ShowcaseThemeId = (typeof SHOWCASE_THEME_IDS)[number];

export type ShowcaseTheme = {
  id: ShowcaseThemeId;
  label: string;
  ring: string;
  ringHot: string;
  call: string;
  book: string;
  cyan: string;
  obsidian: string;
};

export const SHOWCASE_THEMES: Record<ShowcaseThemeId, ShowcaseTheme> = {
  solar_gold: {
    id: "solar_gold",
    label: "Yellow / Solar Gold + Electric Cyan",
    ring: "#FFE500",
    ringHot: "#FF9900",
    call: "#FF9900",
    book: "#00ffcc",
    cyan: "#00ffcc",
    obsidian: "#050507",
  },
  pure_cyan: {
    id: "pure_cyan",
    label: "Pure Cyan",
    ring: "#00ffcc",
    ringHot: "#00f2fe",
    call: "#00f2fe",
    book: "#00ffcc",
    cyan: "#00ffcc",
    obsidian: "#050507",
  },
  emergency_amber: {
    id: "emergency_amber",
    label: "Emergency Amber / Red",
    ring: "#FF9900",
    ringHot: "#ff2a3d",
    call: "#ff2a3d",
    book: "#FF9900",
    cyan: "#00ffcc",
    obsidian: "#050507",
  },
  cobalt_ice: {
    id: "cobalt_ice",
    label: "Cobalt / Ice",
    ring: "#3d7eff",
    ringHot: "#7ec8ff",
    call: "#3d7eff",
    book: "#7ec8ff",
    cyan: "#00ffcc",
    obsidian: "#050507",
  },
};

export const DEFAULT_SHOWCASE_THEME_ID: ShowcaseThemeId = "solar_gold";

export function parseShowcaseThemeId(value: unknown): ShowcaseThemeId {
  const raw = String(value ?? "").trim();
  return (SHOWCASE_THEME_IDS as readonly string[]).includes(raw) ? (raw as ShowcaseThemeId) : DEFAULT_SHOWCASE_THEME_ID;
}

export function showcaseTheme(value: unknown): ShowcaseTheme {
  return SHOWCASE_THEMES[parseShowcaseThemeId(value)];
}

export function parseVisualMode(value: unknown): LeadVisualMode {
  return String(value ?? "").trim() === VISUAL_MODE_CUSTOM ? VISUAL_MODE_CUSTOM : VISUAL_MODE_SAMPLE;
}

export function parseVisualStatus(value: unknown): LeadVisualStatus {
  const raw = String(value ?? "").trim();
  if (raw === VISUAL_STATUS_APPROVED) return VISUAL_STATUS_APPROVED;
  if (raw === "pending") return "pending";
  return VISUAL_STATUS_UNVERIFIED;
}

export function parseDatasetImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 4).slice(0, 12);
  }
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      return parseDatasetImages(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  return [];
}

export function leadHasPhone(lead: { contactPhone?: string | null }): boolean {
  return (lead.contactPhone ?? "").replace(/\D/g, "").length >= 10;
}

export function leadHasDatasetImages(lead: { datasetImages?: string[]; heroImageUrl?: string }): boolean {
  return (lead.datasetImages?.length ?? 0) > 0 || Boolean((lead.heroImageUrl ?? "").trim());
}

export function leadIsUnverified(lead: { visualStatus?: string; visualMode?: string }): boolean {
  return parseVisualStatus(lead.visualStatus) !== VISUAL_STATUS_APPROVED || parseVisualMode(lead.visualMode) !== VISUAL_MODE_CUSTOM;
}

export function matchDatasetInspectorFilters(lead: DatasetLeadRecord, filters: DatasetInspectorFilter): boolean {
  if (filters.hasPhone && !leadHasPhone(lead)) return false;
  if (filters.hasDatasetImages && !leadHasDatasetImages(lead)) return false;
  if (filters.unverified && !leadIsUnverified(lead)) return false;
  return true;
}

export function industrialNoirHeroDirective(shopName: string): string {
  const name = shopName.replace(/\s+/g, " ").trim().slice(0, 80);
  return [
    "Axiom industrial-noir hero pipeline.",
    "Remove clutter, trash, extra people, and competing signage from the source photograph.",
    `Exact business name signage, illuminated, matching the tenant: ${name}.`,
    "Cyan #00ffcc and amber #FFE500 rim lighting on the vehicle or storefront.",
    "Locked camera. Subtle environmental motion only — dust in worklights or rain streaks, never a camera move.",
  ].join(" ");
}

export type OutreachPresentation = {
  visualMode: LeadVisualMode;
  sms: string;
  emailSubject: string;
  emailBody: string;
};

export function outreachPresentationForVisualMode(mode: unknown): OutreachPresentation {
  const visualMode = parseVisualMode(mode);
  if (visualMode === VISUAL_MODE_CUSTOM) {
    return {
      visualMode,
      sms:
        "{business} — we took your actual shop/truck photo and turned it into a custom night-shift live booking preview. Open it: {{claimUrl}}",
      emailSubject: "{business} — your shop photo is now a night-shift booking preview",
      emailBody:
        "Hi {owner},\n\nWe took the actual shop/truck photograph on file for {business} and rebuilt it as a custom night-shift live booking preview.\n\nOpen the preview (this is your building, not a stock plate):\n{{claimUrl}}\n",
    };
  }
  return {
    visualMode,
    sms:
      "{business} — AI concept for your trade: sample shop and van, not your building. Preview: {{claimUrl}}",
    emailSubject: "{business} — AI concept preview (sample shop and van)",
    emailBody:
      "Hi {owner},\n\nThis is an AI concept — sample shop and van, not your building.\n\nSee the sample booking preview:\n{{claimUrl}}\n",
  };
}

export function applyClaimUrl(template: string, claimUrl: string): string {
  return template.replaceAll("{{claimUrl}}", claimUrl).replaceAll("{claimUrl}", claimUrl);
}
