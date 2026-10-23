import { sanitizeAccent, sanitizeContactLine, sanitizeLogoUrl } from "./prospect-brand.ts";

/** Saved on the visitor's browser until onboarding claims the business. */
export const LEAD_STORAGE_KEY = "axiom.lead";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type FunnelQuery = {
  leadSlug: string;
  utmSource: string;
  county: string;
  stopToken: string;
};

export type FunnelSearch = {
  b?: string;
  utm_source?: string;
  county?: string;
  lead_slug?: string;
  t?: string;
  pitch?: boolean;
  session_id?: string;
  greet?: boolean;
  preview?: boolean;
  business?: string;
  biz?: string;
  trade?: string;
  city?: string;
  logo?: string;
  accent?: string;
  phone?: string;
  email?: string;
};

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function isLeadSlug(value: string): boolean {
  return SLUG.test(value);
}

/** Business + city becomes the tracking slug. */
export function leadSlugFrom(businessName: string, city: string): string {
  const raw = `${businessName} ${city}`
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return raw || "lead";
}

export function parseFunnelQuery(source: Record<string, unknown>): FunnelQuery {
  const fromB = clip(source.b, 64).toLowerCase();
  const fromLead = clip(source.lead_slug, 64).toLowerCase();
  const leadSlug = isLeadSlug(fromB) ? fromB : isLeadSlug(fromLead) ? fromLead : "";
  const stopToken = clip(source.t, 80).toLowerCase();
  return {
    leadSlug,
    utmSource: clip(source.utm_source, 80),
    county: clip(source.county, 80),
    stopToken: /^[a-f0-9]{32,80}$/.test(stopToken) ? stopToken : "",
  };
}

/** Optional keys only, so existing links to the homepage stay valid. */
export function parseFunnelSearch(source: Record<string, unknown>): FunnelSearch {
  const query = parseFunnelQuery(source);
  return {
    ...(query.leadSlug ? { b: query.leadSlug, lead_slug: query.leadSlug } : {}),
    ...(query.utmSource ? { utm_source: query.utmSource } : {}),
    ...(query.county ? { county: query.county } : {}),
    ...(query.stopToken ? { t: query.stopToken } : {}),
    ...(source.pitch === true || source.pitch === "1" || source.pitch === "true" ? { pitch: true as const } : {}),
    ...(source.greet === true || source.greet === "1" || source.greet === "true" ? { greet: true as const } : {}),
    ...(source.preview === true || source.preview === "1" || source.preview === "true" ? { preview: true as const } : {}),
    ...(clip(source.business, 80) ? { business: clip(source.business, 80) } : {}),
    ...(clip(source.biz, 80) ? { biz: clip(source.biz, 80) } : {}),
    ...(clip(source.trade, 80) ? { trade: clip(source.trade, 80) } : {}),
    ...(clip(source.city, 80) ? { city: clip(source.city, 80) } : {}),
    ...(sanitizeLogoUrl(source.logo) ? { logo: sanitizeLogoUrl(source.logo) } : {}),
    ...(sanitizeAccent(source.accent) ? { accent: sanitizeAccent(source.accent) } : {}),
    ...(sanitizeContactLine(source.phone, 40) ? { phone: sanitizeContactLine(source.phone, 40) } : {}),
    ...(sanitizeContactLine(source.email, 120) ? { email: sanitizeContactLine(source.email, 120) } : {}),
    ...(/^cs_[A-Za-z0-9_]+$/.test(clip(source.session_id, 80))
      ? { session_id: clip(source.session_id, 80) }
      : {}),
  };
}

/**
 * Canonical regional link. `b` is the lead slug. County and source ride along
 * so a visit can be tied back to the campaign that printed the link.
 */
export const DEFAULT_OUTREACH_TEMPLATE =
  "Hi {business} — a booking page is waiting for you.\n{url}";

