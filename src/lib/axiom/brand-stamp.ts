/** Deterministic Cyber-Obsidian lower-third copy for social stills (pure). */

import { gbpSafeSummary, stripContactDetails } from "./autopilot-caption.ts";

export const STAMP_OBSIDIAN = "#050507";
export const STAMP_CYAN = "#00ffcc";
export const STAMP_GOLD = "#FFE500";

export type BrandStampPlatform = "instagram" | "facebook" | "google_business" | "gbp";

export type BrandStampShop = {
  name: string;
  city: string;
  phone?: string | null;
  license_number?: string | null;
  ad_tagline?: string | null;
};

export type BrandStampCopy = {
  shopName: string;
  city: string;
  licenseOrTagline: string;
  phone: string;
  includePhone: boolean;
  lines: string[];
};

export function normalizeStampPlatform(platform: string): BrandStampPlatform {
  const key = platform.trim().toLowerCase();
  if (key === "gbp" || key === "google_business") return "google_business";
  if (key === "instagram") return "instagram";
  return "facebook";
}

export function stampShowsPhone(platform: BrandStampPlatform | string): boolean {
  const key = normalizeStampPlatform(String(platform));
  return key === "instagram" || key === "facebook";
}

function clip(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function brandStampCopy(shop: BrandStampShop, platform: BrandStampPlatform | string): BrandStampCopy {
  const includePhone = stampShowsPhone(platform);
  const shopName = clip(shop.name || "Local shop", 42);
  const city = clip(shop.city || "", 36);
  const licenseOrTagline = clip(shop.license_number || shop.ad_tagline || "", 48);
  const rawPhone = clip(shop.phone || "", 28);
  const phone = includePhone ? rawPhone : "";
  const lines = [shopName, [city, licenseOrTagline].filter(Boolean).join(" · "), includePhone ? phone : ""]
    .map((line) => (includePhone ? line : stripContactDetails(line)))
    .filter(Boolean);
  return { shopName, city, licenseOrTagline, phone, includePhone, lines };
}

export function stampSafeCaption(caption: string, platform: BrandStampPlatform | string): string {
  if (!stampShowsPhone(platform)) return gbpSafeSummary(caption);
  return caption.replace(/\s+/g, " ").trim().slice(0, 2200);
}

export function gbpNativeCta(phone?: string | null): { actionType: "CALL" | "BOOK" } {
  return (phone ?? "").replace(/\D/g, "").length >= 10 ? { actionType: "CALL" } : { actionType: "BOOK" };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function brandStampSvg(input: { width: number; height: number; copy: BrandStampCopy }): string {
  const width = Math.max(320, Math.round(input.width));
  const barH = Math.max(72, Math.round(input.height * 0.18));
  const y0 = input.height - barH;
  const pad = Math.round(width * 0.04);
  const name = escapeXml(input.copy.lines[0] || "");
  const meta = escapeXml(input.copy.lines[1] || "");
  const phone = escapeXml(input.copy.includePhone ? input.copy.phone : "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${input.height}" viewBox="0 0 ${width} ${input.height}">
  <rect x="0" y="${y0}" width="${width}" height="${barH}" fill="${STAMP_OBSIDIAN}"/>
  <rect x="0" y="${y0}" width="6" height="${barH}" fill="${STAMP_CYAN}"/>
  <rect x="${width - 6}" y="${y0}" width="6" height="${barH}" fill="${STAMP_GOLD}"/>
  <text x="${pad}" y="${y0 + barH * 0.38}" fill="${STAMP_CYAN}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${Math.round(barH * 0.28)}" font-weight="700">${name}</text>
  <text x="${pad}" y="${y0 + barH * 0.64}" fill="#f4f7fb" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${Math.round(barH * 0.2)}">${meta}</text>
  ${phone ? `<text x="${pad}" y="${y0 + barH * 0.88}" fill="${STAMP_GOLD}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${Math.round(barH * 0.2)}" font-weight="700">${phone}</text>` : ""}
</svg>`;
}
