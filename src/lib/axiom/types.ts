import {
  CATALOG_NICHES,
  isCatalogNiche,
  resolveCatalogNiche,
  type CatalogNiche,
} from "@/config/catalog";
import type { HeroEffect } from "./hero-brand";
import type { DashboardConfig } from "./dashboard";
import type { IntroPreset } from "./intro";
import type { LayoutBlock, ThemeProfile } from "./storefront";
import type { TradeProfile } from "./trade-layout";

/** Public + provisionable niches — the verified 21-loop catalog only. */
export const SHOP_NICHES = CATALOG_NICHES;
export type ShopNiche = CatalogNiche;

export function isShopNiche(value: string): value is ShopNiche {
  return isCatalogNiche(value);
}

/** Coerce legacy DB niches onto the verified catalog. */
export function normalizeShopNiche(value: string | null | undefined): ShopNiche {
  return resolveCatalogNiche(value);
}

/** flat is one price. person and boat are how a guide outfit charges. */
export type PriceUnit = "flat" | "person" | "boat";

export type ShopRole = "owner" | "employee" | "customer";

export type OnboardingStep =
  | "niche"
  | "generated"
  | "tour"
  | "setup"
  | "loop"
  | "complete";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Shop = {
  id: string;
  slug: string;
  name: string;
  niche: ShopNiche;
  /** Title typed at signup when the trade is not one of the built-in niches. */
  customNiche: string;
  tagline: string;
  description: string;
  ringColor: string;
  heroImageUrl: string;
  heroVideoUrl: string | null;
  heroBlendPercent: number;
  heroEffectType: HeroEffect;
  heroBrandingTagline: string;
  heroPrompt: string;
  morphDurationSec: number;
  introPreset: IntroPreset;
  introSpeed: number;
  introIntensity: number;
  primaryServiceId: string | null;
  ownerUserId: string | null;
  isShowcase: boolean;
  onboardingStep: OnboardingStep;
  onboarding: {
    hero: boolean;
    service: boolean;
    employee: boolean;
    testBooked: boolean;
  };
  hours: Record<string, string>;
  address: string;
  acceptsCard: boolean;
  /** True when onboarding chose a one-person book. Staff can still be added later. */
  worksAlone: boolean;
  dashboardOverride: boolean;
  dashboardConfig: DashboardConfig;
  themeProfile: ThemeProfile;
  neonAccent: string;
  glowEnabled: boolean;
  layout: LayoutBlock[];
  tradeProfile: TradeProfile;
  createdAt: string;
};

export type Employee = {
  id: string;
  shopId: string;
  displayName: string;
  title: string;
  bio: string;
  phone: string;
  avatarUrl: string;
  inviteStatus: "pending" | "claimed";
  serviceIds: string[];
  dashboardConfig: DashboardConfig;
  availability: Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", boolean>;
};

export type Service = {
  id: string;
  shopId: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  /** Menu section the customer sees above this line. Blank keeps it in the open list. */
  group: string;
  priceUnit: PriceUnit;
};

export type PortfolioItem = {
  id: string;
  employeeId: string;
  imageUrl: string;
  caption: string;
};

export type Appointment = {
  id: string;
  shopId: string;
  employeeId: string;
  employeeName: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  status: AppointmentStatus;
  paymentStatus: string;
  paymentCents: number;
  paymentRef: string | null;
};

export type ShopEventType =
  | "booking_request"
  | "booking_confirmed"
  | "payment_received"
  | "audit_request"
  | "audit_confirmed"
  | "ring_color";

export type ShopEvent = {
  id: string;
  type: ShopEventType;
  appointmentId: string | null;
  employeeId?: string | null;
  payload: string | null;
  createdAt: string;
};

export type Billing = {
  plan: string;
  status: string;
  priceCents: number;
  gearGuardianBps: number;
};

export type ShopNotice = {
  id: string;
  channel: "inbox" | "email" | "sms" | "webhook";
  kind: "booking_request" | "booking_paid" | "inquiry" | "booking_confirmed";
  employeeId: string | null;
  destination: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "skipped" | "failed";
  detail: string;
  createdAt: string;
};

export type PaymentSetup = {
  processorReady: boolean;
  connected: boolean;
  chargesEnabled: boolean;
  connectStatus: "none" | "pending" | "active";
};

export type ShopPublic = {
  shop: Shop;
  services: Service[];
  employees: Employee[];
};

export type AccessMode = "owner" | "employee" | "preview" | "customer" | "none";
