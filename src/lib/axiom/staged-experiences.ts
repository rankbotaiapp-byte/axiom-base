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
    media: ["/media/studio-preview.mp4", "/media/hero-poster.jpg"],
  },
  {
    slug: "drone-hub",
    path: "/drone-hub",
    title: "Drone Operations Hub",
    media: ["/media/infrastructure-hero-animation.mp4", "/media/heroes/contractor.jpg"],
  },
  {
    slug: "apex-moto-gt3",
    path: "/apex-moto-gt3",
    title: "APEX MOTO · GT3",
    media: ["/apex-moto-gt3/apex-clean-loop.mp4", "/media/auto-hero-animation.mp4", "/apex-moto-gt3/apex-poster.jpg"],
  },
  {
    slug: "otter-adventures",
    path: "/otter-adventures",
    title: "Aqua Otter Advocates",
    media: ["/media/axio-plumber-hero.mp4", "/media/axio-plumber-hero.jpg"],
  },
  {
    slug: "land-clearing",
    path: "/land-clearing",
    title: "Axiom Tactical Land Clearing",
    media: [
      "/media/infrastructure-hero-animation.mp4",
      "/media/heroes/contractor.jpg",
      "/media/heroes/contractor.jpg",
    ],
  },
  {
    slug: "cyber-augment",
    path: "/cyber-augment",
    title: "Cyber-Augment Labs",
    media: [
      "/media/electrician-hero-animation.mp4",
      "/media/hero-poster.jpg",
      "/media/heroes/contractor.jpg",
      "/media/heroes/electrical.jpg",
    ],
  },
  {
    slug: "abyssal-sanctuary",
    path: "/abyssal-sanctuary",
    title: "Abyssal Sanctuary",
    media: ["/media/axio-plumber-hero.mp4"],
  },
  {
    slug: "moto-elite",
    path: "/moto-elite",
    title: "Apex Midnight · Track-Spec Moto Hub",
    media: ["/media/auto-hero-animation.mp4", "/media/auto-hero.jpg"],
  },
  {
    slug: "hyper-moto",
    path: "/hyper-moto",
    title: "APEX MOTO LABS · Hyper Moto",
    media: [
      "/media/auto-hero-animation.mp4",
      "/media/auto-hero.jpg",
      "/media/axiom-greeting.mp4",
      "/media/axiom-greeting-poster.jpg",
      "/apex-moto-gt3/apex-poster.jpg",
      "/media/auto-hero.jpg",
    ],
  },
  {
    slug: "cyber-stinger",
    path: "/admin/cyber-stinger",
    title: "CyberStinger Command Dashboard",
    media: [
      "/media/electrician-hero-animation.mp4",
      "/media/hero-poster.jpg",
      "/media/studio-preview.mp4",
      "/media/hero-poster.jpg",
    ],
  },
  {
    slug: "obsidian-core",
    path: "/obsidian-core",
    title: "OBSIDIAN//CORE",
    media: [
      "/media/studio-cyan-fog-loop.mp4",
      "/media/hero-poster.jpg",
      "/media/studio-preview.mp4",
      "/media/hero-poster.jpg",
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
