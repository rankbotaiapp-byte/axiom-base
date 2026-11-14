import { resolveCatalogNiche, type CatalogNiche } from "../../config/catalog.ts";
import { emergencySearchPhrase } from "./autopilot-content.ts";

export const COMPANION_ARCHETYPE_IDS = [
  "cyber-female",
  "cyber-male",
  "animatronic",
  "predator-mech",
] as const;

export type CompanionArchetypeId = (typeof COMPANION_ARCHETYPE_IDS)[number];

export type CompanionPulse = "emergency" | "trial" | "autopilot";

export type CompanionEnvironment = "storefront" | "admin" | "hero-studio";

/** @deprecated Use CompanionArchetypeId. Kept for existing HUD imports. */
export type CompanionPersona = "female" | "male";

export type CompanionArchetype = {
  id: CompanionArchetypeId;
  name: string;
  callsign: string;
  title: string;
  still: string;
  loop: string;
  tool: string;
};

const ARCHETYPES: Record<CompanionArchetypeId, CompanionArchetype> = {
  "cyber-female": {
    id: "cyber-female",
    name: "Nova",
    callsign: "AX-FEM",
    title: "Cyber Female Operative",
    still: "/assets/avatars/cyber-female-ref.jpg",
    loop: "/assets/avatars/cyber-female-intro.mp4",
    tool: "diagnostic scanner",
  },
  "cyber-male": {
    id: "cyber-male",
    name: "Orbit",
    callsign: "AX-MAL",
    title: "Cyber Male Operative",
    still: "/assets/avatars/cyber-male-ref.jpg",
    loop: "/assets/avatars/cyber-male-intro.mp4",
    tool: "field comms plate",
  },
  animatronic: {
    id: "animatronic",
    name: "Stinger",
    callsign: "AX-ANM",
    title: "Animatronic",
    still: "/assets/avatars/animatronic-ref.jpg",
    loop: "/assets/avatars/animatronic-intro.mp4",
    tool: "servo clamp",
  },
  "predator-mech": {
    id: "predator-mech",
    name: "Lynx",
    callsign: "AX-PRD",
    title: "Predator Mech Animal",
    still: "/assets/avatars/predator-mech-ref.jpg",
    loop: "/assets/avatars/predator-intro.mp4",
    tool: "tracking array",
  },
};

export const COMPANION_HAPTICS: Record<CompanionPulse, number[]> = {
  emergency: [40, 50, 40, 50, 90],
  trial: [24, 36, 24],
  autopilot: [14, 28, 14, 28, 14],
};

const NICHE_DEFAULT: Partial<Record<CatalogNiche, CompanionArchetypeId>> = {
  plumbing: "cyber-female",
  electrical: "cyber-male",
  hvac: "animatronic",
  auto: "predator-mech",
};

const TRADE_TOOLS: Partial<Record<CatalogNiche, string>> = {
  plumbing: "pipe wrench + camera reel",
  electrical: "voltage wand + lockout kit",
  hvac: "manifold gauges",
  auto: "impact driver + scan tool",
};

export function isCompanionArchetypeId(value: string | null | undefined): value is CompanionArchetypeId {
  return COMPANION_ARCHETYPE_IDS.includes(value as CompanionArchetypeId);
}

export function companionArchetype(id: CompanionArchetypeId): CompanionArchetype {
  return ARCHETYPES[id];
}

export function allCompanionArchetypes(): CompanionArchetype[] {
  return COMPANION_ARCHETYPE_IDS.map((id) => ARCHETYPES[id]);
}

/** Deterministic tenant pairing: trade default, then slug hash. */
export function pairCompanionArchetype(slug: string, niche?: string | null): CompanionArchetypeId {
  const catalog = resolveCatalogNiche(niche);
  const byTrade = NICHE_DEFAULT[catalog];
  if (byTrade) return byTrade;
  let hash = 2166136261;
  const key = slug.trim().toLowerCase() || catalog;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return COMPANION_ARCHETYPE_IDS[hash % COMPANION_ARCHETYPE_IDS.length]!;
}

export function companionTradeTool(niche?: string | null): string {
  const catalog = resolveCatalogNiche(niche);
  return TRADE_TOOLS[catalog] ?? "field toolkit";
}

export function companionStorageKey(slug: string): string {
  return `axiom-companion-archetype:${slug.trim().toLowerCase()}`;
}

export function companionAnnouncement(
  pulse: CompanionPulse,
  input: { shopName: string; city: string; niche?: string | null },
): string {
  const shop = input.shopName.replace(/\s+/g, " ").trim() || "the shop";
  const emergency = emergencySearchPhrase(input.niche, input.city);
  if (pulse === "emergency") {
    return `Incoming emergency call. Dispatch ${emergency}. ${shop} is live.`;
  }
  if (pulse === "trial") {
    return `One dollar trial booking confirmed for ${shop}. Autopilot holds the book.`;
  }
  return `Autopilot content tick complete. ${emergency}. Schema is broadcasting.`;
}

export type CompanionLiveNotice = {
  id: string;
  kind?: string | null;
  subject?: string | null;
  body?: string | null;
  channel?: string | null;
};

/** Map Twilio / Stripe / inbox rows onto a spoken companion pulse. */
export function companionPulseFromNotice(notice: CompanionLiveNotice): CompanionPulse | null {
  const blob = `${notice.kind ?? ""} ${notice.subject ?? ""} ${notice.body ?? ""} ${notice.channel ?? ""}`.toLowerCase();
  if (!blob.trim()) return null;
  if (/emergenc|dispatch|missed call|inbound call/.test(blob)) return "emergency";
  if (/booking_paid|trial|name.?your.?price|\$1\b|one dollar/.test(blob)) return "trial";
  if (/booking_request|booking_confirmed/.test(blob)) return "trial";
  if (/autopilot|inquiry|webhook|twilio|sms|delivered|undelivered/.test(blob)) return "autopilot";
  return "autopilot";
}
