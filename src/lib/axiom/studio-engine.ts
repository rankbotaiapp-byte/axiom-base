/**
 * Axiom Studio neural prompt matrix + trade niche definitions.
 * Stacks Cyber-Obsidian HUD lock, trade DNA, brand, atmosphere, motion, and camera
 * into one Imagine / animator prompt. Never emits unframed generic stock.
 */

import {
  CATALOG_BY_ID,
  CATALOG_NICHES,
  resolveCatalogNiche,
  type CatalogNiche,
} from "../../config/catalog.ts";
import {
  AXIOM_HUD_CRIMSON,
  AXIOM_HUD_CYAN,
  AXIOM_HUD_OBSIDIAN,
  AXIOM_VISUAL_LOCK,
  withAxiomVisualLock,
} from "./visual-design.ts";

/** Ordered matrix rows — each layer is a discrete neural prompt band. */
export const NEURAL_PROMPT_LAYERS = [
  "lock",
  "hud",
  "trade",
  "brand",
  "atmosphere",
  "motion",
  "camera",
  "constraints",
] as const;

export type NeuralPromptLayerId = (typeof NEURAL_PROMPT_LAYERS)[number];

export type TradeNicheDefinition = {
  id: CatalogNiche;
  label: string;
  /** Primary subject / hero object the model should hold. */
  subject: string;
  /** Trade tools and gear that belong on real surfaces. */
  tools: string;
  /** Physical place the shot lives in. */
  environment: string;
  /** Volumetric / weather / particulate field. */
  atmosphere: string;
  /** Loop-friendly motion for video; stills ignore the verb but keep the energy. */
  motion: string;
  /** Lens / framing guidance. */
  camera: string;
  /** Material / substance language (hydro, chrome, carbon, frost…). */
  substance: string;
  /** Short search / Autopilot keyword anchors. */
  keywords: readonly string[];
};

