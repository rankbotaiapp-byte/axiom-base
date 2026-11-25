/**
 * Studio remake + localized environment motion.
 * Noir + Neon base, 1–2 environmental reactions, locked subject/text/camera.
 */

import { collectedDispatchPhone, isPlaceholderDispatchPhone } from "./dispatch-phone";
import { formatPhone } from "@/lib/utils";
import { AXIOM_HUD_CYAN, AXIOM_HUD_CRIMSON, AXIOM_HUD_OBSIDIAN, AXIOM_VISUAL_LOCK, withAxiomVisualLock } from "./visual-design";

export enum EnvironmentalReactionType {
  HeadlightDustBeams = "headlight_dust_beams",
  BackgroundLightFlicker = "background_light_flicker",
  ColdEngineVaporGlow = "cold_engine_vapor_glow",
  PavementLightBounce = "pavement_light_bounce",
  ShopBayPowerSequence = "shop_bay_power_sequence",
  RainStreaksAndRipples = "rain_streaks_and_ripples",
  SkySunGlare = "sky_sun_glare",
}

export const ENVIRONMENTAL_REACTION_VALUES = [
  EnvironmentalReactionType.HeadlightDustBeams,
  EnvironmentalReactionType.BackgroundLightFlicker,
  EnvironmentalReactionType.ColdEngineVaporGlow,
  EnvironmentalReactionType.PavementLightBounce,
  EnvironmentalReactionType.ShopBayPowerSequence,
  EnvironmentalReactionType.RainStreaksAndRipples,
  EnvironmentalReactionType.SkySunGlare,
] as const;

export const AXIOM_UPLOAD_SUBJECTS = ["vehicle", "building", "tool_or_generic"] as const;
export type AxiomUploadSubject = (typeof AXIOM_UPLOAD_SUBJECTS)[number];

/** Plumbing leads and sub-contractors that share the two-stage remake + selective motion flow. */
export const CONTRACTOR_TRADE_PRESETS = [
  "plumbing",
  "general_contractor",
  "electrical",
  "hvac",
  "painting_finishing",
  "excavation_earthwork",
] as const;
export type ContractorTradePreset = (typeof CONTRACTOR_TRADE_PRESETS)[number];

const CONTRACTOR_TRADE_ALIASES: Record<string, ContractorTradePreset> = {
  plumbing: "plumbing",
  plumber: "plumbing",
  electrical: "electrical",
  electric: "electrical",
  electrician: "electrical",
  hvac: "hvac",
  general_contractor: "general_contractor",
  contractor: "general_contractor",
  construction: "general_contractor",
  landscaping: "general_contractor",
  "pest-control": "general_contractor",
  pestcontrol: "general_contractor",
  painting_finishing: "painting_finishing",
  painting: "painting_finishing",
  finishing: "painting_finishing",
  excavation_earthwork: "excavation_earthwork",
  excavation: "excavation_earthwork",
  earthwork: "excavation_earthwork",
  excavator: "excavation_earthwork",
};

const TRADE_REACTIONS_VEHICLE: Record<ContractorTradePreset, EnvironmentalReactionType[]> = {
  plumbing: [EnvironmentalReactionType.RainStreaksAndRipples, EnvironmentalReactionType.HeadlightDustBeams],
  general_contractor: [EnvironmentalReactionType.HeadlightDustBeams, EnvironmentalReactionType.PavementLightBounce],
  electrical: [EnvironmentalReactionType.BackgroundLightFlicker, EnvironmentalReactionType.ShopBayPowerSequence],
  hvac: [EnvironmentalReactionType.ColdEngineVaporGlow, EnvironmentalReactionType.BackgroundLightFlicker],
  painting_finishing: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.PavementLightBounce],
  excavation_earthwork: [EnvironmentalReactionType.HeadlightDustBeams, EnvironmentalReactionType.BackgroundLightFlicker],
};

