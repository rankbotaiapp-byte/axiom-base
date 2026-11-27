/**
 * Barbershop outreach landing (`/t/{slug}?niche=barber`).
 * Tokens, wording and shimmer timings match the barbershop demo handoff.
 */

import { checkDispatchMobile, emptyOutreachTenant, formatPhone, type OutreachTenant } from "./plumber-outreach.ts";

export { checkDispatchMobile, emptyOutreachTenant, formatPhone };
export type { OutreachTenant };

export const BARBER_GENERIC_NAME = "";
export const BARBER_HERO = "/media/barber-hero.jpg";
export const BARBER_MASK = "/media/barber-mask.png";
export const BARBER_PLACEHOLDER_TEL = "+15415550142";

export function isBarberCampaign(value?: string | null): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return false;
  return (
    v === "barber" ||
    v.includes("barber") ||
    v.includes("barbershop") ||
    v.includes("barber-shop")
  );
}

export function barberCampaignPath(slug: string, opts?: { greet?: boolean; studio?: boolean }): string {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || "ashland-barber";
  const params = new URLSearchParams({ niche: "barber" });
  if (opts?.greet !== false) params.set("greet", "1");
  if (opts?.studio) params.set("studio", "1");
  return `/t/${safe}?${params.toString()}`;
}

export function compactDefined<T extends Record<string, unknown>>(input?: Partial<T> | null): Partial<T> {
  if (!input) return {};
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export type BarberHeroConfig = {
  poster: string;
  mask: string;
  businessName: string;
  phone: string;
  badge: string;
  tagline: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  lede: string;
  bookLabel: string;
  callLabel: string;
};

export const barberHeroDefaults: BarberHeroConfig = {
  poster: BARBER_HERO,
  mask: BARBER_MASK,
  businessName: BARBER_GENERIC_NAME,
  phone: BARBER_PLACEHOLDER_TEL,
  badge: "WALK-INS WELCOME · ROGUE VALLEY",
  tagline: "BARBER · EST. 2026",
  eyebrow: "PRECISION CUTS · HOT SHAVES",
  headline: "Look sharp.",
  headlineAccent: "Leave legendary.",
  lede: "Fades, classic cuts and straight-razor shaves. Book your chair in 60 seconds or walk right in.",
  bookLabel: "BOOK A CUT",
  callLabel: "CALL THE SHOP",
};

export function mergeBarberHero(
  tenantHero?: Partial<BarberHeroConfig> | null,
  overrides?: Partial<BarberHeroConfig> | null,
): BarberHeroConfig {
  const merged = {
    ...barberHeroDefaults,
    ...compactDefined(tenantHero),
    ...compactDefined(overrides),
  };
  return {
    ...merged,
    businessName: (merged.businessName || "").trim(),
    phone: (merged.phone || BARBER_PLACEHOLDER_TEL).trim(),
  };
}

export type BarberService = { id: string; title: string; detail: string; price: string };
export type BarberHoursRow = { day: string; hours: string };
export type BarberChip = { id: string; label: string };

export type BarberOutreachConfig = {
  hero: BarberHeroConfig;
  chips: BarberChip[];
  services: BarberService[];
  slots: string[];
  hours: BarberHoursRow[];
  footer: string;
};

export const DEFAULT_BARBER_OUTREACH: BarberOutreachConfig = {
  hero: barberHeroDefaults,
  chips: [
    { id: "masters", label: "Master Barbers" },
    { id: "days", label: "Open 7 Days" },
    { id: "towel", label: "Hot Towel Shaves" },
    { id: "licensed", label: "Licensed & Insured" },
  ],
  services: [
    { id: "signature", title: "Signature Cut", detail: "Consult, cut, hot towel finish", price: "$35" },
    { id: "fade", title: "Skin Fade", detail: "Bald fade, crisp lineup", price: "$40" },
    { id: "shave", title: "Straight-Razor Shave", detail: "Hot towel, lather, razor", price: "$35" },
    { id: "beard", title: "Cut + Beard Sculpt", detail: "Full cut with beard shaping", price: "$55" },
    { id: "kids", title: "Kids Cut", detail: "12 and under", price: "$25" },
  ],
  slots: ["10:00", "11:30", "1:00", "2:30", "3:15", "4:00", "5:30", "6:15"],
  hours: [
    { day: "Mon–Fri", hours: "9:00 AM–7:00 PM" },
    { day: "Saturday", hours: "8:00 AM–5:00 PM" },
    { day: "Sunday", hours: "10:00 AM–3:00 PM" },
  ],
  footer: "Built by New Era Apps",
};

export function outreachIsSimulatedSafe(): boolean {
  const mode = String(process.env.NEXT_PUBLIC_OUTREACH_MODE || process.env.OUTREACH_MODE || "simulation").toLowerCase();
  return mode !== "live";
}

export function liveCallHref(phone: string): string {
  const check = checkDispatchMobile(phone);
  if (check.ok) return `tel:${check.e164}`;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return `tel:+1${digits.slice(-10)}`;
  return `tel:${BARBER_PLACEHOLDER_TEL}`;
}
