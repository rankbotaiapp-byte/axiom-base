import { useMemo } from "react";
import {
  DEFAULT_COMPETITOR_LAND_GRAB,
  localizeCompetitorLandGrab,
  type CompetitorLandGrabConfig,
  type CompetitorLocale,
} from "@/lib/axiom/competitor-land-grab";
import { CompetitorReplacement } from "./competitor-replacement";
import { LandGrabBanner } from "./land-grab-banner";

/** Competitor comparison + land-grab urgency bound to a lead's market. */
export function CompetitorLandGrabStack({
  locale,
  config = DEFAULT_COMPETITOR_LAND_GRAB,
  comparisonClassName = "",
  bannerClassName = "",
}: {
  locale: CompetitorLocale;
  config?: CompetitorLandGrabConfig;
  comparisonClassName?: string;
  bannerClassName?: string;
}) {
  const data = useMemo(() => localizeCompetitorLandGrab(config, locale), [config, locale]);
  return (
    <>
      <LandGrabBanner data={data} className={bannerClassName} />
      <CompetitorReplacement data={data} className={comparisonClassName} />
    </>
  );
}
