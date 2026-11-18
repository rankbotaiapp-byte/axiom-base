/**
 * Canonical Proof-of-Work demos shown on the public landing and handed into
 * `/axiom-studio?template=<slug>&source=proof_of_work`.
 */

export type ProofOfWorkFeature =
  | "Interactive 3D/Motion Hero"
  | "Service & Package Menu"
  | "Live Booking Calendar"
  | "AI Assistant";

export type ProofOfWorkDemoSlug =
  | "rogue-river-fishing"
  | "coastal-otter"
  | "abyssal-ocean"
  | "private-protection";

export type ProofOfWorkDemo = {
  slug: ProofOfWorkDemoSlug;
  name: string;
  niche: string;
  blurb: string;
  accent: string;
  hoverAccent: string;
  poster: string;
  preview?: string;
  href: string;
  features: ProofOfWorkFeature[];
  heroTheme: string;
  sections: string[];
};

export const PROOF_OF_WORK_DEMOS: readonly ProofOfWorkDemo[] = [
  {
    slug: "rogue-river-fishing",
    name: "Rogue River Guided Fishing",
    niche: "Guided Fishing · Drift Boat",
    blurb:
      "3D-styled catch-and-release splash, river trip packages, guide bio, and 24/7 charter booking on a public storefront.",
    accent: "#06b6d4",
    hoverAccent: "#34d399",
    poster: "/media/studio-references/hero-poster.jpg",
    preview: "/media/studio-references/hero-loop-optimized.mp4",
    href: "/rogue-river-fishing",
    features: [
      "Interactive 3D/Motion Hero",
      "Service & Package Menu",
      "Live Booking Calendar",
      "AI Assistant",
    ],
    heroTheme: "Rogue River Fish Release",
    sections: ["Hero film", "Trip packages", "Guide story", "24/7 booking", "Lead capture"],
  },
  {
    slug: "coastal-otter",
    name: "Coastal Otter Adventures",
    niche: "Eco Tours · Underwater",
    blurb:
      "Swimming otter hero, touch-poppable bubbles, interactive physics dock, tour schedule, and instant online reservations.",
    accent: "#22d3ee",
    hoverAccent: "#34d399",
    poster: "/media/otter-adventures-poster.jpg",
    preview: "/media/otter-hero-animation.mp4",
    href: "/coastal-otter",
    features: [
      "Interactive 3D/Motion Hero",
      "Service & Package Menu",
      "Live Booking Calendar",
      "AI Assistant",
    ],
    heroTheme: "Underwater Otter",
    sections: ["Otter hero", "Bubble FX", "Habitat specs", "Voice concierge", "Book expedition"],
  },
  {
    slug: "abyssal-ocean",
    name: "Abyssal Ocean & Marine",
    niche: "Marine · Expeditions",
    blurb:
      "Shark and octopus underwater scene, deep-ocean layout, expedition offerings, live booking, and AI assistant integration.",
    accent: "#2fe0d0",
    hoverAccent: "#34d399",
    poster: "/showcase/abyssal-sanctuary/poster.jpg",
    preview: "/media/shark-hero-animation.mp4",
    href: "/abyssal-ocean",
    features: [
      "Interactive 3D/Motion Hero",
      "Service & Package Menu",
      "Live Booking Calendar",
      "AI Assistant",
    ],
    heroTheme: "Abyssal Shark & Octopus",
    sections: ["Reef hero", "Encounters", "Dive day", "Reserve calendar", "AI contacts"],
  },
  {
    slug: "private-protection",
    name: "Private Personal Protection",
    niche: "Executive Security · Cyber",
    blurb:
      "Cyber-girl hero, tactical protection packages, vetted public credentials, and confidential 24/7 consultation booking.",
    accent: "#ff2d55",
    hoverAccent: "#34d399",
    poster: "/media/cyber-augment-poster.jpg",
    preview: "/media/cyber-augment-loop.mp4",
    href: "/private-protection",
    features: [
      "Interactive 3D/Motion Hero",
      "Service & Package Menu",
      "Live Booking Calendar",
      "AI Assistant",
    ],
    heroTheme: "Cyber-Girl Private Protection",
    sections: ["Cyber hero", "Precision hardware", "Arsenal", "Upgrade packages", "Consultation book"],
  },
] as const;

export function proofOfWorkDemo(slug: string | null | undefined): ProofOfWorkDemo | undefined {
  if (!slug) return undefined;
  return PROOF_OF_WORK_DEMOS.find((d) => d.slug === slug);
}

export function isProofOfWorkSlug(slug: string | null | undefined): slug is ProofOfWorkDemoSlug {
  return Boolean(proofOfWorkDemo(slug));
}

export function demoExploreHref(demo: ProofOfWorkDemo): string {
  const params = new URLSearchParams({ showcase: "1", template: demo.slug });
  return `${demo.href}?${params.toString()}`;
}

export function demoStudioHref(demo: ProofOfWorkDemo | ProofOfWorkDemoSlug): string {
  const slug = typeof demo === "string" ? demo : demo.slug;
  const params = new URLSearchParams({ template: slug, source: "proof_of_work" });
  return `/axiom-studio?${params.toString()}`;
}
