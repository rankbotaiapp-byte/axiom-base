/** Pure scoring + phone/media helpers for master lead verification. */

export const PRIME_SCORE_THRESHOLD = 75;
export const HERO_MIN_WIDTH = 1200;

export const SMS_CAPABLE_LINE_TYPES = ["mobile", "nonFixedVoip"] as const;
export const LINE_TYPES = ["mobile", "landline", "fixedVoip", "nonFixedVoip", "unknown"] as const;
export const HERO_IMAGE_STATUSES = ["unchecked", "valid", "missing", "low_res", "regenerated"] as const;

export type CommandLeadFilter = "all" | "prime" | "prime_candidates" | "needs_hero" | "needs_phone";
export type CommandLeadNiche = "plumbing" | "electrical" | "hvac" | "all";

export const COMMAND_NICHES: { id: CommandLeadNiche; label: string }[] = [
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "hvac", label: "HVAC" },
  { id: "all", label: "All trades" },
];

export function featuredCommandRank(businessName: string): number {
  const name = String(businessName ?? "").toLowerCase();
  if (/stedfast/.test(name) && /plumb/.test(name)) return 0;
  if (/grants\s*pass/.test(name) && /electric/.test(name)) return 1;
  return 90;
}

export function commandLeadMatchesSearch(
  lead: { businessName?: string; city?: string; contactPhone?: string; contactName?: string; tradeType?: string },
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [lead.businessName, lead.city, lead.contactPhone, lead.contactName, lead.tradeType]
    .map((value) => String(value ?? "").toLowerCase())
    .some((value) => value.includes(q));
}

export function commandLeadMatchesNiche(
  lead: { tradeType?: string; tradeLabel?: string; businessName?: string },
  niche: CommandLeadNiche,
): boolean {
  if (niche === "all") return true;
  const hay = `${lead.tradeType ?? ""} ${lead.tradeLabel ?? ""} ${lead.businessName ?? ""}`.toLowerCase();
  if (niche === "plumbing") return /plumb|drain|sewer|water/.test(hay);
  if (niche === "electrical") return /electric/.test(hay);
  return /hvac|heat|furnace|air\s*cond/.test(hay);
}

export function sortCommandLeads<T extends { businessName: string; tradeType?: string; primeScore?: number }>(
  leads: T[],
  niche: CommandLeadNiche,
  search: string,
): T[] {
  const q = search.trim().toLowerCase();
  return [...leads].sort((a, b) => {
    const aHit = q && commandLeadMatchesSearch(a, q) ? 0 : 1;
    const bHit = q && commandLeadMatchesSearch(b, q) ? 0 : 1;
    if (aHit !== bHit) return aHit - bHit;
    const featured = featuredCommandRank(a.businessName) - featuredCommandRank(b.businessName);
    if (featured !== 0) return featured;
    const aPlumb = commandLeadMatchesNiche(a, "plumbing") ? 0 : 1;
    const bPlumb = commandLeadMatchesNiche(b, "plumbing") ? 0 : 1;
    if (niche === "all" && aPlumb !== bPlumb) return aPlumb - bPlumb;
    return Number(b.primeScore ?? 0) - Number(a.primeScore ?? 0);
  });
}

export type SmsCapableLineType = (typeof SMS_CAPABLE_LINE_TYPES)[number];
export type LeadLineType = (typeof LINE_TYPES)[number];
export type HeroImageStatus = (typeof HERO_IMAGE_STATUSES)[number];

export type PrimeScoreInput = {
  lineType?: string | null;
  verifiedCallerName?: string | null;
  businessName?: string | null;
  heroImageStatus?: string | null;
  email?: string | null;
  website?: string | null;
  hasWebsite?: boolean | null;
  reviewCount?: number | null;
  reviewScore?: number | null;
};

export type PrimeScoreBreakdown = {
  smsCapable: number;
  callerName: number;
  hero: number;
  email: number;
  webOrReviews: number;
  total: number;
};

