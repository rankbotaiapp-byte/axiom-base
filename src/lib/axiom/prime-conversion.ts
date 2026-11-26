/**
 * Prime Conversion & Hero Candidates: score preloaded leads from fields
 * already on the record (no extra crawl). Pure helpers for desk filters
 * and batch pull.
 */

export type CommandLeadNiche = "plumbing" | "electrical" | "hvac" | "all";

function listedPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

function validEmail(value: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function smsCapable(lineType: string | null | undefined): boolean {
  const line = String(lineType ?? "").toLowerCase().replace(/_/g, "");
  return line === "mobile" || line === "nonfixedvoip";
}

function matchesNiche(
  lead: { tradeType?: string | null; tradeLabel?: string | null; businessName?: string | null },
  niche: CommandLeadNiche,
): boolean {
  if (niche === "all") return true;
  const hay = `${lead.tradeType ?? ""} ${lead.tradeLabel ?? ""} ${lead.businessName ?? ""}`.toLowerCase();
  if (niche === "plumbing") return /plumb|drain|sewer|water/.test(hay);
  if (niche === "electrical") return /electric/.test(hay);
  return /hvac|heat|furnace|air\s*cond/.test(hay);
}

function pickChannel(input: {
  canSms: boolean;
  canEmail: boolean;
  smsRemaining: number;
  emailRemaining: number;
}): "sms" | "email" | null {
  const sms = input.canSms && input.smsRemaining > 0;
  const email = input.canEmail && input.emailRemaining > 0;
  if (email) return "email";
  if (sms) return "sms";
  return null;
}

export const PRIME_CANDIDATE_THRESHOLD = 62;
export const PRIME_READY_THRESHOLD = 75;
export const PRIME_BATCH_PULL_DEFAULT = 12;
export const PRIME_BATCH_PULL_MAX = 25;
export const PRIME_HERO_COMPILE_MAX = 6;

export const PRIME_REASON = {
  webImage: "Has Web Image to Recreate",
  mobileLine: "Mobile/Direct Line",
  emergency: "Emergency/24-7 Demand",
  noBooking: "No Online Booking Detected",
  reviews: "Established Review Base",
  website: "Website / Social URL",
  contact: "Complete Contact Card",
  fallbackHero: "Needs Fallback Hero Loop",
} as const;

export type PrimeReasonTag = (typeof PRIME_REASON)[keyof typeof PRIME_REASON];

export type PrimeConversionInput = {
  id?: string;
  businessName?: string | null;
  tradeType?: string | null;
  tradeLabel?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  website?: string | null;
  hasWebsite?: boolean | null;
  datasetImages?: string[] | null;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
  lineType?: string | null;
  reviewCount?: number | null;
  reviewScore?: number | null;
  qaNotes?: string | null;
};

export type PrimeConversionResult = {
  score: number;
  reasons: PrimeReasonTag[];
  hasSourceImage: boolean;
  hasDirectLine: boolean;
  hasWebsiteOrSocial: boolean;
  hasBookingSignal: boolean;
  hasEmergencyDemand: boolean;
  hasReviewBase: boolean;
  contactComplete: boolean;
};

const BOOKING_RE = /\b(book|booking|schedule|appoint|reservation|request.?a.?quote|online.?estimat)\b/i;
const EMERGENCY_RE = /\b(24\s*\/?\s*7|24-7|247|after.?hours|emergency|same.?day|night.?shift|on.?call)\b/i;
const SOCIAL_RE = /facebook\.com|fb\.com|instagram\.com|yelp\.com|google\.com\/maps|gbp\.|linkedin\.com/i;

function haystack(input: PrimeConversionInput): string {
  return [
    input.businessName,
    input.tradeType,
    input.tradeLabel,
    input.website,
    input.qaNotes,
    input.contactName,
  ]
    .map((value) => String(value ?? ""))
    .join(" ");
}

export function leadHasSourceImage(input: PrimeConversionInput): boolean {
  const images = input.datasetImages ?? [];
  return images.some((url) => String(url).trim().length > 4) || Boolean(String(input.heroImageUrl ?? "").trim());
}

export function leadHasWebsiteOrSocial(input: PrimeConversionInput): boolean {
  const site = String(input.website ?? "").trim();
  if (input.hasWebsite) return true;
  if (site.length > 4) return true;
  return SOCIAL_RE.test(haystack(input));
}

export function leadHasBookingSignal(input: PrimeConversionInput): boolean {
  return BOOKING_RE.test(haystack(input)) || BOOKING_RE.test(String(input.website ?? ""));
}

export function leadHasEmergencyDemand(input: PrimeConversionInput): boolean {
  return EMERGENCY_RE.test(haystack(input));
}

export function leadHasReviewBase(input: PrimeConversionInput): boolean {
  const count = Number(input.reviewCount ?? 0);
  const rating = Number(input.reviewScore ?? 0);
  return count >= 5 || (count >= 1 && rating >= 4);
}

export function leadContactComplete(input: PrimeConversionInput): boolean {
  const phone = listedPhone(String(input.contactPhone ?? ""));
  const email = validEmail(input.contactEmail);
  const place = Boolean(String(input.city ?? "").trim() || String(input.streetAddress ?? "").trim());
  const name = Boolean(String(input.contactName ?? "").trim() || String(input.businessName ?? "").trim());
  return phone && name && (email || place);
}

export function evaluatePrimeCandidate(input: PrimeConversionInput): PrimeConversionResult {
  const hasSourceImage = leadHasSourceImage(input);
  const hasDirectLine = smsCapable(input.lineType) || listedPhone(String(input.contactPhone ?? ""));
  const hasWebsiteOrSocial = leadHasWebsiteOrSocial(input);
  const hasBookingSignal = leadHasBookingSignal(input);
  const hasEmergencyDemand = leadHasEmergencyDemand(input);
  const hasReviewBase = leadHasReviewBase(input);
  const contactComplete = leadContactComplete(input);

  let score = 0;
  const reasons: PrimeReasonTag[] = [];

  if (hasDirectLine) {
    score += smsCapable(input.lineType) ? 20 : 12;
    reasons.push(PRIME_REASON.mobileLine);
  }
  if (hasSourceImage) {
    score += 20;
    reasons.push(PRIME_REASON.webImage);
  } else {
    reasons.push(PRIME_REASON.fallbackHero);
  }
  if (hasWebsiteOrSocial) {
    score += 12;
    reasons.push(PRIME_REASON.website);
  }
  if (hasReviewBase) {
    score += 15;
    reasons.push(PRIME_REASON.reviews);
  }
  if (hasEmergencyDemand) {
    score += 15;
    reasons.push(PRIME_REASON.emergency);
  }
  if (!hasBookingSignal) {
    score += 10;
    reasons.push(PRIME_REASON.noBooking);
  }
  if (contactComplete) {
    score += 8;
    reasons.push(PRIME_REASON.contact);
  }

  return {
    score: Math.min(100, score),
    reasons,
    hasSourceImage,
    hasDirectLine,
    hasWebsiteOrSocial,
    hasBookingSignal,
    hasEmergencyDemand,
    hasReviewBase,
    contactComplete,
  };
}

export function isPrimeCandidate(input: PrimeConversionInput, minScore = PRIME_CANDIDATE_THRESHOLD): boolean {
  return evaluatePrimeCandidate(input).score >= minScore;
}

export function parsePrimeBatchLimit(value: unknown, fallback = PRIME_BATCH_PULL_DEFAULT): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(PRIME_BATCH_PULL_MAX, Math.max(1, Math.round(n)));
}

