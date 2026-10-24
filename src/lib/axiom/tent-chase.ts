/** Milestone stills for the tent survival chase. Files on disk use a doubled image extension. */
export const TENT_MILESTONES = {
  dawn: "/media/heroes/image_5.png.jpg",
  chase: "/media/heroes/image_6.png.jpg",
  cover: "/media/heroes/image_7.png.jpg",
} as const;

export const ZIPPER_BREACH = 0.78;

/** The zipper has been dragged far enough to snap the twig and leave the tent. */
export function zipperBreach(peel: number): boolean {
  return peel >= ZIPPER_BREACH;
}

export const TENT_DAYS = [
  { id: "mon", label: "M", date: "19" },
  { id: "tue", label: "T", date: "20" },
  { id: "wed", label: "W", date: "21" },
  { id: "thu", label: "T", date: "22" },
  { id: "fri", label: "F", date: "23" },
] as const;

export const TENT_SLOTS = ["09:00–10:00", "10:00–12:00", "12:00–16:00", "14:00–16:00", "16:00–18:00", "16:00–19:00"] as const;

export const TENT_TIERS = [
  { id: "gear", name: "Tactical outdoor gear", detail: "Outfitting for the treeline." },
  { id: "prep", name: "Wilderness preparation", detail: "Sessions before you go out." },
  { id: "repair", name: "Field repair", detail: "Kit and shelter, on site." },
] as const;

export type TentPhase = "stealth" | "chase" | "cover";

export function tentPhaseIndex(phase: TentPhase): number {
  if (phase === "chase") return 1;
  if (phase === "cover") return 2;
  return 0;
}
