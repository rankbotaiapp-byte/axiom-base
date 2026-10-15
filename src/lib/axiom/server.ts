import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { cleanCustomNiche, heroForCustomNiche } from "./media";
import { parseDashboardConfig, type DashboardConfig } from "./dashboard";
import { parseIntroPreset, type IntroPreset } from "./intro";
import { parseGlowEnabled, parseLayout, parseNeonAccent, parseThemeProfile, parseWeek, type LayoutBlock, type WeekKey } from "./storefront";
import { parseTradeProfile, type TradeProfile } from "./trade-layout";
import { isShopNiche, type AccessMode, type Appointment, type Billing, type Employee, type PaymentSetup, type ShopNotice, type OnboardingStep, type PortfolioItem, type Service, type Shop, type ShopEvent, type PriceUnit, type ShopNiche, type ShopPublic } from "./types";
type ShopRow = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  custom_niche?: string | null;
  tagline: string;
  description: string;
  ring_color: string;
  hero_image_url: string;
  hero_video_url: string | null;
  hero_blend_percent: number;
  intro_preset?: string;
  intro_speed?: number;
  intro_intensity?: number;
  primary_service_id: string | null;
  owner_user_id: string | null;
  is_showcase: boolean;
  onboarding_step: string;
  onboarding_json: string;
  hours_json: string;
  address: string;
  works_alone?: boolean | number | string | null;
  notify_email?: string;
  notify_phone?: string;
  dashboard_override?: unknown;
  dashboard_config?: unknown;
  theme_profile?: string;
  neon_accent?: string;
  glow_enabled?: boolean | number | string | null;
  layout_json?: string;
  trade_profile?: string;
  created_at: string;
};
export const getPublicShop = createServerFn({
  method: "GET"
}).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getPublicShopHandler(ctx);
});
export const listShowcaseShops = createServerFn({
  method: "GET"
}).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.listShowcaseShopsHandler(ctx);
});
export const listBookedStarts = createServerFn({
  method: "GET"
}).validator((d: {
  slug: string;
  employeeId: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.listBookedStartsHandler(ctx);
});
export const getPortfolio = createServerFn({
  method: "GET"
}).validator((employeeId: string) => employeeId).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getPortfolioHandler(ctx);
});
export const listShopEvents = createServerFn({
  method: "GET"
}).validator((d: {
  slug: string;
  after?: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.listShopEventsHandler(ctx);
});
export const getAppointmentPublic = createServerFn({
  method: "GET"
}).validator((d: {
  slug: string;
  id: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getAppointmentPublicHandler(ctx);
});
export const createBooking = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  employeeId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startsAt: string;
  paymentMode: "request" | "demo";
  paymentRef?: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.createBookingHandler(ctx);
});
export const getShopAccess = createServerFn({
  method: "GET"
}).middleware([authMiddleware]).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getShopAccessHandler(ctx);
});
export const listMyShops = createServerFn({
  method: "GET"
}).middleware([authMiddleware]).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.listMyShopsHandler(ctx);
});
export const createShopFromNiche = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  niche: ShopNiche;
  name: string;
  solo?: boolean;
  ownerName?: string;
  leadSlug?: string;
  customNiche?: string;
}) => {
  const customNiche = cleanCustomNiche(typeof d.customNiche === "string" ? d.customNiche : "");
  if (customNiche && d.niche !== "trade") throw new Error("A custom niche uses the open trade");
  if ((d.customNiche ?? "").trim() && customNiche.length < 2) throw new Error("Name the niche");
  return {
    ...d,
    customNiche
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.createShopFromNicheHandler(ctx);
});

/** After a verified territory payment, build that lead's shop for the paying account. */