export const OUTREACH_STRATEGIES = [
  {
    id: "done-for-you",
    label: "Done-For-You Hook",
    line: "The booking page is already built. They only claim it.",
    text: "{owner} — {business} has {website}. A {trade} booking page for {city} is already built. Claim it before another shop in {county} does.\n{url}\nAsk Eric greets {business} on that page.",
    emailSubject: "{owner}, the {business} page is already live",
    emailBody:
      "Hi {owner},\n\n{business} has {website}. The {trade} page for {city} is built, ahead of the other shops in {county}. Reviews on file: {reviews}.\n\nClaim it here:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOnce you open it, the page is yours.",
  },
  {
    id: "missed-calls",
    label: "Missed Calls Hook",
    line: "A call they miss while with a client becomes a booking.",
    text: "{owner}, calls to the {line} at {business} go quiet mid-appointment. Your {trade} page in {city} takes the request.\n{url}\nAsk Eric greets {business} on that page.",
    emailSubject: "The {line} at {business} didn't pick up",
    emailBody:
      "Hi {owner},\n\nWhile you're with a client, the {line} at {business} goes to voicemail and that {trade} job walks to the next shop in {county}.\n\nThis page takes the booking instead:\n{url}\n\nAsk Eric greets {business} on that page.\n\nThey pick a time. You see it when you're free.",
  },
  {
    id: "competitor-edge",
    label: "Competitor Edge Hook",
    line: "Other shops in the county already take the online book.",
    text: "{owner} — other {trade} shops in {county} are taking the online book. {business} is listed with {reviews} and {website}.\n{url}\nAsk Eric greets {business} on that page.",
    emailSubject: "{county} shops are ahead of {business}",
    emailBody:
      "Hi {owner},\n\nPeople in {county} already book {trade} work without calling. {business} is listed with {reviews} and {website}.\n\nYour page is ready:\n{url}\n\nAsk Eric greets {business} on that page.\n\nOpen it and the link is yours.",
  },
] as const;

export type OutreachStrategyId = (typeof OUTREACH_STRATEGIES)[number]["id"];

export function outreachStrategy(id: string) {
  return OUTREACH_STRATEGIES.find((item) => item.id === id) ?? OUTREACH_STRATEGIES[0];
}

export type PhoneLine = "" | "mobile" | "landline";

export type PublicLead = {
  contactName: string;
  reviewScore: number | null;
  reviewCount: number | null;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
};

export function parsePhoneLine(value: unknown): PhoneLine {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "" || raw === "unknown") return "";
  if (raw === "mobile" || raw === "cell") return "mobile";
  if (raw === "landline" || raw === "land line") return "landline";
  throw new Error("Phone line must be mobile or landline");
}

export function parseHasWebsite(value: unknown): boolean | null {
  if (value == null || value === "" || value === "unknown") return null;
  if (typeof value === "boolean") return value;
  const raw = String(value).trim().toLowerCase();
  if (raw === "yes" || raw === "true") return true;
  if (raw === "no" || raw === "false") return false;
  throw new Error("Website status must be yes or no");
}

export function parseReviewScore(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > 5) throw new Error("Review score must be between 0 and 5");
  return Math.round(n * 10) / 10;
}

export function parseReviewCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new Error("Review count must be a whole number");
  return n;
}

function readScore(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function readCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function publicLeadFromRow(row: {
  contact_name?: string | null;
  review_score?: unknown;
  review_count?: unknown;
  has_website?: unknown;
  phone_line?: string | null;
}): PublicLead {
  const line = String(row.phone_line ?? "").trim().toLowerCase();
  return {
    contactName: (row.contact_name ?? "").trim(),
    reviewScore: readScore(row.review_score),
    reviewCount: readCount(row.review_count),
    hasWebsite: typeof row.has_website === "boolean" ? row.has_website : null,
    phoneLine: line === "mobile" || line === "landline" ? line : "",
  };
}

export function outreachPublicTokens(facts: PublicLead, business: string) {
  const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
  const reviews =
    facts.reviewScore == null
      ? "no public reviews"
      : facts.reviewCount == null
        ? `${score} on public reviews`
        : `${score} from ${facts.reviewCount} reviews`;
  const website =
    facts.hasWebsite == null ? "no website listed" : facts.hasWebsite ? "a website already up" : "no website";
  const line = facts.phoneLine === "mobile" ? "mobile" : facts.phoneLine === "landline" ? "landline" : "listed number";
  return {
    owner: facts.contactName || business || "{owner}",
    reviews,
    website,
    line,
  };
}

const EMAIL_READY = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/** A lead is email-ready only when the address is present and shaped like one. */
export function isEmailReady(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 120) return false;
  return EMAIL_READY.test(email);
}