export function selectTopPrimeCandidates<T extends PrimeConversionInput & { id: string; tradeType?: string; tradeLabel?: string; businessName?: string }>(
  leads: readonly T[],
  opts: { niche?: CommandLeadNiche; limit?: unknown; minScore?: number } = {},
): T[] {
  const niche = opts.niche ?? "plumbing";
  const minScore = opts.minScore ?? PRIME_CANDIDATE_THRESHOLD;
  const limit = parsePrimeBatchLimit(opts.limit);
  return [...leads]
    .filter((lead) => matchesNiche(lead, niche))
    .map((lead) => ({ lead, eval: evaluatePrimeCandidate(lead) }))
    .filter((row) => row.eval.score >= minScore)
    .sort(
      (a, b) =>
        b.eval.score - a.eval.score || String(a.lead.businessName ?? "").localeCompare(String(b.lead.businessName ?? "")),
    )
    .slice(0, limit)
    .map((row) => row.lead);
}

export type PrimeBatchPlan = {
  heroRecreateIds: string[];
  fallbackHeroIds: string[];
  outreach: Array<{ id: string; channel: "sms" | "email" }>;
  skippedOutreach: Array<{ id: string; reason: string }>;
};

export function planPrimeBatch<
  T extends PrimeConversionInput & {
    id: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    lineType?: string | null;
  },
>(
  leads: readonly T[],
  opts: {
    selectedIds: readonly string[];
    smsRemaining: number;
    emailRemaining: number;
    heroCompileMax?: number;
  },
): PrimeBatchPlan {
  const chosen = new Set(opts.selectedIds.map((id) => id.trim()).filter(Boolean));
  const rows = leads.filter((lead) => chosen.has(lead.id));
  const heroCompileMax = Math.min(PRIME_HERO_COMPILE_MAX, Math.max(0, opts.heroCompileMax ?? PRIME_HERO_COMPILE_MAX));
  const heroRecreateIds: string[] = [];
  const fallbackHeroIds: string[] = [];
  for (const lead of rows) {
    if (leadHasSourceImage(lead)) {
      if (heroRecreateIds.length < heroCompileMax) heroRecreateIds.push(lead.id);
    } else {
      fallbackHeroIds.push(lead.id);
    }
  }

  const rooms = {
    sms: Math.max(0, Math.floor(opts.smsRemaining)),
    email: Math.max(0, Math.floor(opts.emailRemaining)),
  };
  const outreach: PrimeBatchPlan["outreach"] = [];
  const skippedOutreach: PrimeBatchPlan["skippedOutreach"] = [];
  for (const lead of rows) {
    const channel = pickChannel({
      canSms: listedPhone(String(lead.contactPhone ?? "")) && !["landline", "fixedVoip"].includes(String(lead.lineType ?? "")),
      canEmail: validEmail(lead.contactEmail),
      smsRemaining: rooms.sms,
      emailRemaining: rooms.email,
    });
    if (!channel) {
      skippedOutreach.push({
        id: lead.id,
        reason: rooms.sms <= 0 && rooms.email <= 0 ? "Daily outreach cap reached" : "No SMS or email destination",
      });
      continue;
    }
    if (channel === "sms") rooms.sms -= 1;
    else rooms.email -= 1;
    outreach.push({ id: lead.id, channel });
  }

  return { heroRecreateIds, fallbackHeroIds, outreach, skippedOutreach };
}
