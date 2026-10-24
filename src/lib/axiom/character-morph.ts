export const TRAIT_KEYS = ["chest", "glutes", "lips", "jaw", "shoulders"] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

export type Traits = Record<TraitKey, number>;

export type MorphGender = "female" | "male";

export type HairStyle = "crop" | "long" | "braid" | "plate";

export type CharacterProfile = {
  id: string;
  name: string;
  gender: MorphGender;
  category: string;
  portraitUrl: string;
  hair: HairStyle;
  frame: "taper" | "block";
  skin: string;
  hairColor: string;
  armor: string;
  trim: string;
  lip: string;
  bio: string;
  voice: string;
  behavior: string;
  base: Traits;
};

export const TRAIT_FIELDS: { key: TraitKey; label: string; code: string }[] = [
  { key: "chest", label: "Chest / Pectoral", code: "Chest" },
  { key: "glutes", label: "Glutes / Lower Mass", code: "Glutes" },
  { key: "lips", label: "Lips / Facial Fullness", code: "Lips" },
  { key: "jaw", label: "Jaw / Facial Dimorphism", code: "Jaw" },
  { key: "shoulders", label: "Shoulders / Frame Width", code: "Frame" },
];

const FEMALE_ROSTER: CharacterProfile[] = [
  {
    id: "nyx-vale",
    name: "Nyx Vale",
    gender: "female",
    category: "Cyber Tactical",
    portraitUrl: "/media/characters/nyx-vale.svg",
    hair: "crop",
    frame: "taper",
    skin: "#c48a62",
    hairColor: "#1a120e",
    armor: "#12343a",
    trim: "#3ef0ff",
    lip: "#d46a8a",
    bio: "Night desk lead. She confirms the job, the window, and the price before she offers a time.",
    voice: "Eve, measured alto, short sentences.",
    behavior: "Ask one clarifying question, then offer the next open window.",
    base: { chest: 58, glutes: 52, lips: 48, jaw: 62, shoulders: 54 },
  },
  {
    id: "sera-quill",
    name: "Sera Quill",
    gender: "female",
    category: "Neo Rogue",
    portraitUrl: "/media/characters/sera-quill.svg",
    hair: "long",
    frame: "taper",
    skin: "#6b3a2a",
    hairColor: "#d5d8e0",
    armor: "#2a1030",
    trim: "#ff4fd8",
    lip: "#ff8ac4",
    bio: "Text-first closer. She keeps the tone light and gets the address without a script.",
    voice: "Eve, warmer pace, conversational.",
    behavior: "Mirror a short texting style and end with a clear booking question.",
    base: { chest: 46, glutes: 64, lips: 72, jaw: 40, shoulders: 42 },
  },
  {
    id: "ione-park",
    name: "Ione Park",
    gender: "female",
    category: "Apex Operative",
    portraitUrl: "/media/characters/ione-park.svg",
    hair: "crop",
    frame: "taper",
    skin: "#d7a07a",
    hairColor: "#24160f",
    armor: "#10243a",
    trim: "#3ef0ff",
    lip: "#c96b78",
    bio: "Board keeper. She turns a pile of requests into the one job that should happen first.",
    voice: "Eve, crisp, no filler.",
    behavior: "Rank the next action, name the tradeoff, then stop.",
    base: { chest: 52, glutes: 50, lips: 44, jaw: 66, shoulders: 60 },
  },
  {
    id: "amara-keene",
    name: "Amara Keene",
    gender: "female",
    category: "Vanguard Titan",
    portraitUrl: "/media/characters/amara-keene.svg",
    hair: "braid",
    frame: "block",
    skin: "#a56b45",
    hairColor: "#140e0c",
    armor: "#1c2430",
    trim: "#9eb4c8",
    lip: "#c47a6a",
    bio: "Steady under a full book. She slows the customer down until the scope is real.",
    voice: "Eve, lower pace, calm.",
    behavior: "Restate the scope in one sentence before talking about time.",
    base: { chest: 70, glutes: 60, lips: 55, jaw: 58, shoulders: 68 },
  },
];

