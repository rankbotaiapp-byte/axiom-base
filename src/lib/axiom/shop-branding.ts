export const BRAND_FONTS = ["display", "sans", "mono"] as const;
export type BrandFont = (typeof BRAND_FONTS)[number];

export const BRAND_FONT_LABEL: Record<BrandFont, string> = {
  display: "Display",
  sans: "Sans",
  mono: "Mono",
};

export type BrandDna = {
  locked: boolean;
  logoDataUrl: string;
  primary: string;
  secondary: string;
  font: BrandFont;
  tagline: string;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function cleanLine(value: unknown, limit: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function cleanHex(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  return HEX.test(raw) ? raw.toUpperCase() : fallback;
}

export function emptyBrandDna(): BrandDna {
  return {
    locked: false,
    logoDataUrl: "",
    primary: "#2EE6D6",
    secondary: "#F3F1EB",
    font: "display",
    tagline: "",
  };
}

export function parseBrandDna(raw: unknown): BrandDna {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const font = BRAND_FONTS.includes(record.font as BrandFont) ? (record.font as BrandFont) : "display";
  const logo = typeof record.logoDataUrl === "string" && record.logoDataUrl.startsWith("data:image/") ? record.logoDataUrl.slice(0, 240_000) : "";
  return {
    locked: Boolean(record.locked) || Boolean(logo && cleanLine(record.tagline, 80).length >= 4),
    logoDataUrl: logo,
    primary: cleanHex(record.primary, "#2EE6D6"),
    secondary: cleanHex(record.secondary, "#F3F1EB"),
    font,
    tagline: cleanLine(record.tagline, 80),
  };
}

export function brandDnaComplete(dna: BrandDna): boolean {
  return Boolean(dna.logoDataUrl) && dna.tagline.length >= 4 && HEX.test(dna.primary) && HEX.test(dna.secondary);
}

export function brandPromptLayer(dna: BrandDna, shopName: string): string {
  return [
    `Brand lock: business name "${shopName}".`,
    `Tagline "${dna.tagline}".`,
    `Primary ${dna.primary}, secondary ${dna.secondary}.`,
    `Typography feel: ${BRAND_FONT_LABEL[dna.font]}.`,
    "Weave the logo and palette into real surfaces in the photo: trucks, tools, glass, walls, uniforms, or signage.",
    "Keep the original scene and lighting. No extra people. No watermark. No fake UI.",
  ].join(" ");
}

export const AI_CREDIT_PACK = 40;
export const AI_CREDIT_PACK_CENTS = 2000;
export const AI_IMAGE_UNITS = 1;
export const AI_VIDEO_UNITS = 4;
