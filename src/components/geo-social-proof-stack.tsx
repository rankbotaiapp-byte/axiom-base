import { useMemo } from "react";
import {
  DEFAULT_GEO_SOCIAL_PROOF,
  localizeGeoSocialProof,
  type GeoSocialProofConfig,
  type GeoLocale,
} from "@/lib/axiom/geo-social-proof";
import { GeoProofOfWork } from "./geo-proof-of-work";
import { LocalActivityTicker } from "./local-activity-ticker";

/** Proof-of-work strip + live local activity ticker bound to a lead's city/county. */
export function GeoSocialProofStack({
  locale,
  config = DEFAULT_GEO_SOCIAL_PROOF,
  proofClassName = "",
  tickerClassName = "",
}: {
  locale: GeoLocale;
  config?: GeoSocialProofConfig;
  proofClassName?: string;
  tickerClassName?: string;
}) {
  const proof = useMemo(() => localizeGeoSocialProof(config, locale), [config, locale]);
  return (
    <>
      <GeoProofOfWork proof={proof} className={proofClassName} />
      <LocalActivityTicker proof={proof} className={tickerClassName} />
    </>
  );
}
