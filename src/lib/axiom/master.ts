import { createServerFn } from "@tanstack/react-start";
import { masterAccessMiddleware } from "./master-access";
import { channelFromPackage, followUpBody, followUpSchedule, deskPreviewPath, funnelUrl, isEmailReady, isLeadSlug, isSmsReady, leadSlugFrom, nurtureStatus, outreachPublicTokens, outreachStrategy, packOutreachPackage, renderOutreachMessage, parseFunnelQuery, parseHasWebsite, parsePhoneLine, parseReviewCount, parseReviewScore, publicLeadFromRow, strategyLabelFromPackage, type PhoneLine } from "./funnel";
import { nextSendInstant, parseSendTiming, planSmartChunks, timingProfileFor, type SendTiming } from "./outreach-queue";
import { classifyFiling, classifyTrade, isTradeKey, nicheLabel } from "./directory";
type WireEvent = {
  id: string;
  type: string;
  shopName: string;
  slug: string;
  createdAt: string;
};
/** Read-only outreach settings. Does not drain the queue or send. */
export const readOutreachDesk = createServerFn({
  method: "GET"
}).middleware([masterAccessMiddleware]).handler(async () => {
  const queue = await import("./outreach-queue.server");
  return queue.readOutreachConfig();
});
export const masterGate = createServerFn({
  method: "GET"
}).middleware([masterAccessMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.masterGateHandler(ctx);
});

/** Cookie session for the owner key. Does not require a user login. */
export const masterEntry = createServerFn({
  method: "GET"
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.masterEntryHandler(ctx);
});

