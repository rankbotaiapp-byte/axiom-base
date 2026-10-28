import { compileBrandMark, initialsFrom, type RippleThemeId } from "./brand-studio.ts";

export type SponsorshipBadge = {
  id: string;
  label: string;
};

export const STUDIO_PALETTES = [
  { id: "signal", label: "Signal cyan", accent: "#2EE6D6", neon: "#7CFFF2", ink: "#F3F1EB", field: "#061614" },
  { id: "copper", label: "Copper", accent: "#E7B48A", neon: "#FFD7B0", ink: "#F3F1EB", field: "#1A1008" },
  { id: "steel", label: "Steel", accent: "#7EC8E3", neon: "#C5EEF8", ink: "#F3F1EB", field: "#07141A" },
  { id: "ember", label: "Ember", accent: "#E07A73", neon: "#FFB1AB", ink: "#F3F1EB", field: "#1A0C0A" },
  { id: "emerald", label: "Yard green", accent: "#3DDC97", neon: "#B6F6D8", ink: "#F3F1EB", field: "#071610" },
] as const;

export type StudioPaletteId = (typeof STUDIO_PALETTES)[number]["id"];
export type StudioPalette = (typeof STUDIO_PALETTES)[number];

export type StudioIdentity = {
  locked: boolean;
  businessName: string;
  niche: string;
  nicheLabel: string;
  paletteId: StudioPaletteId | "";
  accent: string;
  neon: string;
  ink: string;
  field: string;
  badges: SponsorshipBadge[];
  /** True once Animate Hero Intro has published the cinematic loop. */
  animated: boolean;
};

export const STUDIO_PLATE = { width: 1280, height: 720 } as const;

export type StudioPlateLayout = {
  logo: { x: number; y: number; size: number };
  horizonY: number;
  nameY: number;
  beam: { x1: number; y1: number; x2: number; y2: number };
  badges: Array<{ x: number; y: number }>;
};

const PALETTE_RIPPLE: Record<StudioPaletteId, RippleThemeId> = {
  signal: "electric-blue",
  copper: "gold",
  steel: "silver",
  ember: "crimson",
  emerald: "electric-blue",
};

const BADGE_TABLE: Array<{ match: RegExp; labels: [string, string, string] }> = [
  { match: /^(contractor|firewood|field|trade|landscaper)$/, labels: ["Licensed", "Insured", "Local crew"] },
  { match: /^(clean|detailer)$/, labels: ["Bonded", "Insured", "On site"] },
  { match: /^(locksmith|security)$/, labels: ["Licensed", "Mobile", "Insured"] },
  { match: /^(salon|beauty|tattoo|photo)$/, labels: ["Licensed", "Booked", "Local"] },
  { match: /^(pets|dogwalk)$/, labels: ["Insured", "Local", "Booked"] },
  { match: /^(foodtruck)$/, labels: ["Licensed", "Local", "Catering"] },
  { match: /^(fitness|wellness|therapy|combat|lessons|music)$/, labels: ["Certified", "Local", "Booked"] },
];

