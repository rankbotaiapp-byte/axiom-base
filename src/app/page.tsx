"use client";

import { FounderIntroHero, PLUMBING_DEMO_ANCHOR } from "@/components/plumbing/founder-intro-hero";
import { PlumberOutreachLive } from "@/components/plumbing/plumber-outreach-landing";
import { DEFAULT_PLUMBER_OUTREACH, emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";
import { DEFAULT_TENANT_SLUG } from "@/lib/axiom/tenant-overlay";

/**
 * Next.js leftover public landing. Live `/` is `src/routes/index.tsx`.
 * Both open on Eric's intro, then the industrial plumbing outreach storefront.
 */
export default function Page() {
  return (
    <>
      <FounderIntroHero />
      <PlumberOutreachLive
        initial={DEFAULT_PLUMBER_OUTREACH}
        tenant={emptyOutreachTenant(DEFAULT_TENANT_SLUG)}
        studio={false}
        greet={false}
        sectionId={PLUMBING_DEMO_ANCHOR}
      />
    </>
  );
}
