import { CompetitorLandGrabStack } from "@/components/competitor-land-grab-stack";
import { DemoPreloadDesk, type DemoPreloadFields } from "@/components/demo-preload-desk";
import { GeoSocialProofStack } from "@/components/geo-social-proof-stack";
import { MissedCallRecoverySim } from "@/components/missed-call-recovery-sim";
import {
  DEFAULT_COMPETITOR_LAND_GRAB,
  type CompetitorLandGrabConfig,
} from "@/lib/axiom/competitor-land-grab";
import {
  DEFAULT_GEO_SOCIAL_PROOF,
  type GeoSocialProofConfig,
} from "@/lib/axiom/geo-social-proof";

/** Pre-populated desk + conversion stacks + missed-call recovery under a demo / outreach storefront. */
export function DemoRetentionStack({
  fields,
  niche,
  bookHref = "#guest-book",
  greet = false,
  geoProof = DEFAULT_GEO_SOCIAL_PROOF,
  landGrab = DEFAULT_COMPETITOR_LAND_GRAB,
}: {
  fields: DemoPreloadFields;
  niche: string;
  bookHref?: string;
  /** True when the visit carried greet=1 (custom storefront / avatar intro). */
  greet?: boolean;
  geoProof?: GeoSocialProofConfig;
  landGrab?: CompetitorLandGrabConfig;
}) {
  const locale = {
    city: fields.city,
    county: fields.county,
    niche,
    trade: fields.trade || fields.nicheLabel,
    business: fields.businessName,
    greet,
  };
  return (
    <div className="bg-obsidian text-fg">
      <DemoPreloadDesk fields={fields} />
      <CompetitorLandGrabStack config={landGrab} locale={locale} comparisonClassName="px-4 sm:px-6" />
      <GeoSocialProofStack config={geoProof} locale={locale} />
      <MissedCallRecoverySim
        businessName={fields.businessName}
        niche={niche}
        trade={fields.trade || fields.nicheLabel || ""}
        bookHref={bookHref}
      />
    </div>
  );
}