function cleanLine(value: unknown, limit: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function cleanBadge(value: unknown): string {
  return cleanLine(value, 18);
}

export function studioPalette(id: string): StudioPalette | null {
  return STUDIO_PALETTES.find((palette) => palette.id === id) ?? null;
}

export function emptyStudioIdentity(): StudioIdentity {
  return {
    locked: false,
    businessName: "",
    niche: "",
    nicheLabel: "",
    paletteId: "",
    accent: "",
    neon: "",
    ink: "",
    field: "",
    badges: [],
    animated: false,
  };
}

export function defaultBadges(niche: string): SponsorshipBadge[] {
  const key = niche.trim().toLowerCase();
  const row = BADGE_TABLE.find((item) => item.match.test(key));
  const labels = row?.labels ?? (["Local", "Insured", "Booked"] as const);
  return labels.map((label, index) => ({ id: `badge-${index}`, label }));
}

export function normalizeBadges(values: readonly unknown[], niche: string): SponsorshipBadge[] {
  const next: SponsorshipBadge[] = [];
  for (const value of values) {
    const label = cleanBadge(value);
    if (!label || next.some((badge) => badge.label.toLowerCase() === label.toLowerCase())) continue;
    next.push({ id: `badge-${next.length}`, label });
    if (next.length === 3) break;
  }
  return next.length ? next : defaultBadges(niche);
}

export function paletteToRipple(id: string): RippleThemeId {
  const palette = studioPalette(id);
  return palette ? PALETTE_RIPPLE[palette.id] : "electric-blue";
}

/** Where the mark, the neon horizon, and the sponsor chips sit on the 16:9 plate. */
export function studioPlateLayout(badgeCount: number): StudioPlateLayout {
  const count = Math.max(0, Math.min(3, Math.floor(Number.isFinite(badgeCount) ? badgeCount : 0)));
  const badges = Array.from({ length: count }, (_, index) => ({
    x: Math.round((STUDIO_PLATE.width * (index + 1)) / (count + 1)),
    y: Math.round(STUDIO_PLATE.height * 0.78),
  }));
  return {
    logo: { x: 88, y: 88, size: 112 },
    horizonY: Math.round(STUDIO_PLATE.height * 0.62),
    nameY: Math.round(STUDIO_PLATE.height * 0.9),
    beam: {
      x1: 0,
      y1: Math.round(STUDIO_PLATE.height * 0.72),
      x2: STUDIO_PLATE.width,
      y2: Math.round(STUDIO_PLATE.height * 0.4),
    },
    badges,
  };
}

export function isStudioPlate(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:image/") || url.startsWith("/api/hero/brand/");
}

export function generateStudioIdentity(input: {
  businessName: string;
  niche: string;
  nicheLabel?: string;
  paletteId: string;
  badges?: readonly unknown[];
}): StudioIdentity {
  const businessName = cleanLine(input.businessName, 48);
  if (businessName.length < 2) throw new Error("Name the business");
  const niche = cleanLine(input.niche, 40);
  if (!niche) throw new Error("Pick a trade");
  const palette = studioPalette(cleanLine(input.paletteId, 24));
  if (!palette) throw new Error("Pick a color");
  const nicheLabel = cleanLine(input.nicheLabel, 80) || niche;
  return {
    locked: true,
    businessName,
    niche,
    nicheLabel,
    paletteId: palette.id,
    accent: palette.accent,
    neon: palette.neon,
    ink: palette.ink,
    field: palette.field,
    badges: normalizeBadges(input.badges ?? [], niche),
    animated: false,
  };
}

export function parseStudioIdentity(raw: unknown): StudioIdentity {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const palette = typeof record.paletteId === "string" ? studioPalette(record.paletteId) : null;
  const businessName = cleanLine(record.businessName, 48);
  const niche = cleanLine(record.niche, 40);
  const nicheLabel = cleanLine(record.nicheLabel, 80) || niche;
  const locked = record.locked === true && Boolean(palette) && businessName.length >= 2 && niche.length > 0;
  if (!locked || !palette) return emptyStudioIdentity();
  return {
    locked: true,
    businessName,
    niche,
    nicheLabel,
    paletteId: palette.id,
    accent: palette.accent,
    neon: palette.neon,
    ink: palette.ink,
    field: palette.field,
    badges: normalizeBadges(Array.isArray(record.badges) ? record.badges.map((item) => {
      if (item && typeof item === "object" && "label" in item) return (item as { label: unknown }).label;
      return item;
    }) : [], niche),
    animated: record.animated === true,
  };
}

/** The logo is compiled from the locked name and color. It is not a stored upload. */
export function studioLogo(identity: StudioIdentity): string {
  if (!identity.locked) return "";
  return compileBrandMark(identity.businessName, identity.nicheLabel || identity.niche, identity.accent).dataUrl;
}

export function studioInitials(identity: StudioIdentity): string {
  return initialsFrom(identity.businessName || "Axiom");
}

export function identitySurface(identity: StudioIdentity): Record<string, string> {
  if (!identity.locked) return {};
  return {
    "--neon": identity.neon,
    "--ring-color": identity.accent,
    "--glass-tint": identity.ink,
    "--ripple": identity.accent,
  };
}