/** Exchange the owner key for a year-long httpOnly session, then forget the key. */
export const claimMasterBypass = createServerFn({
  method: "POST"
}).validator((input: {
  key?: string;
}) => {
  const key = typeof input?.key === "string" ? input.key.trim() : "";
  if (key.length < 16 || key.length > 200) throw new Error("That key does not open the desk.");
  return {
    key
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.claimMasterBypassHandler(ctx);
});
export const getMasterDesk = createServerFn({
  method: "GET"
}).middleware([masterAccessMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.getMasterDeskHandler(ctx);
});
type LeadDraft = {
  businessName: string;
  tradeType: string;
  city: string;
  county: string;
  leadSlug: string;
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  reviewScore: number | null;
  reviewCount: number | null;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
  tradeLabel: string;
};
export function cleanLead(input: {
  businessName?: string;
  tradeType?: string;
  city?: string;
  county?: string;
  leadSlug?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  reviewScore?: unknown;
  reviewCount?: unknown;
  hasWebsite?: unknown;
  phoneLine?: unknown;
}): LeadDraft {
  const businessName = (input.businessName ?? "").trim().slice(0, 80);
  const city = (input.city ?? "").trim().slice(0, 80);
  const county = (input.county ?? "").trim().slice(0, 80);
  const trade = (input.tradeType ?? "").trim();
  if (businessName.length < 2) throw new Error("Business name is required");
  if (city.length < 2) throw new Error("City is required");
  if (county.length < 2) throw new Error("County is required");
  const classified = classifyFiling(businessName, trade);
  const requested = (input.leadSlug ?? "").trim().toLowerCase();
  const leadSlug = requested ? requested : leadSlugFrom(businessName, city);
  if (!isLeadSlug(leadSlug)) throw new Error("Lead slug must be lowercase letters, numbers, and hyphens");
  return {
    businessName,
    tradeType: classified.tradeType,
    tradeLabel: classified.tradeLabel,
    city,
    county,
    leadSlug,
    contactEmail: (input.contactEmail ?? "").trim().toLowerCase().slice(0, 120),
    contactPhone: (input.contactPhone ?? "").trim().slice(0, 40),
    contactName: (input.contactName ?? "").trim().slice(0, 80),
    reviewScore: parseReviewScore(input.reviewScore),
    reviewCount: parseReviewCount(input.reviewCount),
    hasWebsite: parseHasWebsite(input.hasWebsite),
    phoneLine: parsePhoneLine(input.phoneLine),
  };
}

function readRegion(input: {
  county?: string;
  tradeType?: string;
}, allowAll = false) {
  const county = (input.county ?? "").trim().slice(0, 80);
  const trade = (input.tradeType ?? "").trim();
  if (county.length < 2) throw new Error("County is required");
  if (allowAll && (trade === "all" || trade === "")) return {
    county,
    tradeType: "all" as const,
  };
  if (!isTradeKey(trade)) throw new Error("Pick a trade");
  return {
    county,
    tradeType: trade,
  };
}

export const addPreloadedLeads = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((input: {
  leads: Array<{
    businessName?: string;
    tradeType?: string;
    city?: string;
    county?: string;
    leadSlug?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactName?: string;
    reviewScore?: unknown;
    reviewCount?: unknown;
    hasWebsite?: unknown;
    phoneLine?: unknown;
  }>;
}) => {
  if (!input || !Array.isArray(input.leads) || input.leads.length === 0) {
    throw new Error("Add at least one business");
  }
  if (input.leads.length > 40) throw new Error("Add up to 40 businesses at a time");
  return {
    leads: input.leads.map(cleanLead)
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.addPreloadedLeadsHandler(ctx);
});
export type OutreachFunnelRow = {
  leadSlug: string;
  businessName: string;
  niche: string;
  contact: string;
  city: string;
  path: string;
  opened: boolean;
  tested: boolean;
  converted: boolean;
  createdAt: string;
};
export const createOutreachFunnel = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((input: {
  businessName?: string;
  niche?: string;
  contact?: string;
  city?: string;
  county?: string;
}) => {
  const businessName = String(input?.businessName ?? "").trim();
  const niche = String(input?.niche ?? "").trim();
  const contact = String(input?.contact ?? "").trim().slice(0, 120);
  const city = String(input?.city ?? "").trim();
  const county = String(input?.county ?? "").trim() || city;
  const email = contact.includes("@") ? contact.toLowerCase() : "";
  const phone = email ? "" : contact;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email required");
  if (!email && phone.replace(/\D/g, "").length < 7) throw new Error("Email or phone is required");
  return {
    businessName,
    niche,
    email,
    phone,
    city,
    county
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.createOutreachFunnelHandler(ctx);
});
export const listOutreachFunnels = createServerFn({
  method: "GET"
}).middleware([masterAccessMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.listOutreachFunnelsHandler(ctx);
});
export const preloadRegionalRoster = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.preloadRegionalRosterHandler(ctx);
});
export const generateRegionalFunnel = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((input: {
  county?: string;
  tradeType?: string;
}) => {
  const county = (input.county ?? "").trim().slice(0, 80);
  const trade = (input.tradeType ?? "").trim();
  if (county.length < 2) throw new Error("County is required");
  const classified = classifyTrade(trade);
  return {
    county,
    tradeType: classified.tradeType
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.generateRegionalFunnelHandler(ctx);
});
type OutreachLead = {
  businessName: string;
  city: string;
  county: string;
  tradeType: string;
  leadSlug: string;
  url: string;
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  reviewScore: number | null;
  reviewCount: number | null;
  hasWebsite: boolean | null;
  phoneLine: PhoneLine;
  claimed: boolean;
  accountMode: "simulation" | "live";
  tradeLabel: string;
};
type FollowLoop = {
  id: string;
  channel: "email" | "sms";
  status: "active" | "stopped" | "complete";
  reason: string;
  strategy: string;
  touches: {
    day: number;
    label: string;
    status: "sent" | "scheduled" | "skipped";
    scheduledAt: string;
  }[];
};
export const previewOutreach = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((input: {
  county?: string;
  tradeType?: string;
}) => readRegion(input, true)).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.previewOutreachHandler(ctx);
});
export const launchOutreachBatch = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((input: {
  county?: string;
  tradeType?: string;
  strategy?: string;
  text?: string;
  emailSubject?: string;
  emailBody?: string;
  channel?: string;
  timing?: string;
}) => {
  const region = readRegion(input, true);
  const rawChannel = input.channel === "email" || input.channel === "sms" ? input.channel : "";
  if (rawChannel !== "email" && rawChannel !== "sms") throw new Error("Pick a channel");
  const channel = rawChannel;
  const text = (input.text ?? "").trim().slice(0, 1000);
  const emailSubject = (input.emailSubject ?? "").trim().slice(0, 200);
  const emailBody = (input.emailBody ?? "").trim().slice(0, 4000);
  if (channel === "sms" && text.length < 2) throw new Error("Write a text first");
  if (channel === "email" && (emailSubject.length < 2 || emailBody.length < 2)) {
    throw new Error("Write the email first");
  }
  const strategy = outreachStrategy(input.strategy ?? "").id;
  return {
    ...region,
    channel,
    strategy,
    text,
    emailSubject,
    emailBody,
    template: packOutreachPackage({
      strategy,
      text,
      emailSubject,
      emailBody,
      channel
    }),
    timing: parseSendTiming(input.timing)
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.launchOutreachBatchHandler(ctx);
});
export const ensureFunnelSession = createServerFn({
  method: "POST"
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.ensureFunnelSessionHandler(ctx);
});
export const recordFunnelHit = createServerFn({
  method: "POST"
}).validator((input: {
  leadSlug?: string;
  utmSource?: string;
  county?: string;
  stopToken?: string;
  path?: string;
}) => {
  return parseFunnelQuery({
    b: input?.leadSlug,
    utm_source: input?.utmSource,
    county: input?.county,
    t: input?.stopToken
  });
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.recordFunnelHitHandler(ctx);
});
export const recordMasterDeskOpen = createServerFn({
  method: "POST"
}).middleware([masterAccessMiddleware]).validator((slug: string) => slug.trim()).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.recordMasterDeskOpenHandler(ctx);
});
export const getLeadPreview = createServerFn({
  method: "POST"
}).validator((leadSlug: string) => {
  const slug = String(leadSlug ?? "").trim().toLowerCase();
  if (!isLeadSlug(slug)) throw new Error("Unknown business");
  return slug;
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.getLeadPreviewHandler(ctx);
});
export const beginTerritoryCheckout = createServerFn({
  method: "POST"
}).validator((input: {
  leadSlug?: string;
  planId?: string;
}) => {
  const leadSlug = String(input?.leadSlug ?? "").trim().toLowerCase();
  const planId = String(input?.planId ?? "").trim();
  if (!isLeadSlug(leadSlug)) throw new Error("Unknown business");
  if (planId !== "trial" && planId !== "growth" && planId !== "lifetime") throw new Error("Unknown plan");
  return {
    leadSlug,
    planId
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.beginTerritoryCheckoutHandler(ctx);
});
export const finishTerritoryCheckout = createServerFn({
  method: "POST"
}).validator((input: {
  checkoutId?: string;
  paymentRef?: string;
}) => {
  const checkoutId = String(input?.checkoutId ?? "").trim();
  const paymentRef = String(input?.paymentRef ?? "").trim();
  if (!/^chk_[a-z0-9]{8,32}$/.test(checkoutId)) throw new Error("Checkout expired");
  return {
    checkoutId,
    paymentRef
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.finishTerritoryCheckoutHandler(ctx);
});
export const confirmTerritorySession = createServerFn({
  method: "POST"
}).validator((sessionId: string) => {
  const id = String(sessionId ?? "").trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error("Invalid session");
  return id;
}).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.confirmTerritorySessionHandler(ctx);
});
export type PlatformPulse = {
  id: string;
  type: string;
  shopName: string;
  detail: string;
  createdAt: string;
};
export const listPlatformPulse = createServerFn({
  method: "GET"
}).middleware([masterAccessMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./master.server");
  return loaded.listPlatformPulseHandler(ctx);
});
