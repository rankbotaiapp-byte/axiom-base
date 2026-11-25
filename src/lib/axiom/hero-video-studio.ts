/**
 * Studio still remake (proof_touchup) and background motion (background_motion) prompts.
 * Motion spend is gated by dailyMotionCapCents / reserveMicroMotion on the server.
 */

import { dailyMotionCapCents } from "./render-credits";
import {
  buildAxiomStagePrompt,
  buildKineticMotionPrompt,
  buildSelectiveEnvironmentMotion,
  capEnvironmentalReactions,
  EnvironmentalReactionType,
  resolveUploadSubject,
  showcaseFallbackForSubject,
  type AxiomUploadSubject,
  type LocalizedMotionSpec,
} from "./studio-visual-blueprint";

export { dailyMotionCapCents, buildAxiomStagePrompt, buildSelectiveEnvironmentMotion };

const MOTION_TO_REACTIONS: Record<string, EnvironmentalReactionType[]> = {
  rain: [EnvironmentalReactionType.RainStreaksAndRipples],
  fog: [EnvironmentalReactionType.ColdEngineVaporGlow],
  smoke: [EnvironmentalReactionType.HeadlightDustBeams],
  "headlight-neon-flicker": [EnvironmentalReactionType.BackgroundLightFlicker],
  "power-led-on": [EnvironmentalReactionType.ShopBayPowerSequence],
  "screen-light-up": [EnvironmentalReactionType.ShopBayPowerSequence],
  "shooting-star": [EnvironmentalReactionType.SkySunGlare],
  "subtle-river-flow": [EnvironmentalReactionType.RainStreaksAndRipples, EnvironmentalReactionType.PavementLightBounce],
  subtle: [EnvironmentalReactionType.PavementLightBounce],
  "passing-vehicle": [EnvironmentalReactionType.PavementLightBounce],
  motorcycle: [EnvironmentalReactionType.PavementLightBounce],
  "leaf-blowing": [EnvironmentalReactionType.HeadlightDustBeams],
  "tree-leaves-rustle": [EnvironmentalReactionType.SkySunGlare],
  "slow-steering-turn": [EnvironmentalReactionType.PavementLightBounce],
};

export function reactionsFromMotionPreset(
  motion?: string | null,
  extra: readonly unknown[] = [],
): EnvironmentalReactionType[] {
  const fromPreset = MOTION_TO_REACTIONS[(motion || "").trim()] ?? [EnvironmentalReactionType.HeadlightDustBeams];
  return capEnvironmentalReactions([...fromPreset, ...extra]);
}

/** proof_touchup: Flux img2img consumes this Noir + Neon stage prompt. */
export function remakeUploadedPhotoPrompt(input: {
  shopName?: string;
  tagline?: string;
  phone?: string;
  niche?: string;
  brandColor?: string;
  slotLabel?: string;
  subject?: AxiomUploadSubject | string | null;
  hasUpload?: boolean;
  inlay?: string | null;
  machineType?: string;
}): string {
  return buildAxiomStagePrompt({
    stage: "base_neon_trim",
    subject: input.subject ?? (input.hasUpload === false ? "tool_or_generic" : "vehicle"),
    shopName: input.shopName,
    tagline: input.tagline,
    phone: input.phone,
    niche: input.niche,
    brandColor: input.brandColor,
    slotLabel: input.slotLabel,
    hasUpload: input.hasUpload !== false,
    inlay: input.inlay,
    machineType: input.machineType,
  });
}

/** background_motion: kinetic dust-beam loop, 1–2 reactions, subject and text locked. */
export function animateRecreatedBackgroundPrompt(input: {
  niche?: string;
  shopName?: string;
  motion?: string | null;
  reactions?: readonly unknown[];
  machineType?: string;
  replicateBalanceUnits?: number;
}): LocalizedMotionSpec {
  const kinetic = buildKineticMotionPrompt({
    niche: input.niche,
    shopName: input.shopName,
    machineType: input.machineType,
    replicateBalanceUnits: input.replicateBalanceUnits,
  });
  const selected = capEnvironmentalReactions(input.reactions ?? []);
  return {
    ...kinetic,
    reactions: input.reactions && input.reactions.length ? selected : kinetic.reactions,
  };
}

export function subcontractorShowcase(subject?: string | null) {
  return showcaseFallbackForSubject(subject ?? "tool_or_generic");
}

export function resolveStudioSubject(value?: string | null): AxiomUploadSubject {
  return resolveUploadSubject(value);
}

/** True when another motion render still fits today's slice of the monthly budget. */
export function withinDailyMotionCap(input: {
  monthlyLimitCents: number;
  spentTodayCents: number;
  priceCents: number;
}): boolean {
  return input.spentTodayCents + input.priceCents <= dailyMotionCapCents(input.monthlyLimitCents);
}
