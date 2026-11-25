import { z } from "zod";
import { SHOWCASE_THEME_IDS } from "@/lib/axiom/outreach-desk";

const HexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/);

export const ThemeTokensSchema = z.object({
  canvasBg: HexColor.default("#050507"),
  surfaceBg: HexColor.default("#0B0D12"),
  primaryAccent: HexColor.default("#00f2fe"),
  secondaryAccent: HexColor.default("#ff2a3d"),
  ringColor: HexColor.default("#FFE500"),
  ringHot: HexColor.default("#FF9900"),
  callCta: HexColor.default("#FF9900"),
  bookCta: HexColor.default("#00ffcc"),
  showcaseThemeId: z.enum(SHOWCASE_THEME_IDS).default("solar_gold"),
});

export const MediaSlotSchema = z.object({
  kind: z.enum(["image", "cinemagraph", "loop-video"]),
  posterUrl: z.string().min(1).max(2000),
  videoUrl: z.string().max(2000).optional(),
  alt: z.string().max(180).default(""),
  focalPoint: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .default({ x: 50, y: 50 }),
});

export const HeroSectionSchema = z.object({
  eyebrow: z.string().max(80),
  headline: z.string().min(2).max(160),
  subheadline: z.string().max(360),
  responseSlaBadge: z.string().max(80),
  primaryCtaLabel: z.string().min(1).max(48).default("Book now"),
  secondaryCtaLabel: z.string().max(48).optional(),
  media: MediaSlotSchema,
});

export const TrustBarSchema = z.object({
  licenseNumber: z.string().max(48),
  insuredAndBonded: z.boolean(),
  yearsInBusiness: z.number().int().min(0).max(150),
  warrantyHeadline: z.string().max(140),
  ratingSummary: z.object({
    score: z.number().min(0).max(5),
    count: z.number().int().min(0),
    label: z.string().max(80),
  }),
});

export const ServiceItemSchema = z.object({
  id: z.string().min(1).max(48),
  title: z.string().min(1).max(80),
  summary: z.string().max(280),
  startingPriceLabel: z.string().max(48),
  estimatedDuration: z.string().max(48),
  isEmergencyEligible: z.boolean(),
});

export const BeforeAfterProjectSchema = z.object({
  id: z.string().min(1).max(48),
  title: z.string().min(1).max(90),
  summary: z.string().max(280).default(""),
  beforeUrl: z.string().min(1).max(2000),
  afterUrl: z.string().min(1).max(2000),
});

export const TestimonialSchema = z.object({
  id: z.string().min(1).max(48),
  quote: z.string().min(1).max(420),
  author: z.string().min(1).max(80),
  detail: z.string().max(90).default(""),
});

export const IntakeQuestionSchema = z.object({
  id: z.string().min(1).max(48),
  label: z.string().min(1).max(140),
  kind: z.enum(["select", "text", "urgency"]),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1).max(80)).max(12).optional(),
});

export const ConversionConfigSchema = z.object({
  mode: z.enum(["instant-booking", "quote-request", "hybrid-dispatch"]),
  intakeQuestions: z.array(IntakeQuestionSchema).max(8),
  displayPhone: z.string().min(7).max(28),
  serviceCities: z.array(z.string().min(1).max(60)).min(1).max(24),
  notificationEmail: z.string().email().max(120),
  primaryCtaLabel: z.string().min(1).max(48).default("Book a visit"),
  emergencyCtaLabel: z.string().min(1).max(48).default("Emergency dispatch"),
});

export const TenantStorefrontSchema = z.object({
  tenantId: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  businessName: z.string().min(2).max(80),
  licenseBadge: z.string().max(64).default("Licensed"),
  theme: ThemeTokensSchema,
  hero: HeroSectionSchema,
  trust: TrustBarSchema,
  services: z.array(ServiceItemSchema).min(1).max(12),
  projects: z.array(BeforeAfterProjectSchema).max(8),
  testimonials: z.array(TestimonialSchema).max(8),
  conversion: ConversionConfigSchema,
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;
export type MediaSlot = z.infer<typeof MediaSlotSchema>;
export type HeroSection = z.infer<typeof HeroSectionSchema>;
export type TrustBar = z.infer<typeof TrustBarSchema>;
export type ServiceItem = z.infer<typeof ServiceItemSchema>;
export type BeforeAfterProject = z.infer<typeof BeforeAfterProjectSchema>;
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type IntakeQuestion = z.infer<typeof IntakeQuestionSchema>;
export type ConversionConfig = z.infer<typeof ConversionConfigSchema>;
export type TenantStorefrontConfig = z.infer<typeof TenantStorefrontSchema>;
export type ConversionMode = ConversionConfig["mode"];
