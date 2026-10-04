import type { IntroPreset } from "./intro";

export type ShopNiche = "location" | "field" | "studio";

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
  tagline: string;
  description: string;
  ringColor: string;
  heroImageUrl: string;
  heroVideoUrl: string | null;
  heroBlendPercent: number;
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
};

export type Service = {
  id: string;
  shopId: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
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

export type ShopEventType = "booking_request" | "booking_confirmed" | "ring_color";

export type ShopEvent = {
  id: string;
  type: ShopEventType;
  appointmentId: string | null;
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
  kind: "booking_request" | "booking_paid" | "inquiry";
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
};

export type ShopPublic = {
  shop: Shop;
  services: Service[];
  employees: Employee[];
};

export type AccessMode = "owner" | "employee" | "preview" | "customer" | "none";