const TRADE_NICHE_DEFINITIONS: Record<CatalogNiche, TradeNicheDefinition> = {
  auto: {
    id: "auto",
    label: "Auto",
    subject: "service bay with a lifted chassis and rolling toolbox",
    tools: "impact driver, scan tool, torque wrench on brushed steel",
    environment: "night garage bay, concrete floor, open roll-up door",
    atmosphere: "volumetric smoke, oil-haze particulates, cyan rim on metal",
    motion: "slow orbit past the lift with soft tool-cart parallax",
    camera: "low three-quarter push-in, shallow depth, no hard frame",
    substance: "embers and hot metal reflections",
    keywords: ["auto repair garage", "service bay", "emergency roadside"],
  },
  barber: {
    id: "barber",
    label: "Barber",
    subject: "classic chair by the window with hot-towel warmer",
    tools: "shears, clippers, straight razor on a glass tray",
    environment: "obsidian barbershop interior, mirror wall, neon edge",
    atmosphere: "fine powder haze, warm practicals, cyan HUD plate on mirror",
    motion: "quiet chair turn and clipper glide, loop-safe idle",
    camera: "eye-level portrait plane, soft edge feathering",
    substance: "frosted glass and chrome fixtures",
    keywords: ["barbershop chair", "fade haircut", "hot towel"],
  },
  "beauty-salon": {
    id: "beauty-salon",
    label: "Beauty salon",
    subject: "private suite station with color bowl and soft key light",
    tools: "brushes, foils, steamer on a holographic tray",
    environment: "obsidian suite, brushed metal cabinetry, frosted partition",
    atmosphere: "soft volumetric mist, cyan hairline strokes on glass",
    motion: "slow rake of light across the suite, gentle steam rise",
    camera: "elevated three-quarter, feathered vignette",
    substance: "frosted glass and liquid chrome accents",
    keywords: ["beauty salon suite", "hair color", "spa station"],
  },
  "bow-tech": {
    id: "bow-tech",
    label: "Bow tech",
    subject: "custom compound bow on a maple workbench",
    tools: "press, serving jig, hex keys, string wax",
    environment: "archery bench under tactical HUD plates",
    atmosphere: "dust motes in shaft light, cyan crosshairs on limb tips",
    motion: "slow push along the riser, string micro-flex",
    camera: "macro-to-wide orbit locked on the rest",
    substance: "carbon fiber and brushed aluminum",
    keywords: ["compound bow bench", "archery workshop", "bow tune"],
  },
  canine: {
    id: "canine",
    label: "Canine",
    subject: "grooming run and outdoor kennel gate ready for booking",
    tools: "leash, clippers, bath wand on stainless rail",
    environment: "clean kennel corridor opening to a field path",
    atmosphere: "morning mist, soft particulate, cyan gate readouts",
    motion: "gentle gate swing and leash coil idle loop",
    camera: "low tracking shot along the run",
    substance: "wet chrome and frosted glass",
    keywords: ["dog grooming", "boarding kennel", "outdoor run"],
  },
  contractor: {
    id: "contractor",
    label: "Contractor",
    subject: "job-site frame with sawhorses and marked plans",
    tools: "circular saw, laser level, nail gun on plywood",
    environment: "residential build site at dusk, lumber stacks",
    atmosphere: "sawdust haze, volumetric smoke, cyan HUD on hard hat edge",
    motion: "slow crane-like rise over the frame",
    camera: "wide establishing into mid tool detail",
    substance: "raw timber and brushed steel",
    keywords: ["construction site", "general contractor", "remodel"],
  },
  electrical: {
    id: "electrical",
    label: "Electrical",
    subject: "open service panel with copper bus bars and labeled breakers",
    tools: "voltage wand, lockout kit, fish tape on a brushed plate",
    environment: "night utility closet, obsidian field #050507, neon-red structural edge light",
    atmosphere: "controlled ember glow on copper, volumetric smoke, cyan HUD traces",
    motion: "subtle pulse along copper bus, slow pan",
    camera: "tight panel insert then pull to the truck",
    substance: "polished copper reflections and obsidian carbon",
    keywords: ["electrician panel", "copper bus", "24/7 electrical"],
  },
  fabrication: {
    id: "fabrication",
    label: "Fabrication",
    subject: "steel fab table with fixture clamps and MIG torch",
    tools: "welder, angle grinder, layout square",
    environment: "shop bay with overhead crane silhouette",
    atmosphere: "grinding sparks, volumetric smoke, cyan plate etch",
    motion: "torch idle glow with slow dolly past the jig",
    camera: "low industrial angle, rim-lit metal",
    substance: "embers, slag glow, liquid chrome weld bead",
    keywords: ["metal fab shop", "welding", "custom steel"],
  },
  forestry: {
    id: "forestry",
    label: "Forestry",
    subject: "marked timber stand with crew saw and choker cable",
    tools: "chainsaw, wedge, measuring tape on bark",
    environment: "high-desert stand, soft undergrowth, dusk canopy",
    atmosphere: "wood smoke and pollen, volumetric shafts, cyan tree tags",
    motion: "slow boom through trees with leaf drift",
    camera: "forest depth parallax, subject mid-ground",
    substance: "raw timber and cold steel",
    keywords: ["forestry crew", "timber stand", "tree service"],
  },
  glasswork: {
    id: "glasswork",
    label: "Glasswork",
    subject: "precision pane on suction cups awaiting set",
    tools: "glass cutter, glazing points, laser measure",
    environment: "studio bay with refracting daylight and HUD plate",
    atmosphere: "fine particulate, prismatic cyan edge bloom",
    motion: "slow refraction sweep across the pane",
    camera: "macro edge then pull to install plane",
    substance: "frosted glass and liquid chrome hardware",
    keywords: ["glass install", "glazing studio", "precision pane"],
  },
  hvac: {
    id: "hvac",
    label: "HVAC",
    subject: "rooftop condenser and manifold gauges under frost vapor",
    tools: "manifold gauges, coil fins, vacuum pump",
    environment: "blue-hour rooftop, obsidian sky #050507, neon-red edge brackets",
    atmosphere: "cold vapor plume, frost crystals, volumetric smoke",
    motion: "gentle vapor rise and gauge needle idle",
    camera: "three-quarter rooftop push-in",
    substance: "frost on brushed aluminum with wet condensate reflections",
    keywords: ["hvac condenser", "frost vapor", "24/7 AC"],
  },
  landscaping: {
    id: "landscaping",
    label: "Landscaping",
    subject: "hand-carved stone boulders along a wet hardscape edge",
    tools: "chisel marks, irrigation head, mason line on the lead boulder",
    environment: "dusk garden, obsidian field #050507, carved stone receding into bokeh",
    atmosphere: "mist over turf, pollen drift, volumetric smoke, neon-red edge light on wet stone",
    motion: "slow lateral slide along the carved boulder line",
    camera: "ground-level tracking with soft horizon",
    substance: "carved stone, sheet water, and living green against obsidian mulch",
    keywords: ["stone boulder carving", "landscaping", "wet hardscape"],
  },
  machining: {
    id: "machining",
    label: "Machining",
    subject: "CNC spindle over a fixture plate holding tolerance",
    tools: "end mill, dial indicator, calipers",
    environment: "precision machine shop under cool practicals",
    atmosphere: "coolant mist, volumetric smoke, cyan readout plates",
    motion: "spindle idle spin and slow orbit of the fixture",
    camera: "macro chip light then wide shop pull",
    substance: "embers of hot swarf and liquid chrome ways",
    keywords: ["cnc shop", "precision mill", "machine tools"],
  },
  plumbing: {
    id: "plumbing",
    label: "Plumbing",
    subject: "polished copper pipes and fittings set into wet ceramic tile",
    tools: "pipe wrench, inspection camera, copper elbows on the tile plane",
    environment: "night tile bath, obsidian field #050507, steam in the deep bokeh",
    atmosphere: "hydro droplets, steam, volumetric smoke, neon-red edge light on copper",
    motion: "water pulse along the copper runs, loop-safe",
    camera: "tight tile insert then pull back to the wet wall",
    substance: "copper, glazed tile, and sheet-water reflections",
    keywords: ["copper pipes", "wet tile", "emergency plumber"],
  },
  "personal-trainer": {
    id: "personal-trainer",
    label: "Personal trainer",
    subject: "rack and bench staged for a booked hour",
    tools: "kettlebell, jump rope, heart-rate HUD plate",
    environment: "obsidian gym bay with neon cyan lane lines",
    atmosphere: "chalk dust volumetric, soft sweat sheen, cyan pulse",
    motion: "subtle rack sway and weight plate idle",
    camera: "hero low angle into the rack plane",
    substance: "carbon fiber and brushed steel",
    keywords: ["personal trainer", "strength session", "gym coaching"],
  },
  "power-sports": {
    id: "power-sports",
    label: "Outdoor sports lessons",
    subject: "board or sled staged for a lesson block",
    tools: "bindings tool, helmet, lesson clipboard HUD",
    environment: "trailhead / snow line under dusk sky",
    atmosphere: "blown snow or dust, volumetric haze, cyan trail markers",
    motion: "slow board edge carve idle / sled glide loop",
    camera: "tracking three-quarter with terrain parallax",
    substance: "frost crystals and carbon composite",
    keywords: ["outdoor lessons", "ATV bay", "board block"],
  },
  roofing: {
    id: "roofing",
    label: "Roofing",
    subject: "pitch with staged shingles and chalk lines",
    tools: "nail gun, harness, magnetic tray",
    environment: "residential rooftop before dark",
    atmosphere: "wind particulate, volumetric sky smoke, cyan edge brackets",
    motion: "slow crane over the pitch",
    camera: "elevated diagonal along the ridge",
    substance: "asphalt texture and brushed metal flashing",
    keywords: ["roofing install", "shingles", "roof inspection"],
  },
  security: {
    id: "security",
    label: "Security",
    subject: "patrol post with camera array and lockset",
    tools: "key set, flashlight, body-cam HUD plate",
    environment: "night perimeter, brushed metal gate",
    atmosphere: "searchlight haze, volumetric smoke, cyan crosshair reticles",
    motion: "slow pan of the post with scan-line pulse",
    camera: "surveillance three-quarter, deep blacks",
    substance: "obsidian carbon and cold steel",
    keywords: ["security patrol", "camera install", "locksmith"],
  },
  "stone-masonry": {
    id: "stone-masonry",
    label: "Stone masonry",
    subject: "course of natural stone with wet mortar bed",
    tools: "trowel, level, chisel, mason line",
    environment: "patio wall build under open sky",
    atmosphere: "stone dust volumetric, cyan HUD on level readout",
    motion: "slow dolly along the face course",
    camera: "low wall-hugging track",
    substance: "raw stone and damp mortar sheen",
    keywords: ["stone masonry", "brick mason", "hardscape wall"],
  },
  taxidermy: {
    id: "taxidermy",
    label: "Taxidermy",
    subject: "mount on the finishing bench under soft key",
    tools: "detail brushes, form, glass eyes on tray",
    environment: "wildlife studio lodge, dark wood and HUD plate",
    atmosphere: "fine dust motes, volumetric shafts, cyan edge brackets",
    motion: "slow orbit of the mount, feather micro-stir",
    camera: "portrait plane with deep field falloff",
    substance: "natural fur texture against brushed metal base",
    keywords: ["taxidermy studio", "wildlife mount", "restoration"],
  },
  "tool-repair": {
    id: "tool-repair",
    label: "Tool repair",
    subject: "open power tool on a service bench",
    tools: "driver bits, armature gauge, sharpening stone",
    environment: "compact repair bay with pegboard HUD",
    atmosphere: "oil mist, volumetric smoke, cyan diagnostic plate",
    motion: "chuck idle spin and soft bench parallax",
    camera: "macro bench work into shop pull",
    substance: "embers of grind and liquid chrome housing",
    keywords: ["tool repair bench", "power tool service", "sharpen"],
  },
  "water-systems": {
    id: "water-systems",
    label: "Water systems",
    subject: "well head and filtration skid with pressure gauges",
    tools: "pipe wrench, test kit, pump controller",
    environment: "deep-water service pad, cool practicals",
    atmosphere: "hydro spray, mist sheets, cyan HUD on PSI plate",
    motion: "water pulse and gauge needle loop",
    camera: "low pad angle with reflective wet ground",
    substance: "hydro-splash and frosted glass canisters",
    keywords: ["well pump", "water filtration", "treatment system"],
  },
  woodworking: {
    id: "woodworking",
    label: "Woodworking",
    subject: "millwork bench with matched grain panel",
    tools: "hand plane, chisels, marking gauge",
    environment: "warm shop under cool cyan rim accents",
    atmosphere: "fine sawdust volumetric, soft smoke in deep field",
    motion: "slow plane stroke idle and shaving curl",
    camera: "macro grain then wide bench pull",
    substance: "raw timber and brushed brass hardware",
    keywords: ["woodworking shop", "custom cabinetry", "millwork"],
  },
};