const TRADE_REACTIONS_BUILDING: Record<ContractorTradePreset, EnvironmentalReactionType[]> = {
  plumbing: [EnvironmentalReactionType.RainStreaksAndRipples, EnvironmentalReactionType.ShopBayPowerSequence],
  general_contractor: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.PavementLightBounce],
  electrical: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.BackgroundLightFlicker],
  hvac: [EnvironmentalReactionType.ColdEngineVaporGlow, EnvironmentalReactionType.ShopBayPowerSequence],
  painting_finishing: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.PavementLightBounce],
  excavation_earthwork: [EnvironmentalReactionType.HeadlightDustBeams, EnvironmentalReactionType.PavementLightBounce],
};

const TRADE_REACTIONS_GENERIC: Record<ContractorTradePreset, EnvironmentalReactionType[]> = {
  plumbing: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.BackgroundLightFlicker],
  general_contractor: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.PavementLightBounce],
  electrical: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.BackgroundLightFlicker],
  hvac: [EnvironmentalReactionType.ColdEngineVaporGlow, EnvironmentalReactionType.ShopBayPowerSequence],
  painting_finishing: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.BackgroundLightFlicker],
  excavation_earthwork: [EnvironmentalReactionType.ShopBayPowerSequence, EnvironmentalReactionType.HeadlightDustBeams],
};

