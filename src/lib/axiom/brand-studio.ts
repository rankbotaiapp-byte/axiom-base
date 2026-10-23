import { isPresentationStyle, type PresentationStyle } from "./intro.ts";

export const RIPPLE_THEMES = [
  { id: "electric-blue", label: "Electric Blue Metallic", accent: "#3D7EFF", metal: "#B9D2FF", ring: "#6AA4FF" },
  { id: "fuchsia", label: "Fuchsia Neon", accent: "#FF2BD6", metal: "#FF9BE8", ring: "#FF57DE" },
  { id: "silver", label: "Metallic Silver", accent: "#C5CED8", metal: "#F3F6F8", ring: "#E4EAF0" },
  { id: "gold", label: "Gold/Amber", accent: "#E0A23A", metal: "#F6D48A", ring: "#F0B84A" },
  { id: "crimson", label: "Crimson Red", accent: "#E0233A", metal: "#FF9AA6", ring: "#FF4D62" },
] as const;

export type RippleThemeId = (typeof RIPPLE_THEMES)[number]["id"];
export type RippleTheme = (typeof RIPPLE_THEMES)[number];

export type BrandStudioState = {
  header: string;
  tagline: string;
  theme: RippleThemeId | "";
  presentation: PresentationStyle | "";
};

export const EMPTY_BRAND_STUDIO: BrandStudioState = {
  header: "",
  tagline: "",
  theme: "",
  presentation: "",
};

const SYMBOLS = ["arc", "diamond", "bolt", "ring"] as const;
export type BrandSymbol = (typeof SYMBOLS)[number];

export type BrandMark = {
  header: string;
  tagline: string;
  initials: string;
  symbol: BrandSymbol;
  accent: string;
  svg: string;
  dataUrl: string;
};

function cleanLine(value: unknown, limit: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function isRippleTheme(value: string): value is RippleThemeId {
  return RIPPLE_THEMES.some((theme) => theme.id === value);
}

export function rippleTheme(id: string): RippleTheme | null {
  return RIPPLE_THEMES.find((theme) => theme.id === id) ?? null;
}

export function parseBrandStudio(raw: unknown): BrandStudioState {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const theme = typeof record.theme === "string" && isRippleTheme(record.theme) ? record.theme : "";
  const presentation =
    typeof record.presentation === "string" && isPresentationStyle(record.presentation) ? record.presentation : "";
  return {
    header: cleanLine(record.header, 48),
    tagline: cleanLine(record.tagline, 72),
    theme,
    presentation,
  };
}

export function initialsFrom(header: string): string {
  const words = header.split(" ").filter(Boolean);
  if (words.length === 0) return "AX";
  const first = words[0]?.[0] ?? "A";
  const second = words.length > 1 ? (words[1]?.[0] ?? "") : (words[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

function symbolFor(initials: string): BrandSymbol {
  const code = initials.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SYMBOLS[code % SYMBOLS.length] ?? "arc";
}

function symbolPath(symbol: BrandSymbol, accent: string): string {
  if (symbol === "diamond") {
    return `<path d="M128 62 L150 104 L128 146 L106 104 Z" fill="none" stroke="${accent}" stroke-width="2"/>`;
  }
  if (symbol === "bolt") {
    return `<path d="M136 64 L118 108 H136 L120 148" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  if (symbol === "ring") {
    return `<circle cx="128" cy="104" r="18" fill="none" stroke="${accent}" stroke-width="2"/>`;
  }
  return `<path d="M96 128 A32 32 0 0 1 160 128" fill="none" stroke="${accent}" stroke-width="2"/>`;
}

/** Compile a vector mark from the header and tagline. The initials overlap a geometric symbol. */
export function compileBrandMark(header: string, tagline: string, accent = "#3D7EFF"): BrandMark {
  const title = cleanLine(header, 48) || "Axiom";
  const line = cleanLine(tagline, 72);
  const initials = initialsFrom(title);
  const symbol = symbolFor(initials);
  const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : "#3D7EFF";
  const left = escapeXml(initials[0] ?? "A");
  const right = escapeXml(initials[1] ?? left);
  const gid = `mark-${initials.toLowerCase()}-${symbol}`;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${escapeXml(title)}">`,
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="#F3F6F8"/><stop offset="1" stop-color="${safeAccent}"/>`,
    `</linearGradient></defs>`,
    `<rect width="256" height="256" rx="48" fill="#121216"/>`,
    `<circle cx="128" cy="104" r="74" fill="none" stroke="url(#${gid})" stroke-width="3"/>`,
    symbolPath(symbol, safeAccent),
    `<text x="104" y="120" text-anchor="middle" font-size="68" font-family="Georgia, serif" fill="#F3F1EB">${left}</text>`,
    `<text x="152" y="120" text-anchor="middle" font-size="68" font-family="Georgia, serif" fill="${safeAccent}">${right}</text>`,
    `<text x="128" y="198" text-anchor="middle" font-size="16" font-family="Outfit, sans-serif" fill="#F3F1EB">${escapeXml(title)}</text>`,
    line
      ? `<text x="128" y="222" text-anchor="middle" font-size="11" font-family="Outfit, sans-serif" fill="#9A9AA3">${escapeXml(line)}</text>`
      : "",
    `</svg>`,
  ].join("");
  return {
    header: title,
    tagline: line,
    initials,
    symbol,
    accent: safeAccent,
    svg,
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

/** Glass, perimeter ring, and touch ripple all read these variables. */
export function themeSurface(theme: RippleTheme): Record<string, string> {
  return {
    "--neon": theme.accent,
    "--ring-color": theme.ring,
    "--glass-tint": theme.metal,
    "--ripple": theme.accent,
  };
}