const MALE_ROSTER: CharacterProfile[] = [
  {
    id: "kael-dray",
    name: "Kael Dray",
    gender: "male",
    category: "Cyber Tactical",
    portraitUrl: "/media/characters/kael-dray.svg",
    hair: "crop",
    frame: "block",
    skin: "#e0b394",
    hairColor: "#3a2a22",
    armor: "#12343a",
    trim: "#3ef0ff",
    lip: "#c48474",
    bio: "Field lead. He repeats the address and the symptom before he puts anything on the book.",
    voice: "Eve, direct, even pace.",
    behavior: "Confirm address, symptom, and access notes, in that order.",
    base: { chest: 62, glutes: 48, lips: 36, jaw: 70, shoulders: 66 },
  },
  {
    id: "rook-hale",
    name: "Rook Hale",
    gender: "male",
    category: "Neo Rogue",
    portraitUrl: "/media/characters/rook-hale.svg",
    hair: "crop",
    frame: "taper",
    skin: "#4a2c24",
    hairColor: "#0e0c0c",
    armor: "#2a1030",
    trim: "#ff4fd8",
    lip: "#a86474",
    bio: "Quiet dispatcher. One question at a time, then a time the shop can actually keep.",
    voice: "Eve, sparse, low urgency.",
    behavior: "Ask a single question and wait. Never stack three asks.",
    base: { chest: 50, glutes: 44, lips: 42, jaw: 56, shoulders: 48 },
  },
  {
    id: "idris-cho",
    name: "Idris Cho",
    gender: "male",
    category: "Apex Operative",
    portraitUrl: "/media/characters/idris-cho.svg",
    hair: "crop",
    frame: "block",
    skin: "#c4a574",
    hairColor: "#2a2118",
    armor: "#241018",
    trim: "#ff4fd8",
    lip: "#b56d62",
    bio: "Operator. He turns a messy request into the next concrete step and leaves the rest for later.",
    voice: "Eve, tight, executive.",
    behavior: "Give the next step, the owner of that step, and when it is done.",
    base: { chest: 64, glutes: 54, lips: 38, jaw: 72, shoulders: 74 },
  },
  {
    id: "marek-voss",
    name: "Marek Voss",
    gender: "male",
    category: "Vanguard Titan",
    portraitUrl: "/media/characters/marek-voss.svg",
    hair: "plate",
    frame: "block",
    skin: "#8d6a45",
    hairColor: "#2a241c",
    armor: "#1c2430",
    trim: "#9eb4c8",
    lip: "#a87868",
    bio: "Closer for a full day. He offers the next real opening instead of a maybe.",
    voice: "Eve, grounded, unhurried.",
    behavior: "Protect the calendar. Offer one real slot, not a range of hopes.",
    base: { chest: 78, glutes: 70, lips: 30, jaw: 84, shoulders: 88 },
  },
];

export const CHARACTER_ROSTERS: Record<MorphGender, CharacterProfile[]> = {
  female: FEMALE_ROSTER,
  male: MALE_ROSTER,
};

export function rosterFor(gender: MorphGender): CharacterProfile[] {
  return CHARACTER_ROSTERS[gender];
}

export function profileById(id: string): CharacterProfile | null {
  for (const roster of Object.values(CHARACTER_ROSTERS)) {
    const found = roster.find((profile) => profile.id === id);
    if (found) return found;
  }
  return null;
}

export function clampTrait(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Maps a 0–100 trait onto a transform range. Ends are the visual min and max. */
export function traitScale(value: number, min: number, max: number): number {
  return min + ((max - min) * clampTrait(value)) / 100;
}

/** Mean of the five traits. A profile's base stats already produce a score. */
export function enhancementIndex(traits: Traits): number {
  const total = TRAIT_KEYS.reduce((sum, key) => sum + clampTrait(traits[key]), 0);
  return Math.round(total / TRAIT_KEYS.length);
}
