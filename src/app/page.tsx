"use client";

import { PlumberOutreachLive } from "@/components/plumbing/plumber-outreach-landing";
import { DEFAULT_PLUMBER_OUTREACH, emptyOutreachTenant } from "@/lib/axiom/plumber-outreach";
import { DEFAULT_TENANT_SLUG } from "@/lib/axiom/tenant-overlay";

/**
 * Next.js leftover public landing. Live `/` is `src/routes/index.tsx`.
 * Both render the industrial plumbing outreach storefront so this file cannot drift.
 */
export default function Page() {
  return (
    <PlumberOutreachLive
      initial={DEFAULT_PLUMBER_OUTREACH}
      tenant={emptyOutreachTenant(DEFAULT_TENANT_SLUG)}
      studio={false}
      greet
    />
  );
}
