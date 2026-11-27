import { resolveCatalogNiche } from "@/config/catalog";
import { FOUNDER_WELCOME_POSTER, FOUNDER_WELCOME_VIDEO } from "@/lib/axiom/founder-welcome";
import { pairDatasetToNichePreview } from "@/lib/axiom/niche-dataset-pairing";
import { TenantStorefrontSchema, type TenantStorefrontConfig } from "@/lib/schemas/tenant";

export const STOREFRONT_UNLOCK_CENTS = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type UnlockPhase = "locked" | "draft" | "published";

export type LeadHydrationInput = {
  slug: string;
  businessName: string;
  niche: string;
  phone?: string;
  email?: string;
  city?: string;
  leadId?: string;
  tenantId?: string;
  licenseVerified?: boolean;
};

export function cleanShopSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isStorefrontUnlockPayment(input: {
  kind: string;
  amountCents: number;
  paymentStatus: string;
}): boolean {
  return input.kind === "storefront_unlock" && input.paymentStatus === "paid" && input.amountCents === STOREFRONT_UNLOCK_CENTS;
}

function phoneOrDesk(value: string | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const ten = digits.slice(-10);
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return "(555) 010-0000";
}

function emailOrDesk(value: string | undefined): string {
  const email = (value ?? "").trim().slice(0, 120);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  return "desk@axiom.shop";
}

/** Dataset niche pairing → a schema-valid draft storefront. Not live until a plan is published. */
export function hydrateLeadStorefront(input: LeadHydrationInput): TenantStorefrontConfig {
  const slug = cleanShopSlug(input.slug);
  const niche = resolveCatalogNiche(input.niche);
  const businessName = input.businessName.replace(/\s+/g, " ").trim().slice(0, 80) || "Your shop";
  const city = (input.city ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const paired = pairDatasetToNichePreview({
    businessName,
    tradeType: niche,
    phone: input.phone,
    email: input.email,
    city,
    leadSlug: slug,
    leadId: input.leadId,
  });
  const videoUrl = paired.heroVideoUrl.trim() || FOUNDER_WELCOME_VIDEO;
  const posterUrl = paired.heroStillUrl.trim() || FOUNDER_WELCOME_POSTER;
  const draft = {
    tenantId: (input.tenantId || `tenant_${slug}`).slice(0, 80),
    slug,
    businessName,
    licenseBadge: input.licenseVerified ? "Licensed" : "Local dispatch",
    theme: {
      canvasBg: "#050507",
      surfaceBg: "#0B0D12",
      primaryAccent: "#00f2fe",
      secondaryAccent: "#ff2a3d",
      ringColor: "#FFE500",
      ringHot: "#FF9900",
      callCta: "#FF9900",
      bookCta: "#00ffcc",
      showcaseThemeId: "solar_gold",
    },
    hero: {
      eyebrow: paired.overlay.location || paired.templateName,
      headline: businessName,
      subheadline: paired.tagline,
      responseSlaBadge: "Preview · unlock to edit",
      primaryCtaLabel: "Book a visit",
      secondaryCtaLabel: "Dispatch now",
      media: {
        kind: videoUrl ? "loop-video" : "image",
        posterUrl,
        videoUrl: videoUrl || undefined,
        alt: `${businessName} storefront`,
        focalPoint: { x: 50, y: 46 },
      },
    },
    trust: {
      licenseNumber: "",
      insuredAndBonded: Boolean(input.licenseVerified),
      yearsInBusiness: 0,
      warrantyHeadline: "Workmanship on the booked job",
      ratingSummary: { score: 5, count: 0, label: "New on Axiom" },
    },
    services: [
      {
        id: "visit",
        title: "Booked visit",
        summary: paired.tagline,
        startingPriceLabel: "Quote",
        estimatedDuration: "Scheduled",
        isEmergencyEligible: false,
      },
      {
        id: "dispatch",
        title: "Same-day dispatch",
        summary: "A crew confirms the window after you unlock the page.",
        startingPriceLabel: "Dispatch",
        estimatedDuration: "Same day",
        isEmergencyEligible: true,
      },
    ],
    projects: [
      {
        id: "proof",
        title: "Job proof",
        summary: "Swap these stills for a real before and after in Studio.",
        beforeUrl: posterUrl,
        afterUrl: posterUrl,
      },
    ],
    testimonials: [],
    conversion: {
      mode: "hybrid-dispatch" as const,
      displayPhone: phoneOrDesk(input.phone),
      notificationEmail: emailOrDesk(input.email),
      serviceCities: [city || "Local"],
      primaryCtaLabel: "Book a visit",
      emergencyCtaLabel: "Dispatch now",
      intakeQuestions: [
        {
          id: "service",
          label: "What do you need?",
          kind: "select" as const,
          required: true,
          options: ["Booked visit", "Same-day dispatch", "Not sure"],
        },
        {
          id: "urgency",
          label: "How soon?",
          kind: "urgency" as const,
          required: true,
          options: ["Right now", "Today", "This week"],
        },
      ],
    },
  };
  return TenantStorefrontSchema.parse(draft);
}

export function deskPhase(input: { unlockStatus: string; publishStatus: string }): UnlockPhase {
  if (input.publishStatus === "published") return "published";
  if (input.unlockStatus === "unlocked") return "draft";
  return "locked";
}
