import type { NicheId, PlanId } from "@/config/storefront";

export type TenantStatus = "preview" | "active" | "paused";

export interface TenantConfig {
  tagline: string;
  services: { name: string; description?: string; price?: string }[];
  hours: { days: string[]; opens: string; closes: string }[];
  faqs: { q: string; a: string }[];
  serviceArea: string[];
  social: Partial<Record<"facebook" | "instagram" | "tiktok" | "youtube" | "google", string>>;
  colors: { accent: string; glow: string };
  content: { cadencePerWeek: number; pillars: string[]; autoPublish: boolean };
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  niche: NicheId;
  city: string;
  region: string;
  street?: string | null;
  postalCode?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  plan: PlanId;
  status: TenantStatus;
  config: TenantConfig;
  createdAt: string;
  updatedAt: string;
}

export type PostKind = "article" | "gbp" | "social";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface Post {
  id: string;
  tenantId: string;
  slug: string;
  kind: PostKind;
  title: string;
  body: string; // markdown-lite (paragraphs + "## " headings + "- " bullets)
  excerpt: string;
  keywords: string[];
  cta?: string | null;
  imagePrompt?: string | null;
  status: PostStatus;
  scheduledFor: string;
  publishedAt?: string | null;
  results: Record<string, { ok: boolean; id?: string; error?: string; at: string }>;
  createdAt: string;
}

export type ChannelPlatform = "web" | "webhook" | "facebook" | "instagram" | "gbp";

export interface Channel {
  tenantId: string;
  platform: ChannelPlatform;
  enabled: boolean;
  /** Server-only. Store encrypted at rest (Supabase Vault / pgsodium) in production. */
  credentials: Record<string, string>;
}

export interface Booking {
  business_id: string;
  customer_name: string;
  phone: string;
  message: string;
  source: string;
  status: string;
}
