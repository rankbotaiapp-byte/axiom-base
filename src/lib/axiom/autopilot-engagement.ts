/**
 * Social engagement: inbound comments/DMs/reviews → intent, brand-safe reply, warm lead.
 * Pure module. Graph I/O and AI live in autopilot-engagement.server.ts.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const SOCIAL_INTENTS = ["pricing", "booking", "question", "review"] as const;
export type SocialIntent = (typeof SOCIAL_INTENTS)[number];

export const SOCIAL_INBOUND_KINDS = ["comment", "mention", "dm", "review", "question"] as const;
export type SocialInboundKind = (typeof SOCIAL_INBOUND_KINDS)[number];

export type SocialInboundPlatform = "facebook" | "instagram" | "gbp";

export type SocialInboundEvent = {
  platform: SocialInboundPlatform;
  kind: SocialInboundKind;
  externalId: string;
  pageId: string;
  parentId: string;
  fromId: string;
  fromName: string;
  text: string;
  createdAt: string;
};

export type ClassifiedEngagement = {
  intent: SocialIntent;
  booking: boolean;
  liveNeed: boolean;
  confidence: number;
  reply: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  summary: string;
};

const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const BOOKING_RE =
  /\b(book|booking|appoint|schedule|dispatch|come out|send (a |the )?tech|emergency|clogged|overflow|burst|leak(ing)?|no water|no heat|today|asap|right now|need (a )?plumber)\b/i;
const PRICING_RE = /\b(how much|quote|cost|price|pricing|estimate|rate|what do you charge)\b/i;
const REVIEW_RE = /\b(star|stars|review|recommend|great job|awesome|thank you|thanks|5\/5)\b/i;

export function storefrontPath(slug: string): string {
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "shop";
  return `/t/${clean}`;
}

export function storefrontUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${storefrontPath(slug)}`;
}

export function extractContactFromText(text: string): { phone: string; email: string } {
  const phoneMatch = text.match(PHONE_RE);
  const emailMatch = text.match(EMAIL_RE);
  const digits = (phoneMatch?.[0] ?? "").replace(/\D/g, "");
  const phone = digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits.length === 10 ? `+1${digits}` : "";
  return { phone, email: (emailMatch?.[0] ?? "").toLowerCase() };
}

export function heuristicIntent(text: string): Pick<ClassifiedEngagement, "intent" | "booking" | "liveNeed" | "confidence"> {
  const raw = text.trim();
  if (!raw) return { intent: "question", booking: false, liveNeed: false, confidence: 0 };
  const booking = BOOKING_RE.test(raw);
  const pricing = PRICING_RE.test(raw);
  const review = REVIEW_RE.test(raw) && !booking && !pricing;
  const liveNeed = booking || /\b(emergency|burst|overflow|no water|flood)\b/i.test(raw);
  if (booking) return { intent: "booking", booking: true, liveNeed, confidence: 0.72 };
  if (pricing) return { intent: "pricing", booking: false, liveNeed, confidence: 0.68 };
  if (review) return { intent: "review", booking: false, liveNeed: false, confidence: 0.6 };
  return { intent: "question", booking: false, liveNeed: false, confidence: 0.45 };
}

export function brandSafeReply(input: {
  shopName: string;
  slug: string;
  origin: string;
  intent: SocialIntent;
  fromName?: string;
}): string {
  const name = (input.fromName ?? "").trim().split(/\s+/)[0] ?? "";
  const hello = name && name.length < 18 ? `${name}, ` : "";
  const link = storefrontUrl(input.origin, input.slug);
  const shop = input.shopName.replace(/\s+/g, " ").trim().slice(0, 48) || "our shop";
  if (input.intent === "booking") {
    return `${hello}${shop} can take this. Book a time here and the crew gets a text: ${link}`;
  }
  if (input.intent === "pricing") {
    return `${hello}Want a straight number? Open ${shop} and send the job details here — we reply with a price, not a pitch: ${link}`;
  }
  if (input.intent === "review") {
    return `${hello}Thank you. ${shop} is local and on the book if you or a neighbor need us: ${link}`;
  }
  return `${hello}${shop} can help. Ask on this booking page and we pick it up: ${link}`;
}

export function classifySocialIntent(input: {
  text: string;
  shopName: string;
  slug: string;
  origin: string;
  fromName?: string;
}): ClassifiedEngagement {
  const text = input.text.replace(/\s+/g, " ").trim().slice(0, 2000);
  const guessed = heuristicIntent(text);
  const contact = extractContactFromText(text);
  return {
    ...guessed,
    reply: brandSafeReply({
      shopName: input.shopName,
      slug: input.slug,
      origin: input.origin,
      intent: guessed.intent,
      fromName: input.fromName,
    }),
    contactName: (input.fromName ?? "").trim().slice(0, 80),
    contactPhone: contact.phone,
    contactEmail: contact.email,
    summary: text.slice(0, 240),
  };
}

export function parseClassifiedJson(
  raw: string,
  fallback: ClassifiedEngagement,
): ClassifiedEngagement {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return fallback;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    const intent = SOCIAL_INTENTS.includes(parsed.intent as SocialIntent)
      ? (parsed.intent as SocialIntent)
      : fallback.intent;
    const phone = extractContactFromText(String(parsed.phone ?? parsed.contactPhone ?? fallback.contactPhone)).phone
      || fallback.contactPhone;
    const email = extractContactFromText(String(parsed.email ?? parsed.contactEmail ?? fallback.contactEmail)).email
      || fallback.contactEmail;
    const reply = String(parsed.reply ?? fallback.reply).replace(/\s+/g, " ").trim().slice(0, 280);
    const booking = parsed.booking === true || intent === "booking";
    return {
      intent,
      booking,
      liveNeed: parsed.liveNeed === true || booking || fallback.liveNeed,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? fallback.confidence) || fallback.confidence)),
      reply: reply.includes("/t/") ? reply : fallback.reply,
      contactName: String(parsed.name ?? parsed.contactName ?? fallback.contactName).trim().slice(0, 80),
      contactPhone: phone,
      contactEmail: email,
      summary: String(parsed.summary ?? fallback.summary).trim().slice(0, 240),
    };
  } catch {
    return fallback;
  }
}

export function parseMetaWebhookPayload(payload: unknown): SocialInboundEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { object?: unknown; entry?: unknown };
  const object = String(root.object ?? "");
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const events: SocialInboundEvent[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as {
      id?: unknown;
      time?: unknown;
      changes?: unknown;
      messaging?: unknown;
    };
    const pageId = String(row.id ?? "").trim();
    if (!pageId) continue;
    const createdAt = typeof row.time === "number" ? new Date(row.time * 1000).toISOString() : new Date().toISOString();
    const platform: SocialInboundPlatform = object === "instagram" ? "instagram" : "facebook";

    const changes = Array.isArray(row.changes) ? row.changes : [];
    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const field = String((change as { field?: unknown }).field ?? "");
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") continue;
      const v = value as Record<string, unknown>;
      const verb = String(v.verb ?? "add");
      if (verb && verb !== "add") continue;
      const from = v.from && typeof v.from === "object" ? (v.from as Record<string, unknown>) : {};
      const fromId = String(from.id ?? v.from_id ?? "").trim();
      if (fromId && fromId === pageId) continue;
      const text = String(v.message ?? v.text ?? v.comment ?? "").trim();
      const commentId = String(v.comment_id ?? v.id ?? "").trim();
      if (!commentId && !text) continue;
      let kind: SocialInboundKind = "comment";
      if (field === "mentions" || v.item === "mention") kind = "mention";
      if (field === "reviews") kind = "review";
      events.push({
        platform,
        kind,
        externalId: `${platform}:${commentId || String(v.post_id ?? "")}:${fromId}`,
        pageId,
        parentId: String(v.post_id ?? v.media_id ?? v.parent_id ?? commentId).trim(),
        fromId,
        fromName: String(from.name ?? from.username ?? "").trim(),
        text,
        createdAt,
      });
    }

    const messages = Array.isArray(row.messaging) ? row.messaging : [];
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") continue;
      const m = msg as { sender?: { id?: unknown }; message?: { mid?: unknown; text?: unknown }; timestamp?: unknown };
      const fromId = String(m.sender?.id ?? "").trim();
      if (!fromId || fromId === pageId) continue;
      const text = String(m.message?.text ?? "").trim();
      const mid = String(m.message?.mid ?? "").trim();
      if (!mid && !text) continue;
      events.push({
        platform,
        kind: "dm",
        externalId: `${platform}:dm:${mid || fromId}`,
        pageId,
        parentId: fromId,
        fromId,
        fromName: "",
        text,
        createdAt: typeof m.timestamp === "number" ? new Date(m.timestamp).toISOString() : createdAt,
      });
    }
  }
  return events.filter((event) => event.externalId && (event.text || event.kind === "dm"));
}

export function parseGbpWebhookPayload(payload: unknown): SocialInboundEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  let body: Record<string, unknown> = root;
  if (typeof root.message === "object" && root.message && "data" in (root.message as object)) {
    const data = String((root.message as { data?: unknown }).data ?? "");
    try {
      const decoded = Buffer.from(data, "base64").toString("utf8");
      body = JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return [];
    }
  }
  const locationId = String(body.locationId ?? body.location_id ?? body.name ?? "").split("/").pop() ?? "";
  const review = body.review && typeof body.review === "object" ? (body.review as Record<string, unknown>) : body;
  const question = body.question && typeof body.question === "object" ? (body.question as Record<string, unknown>) : null;
  const events: SocialInboundEvent[] = [];
  const reviewId = String(review.reviewId ?? review.name ?? "").trim();
  const reviewText = String(review.comment ?? review.text ?? "").trim();
  if (reviewId && (reviewText || review.starRating)) {
    const reviewer = review.reviewer && typeof review.reviewer === "object" ? (review.reviewer as Record<string, unknown>) : {};
    events.push({
      platform: "gbp",
      kind: "review",
      externalId: `gbp:review:${reviewId}`,
      pageId: locationId,
      parentId: reviewId,
      fromId: String(reviewer.displayName ?? reviewer.name ?? "").trim() || "reviewer",
      fromName: String(reviewer.displayName ?? "").trim(),
      text: reviewText || `${String(review.starRating ?? "")} star review`,
      createdAt: String(review.createTime ?? new Date().toISOString()),
    });
  }
  if (question) {
    const qid = String(question.name ?? question.id ?? "").trim();
    const qtext = String(question.text ?? "").trim();
    if (qid && qtext) {
      events.push({
        platform: "gbp",
        kind: "question",
        externalId: `gbp:question:${qid}`,
        pageId: locationId,
        parentId: qid,
        fromId: String((question.author as { displayName?: string } | undefined)?.displayName ?? "asker"),
        fromName: String((question.author as { displayName?: string } | undefined)?.displayName ?? ""),
        text: qtext,
        createdAt: String(question.createTime ?? new Date().toISOString()),
      });
    }
  }
  return events;
}

export function metaSignatureMatches(raw: string, header: string | null, secret: string): boolean {
  if (!secret || !header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header.trim());
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function metaVerifyChallenge(search: URLSearchParams, verifyToken: string): string | null {
  const mode = search.get("hub.mode");
  const token = search.get("hub.verify_token");
  const challenge = search.get("hub.challenge");
  if (mode !== "subscribe" || !challenge || !verifyToken || token !== verifyToken) return null;
  return challenge;
}