export const updateShopBrand = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  ringColor?: string;
  heroBlendPercent?: number;
  introPreset?: IntroPreset;
  introSpeed?: number;
  introIntensity?: number;
  heroImageUrl?: string;
  name?: string;
  tagline?: string;
  primaryServiceId?: string;
  markHero?: boolean;
  markService?: boolean;
  onboardingStep?: OnboardingStep;
  neonAccent?: string;
  glowEnabled?: boolean;
  layout?: LayoutBlock[];
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.updateShopBrandHandler(ctx);
});
export const saveTradeProfile = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  profile: TradeProfile;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.saveTradeProfileHandler(ctx);
});
export const setEmployeeAvailability = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  employeeId: string;
  day: string;
  on: boolean;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.setEmployeeAvailabilityHandler(ctx);
});
export const setShopRingColor = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  ringColor: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.setShopRingColorHandler(ctx);
});
export const setShopIntro = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  introPreset: IntroPreset;
  introSpeed: number;
  introIntensity: number;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.setShopIntroHandler(ctx);
});
export const inviteEmployee = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  displayName: string;
  phone: string;
  title?: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.inviteEmployeeHandler(ctx);
});
export const claimInvite = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((token: string) => token).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.claimInviteHandler(ctx);
});
export const getInvitePreview = createServerFn({
  method: "GET"
}).validator((token: string) => token).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getInvitePreviewHandler(ctx);
});
export const setShopDashboard = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  override: boolean;
  config: DashboardConfig;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.setShopDashboardHandler(ctx);
});
export const setEmployeeDashboard = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  employeeId: string;
  config: DashboardConfig;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.setEmployeeDashboardHandler(ctx);
});
export const getOperatorData = createServerFn({
  method: "GET"
}).middleware([authMiddleware]).validator((input: string | {
  slug: string;
  desk?: "master";
}) => {
  if (typeof input === "string") return {
    slug: input,
    desk: undefined as "master" | undefined
  };
  if (!input || typeof input.slug !== "string") throw new Error("Shop not found");
  return {
    slug: input.slug,
    desk: input.desk === "master" ? "master" as const : undefined
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getOperatorDataHandler(ctx);
});
export const acceptBooking = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  appointmentId: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.acceptBookingHandler(ctx);
});
export const confirmLatestAudit = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.confirmLatestAuditHandler(ctx);
});
export const getAuditStatus = createServerFn({
  method: "GET"
}).validator((id: string) => {
  const value = String(id ?? "");
  if (!/^aud_[a-z0-9]+$/i.test(value)) throw new Error("Unknown audit");
  return value;
}).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.getAuditStatusHandler(ctx);
});
export const addPortfolioItem = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  imageUrl: string;
  caption: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.addPortfolioItemHandler(ctx);
});
export const listShopPortfolio = createServerFn({
  method: "GET"
}).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.listShopPortfolioHandler(ctx);
});
export const removePortfolioItem = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  id: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.removePortfolioItemHandler(ctx);
});
export const updateShopProfile = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.updateShopProfileHandler(ctx);
});
export const updateNotifyChannels = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  notifyEmail: string;
  notifyPhone: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.updateNotifyChannelsHandler(ctx);
});
export const saveShopServices = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((d: {
  slug: string;
  services: {
    id?: string;
    name: string;
    description: string;
    durationMin: number;
    priceCents: number;
    group?: string;
    priceUnit?: PriceUnit;
  }[];
  removeIds: string[];
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.saveShopServicesHandler(ctx);
});
export const submitInquiry = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  name: string;
  phone: string;
  message: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.submitInquiryHandler(ctx);
});
export const submitAudit = createServerFn({
  method: "POST"
}).validator((d: {
  shopSlug?: string;
  leadSlug?: string;
  name?: string;
  channel?: string;
  contact?: string;
  lane?: string;
  lowCents?: number;
  highCents?: number;
  impact?: number;
}) => {
  const name = String(d?.name ?? "").trim();
  const channel = d?.channel === "email" ? "email" : d?.channel === "text" ? "text" : "";
  const contact = String(d?.contact ?? "").trim().slice(0, 120);
  const lane = String(d?.lane ?? "").trim().slice(0, 40);
  const lowCents = Math.round(Number(d?.lowCents));
  const highCents = Math.round(Number(d?.highCents));
  const impact = Math.round(Number(d?.impact));
  const shopSlug = String(d?.shopSlug ?? "").trim().toLowerCase();
  const leadSlug = String(d?.leadSlug ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 80) throw new Error("Name required");
  if (!channel) throw new Error("Choose text or email");
  if (!lane) throw new Error("Pick a bracket first");
  if (!Number.isFinite(lowCents) || !Number.isFinite(highCents) || lowCents < 0 || highCents < lowCents) {
    throw new Error("This menu has no priced lines yet");
  }
  if (!Number.isFinite(impact) || impact < 1 || impact > 99) throw new Error("Run the audit again");
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw new Error("Email required");
  if (channel === "text" && contact.replace(/\D/g, "").length < 7) throw new Error("Phone required");
  if (shopSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shopSlug)) throw new Error("Shop not found");
  if (leadSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leadSlug)) throw new Error("Unknown business");
  if (!shopSlug && !leadSlug) throw new Error("Unknown business");
  return {
    shopSlug,
    leadSlug,
    name,
    channel,
    contact,
    lane,
    lowCents,
    highCents,
    impact
  };
}).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.submitAuditHandler(ctx);
});
export const startCardCheckout = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  employeeId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startsAt: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.startCardCheckoutHandler(ctx);
});
export const beginCardElements = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  employeeId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startsAt: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.beginCardElementsHandler(ctx);
});
export const confirmCardCheckout = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  sessionId: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.confirmCardCheckoutHandler(ctx);
});
export const confirmCardPayment = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  paymentIntentId: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.confirmCardPaymentHandler(ctx);
});
export const releaseCardCheckout = createServerFn({
  method: "POST"
}).validator((d: {
  slug: string;
  appointmentId: string;
}) => d).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.releaseCardCheckoutHandler(ctx);
});
export const beginStripeConnect = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.beginStripeConnectHandler(ctx);
});
export const refreshStripeConnect = createServerFn({
  method: "POST"
}).middleware([authMiddleware]).validator((slug: string) => slug).handler(async (ctx: any) => {
  const loaded = await import("./shop-server.server");
  return loaded.refreshStripeConnectHandler(ctx);
});
