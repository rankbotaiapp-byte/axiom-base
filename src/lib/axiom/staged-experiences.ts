/**
 * Staged cinematic shop experiences migrated from `_temp_caude_build`.
 * Static TanStack routes take precedence over `/$shopSlug` for these paths.
 */
export type StagedExperience = {
  slug: string;
  path: `/${string}`;
  title: string;
  media: readonly string[];
};

export const STAGED_EXPERIENCES = [
  {
    slug: "aether",
    path: "/aether",
    title: "Aether Dynamics",
    media: ["/media/aether-propulsion.mp4", "/media/aether-poster.jpg"],
  },
  {
    slug: "drone-hub",
    path: "/drone-hub",
    title: "Drone Operations Hub",
    media: ["/media/drone-loop.mp4", "/media/drone-poster.jpg"],
  },
  {
    slug: "apex-moto-gt3",
    path: "/apex-moto-gt3",
    title: "APEX MOTO · GT3",
    media: ["/media/apex-moto-gt3-hero.mp4", "/media/garage-loop.mp4", "/media/apex-moto-gt3-poster.jpg"],
  },
  {
    slug: "otter-adventures",
    path: "/otter-adventures",
    title: "Aqua Otter Advocates",
    media: ["/media/otter-adventures-loop.mp4", "/media/otter-adventures-poster.jpg"],
  },
  {
    slug: "land-clearing",
    path: "/land-clearing",
    title: "Axiom Tactical Land Clearing",
    media: [
      "/media/land-clearing-loop.mp4",
      "/media/land-clearing-poster.jpg",
      "/media/land-clearing-fleet.jpg",
    ],
  },
  {
    slug: "cyber-augment",
    path: "/cyber-augment",
    title: "Cyber-Augment Labs",
    media: [
      "/media/cyber-augment-loop.mp4",
      "/media/cyber-augment-poster.jpg",
      "/media/cyber-augment-workshop.jpg",
      "/media/cyber-augment-armory.jpg",
    ],
  },
  {
    slug: "abyssal-sanctuary",
    path: "/abyssal-sanctuary",
    title: "Abyssal Sanctuary",
    media: ["/media/abyssal-sanctuary-loop.mp4"],
  },
  {
    slug: "moto-elite",
    path: "/moto-elite",
    title: "Apex Midnight · Track-Spec Moto Hub",
    media: ["/media/garage-loop.mp4", "/media/garage-poster.jpg"],
  },
  {
    slug: "hyper-moto",
    path: "/hyper-moto",
    title: "APEX MOTO LABS · Hyper Moto",
    media: [
      "/media/garage-loop.mp4",
      "/media/garage-poster.jpg",
      "/media/axiom-greeting.mp4",
      "/media/axiom-greeting-poster.jpg",
      "/media/hyper-moto-apex-engine.jpg",
      "/media/hyper-moto-wireframe-head.jpg",
    ],
  },
  {
    slug: "cyber-stinger",
    path: "/admin/cyber-stinger",
    title: "CyberStinger Command Dashboard",
    media: [
      "/media/cyber-stinger-loop.mp4",
      "/media/cyber-stinger-poster.jpg",
      "/media/cyber-stinger-portrait.mp4",
      "/media/cyber-stinger-portrait-poster.jpg",
    ],
  },
  {
    slug: "obsidian-core",
    path: "/obsidian-core",
    title: "OBSIDIAN//CORE",
    media: [
      "/media/obsidian-crystal-orbit.mp4",
      "/media/obsidian-crystal-orbit-poster.jpg",
      "/media/obsidian-zero-point-core.mp4",
      "/media/obsidian-zero-point-core-poster.jpg",
    ],
  },
] as const satisfies readonly StagedExperience[];

const BY_SLUG = new Map<string, StagedExperience>(STAGED_EXPERIENCES.map((row) => [row.slug, row]));

export function stagedExperience(slug: string): StagedExperience | null {
  return BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

export function isStagedExperienceSlug(slug: string): boolean {
  return BY_SLUG.has(slug.trim().toLowerCase());
}
