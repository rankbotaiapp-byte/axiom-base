export const ASSISTANT_CONFIG_KEY = "axiom_storefront_config";
export const ASSISTANT_CONFIG_EVENT = "axiom-assistant-config";

export const BASE_TYPES = ["Male Human", "Female Human", "Animal", "Colored Orb"] as const;
export const HAIR_COLORS = [
  { id: "Ink", hex: "#1c1917" },
  { id: "Ash", hex: "#94a3b8" },
  { id: "Copper", hex: "#c2714f" },
  { id: "Gold", hex: "#e4c16a" },
  { id: "Auburn", hex: "#7c2d12" },
] as const;
export const OUTFITS = ["Corporate", "Tactical", "Clean", "None"] as const;
export const VOICES = ["Professional", "Direct", "Neutral", "Warm"] as const;
export const PERSONALITIES = ["Polished", "Action-Oriented", "Hyper-efficient", "Calm"] as const;
export const ARCHETYPES = ["The Executive", "The Operator", "The Minimalist", "Custom"] as const;

export type BaseType = (typeof BASE_TYPES)[number];
export type HairColorId = (typeof HAIR_COLORS)[number]["id"];
export type OutfitId = (typeof OUTFITS)[number];
export type VoiceId = (typeof VOICES)[number];
export type PersonalityId = (typeof PERSONALITIES)[number];
export type ArchetypeId = (typeof ARCHETYPES)[number];
export type HumanBase = "Male Human" | "Female Human";

export type AssistantConfig = {
  baseType: BaseType;
  hairColor: string;
  outfit: OutfitId;
  voice: VoiceId;
  personality: PersonalityId;
  selectedArchetype: ArchetypeId;
};

const HUMAN_BASES: readonly HumanBase[] = ["Male Human", "Female Human"];

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function showsHair(baseType: BaseType): boolean {
  return baseType === "Male Human" || baseType === "Female Human" || baseType === "Animal";
}

export function hairHex(id: string): string {
  return HAIR_COLORS.find((color) => color.id === id)?.hex ?? "#94a3b8";
}

export function executiveConfig(baseType: HumanBase): AssistantConfig {
  return {
    baseType,
    hairColor: baseType === "Female Human" ? "Copper" : "Ink",
    outfit: "Corporate",
    voice: "Professional",
    personality: "Polished",
    selectedArchetype: "The Executive",
  };
}

export function operatorConfig(baseType: HumanBase): AssistantConfig {
  return {
    baseType,
    hairColor: "Ash",
    outfit: "Tactical",
    voice: "Direct",
    personality: "Action-Oriented",
    selectedArchetype: "The Operator",
  };
}

export function minimalistConfig(): AssistantConfig {
  return {
    baseType: "Colored Orb",
    hairColor: "",
    outfit: "None",
    voice: "Neutral",
    personality: "Hyper-efficient",
    selectedArchetype: "The Minimalist",
  };
}

/** Accept only the six assistant fields. Body measurements never restore. */
export function parseAssistantConfig(input: unknown): AssistantConfig | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const baseType = oneOf(record.baseType, BASE_TYPES);
  const outfit = oneOf(record.outfit, OUTFITS);
  const voice = oneOf(record.voice, VOICES) ?? oneOf(record.voiceProfile, VOICES);
  const personality = oneOf(record.personality, PERSONALITIES) ?? oneOf(record.personalityArchetype, PERSONALITIES);
  const selectedArchetype = oneOf(record.selectedArchetype, ARCHETYPES);
  if (!baseType || !outfit || !voice || !personality || !selectedArchetype) return null;
  const hairColor = typeof record.hairColor === "string" ? record.hairColor : "";
  if (hairColor !== "" && !oneOf(hairColor, HAIR_COLORS.map((color) => color.id))) return null;
  return { baseType, hairColor, outfit, voice, personality, selectedArchetype };
}