/** A lead is SMS-ready only when the listed line is classified as mobile. */
export function isSmsReady(phoneLine: string): boolean {
  return phoneLine === "mobile";
}

export function leadChannelTags(lead: { contactEmail: string; phoneLine: string }): string[] {
  const tags: string[] = [];
  if (isSmsReady(lead.phoneLine)) tags.push("SMS-ready");
  if (isEmailReady(lead.contactEmail)) tags.push("Email-ready");
  if (tags.length === 0) tags.push("No channel");
  return tags;
}

/** Short labels for the lead grid. */
export function leadPublicTags(facts: PublicLead): string[] {
  const score = facts.reviewScore == null ? "" : facts.reviewScore.toFixed(1);
  const reviews =
    facts.reviewScore == null
      ? "No reviews"
      : facts.reviewCount == null
        ? score
        : `${score} · ${facts.reviewCount}`;
  return [
    facts.contactName || "No owner",
    reviews,
    facts.hasWebsite == null ? "Website unknown" : facts.hasWebsite ? "Has website" : "No website",
    facts.phoneLine === "mobile" ? "Mobile" : facts.phoneLine === "landline" ? "Landline" : "Line unknown",
  ];
}

/** Fill the lead, its public listing, and its tracking link into a text or email draft. */
export function renderOutreachMessage(
  template: string,
  lead: {
    business: string;
    url: string;
    trade?: string;
    county?: string;
    city?: string;
    owner?: string;
    reviews?: string;
    website?: string;
    line?: string;
  },
): string {
  return template
    .replaceAll("{business}", lead.business)
    .replaceAll("{url}", lead.url)
    .replaceAll("{trade}", lead.trade ?? "")
    .replaceAll("{county}", lead.county ?? "")
    .replaceAll("{city}", lead.city ?? "")
    .replaceAll("{owner}", lead.owner ?? "")
    .replaceAll("{reviews}", lead.reviews ?? "")
    .replaceAll("{website}", lead.website ?? "")
    .replaceAll("{line}", lead.line ?? "");
}

export function packOutreachPackage(draft: {
  strategy: string;
  text: string;
  emailSubject: string;
  emailBody: string;
  channel?: "email" | "sms" | "";
}): string {
  const channel = draft.channel === "email" || draft.channel === "sms" ? draft.channel : "";
  return JSON.stringify({
    strategy: outreachStrategy(draft.strategy).id,
    text: draft.text,
    emailSubject: draft.emailSubject,
    emailBody: draft.emailBody,
    channel,
    queue: channel ? "trickle" : "",
  });
}

export const FOLLOW_UP_STEPS = [
  { day: 0, label: "Day 0 Initial Hook" },
  { day: 2, label: "48 hour unactivated reminder" },
  { day: 3, label: "Day 3 Competitor Proof Bump" },
  { day: 6, label: "Day 6 Loss Aversion Final Call" },
] as const;

export type FollowTouchStatus = "sent" | "scheduled" | "skipped";
export type NurtureStatus = "active" | "stopped" | "complete";

/** Day 0 goes out with the launch. The 48-hour, day 3, and day 6 notes wait unless the lead already clicked. */
export function followUpSchedule(from: Date): {
  day: number;
  label: string;
  scheduledAt: string;
  status: FollowTouchStatus;
}[] {
  return FOLLOW_UP_STEPS.map((step) => ({
    day: step.day,
    label: step.label,
    scheduledAt: new Date(from.getTime() + step.day * 86_400_000).toISOString(),
    status: step.day === 0 ? "sent" : "scheduled",
  }));
}

