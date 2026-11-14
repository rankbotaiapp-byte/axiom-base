/**
 * OBSIDIAN//CORE site config — brand, media, HUD copy.
 * Colors remapped onto Axiom tactical tokens (#030712 / #00ffcc / amber).
 */
export const SITE = {
  brand: "OBSIDIAN//CORE",
  colors: {
    obsidian: "#030712",
    cyan: "#00ffcc",
    amber: "#f59e0b",
  },

  home: {
    video: "/media/obsidian-crystal-orbit.mp4",
    poster: "/media/obsidian-crystal-orbit-poster.jpg",
    eyebrow: "SECTOR 07 // FRACTURE FIELD ONLINE",
    title: ["FRACTURE", "THE VOID"] as const,
    sub: "A living crystal lattice suspended in zero gravity. Step inside the core and bring your system online.",
  },

  core: {
    video: "/media/obsidian-zero-point-core.mp4",
    poster: "/media/obsidian-zero-point-core-poster.jpg",
    eyebrow: "DEPTH 02 // CORE CHAMBER",
    title: ["ZERO-POINT", "CORE"] as const,
    sub: "The source of the field. Raw energy arcing through a fractured heart, held stable at the edge of collapse.",
    readouts: [
      { label: "LATTICE INTEGRITY", value: "97.4%", tone: "cyan" as const },
      { label: "ARC DISCHARGE", value: "4.8 GW", tone: "amber" as const },
      { label: "CONTAINMENT", value: "STABLE", tone: "cyan" as const },
    ],
  },

  modal: {
    title: "INITIALIZE PROTOCOL",
    sub: "Identify yourself to open a secure channel.",
    missions: ["Start for $1, then $150/mo", "Founder's Lifetime", "Just exploring"],
    success: "ACCESS GRANTED. Watch your channel — we respond within 24 hours.",
  },
} as const;

export type Tone = "cyan" | "amber";
