"use client";

import type { CSSProperties, ReactNode } from "react";
import { EmergencyDispatchBar } from "@/components/conversion/EmergencyDispatchBar";
import { InstantQuoteBookWidget } from "@/components/conversion/InstantQuoteBookWidget";
import { StorefrontBookingHost } from "@/components/conversion/StorefrontBookingHost";
import { AxiomScrollAtmosphere } from "@/components/atmosphere/AxiomScrollAtmosphere";
import { useStorefrontAtmosphere } from "@/components/atmosphere/useStorefrontAtmosphere";

export function LiveShopCroShell({
  shopSlug,
  shopName,
  city,
  niche,
  accentPrimary,
  children,
  quotePlacement = "after-trust",
}: {
  shopSlug: string;
  shopName: string;
  city: string;
  niche: string;
  accentPrimary?: string;
  children: ReactNode;
  /** Reserved for future slot injection; quote always renders via sibling section in page. */
  quotePlacement?: "after-trust" | "inline";
}) {
  const { enabled: atmosphereOn } = useStorefrontAtmosphere(shopSlug);
  const brandStyle = accentPrimary
    ? ({ ["--brand-primary" as string]: accentPrimary } as CSSProperties)
    : undefined;

  return (
    <StorefrontBookingHost
      shopSlug={shopSlug}
      shopName={shopName}
      bookPath={`/${shopSlug}/book`}
      themeId="cyber_cyan"
      brandStyle={brandStyle}
    >
      <AxiomScrollAtmosphere enabled={atmosphereOn} />
      <EmergencyDispatchBar city={city} placement="bottom" />
      <div className="relative z-[1]">{children}</div>
      {quotePlacement === "after-trust" ? null : (
        <InstantQuoteBookWidget shopName={shopName} niche={niche} className="mx-6 my-12" />
      )}
    </StorefrontBookingHost>
  );
}

export function LiveShopQuoteSection({
  shopName,
  niche,
}: {
  shopName: string;
  niche: string;
}) {
  return (
    <section className="border-b border-slate-800/60 bg-[#050507] px-6 py-14">
      <InstantQuoteBookWidget shopName={shopName} niche={niche} />
    </section>
  );
}