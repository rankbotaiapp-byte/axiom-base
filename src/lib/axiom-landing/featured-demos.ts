import {
  PROOF_OF_WORK_DEMOS,
  type ProofOfWorkDemo,
} from "@/lib/axiom-landing/proof-of-work-demos";
import { getShowcase, showcaseSrc, type ShowcaseBuild } from "./showcase";

export type FeaturedDemo = {
  slug: string;
  buildId: string | null;
  name: string;
  niche: string;
  blurb: string;
  accent: string;
  poster?: string;
  preview?: string;
  hook: string;
  /** Public storefront path. Defaults to `/t/<slug>`. */
  href?: string;
};

/** Public landing Proof-of-Work demos (and /t/<slug> redirects). */
export const FEATURED_DEMOS: FeaturedDemo[] = PROOF_OF_WORK_DEMOS.map(fromProof);

function fromProof(demo: ProofOfWorkDemo): FeaturedDemo {
  return {
    slug: demo.slug,
    buildId: null,
    name: demo.name,
    niche: demo.niche,
    blurb: demo.blurb,
    accent: demo.accent,
    poster: demo.poster,
    preview: demo.preview,
    href: demo.href,
    hook: `Explore the live ${demo.name} demo, then launch Axiom Studio pre-structured like this build.`,
  };
}

export function featuredDemo(slug: string): FeaturedDemo | undefined {
  return FEATURED_DEMOS.find((demo) => demo.slug === slug);
}

export function featuredShowcase(demo: FeaturedDemo): ShowcaseBuild | undefined {
  return demo.buildId ? getShowcase(demo.buildId) : undefined;
}

/** @deprecated Prefer demo.href from FEATURED_DEMOS / proof-of-work-demos. */
export function showcasePoster(build: ShowcaseBuild): string | undefined {
  return build.poster ? showcaseSrc(build, build.poster) : undefined;
}
