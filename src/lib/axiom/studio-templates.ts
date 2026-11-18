import {
  PROOF_OF_WORK_DEMOS,
  proofOfWorkDemo,
  type ProofOfWorkDemo,
  type ProofOfWorkDemoSlug,
} from "@/lib/axiom-landing/proof-of-work-demos";

export type StudioTemplatePreset = {
  slug: ProofOfWorkDemoSlug;
  name: string;
  niche: string;
  heroTheme: string;
  accent: string;
  poster: string;
  preview?: string;
  sections: string[];
  features: string[];
  banner: string;
};

export function studioTemplateFromSearch(
  template: string | null | undefined,
): StudioTemplatePreset | null {
  const demo = proofOfWorkDemo(template);
  if (!demo) return null;
  return toPreset(demo);
}

export function allStudioTemplatePresets(): StudioTemplatePreset[] {
  return PROOF_OF_WORK_DEMOS.map(toPreset);
}

function toPreset(demo: ProofOfWorkDemo): StudioTemplatePreset {
  return {
    slug: demo.slug,
    name: demo.name,
    niche: demo.niche,
    heroTheme: demo.heroTheme,
    accent: demo.accent,
    poster: demo.poster,
    preview: demo.preview,
    sections: [...demo.sections],
    features: [...demo.features],
    banner: `Structured from ${demo.name} — Enter your business name, services & branding to launch`,
  };
}

export const STUDIO_TEMPLATE_STORAGE_KEY = "axiom.studio.template.v1";

export function rememberStudioTemplate(slug: ProofOfWorkDemoSlug): void {
  try {
    localStorage.setItem(STUDIO_TEMPLATE_STORAGE_KEY, slug);
  } catch {
    /* ignore */
  }
}