const STORED_KEYS = ["baseType", "hairColor", "outfit", "voice", "personality", "selectedArchetype"] as const;
export const LEGACY_BODY_KEYS = ["chest", "glutes", "lips", "jaw", "shoulders"] as const;
const BODY_KEYS = new Set<string>(LEGACY_BODY_KEYS);

function isVacant(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0 || value.every(isVacant);
  if (typeof value !== "object") return false;
  const values = Object.values(value as Record<string, unknown>);
  return values.length === 0 || values.every(isVacant);
}

/** Drop chest, glutes, lips, jaw, and shoulders at every depth, including nested blobs. */
export function stripLegacyBody(value: unknown, depth = 0): { value: unknown; stripped: boolean } {
  if (depth > 16 || value == null || typeof value !== "object") return { value, stripped: false };
  if (Array.isArray(value)) {
    let stripped = false;
    const next = value.map((item) => {
      const cleaned = stripLegacyBody(item, depth + 1);
      if (cleaned.stripped) stripped = true;
      return cleaned.value;
    });
    return { value: next, stripped };
  }
  let stripped = false;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (BODY_KEYS.has(key)) {
      stripped = true;
      continue;
    }
    const cleaned = stripLegacyBody(child, depth + 1);
    if (cleaned.stripped) stripped = true;
    next[key] = cleaned.value;
  }
  return { value: next, stripped };
}

/** True when a saved desk still carries a body measurement anywhere in the tree. */
export function containsLegacyBodyKeys(value: unknown): boolean {
  return stripLegacyBody(value).stripped;
}

export type StoragePlan = {
  config: AssistantConfig | null;
  action: "keep" | "rewrite" | "remove";
};

/** Clean a stored desk before the UI reads it. Empty or body-only files are removed. */
export function planAssistantStorage(raw: string): StoragePlan {
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return { config: null, action: "keep" };
  }
  const cleaned = stripLegacyBody(stored);
  if (isVacant(cleaned.value)) return { config: null, action: "remove" };
  const config = parseAssistantConfig(cleaned.value);
  if (!config) return { config: null, action: cleaned.stripped ? "remove" : "keep" };
  const record = cleaned.value as Record<string, unknown>;
  const keys = Object.keys(record);
  const canonical =
    !cleaned.stripped &&
    keys.length === STORED_KEYS.length &&
    STORED_KEYS.every((key) => Object.prototype.hasOwnProperty.call(record, key));
  if (!canonical) return { config, action: "rewrite" };
  return { config, action: "keep" };
}

/** Load the saved assistant and deep-clean it before any screen uses the value. */
export function readAssistantConfig(): AssistantConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ASSISTANT_CONFIG_KEY);
    if (!raw) return null;
    const plan = planAssistantStorage(raw);
    if (plan.action === "rewrite" && plan.config) {
      localStorage.setItem(ASSISTANT_CONFIG_KEY, JSON.stringify(plan.config));
    } else if (plan.action === "remove") {
      localStorage.removeItem(ASSISTANT_CONFIG_KEY);
    }
    return plan.config;
  } catch {
    return null;
  }
}

export function writeAssistantConfig(config: AssistantConfig): void {
  const payload: AssistantConfig = {
    baseType: config.baseType,
    hairColor: config.hairColor,
    outfit: config.outfit,
    voice: config.voice,
    personality: config.personality,
    selectedArchetype: config.selectedArchetype,
  };
  localStorage.setItem(ASSISTANT_CONFIG_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(ASSISTANT_CONFIG_EVENT));
}

export function customizeAssistant(
  current: AssistantConfig,
  patch: Partial<Pick<AssistantConfig, "baseType" | "hairColor" | "outfit" | "voice" | "personality">>,
): AssistantConfig {
  return { ...current, ...patch, selectedArchetype: "Custom" };
}

export function isHumanBase(value: BaseType): value is HumanBase {
  return (HUMAN_BASES as readonly string[]).includes(value);
}