export type NeuralPromptMedium = "image" | "video";

export type NeuralPromptMatrixInput = {
  niche?: string | null;
  shopName?: string;
  tagline?: string;
  accent?: string;
  medium?: NeuralPromptMedium;
  /** Freeform scene override from Hero Studio / Copilot. */
  sceneHint?: string;
  /** Extra brand DNA line (logo surfaces, palette note). */
  brandNote?: string;
};

export type NeuralPromptMatrix = Record<NeuralPromptLayerId, string>;

export type StudioEnginePrompt = {
  niche: CatalogNiche;
  definition: TradeNicheDefinition;
  layers: NeuralPromptMatrix;
  prompt: string;
  medium: NeuralPromptMedium;
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function cleanLine(value: unknown, limit: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function cleanAccent(value: unknown): string {
  const raw = cleanLine(value, 16);
  return HEX.test(raw) ? raw.toUpperCase() : AXIOM_HUD_CYAN;
}

/** Full trade niche table — every verified catalog id. */
export function allTradeNicheDefinitions(): TradeNicheDefinition[] {
  return CATALOG_NICHES.map((id) => TRADE_NICHE_DEFINITIONS[id]);
}

export function tradeNicheDefinition(niche?: string | null): TradeNicheDefinition {
  const id = resolveCatalogNiche(niche);
  return TRADE_NICHE_DEFINITIONS[id] ?? TRADE_NICHE_DEFINITIONS[resolveCatalogNiche("contractor")];
}

export function isTradeNicheId(value: string | null | undefined): value is CatalogNiche {
  if (!value) return false;
  return (CATALOG_NICHES as readonly string[]).includes(value.trim().toLowerCase());
}

/** Build the eight-layer neural prompt matrix for one studio shot. */
export function buildNeuralPromptMatrix(input: NeuralPromptMatrixInput = {}): NeuralPromptMatrix {
  const def = tradeNicheDefinition(input.niche);
  const catalog = CATALOG_BY_ID[def.id];
  const shop = cleanLine(input.shopName, 48) || catalog.defaultName;
  const tagline = cleanLine(input.tagline, 80) || catalog.tagline;
  const accent = cleanAccent(input.accent);
  const scene = cleanLine(input.sceneHint, 280);
  const brandNote = cleanLine(input.brandNote, 200);
  const medium = input.medium === "video" ? "video" : "image";

  const tradeBody = scene
    ? `${def.label} trade DNA: ${scene}. Default subject remains ${def.subject}; tools ${def.tools}; place ${def.environment}.`
    : `${def.label} trade DNA: subject is ${def.subject}. Tools: ${def.tools}. Place: ${def.environment}. Substance: ${def.substance}.`;

  const brandBody = [
    `Brand lock: business name "${shop}".`,
    `Tagline "${tagline}".`,
    `Tenant accent ${accent}, HUD cyan ${AXIOM_HUD_CYAN}, crimson ${AXIOM_HUD_CRIMSON}.`,
    "Weave the logo and wordmark into real surfaces — truck, glass, wrench, visor, wall plate — and into the holographic HUD plate.",
    brandNote,
  ]
    .filter(Boolean)
    .join(" ");

  const motionBody =
    medium === "video"
      ? `Motion: ${def.motion}. Slow orbit or push-in only. Loop-safe. No on-film word painting unless the tagline is already brand DNA.`
      : `Still energy: imply ${def.motion} without smear. Hold the subject sharp on the hero plane.`;

  return {
    lock: AXIOM_VISUAL_LOCK,
    hud: `HUD geometry: obsidian field ${AXIOM_HUD_OBSIDIAN}, neon cyan ${AXIOM_HUD_CYAN} highlights, crimson ${AXIOM_HUD_CRIMSON} corner glow, tactical L-bracket crosshairs, holographic data plates, hairline cyan strokes.`,
    trade: tradeBody,
    brand: brandBody,
    atmosphere: `Atmosphere: ${def.atmosphere}. Keep volumetric smoke in the deep field.`,
    motion: motionBody,
    camera: `Camera: ${def.camera}. Subject on the z-space hero plane with soft alpha-edge feathering — never a hard rectangular stock frame.`,
    constraints:
      "Constraints: keep original scene lighting when a reference still is provided. No extra people. No generic stock. No purple AI chrome. No invented logo replacing the tenant mark. No watermark.",
  };
}

/** Flatten matrix layers into a single Imagine / animator prompt (lock prepended). */
export function composeNeuralPrompt(input: NeuralPromptMatrixInput = {}): string {
  const layers = buildNeuralPromptMatrix(input);
  const body = NEURAL_PROMPT_LAYERS.map((id) => layers[id]).join(" ");
  return withAxiomVisualLock(body);
}

/** Full studio engine packet: niche definition + matrix + composed prompt. */
export function studioEnginePrompt(input: NeuralPromptMatrixInput = {}): StudioEnginePrompt {
  const definition = tradeNicheDefinition(input.niche);
  const layers = buildNeuralPromptMatrix({ ...input, niche: definition.id });
  const medium = input.medium === "video" ? "video" : "image";
  return {
    niche: definition.id,
    definition,
    layers,
    medium,
    prompt: composeNeuralPrompt({ ...input, niche: definition.id, medium }),
  };
}

/** Keyword anchors for Autopilot / stock search, from the niche matrix. */
export function studioNicheKeywords(niche?: string | null): string[] {
  const def = tradeNicheDefinition(niche);
  const label = def.label.toLowerCase();
  return [...new Set([label, ...def.keywords].map((k) => k.trim()).filter(Boolean))].slice(0, 8);
}

/** Million-dollar studio field. Darker than the HUD token so plates read as carved metal. */
export const STUDIO_FIELD = "#050507";
/** Neon-red structural edge light. Matches crimson HUD `#ff2a3d`. */
export const STUDIO_EDGE = AXIOM_HUD_CRIMSON;

/**
 * Trades the studio matrix renders as three stored plates.
 * Pest control is studio-only — it is not a catalog niche.
 */
export const STUDIO_MATRIX_NICHES = ["landscaping", "plumbing", "hvac", "electrical", "pest-control"] as const;

export type StudioMatrixNiche = (typeof STUDIO_MATRIX_NICHES)[number];

export type StudioParticleKind = "pollen" | "droplets" | "vapor" | "sparks" | "mist";

export type StudioMatrixEntry = {
  id: StudioMatrixNiche;
  label: string;
  /** Catalog id when one exists. Pest control stays null. */
  catalogNiche: CatalogNiche | null;
  /** Layer 0 — far cinematic bokeh. */
  environment: string;
  /** Layer 1 — trade equipment. */
  equipment: string;
  /** Layer 1 — fluid / water reflections sitting on that equipment. */
  fluid: string;
  /** Layer 2 — how the nameplate is cut. */
  nameplate: string;
  particles: StudioParticleKind;
  motion: string;
};

export const STUDIO_MATRIX: Record<StudioMatrixNiche, StudioMatrixEntry> = {
  landscaping: {
    id: "landscaping",
    label: "Landscaping",
    catalogNiche: "landscaping",
    environment:
      "Dusk garden bokeh. Hand-carved stone boulders fall out of focus into volumetric smoke on an obsidian field #050507.",
    equipment: "Lead boulder with fresh chisel facets, mason line, and a wet irrigation head.",
    fluid: "Sheet water sliding across carved stone, specular reflections of neon-red edge light #ff2a3d.",
    nameplate: "Embossed brushed-metal nameplate cut into the lead boulder, neon-red structural edge-light.",
    particles: "pollen",
    motion: "Slow lateral slide along the carved boulder line.",
  },
  plumbing: {
    id: "plumbing",
    label: "Plumbing",
    catalogNiche: "plumbing",
    environment: "Night ceramic-tile wall thrown into cinematic bokeh. Steam and obsidian field #050507.",
    equipment: "Polished copper pipes, elbows, and a pipe wrench resting on wet tile.",
    fluid: "Water sheet and copper reflections. Hydro droplets catch crimson edge light #ff2a3d.",
    nameplate: "Neon-carved copper nameplate flush with the tile plane, #ff2a3d edge bloom.",
    particles: "droplets",
    motion: "Water pulse traveling the copper runs.",
  },
  hvac: {
    id: "hvac",
    label: "HVAC",
    catalogNiche: "hvac",
    environment: "Blue-hour rooftop bokeh. Condenser silhouettes against an obsidian sky #050507.",
    equipment: "Coil fins, manifold gauges, and a brushed-aluminum condenser cabinet.",
    fluid: "Frost vapor and condensate beads reflecting neon-red structural edge light #ff2a3d.",
    nameplate: "Embossed aluminum nameplate on the condenser door, neon-red edge lighting.",
    particles: "vapor",
    motion: "Gentle vapor rise with a slow rooftop push-in.",
  },
  electrical: {
    id: "electrical",
    label: "Electrical",
    catalogNiche: "electrical",
    environment: "Night panel room in deep bokeh. Obsidian void #050507, volumetric smoke.",
    equipment: "Open service panel, polished copper bus bars, labeled breakers, voltage wand.",
    fluid: "Specular streaks on the copper bus and the glass cover, lit by neon-red edge light #ff2a3d.",
    nameplate: "Brushed-metal nameplate on the panel door with neon-red structural edge-light.",
    particles: "sparks",
    motion: "Slow pulse along the copper bus.",
  },
  "pest-control": {
    id: "pest-control",
    label: "Pest control",
    catalogNiche: null,
    environment: "Night foundation line in cinematic bokeh. Siding and shrubs fall off into #050507.",
    equipment: "Treatment wand, exterior station housings, and a flashlight beam on the siding. No chemical labels.",
    fluid: "Fine mist and wet-foundation reflections catching neon-red edge light #ff2a3d.",
    nameplate: "Embossed metal nameplate on the truck door, neon-carved wordmark.",
    particles: "mist",
    motion: "Slow tracking shot along the foundation with drifting mist.",
  },
};

export const RENDER_LAYER_ROLES = ["bokeh", "equipment", "nameplate"] as const;
export type RenderLayerRole = (typeof RENDER_LAYER_ROLES)[number];

export type StudioRenderLayer = {
  index: 0 | 1 | 2;
  role: RenderLayerRole;
  label: string;
  prompt: string;
  /** Stable jsonb / column key for database storage. */
  storageKey: "layer_0_bokeh" | "layer_1_equipment" | "layer_2_nameplate";
  /** CSS translateZ in px for the preview stack. */
  z: number;
  /** Mouse-parallax multiplier. Far plates move less. */
  parallax: number;
  particles: StudioParticleKind | "none";
};

export type StudioLayerPacket = {
  version: 1;
  niche: StudioMatrixNiche;
  label: string;
  shopName: string;
  tagline: string;
  field: typeof STUDIO_FIELD;
  edge: typeof STUDIO_EDGE;
  hud: typeof AXIOM_HUD_CYAN;
  layers: [StudioRenderLayer, StudioRenderLayer, StudioRenderLayer];
  /** Full stacked prompt, visual-lock stamped. */
  prompt: string;
};

export type StudioParticleSeed = {
  id: number;
  /** Percent across the plate. */
  x: number;
  y: number;
  size: number;
  /** 0 far, 1 near — multiplies pointer parallax. */
  depth: number;
  drift: number;
};

const MATRIX_ALIASES: Record<string, StudioMatrixNiche> = {
  landscape: "landscaping",
  lawn: "landscaping",
  plumber: "plumbing",
  electric: "electrical",
  electrician: "electrical",
  pest: "pest-control",
  pestcontrol: "pest-control",
  "pest-control": "pest-control",
};

export function isStudioMatrixNiche(value: string | null | undefined): value is StudioMatrixNiche {
  if (!value) return false;
  return (STUDIO_MATRIX_NICHES as readonly string[]).includes(value.trim().toLowerCase());
}

export function resolveStudioMatrixNiche(value?: string | null): StudioMatrixNiche {
  const key = (value ?? "").trim().toLowerCase();
  if (isStudioMatrixNiche(key)) return key;
  return MATRIX_ALIASES[key] ?? "plumbing";
}

export function studioMatrixEntry(niche?: string | null): StudioMatrixEntry {
  return STUDIO_MATRIX[resolveStudioMatrixNiche(niche)];
}

function layerPrompt(body: string): string {
  return withAxiomVisualLock(
    `${AXIOM_VISUAL_LOCK} Obsidian field ${STUDIO_FIELD}. Neon-red structural edge-lighting ${STUDIO_EDGE}. HUD cyan ${AXIOM_HUD_CYAN}. Tactical corner crosshairs. Volumetric smoke. ${body}`,
  );
}

/** Split one studio shot into three independently stored render layers. */
export function decomposeStudioLayers(input: {
  niche?: string | null;
  shopName?: string;
  tagline?: string;
} = {}): StudioLayerPacket {
  const entry = studioMatrixEntry(input.niche);
  const shop = cleanLine(input.shopName, 48) || "Your shop";
  const tagline = cleanLine(input.tagline, 140);
  const plate = tagline ? `${shop} — ${tagline}` : shop;

  const bokeh = layerPrompt(
    `Layer 0 cinematic bokeh background only. ${entry.environment} No sharp tools. No readable lettering. Soft alpha edge, no hard rectangular frame.`,
  );
  const equipment = layerPrompt(
    `Layer 1 midground only. ${entry.equipment} Fluid and reflections: ${entry.fluid} Motion: ${entry.motion} Isolated on transparency. No business name. No background sky.`,
  );
  const nameplate = layerPrompt(
    `Layer 2 foreground nameplate only. ${entry.nameplate} Embossed metallic or neon-carved lettering reads "${plate}". Tenant mark on the metal. Isolated plate, no environment, no extra people.`,
  );

  const layers: [StudioRenderLayer, StudioRenderLayer, StudioRenderLayer] = [
    {
      index: 0,
      role: "bokeh",
      label: "Cinematic bokeh",
      prompt: bokeh,
      storageKey: "layer_0_bokeh",
      z: -72,
      parallax: 0.28,
      particles: entry.particles,
    },
    {
      index: 1,
      role: "equipment",
      label: "Trade equipment",
      prompt: equipment,
      storageKey: "layer_1_equipment",
      z: 12,
      parallax: 0.62,
      particles: "none",
    },
    {
      index: 2,
      role: "nameplate",
      label: "Nameplate",
      prompt: nameplate,
      storageKey: "layer_2_nameplate",
      z: 64,
      parallax: 1,
      particles: "none",
    },
  ];

  return {
    version: 1,
    niche: entry.id,
    label: entry.label,
    shopName: shop,
    tagline,
    field: STUDIO_FIELD,
    edge: STUDIO_EDGE,
    hud: AXIOM_HUD_CYAN,
    layers,
    prompt: withAxiomVisualLock(layers.map((layer) => layer.prompt).join(" ")),
  };
}

/** Plain jsonb record for a `studio_layers` column. */
export function serializeStudioLayerPacket(packet: StudioLayerPacket): Record<string, unknown> {
  return {
    version: packet.version,
    niche: packet.niche,
    label: packet.label,
    shopName: packet.shopName,
    tagline: packet.tagline,
    field: packet.field,
    edge: packet.edge,
    hud: packet.hud,
    prompt: packet.prompt,
    layers: packet.layers.map((layer) => ({
      index: layer.index,
      role: layer.role,
      label: layer.label,
      prompt: layer.prompt,
      storageKey: layer.storageKey,
      z: layer.z,
      parallax: layer.parallax,
      particles: layer.particles,
    })),
  };
}

/** Deterministic particle field for the preview hook. Same niche always yields the same seeds. */
export function studioParticleSeeds(niche?: string | null, count = 22): StudioParticleSeed[] {
  const entry = studioMatrixEntry(niche);
  const total = Math.max(8, Math.min(40, Math.floor(count)));
  let hash = 2166136261;
  const key = entry.id;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Array.from({ length: total }, (_, id) => {
    hash = Math.imul(hash ^ (id + 1), 16777619);
    const unit = (hash >>> 0) / 4294967295;
    const unitB = ((Math.imul(hash, 2246822519) >>> 0) / 4294967295);
    return {
      id,
      x: Math.round(unit * 1000) / 10,
      y: Math.round(unitB * 1000) / 10,
      size: 1 + (id % 3),
      depth: 0.25 + (id % 5) * 0.15,
      drift: 6 + (id % 7) * 1.4,
    };
  });
}

export { TRADE_NICHE_DEFINITIONS };
