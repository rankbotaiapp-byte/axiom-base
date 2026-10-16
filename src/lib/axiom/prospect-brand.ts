/** Runtime branding for an outreach preview. Nothing here is written to the database. */

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Six-digit hex, or empty when the value is not a color. */
export function sanitizeAccent(value: unknown): string {
  const raw = String(value ?? "").trim();
  const match = HEX.exec(raw);
  if (!match) return "";
  const hex = match[1] ?? "";
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return `#${hex.toUpperCase()}`;
}

/** A same-origin path or an http(s) URL. Anything else is dropped so the img cannot 404 via a script. */
export function sanitizeLogoUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 400) return "";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") && !raw.includes("..")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export function sanitizeContactLine(value: unknown, max = 80): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

export type ProspectBrand = {
  businessName: string;
  logoUrl: string;
  accent: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export function resolveProspectBrand(input: {
  fallbackName: string;
  fallbackAccent: string;
  businessName?: string;
  logoUrl?: string;
  accent?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}): ProspectBrand {
  const businessName = sanitizeContactLine(input.businessName, 80) || input.fallbackName;
  const accent = sanitizeAccent(input.accent) || sanitizeAccent(input.fallbackAccent) || "#2EE6D6";
  return {
    businessName,
    logoUrl: sanitizeLogoUrl(input.logoUrl),
    accent,
    contactName: sanitizeContactLine(input.contactName, 80),
    contactPhone: sanitizeContactLine(input.contactPhone, 40),
    contactEmail: sanitizeContactLine(input.contactEmail, 120),
  };
}