export function parseLeadLineType(value: unknown): LeadLineType {
  const raw = String(value ?? "").trim();
  if (raw === "mobile" || raw === "landline" || raw === "fixedVoip" || raw === "nonFixedVoip") return raw;
  const lower = raw.toLowerCase();
  if (lower === "nonfixedvoip" || lower === "non_fixed_voip") return "nonFixedVoip";
  if (lower === "fixedvoip" || lower === "fixed_voip") return "fixedVoip";
  return "unknown";
}

export function parseHeroImageStatus(value: unknown): HeroImageStatus {
  const raw = String(value ?? "").trim();
  return (HERO_IMAGE_STATUSES as readonly string[]).includes(raw) ? (raw as HeroImageStatus) : "unchecked";
}

export function isSmsCapableLineType(value: unknown): boolean {
  const line = parseLeadLineType(value);
  return line === "mobile" || line === "nonFixedVoip";
}

export function normalizeUsE164(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function isValidEmail(value: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function foldName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(llc|inc|co|company|the|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function callerNameMatchesBusiness(callerName: string | null | undefined, businessName: string | null | undefined): boolean {
  const caller = foldName(callerName ?? "");
  const business = foldName(businessName ?? "");
  if (caller.length < 3 || business.length < 3) return false;
  return caller.includes(business) || business.includes(caller);
}

export function hasWebOrReviews(input: PrimeScoreInput): boolean {
  if (input.hasWebsite) return true;
  if (String(input.website ?? "").trim().length > 4) return true;
  const reviews = Number(input.reviewCount ?? 0);
  const score = Number(input.reviewScore ?? 0);
  return reviews > 0 || score > 0;
}

export function computePrimeScore(input: PrimeScoreInput): PrimeScoreBreakdown {
  const smsCapable = isSmsCapableLineType(input.lineType) ? 35 : 0;
  const callerName = callerNameMatchesBusiness(input.verifiedCallerName, input.businessName) ? 20 : 0;
  const heroStatus = parseHeroImageStatus(input.heroImageStatus);
  const hero = heroStatus === "valid" || heroStatus === "regenerated" ? 20 : 0;
  const email = isValidEmail(input.email) ? 15 : 0;
  const webOrReviews = hasWebOrReviews(input) ? 10 : 0;
  const total = Math.min(100, smsCapable + callerName + hero + email + webOrReviews);
  return { smsCapable, callerName, hero, email, webOrReviews, total };
}

export function isPrimeAutopilotReady(input: {
  primeScore?: number | null;
  qaApproved?: boolean | null;
  heroImageStatus?: string | null;
}): boolean {
  if (input.qaApproved) return Number(input.primeScore ?? 0) >= PRIME_SCORE_THRESHOLD;
  const hero = parseHeroImageStatus(input.heroImageStatus);
  return Number(input.primeScore ?? 0) >= PRIME_SCORE_THRESHOLD && (hero === "valid" || hero === "regenerated");
}

/** JPEG SOF / PNG IHDR / WebP VP8L width from a file prefix. */
export function readImageWidthFromBytes(bytes: Uint8Array): number | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
  }
  if (bytes.length > 12 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1]!;
      if (marker === 0xd8 || marker === 0xd9) {
        i += 2;
        continue;
      }
      const size = (bytes[i + 2]! << 8) | bytes[i + 3]!;
      if (marker >= 0xc0 && marker <= 0xc3) {
        return (bytes[i + 7]! << 8) | bytes[i + 8]!;
      }
      i += 2 + size;
    }
  }
  if (bytes.length > 30 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        const bits = bytes[26]! | (bytes[27]! << 8) | (bytes[28]! << 16);
        return (bits & 0x3fff) + 1;
      }
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
        const bits = bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24);
        return (bits & 0x3fff) + 1;
      }
    }
  }
  return null;
}