/** Template for one step. Day 0 reuses the hook that launched the batch. */
export function followUpBody(
  day: number,
  channel: "email" | "sms",
  launched: { text: string; emailSubject: string; emailBody: string },
): string {
  if (day === 0) {
    return channel === "sms" ? launched.text : `${launched.emailSubject}\n\n${launched.emailBody}`;
  }
  if (day === 2) {
    return channel === "sms"
      ? "{owner} — {business} has not activated the page. The book is still open.\n{url}"
      : "48 hours on the {business} page\n\nHi {owner},\n\nThe {trade} page for {city} is still unactivated. The book stays open.\n\n{url}";
  }
  if (day === 3) {
    return channel === "sms"
      ? "{owner} — {business} still has not opened the page. Other {trade} shops in {county} took the book. Listed with {reviews}.\n{url}"
      : "{county} booked while {business} waited\n\nHi {owner},\n\nOther {trade} shops in {county} kept taking the online book. {business} is still listed with {reviews} and {website}, and the page has not been opened.\n\nThe proof is the link:\n{url}";
  }
  return channel === "sms"
    ? "{owner}, last note for {business}. The {city} page is pulled if it stays unclaimed.\n{url}"
    : "Last call for the {business} page\n\nHi {owner},\n\nThis is the last note. The {trade} page for {city} comes off the book if {business} leaves it unclaimed.\n\n{url}";
}

export function nurtureStatus(input: {
  clicked: boolean;
  touches: { status: FollowTouchStatus }[];
}): NurtureStatus | "none" {
  if (input.touches.length === 0) return "none";
  if (input.clicked) return "stopped";
  if (input.touches.some((touch) => touch.status === "scheduled")) return "active";
  return "complete";
}

export function channelFromPackage(stored: string): "email" | "sms" | "" {
  if (!stored.startsWith("{")) return "";
  try {
    const parsed = JSON.parse(stored) as { channel?: string };
    return parsed.channel === "email" || parsed.channel === "sms" ? parsed.channel : "";
  } catch {
    return "";
  }
}

export function strategyLabelFromPackage(stored: string): string {
  if (!stored.startsWith("{")) return "";
  try {
    const parsed = JSON.parse(stored) as { strategy?: string };
    if (!parsed.strategy) return "";
    const known = OUTREACH_STRATEGIES.find((item) => item.id === parsed.strategy);
    return known?.label ?? "";
  } catch {
    return "";
  }
}

export function funnelUrl(
  origin: string,
  lead: {
    leadSlug: string;
    county: string;
    stopToken?: string;
    greet?: boolean;
    businessName?: string;
    trade?: string;
    city?: string;
  },
): string {
  const base = origin.replace(/\/$/, "");
  const url = new URL("/", base.endsWith("/") ? base : `${base}/`);
  url.searchParams.set("b", lead.leadSlug);
  if (lead.county) url.searchParams.set("county", lead.county);
  url.searchParams.set("utm_source", "regional");
  if (lead.stopToken) url.searchParams.set("t", lead.stopToken);
  if (lead.greet) {
    url.searchParams.set("greet", "1");
    const business = (lead.businessName ?? "").trim().slice(0, 80);
    const trade = (lead.trade ?? "").trim().slice(0, 80);
    const city = (lead.city ?? "").trim().slice(0, 80);
    if (business) url.searchParams.set("biz", business);
    if (trade) url.searchParams.set("trade", trade);
    if (city) url.searchParams.set("city", city);
  }
  return url.toString();
}

/** One prospect, pre-configured. Opens are logged because this is not the pitch layout. */
export function deskPreviewPath(lead: {
  leadSlug: string;
  county?: string;
  city?: string;
  businessName?: string;
  trade?: string;
}): string {
  const params = new URLSearchParams({ b: lead.leadSlug, utm_source: "desk" });
  const county = (lead.county ?? "").trim();
  const city = (lead.city ?? "").trim();
  const business = (lead.businessName ?? "").trim();
  const trade = (lead.trade ?? "").trim();
  if (county) params.set("county", county);
  if (city) params.set("city", city);
  if (business) params.set("biz", business);
  if (trade) params.set("trade", trade);
  return `/?${params.toString()}`;
}
