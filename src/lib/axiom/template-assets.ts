import { cleanStillUrl, isPlayableHeroFilm } from "./hero-studio-state.ts";

export const TEMPLATE_ASSET_SLOTS = ["hero-loop", "branded-plate", "service-media"] as const;
export type TemplateAssetSlot = (typeof TEMPLATE_ASSET_SLOTS)[number];

export type TemplateAssetRow = {
  id: TemplateAssetSlot;
  label: string;
  detail: string;
  filled: boolean;
  generateHint: string;
};

export type TemplateAssetReport = {
  slots: TemplateAssetRow[];
  filled: number;
  total: number;
  ready: boolean;
  missing: TemplateAssetSlot[];
};

export type TemplateAssetInput = {
  heroLoop?: string | null;
  brandedPlate?: string | null;
  logoUrl?: string | null;
  serviceCount?: number;
  serviceMediaCount?: number;
  serviceOnboarded?: boolean;
};

function filledFilm(value?: string | null): boolean {
  return Boolean(value && isPlayableHeroFilm(value));
}

function filledStill(value?: string | null): boolean {
  if (!value) return false;
  if (value.startsWith("data:image/")) return value.length > 40;
  if (value.startsWith("/media/") && !value.includes("..")) return true;
  return Boolean(cleanStillUrl(value));
}

/** Inspect a tenant template against the three conversion-critical media slots. */
export function inspectTemplateAssets(input: TemplateAssetInput): TemplateAssetReport {
  const hero = filledFilm(input.heroLoop);
  const plate = filledStill(input.brandedPlate) || filledStill(input.logoUrl);
  const services =
    (input.serviceCount ?? 0) > 0 ||
    (input.serviceMediaCount ?? 0) > 0 ||
    input.serviceOnboarded === true;

  const slots: TemplateAssetRow[] = [
    {
      id: "hero-loop",
      label: "Hero video loop",
      detail: hero ? "Cinematic loop is on the storefront." : "No playable MP4 in the hero slot.",
      filled: hero,
      generateHint: "Generate a 3D / Blender loop or pin a catalog film.",
    },
    {
      id: "branded-plate",
      label: "Branded plate",
      detail: plate ? "Still or logo is locked on the film." : "Drop a branded still or lock Brand DNA.",
      filled: plate,
      generateHint: "Generate a Cyber-Obsidian still with the tenant mark etched in.",
    },
    {
      id: "service-media",
      label: "Service media",
      detail: services ? "At least one service plate is live." : "No service copy or service stills yet.",
      filled: services,
      generateHint: "Add a service with a still, or finish onboarding services.",
    },
  ];
  const missing = slots.filter((row) => !row.filled).map((row) => row.id);
  return {
    slots,
    filled: slots.length - missing.length,
    total: slots.length,
    ready: missing.length === 0,
    missing,
  };
}