export function resolveContractorTrade(trade?: string | null): ContractorTradePreset {
  const key = (trade ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((CONTRACTOR_TRADE_PRESETS as readonly string[]).includes(key)) return key as ContractorTradePreset;
  const spaced = (trade ?? "").trim().toLowerCase();
  return CONTRACTOR_TRADE_ALIASES[spaced] ?? CONTRACTOR_TRADE_ALIASES[key] ?? "general_contractor";
}

export function subjectFromStudioUpload(input: { hasFile?: boolean; inlay?: string | null } = {}): AxiomUploadSubject {
  if (!input.hasFile) return "tool_or_generic";
  if (input.inlay === "vehicle") return "vehicle";
  if (input.inlay === "glass" || input.inlay === "surface") return "building";
  return "tool_or_generic";
}

/** 1–2 environmental reactions for a trade, capped by buildSelectiveEnvironmentMotion. */
export function getDefaultReactionsForTrade(
  trade?: string | null,
  subjectType: AxiomUploadSubject | string | null = "tool_or_generic",
): EnvironmentalReactionType[] {
  const preset = resolveContractorTrade(trade);
  const subject = resolveUploadSubject(subjectType);
  const raw =
    subject === "vehicle"
      ? TRADE_REACTIONS_VEHICLE[preset]
      : subject === "building"
        ? TRADE_REACTIONS_BUILDING[preset]
        : TRADE_REACTIONS_GENERIC[preset];
  return buildSelectiveEnvironmentMotion(raw).reactions;
}

export const AXIOM_VISUAL_STAGES = [
  "base_neon_trim",
  "lit_vapor_state",
  "niche_graphic_inlay",
  "shop_motion_sequence",
] as const;
export type AxiomVisualStage = (typeof AXIOM_VISUAL_STAGES)[number];

export type LocalizedMotionSpec = {
  reactions: EnvironmentalReactionType[];
  lockSubjectAndText: boolean;
  motionPrompt: string;
};

export const ENVIRONMENTAL_REACTION_PRESETS: {
  id: EnvironmentalReactionType;
  label: string;
}[] = [
  { id: EnvironmentalReactionType.HeadlightDustBeams, label: "Dust in the beams" },
  { id: EnvironmentalReactionType.BackgroundLightFlicker, label: "Work-light flicker" },
  { id: EnvironmentalReactionType.ColdEngineVaporGlow, label: "Cold vapor glow" },
  { id: EnvironmentalReactionType.PavementLightBounce, label: "Pavement bounce" },
  { id: EnvironmentalReactionType.ShopBayPowerSequence, label: "Bay power-up" },
  { id: EnvironmentalReactionType.RainStreaksAndRipples, label: "Rain streaks" },
  { id: EnvironmentalReactionType.SkySunGlare, label: "Sky / sun glare" },
];

const SINGLE_REACTION_DESCRIPTIONS: Record<EnvironmentalReactionType, string> = {
  [EnvironmentalReactionType.HeadlightDustBeams]:
    "fine dust and dirt particles drifting naturally through the headlight and work-light beams in front of the vehicle with subtle volumetric light scattering and soft light bounce on the ground",
  [EnvironmentalReactionType.BackgroundLightFlicker]:
    "existing background work lights and site lamps already turned on showing a subtle, realistic electrical flicker and gentle intensity shift without strobing",
  [EnvironmentalReactionType.ColdEngineVaporGlow]:
    "light cold-air vapor drifting low near the ground and wheel wells, catching and scattering underglow and warm light bounce",
  [EnvironmentalReactionType.PavementLightBounce]:
    "subtle light bounce and gentle reflections shifting across the ground or wet pavement around the scene",
  [EnvironmentalReactionType.ShopBayPowerSequence]:
    "clean sequential lighting cue where interior bay lights warm up, trim neon steadies with a subtle pulse, and nameplate light settles in",
  [EnvironmentalReactionType.RainStreaksAndRipples]:
    "fine rain streaks falling through the air and subtle surface ripples/reflections where rain hits the ground and lit edges",
  [EnvironmentalReactionType.SkySunGlare]:
    "natural sky/sun glare or low-angle light rays shifting softly through the upper sky and clouds with subtle lens/highlight shimmer",
};

const LOCK_HEADER =
  "Static tripod camera, locked framing, locked vehicle and building geometry, locked people and text. Do not warp, bend, or move the truck, buildings, workers, or lettering.";

const PLACEHOLDER_NAME = /^(n\/?a|tbd|todo|placeholder|your shop|test|asdf|xxx+)$/i;
const PLACEHOLDER_TAGLINE = /^(n\/?a|tbd|todo|placeholder|tagline|lorem|insert .+)$/i;

export const GENERIC_SHOWCASE_PANEL_POSTER = "/media/axiom-generic-showcase-panel.png";
export const HEAVY_EQUIPMENT_PLATE_POSTER = "/media/axiom-heavy-equipment-plate.png";

/** Matte-black HUD panel for sub-contractors with no van/truck upload. */
export const TOOL_OR_GENERIC_SHOWCASE = {
  subject: "tool_or_generic" as const,
  posterUrl: GENERIC_SHOWCASE_PANEL_POSTER,
  stillPrompt: "",
};

export type ShowcaseCopy = {
  shopName?: string;
  tagline?: string;
  phone?: string;
  niche?: string;
  machineType?: string;
  replicateBalanceUnits?: number;
};

function cleanShopName(value?: string): string {
  const name = (value || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (name.length < 2 || PLACEHOLDER_NAME.test(name)) return "";
  return name;
}

function cleanTagline(value?: string): string {
  const line = (value || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (line.length < 2 || PLACEHOLDER_TAGLINE.test(line)) return "";
  return line;
}

function cleanPhoneDisplay(value?: string): string {
  const raw = (value || "").trim();
  if (!raw || isPlaceholderDispatchPhone(raw) || !collectedDispatchPhone(raw)) return "";
  return formatPhone(raw);
}

/** Niche → real machine language. Never emits [INSERT MACHINE TYPE]. */
export function machineTypeForNiche(niche?: string | null, override?: string | null): string {
  const custom = (override || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (custom && !PLACEHOLDER_TAGLINE.test(custom) && !/\[insert/i.test(custom)) return custom;
  const id = (niche || "").toLowerCase();
  if (/excavat|dozer|earth|land.?clear|grading|construct/.test(id)) return "Caterpillar D9T Bulldozer";
  if (/landscap|lawn|tree/.test(id)) return "compact tracked loader";
  if (/plumb|hvac|pest/.test(id)) return "marked service van";
  if (/electric/.test(id)) return "bucket truck";
  if (/auto|fleet|tow|mechanic/.test(id)) return "heavy-duty service truck";
  if (/roof/.test(id)) return "roofing work van";
  return "heavy-duty work machine";
}

export function formatReplicateBalance(units: unknown): string | null {
  const n = typeof units === "number" ? units : Number(units);
  if (!Number.isFinite(n) || n < 0) return null;
  return `${Math.floor(n)} units`;
}

/** Fallback plate when no vehicle photo is uploaded. Fascia lines are validated or omitted. */
export function buildGenericPanelPrompt(copy: ShowcaseCopy = {}): string {
  const name = cleanShopName(copy.shopName);
  const tagline = cleanTagline(copy.tagline);
  const phone = cleanPhoneDisplay(copy.phone);
  const fascia = [name, tagline, phone].filter(Boolean);
  const fasciaBlock =
    fascia.length > 0
      ? `Above this counter, a backlit rectangular fascia sign displays precise, illuminated, perfect white sans-serif text rendered in a clean font (Inter): ${fascia.join(" / ")}. No placeholder fields. No bracket tokens. No dummy 555 numbers.`
      : "Above this counter, the fascia is a blank smoked-glass plate with no lettering. Do not invent a business name, tagline, phone number, or bracket tokens.";
  return [
    "High-end cinematic photograph of an Axiom professional showcase panel.",
    "A deep satin matte-black (#050507) recessed architectural wall panel is perfectly centered inside a moody, twilight industrial bay.",
    "Razor-sharp electric-cyan (#00ffcc) neon edge lighting traces the entire perimeter of the panel, casting a subtle, cool light onto the dark, raw concrete floor and surrounding wall.",
    "The scene is lit with deep film noir / chiaroscuro contrast.",
    "Mounted directly onto the panel is a minimalist matte-black and smoked-glass floating service counter.",
    fasciaBlock,
    "The background recedes into a dark, blurred workshop environment where indistinct, dark heavy machinery silhouettes catch faint blue and amber reflections.",
    "The entire plate must be 100% static and razor-sharp. Focus is perfect on the panel and text.",
    "Do not invent a truck, van, or fleet vehicle. This is the no-upload fallback.",
  ].join(" ");
}

/** Restyle an uploaded vehicle / van / machine. The source photograph stays the subject. */
export function buildHeavyEquipmentPrompt(copy: ShowcaseCopy = {}): string {
  const machine = machineTypeForNiche(copy.niche, copy.machineType);
  return [
    `A high-contrast cinematic film noir photograph of this heavy-duty ${machine}, staged on a gritty construction site at dusk.`,
    "Use the uploaded photograph as the only source machine. Do not substitute a stock plate or a different model.",
    "The machine is finished in a dark, impenetrable matte-black industrial coating.",
    "Precision electric-cyan (#00ffcc) neon light strips are intricately integrated, tracing the edges of the massive blade, the cabin frame, the engine cowl contours, and the ladder rungs, making the machine look engineered and high-end.",
    "Blazing cool-white LED worklights are activated, casting powerful, defined beams forward.",
    "A massive, dense cloud of fine dust and dirt particles is already suspended in the air within the light beams, brilliantly illuminated and catching the light, establishing motion before animation.",
    "The background shows the dark steel-frame structure of a building under construction and a distant city skyline, all cast in deep shadows.",
    "The entire scene (machine, background, ground) is 100% static, locked in perfect focus, and immaculate.",
    "The lighting is pure chiaroscuro. No extra people. No invented lettering.",
  ].join(" ");
}

/**
 * Kinetic re-creation after the still exists.
 * Layer 1 locked machine/ground/camera. Layer 2: 1–2 dust-beam / flicker reactions.
 * HUD overlay only when a real Replicate balance is supplied.
 */
export function buildKineticMotionPrompt(copy: ShowcaseCopy = {}): LocalizedMotionSpec {
  const machine = machineTypeForNiche(copy.niche, copy.machineType);
  const balance = formatReplicateBalance(copy.replicateBalanceUnits);
  const spec = buildSelectiveEnvironmentMotion(
    [EnvironmentalReactionType.HeadlightDustBeams, EnvironmentalReactionType.BackgroundLightFlicker],
    `${machine} kinetic dust-beam loop`,
  );
  const hud = balance
    ? `TEXT OVERLAY (STATIC HUD): Floating in the air next to the cabin is a small, sharp, illuminated white digital readout (holographic HUD) showing exactly: REPLICATE BALANCE: ${balance} and STAGE: KINETIC RE-CREATION. The HUD lettering is frozen. Do not invent other captions.`
    : "Do not add a balance HUD, captions, or placeholder lettering. Keep existing text locked.";
  return {
    ...spec,
    motionPrompt: [
      "Based exactly on the provided static plate, this is a precise looping cinemagraph.",
      `LAYER 1 (100% LOCKED): The entire matte-black ${machine}, the construction site background, and the ground are completely frozen in time. The camera is on a static tripod; there is no zoom, pan, or shake.`,
      spec.motionPrompt,
      "LAYER 2 (DYNAMIC MOTION): Animate ONLY the volumetric light beams and the dense dust cloud they illuminate. Apply a slow, organic, irregular drift and turbulence to the thousands of illuminated dust particles within the beams. The intensity of the cool-white worklights subtly pulses and flickers, causing the reflections within the dust cloud to shift and dance in real-time while the machine itself remains as still as a monument.",
      hud,
      "Gritty, industrial, and hyper-realistic. The contrast between the massive static machine and the moving particles is absolute.",
    ].join(" "),
  };
}

export function isEnvironmentalReaction(value: unknown): value is EnvironmentalReactionType {
  return typeof value === "string" && (ENVIRONMENTAL_REACTION_VALUES as readonly string[]).includes(value);
}

export function capEnvironmentalReactions(selected: readonly unknown[]): EnvironmentalReactionType[] {
  const unique: EnvironmentalReactionType[] = [];
  for (const item of selected) {
    if (!isEnvironmentalReaction(item)) continue;
    if (unique.includes(item)) continue;
    unique.push(item);
    if (unique.length >= 2) break;
  }
  return unique.length > 0 ? unique : [EnvironmentalReactionType.HeadlightDustBeams];
}

/**
 * Animate only 1–2 selected environmental reactions.
 * Camera, subject geometry, workers, and text stay locked.
 */
export function buildSelectiveEnvironmentMotion(
  selectedReactions: EnvironmentalReactionType[],
  contextHint?: string,
): LocalizedMotionSpec {
  const activeList = capEnvironmentalReactions(selectedReactions);
  const combinedEffects = activeList.map((reaction) => SINGLE_REACTION_DESCRIPTIONS[reaction]).join("; and ");
  const hintSuffix = contextHint?.trim() ? ` Scene context: ${contextHint.trim()}.` : "";
  return {
    reactions: activeList,
    lockSubjectAndText: true,
    motionPrompt: `${LOCK_HEADER} Animate only these 1-2 natural environmental elements: ${combinedEffects}. Keep all other parts of the scene still.${hintSuffix}`,
  };
}

/** Alias used by earlier Studio motion wiring. */
export function buildLocalizedEnvironmentMotion(
  selectedReactions: EnvironmentalReactionType[],
  contextHint?: string,
): LocalizedMotionSpec {
  return buildSelectiveEnvironmentMotion(selectedReactions, contextHint);
}

export function resolveUploadSubject(value?: string | null): AxiomUploadSubject {
  const key = (value ?? "").trim().toLowerCase();
  if (key === "vehicle" || key === "building" || key === "tool_or_generic") return key;
  if (/truck|van|fleet|auto|vehicle/.test(key)) return "vehicle";
  if (/shop|bay|building|storefront|office/.test(key)) return "building";
  return "tool_or_generic";
}

export function showcaseFallbackForSubject(
  subject?: string | null,
  copy: ShowcaseCopy = {},
): { subject: AxiomUploadSubject; posterUrl: string; stillPrompt: string } {
  const resolved = resolveUploadSubject(subject);
  if (resolved === "vehicle") {
    return {
      subject: "vehicle",
      posterUrl: HEAVY_EQUIPMENT_PLATE_POSTER,
      stillPrompt: buildHeavyEquipmentPrompt(copy),
    };
  }
  if (resolved === "building") {
    return {
      subject: "building",
      posterUrl: GENERIC_SHOWCASE_PANEL_POSTER,
      stillPrompt: buildGenericPanelPrompt(copy),
    };
  }
  return {
    subject: "tool_or_generic",
    posterUrl: GENERIC_SHOWCASE_PANEL_POSTER,
    stillPrompt: buildGenericPanelPrompt(copy),
  };
}

const STAGE_COPY: Record<AxiomVisualStage, string> = {
  base_neon_trim:
    "Stage base_neon_trim: Noir + Neon base. Obsidian field, neon cyan #00f2fe trim on real edges, crimson used only as a hairline corner.",
  lit_vapor_state:
    "Stage lit_vapor_state: volumetric smoke and cold vapor catching underglow. Keep the subject geometry identical.",
  niche_graphic_inlay:
    "Stage niche_graphic_inlay: inlay the shop mark into a real surface already in frame. No floating caption bar.",
  shop_motion_sequence:
    "Stage shop_motion_sequence: hold for a later 1–2 reaction motion pass. Do not restage.",
};

export type AxiomStagePromptInput = {
  stage?: AxiomVisualStage;
  subject?: AxiomUploadSubject | string | null;
  shopName?: string;
  tagline?: string;
  phone?: string;
  niche?: string;
  brandColor?: string;
  slotLabel?: string;
  hasUpload?: boolean;
  inlay?: string | null;
  machineType?: string;
  replicateBalanceUnits?: number;
};

/** Noir + Neon still prompt for proof_touchup remakes. */
export function buildAxiomStagePrompt(input: AxiomStagePromptInput = {}): string {
  const stage = AXIOM_VISUAL_STAGES.includes(input.stage as AxiomVisualStage) ? (input.stage as AxiomVisualStage) : "base_neon_trim";
  const subject = resolveUploadSubject(input.subject);
  const copy: ShowcaseCopy = {
    shopName: input.shopName,
    tagline: input.tagline,
    phone: input.phone,
    niche: input.niche,
    machineType: input.machineType,
    replicateBalanceUnits: input.replicateBalanceUnits,
  };
  const scene =
    input.hasUpload === false || subject === "tool_or_generic"
      ? buildGenericPanelPrompt(copy)
      : buildHeavyEquipmentPrompt(copy);
  const body = [
    AXIOM_VISUAL_LOCK,
    "Noir + Neon base: brushed-metal obsidian",
    AXIOM_HUD_OBSIDIAN,
    `neon cyan ${AXIOM_HUD_CYAN} / electric cyan #00ffcc highlights, crimson ${AXIOM_HUD_CRIMSON} used sparingly.`,
    STAGE_COPY[stage],
    scene,
  ].join(" ");
  return withAxiomVisualLock(body);
}

export type BrandingCheck = { ok: true } | { ok: false; reason: string };

export function assertValidBranding(input: { shopName?: string; phone?: string; tagline?: string }): BrandingCheck {
  if (!cleanShopName(input.shopName)) {
    return { ok: false, reason: "Name the shop — placeholder labels are blocked." };
  }
  if ((input.tagline || "").trim() && !cleanTagline(input.tagline)) {
    return { ok: false, reason: "Placeholder taglines are blocked." };
  }
  if ((input.phone || "").trim() && !cleanPhoneDisplay(input.phone)) {
    return { ok: false, reason: "555 numbers are placeholders — enter the real cell you carry on the job." };
  }
  return { ok: true };
}
