"use client";

import { ChaChingRevenueCounter } from "@/components/admin/ChaChingRevenueCounter";
import { InstantQuoteBookWidget } from "@/components/conversion/InstantQuoteBookWidget";
import { StorefrontBookingHost } from "@/components/conversion/StorefrontBookingHost";

const DEMO_SLUG = "private-protection";
const DEMO_NAME = "Sample trade storefront";

/** Phase 3 — live Cha-Ching + instant quote, same widgets owners see in admin. */
export function LandingConversionPipeline() {
  return (
    <section
      id="pipeline"
      className="relative overflow-hidden border-t border-white/10 bg-[#030305] px-5 py-20 sm:px-8 sm:py-28"
      aria-labelledby="pipeline-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(0,242,254,0.1), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1120px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#00f2fe]">
          Automated pipeline // booking to booked revenue
        </p>
        <h2
          id="pipeline-heading"
          className="mt-3 max-w-3xl font-[family-name:var(--font-head,'Space_Grotesk',system-ui,sans-serif)] text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Homeowner picks a job. Your phone gets the dollar sign.
        </h2>
        <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/55">
          Instant quote on your public page. Cha-Ching tracks jobs booked today, pipeline dollars, and how fast you
          answer — while Autopilot chases the leads you never called back.
        </p>

        <StorefrontBookingHost
          shopSlug={DEMO_SLUG}
          shopName={DEMO_NAME}
          bookPath={`/${DEMO_SLUG}/book`}
          themeId="cyber_cyan"
        >
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
            <ChaChingRevenueCounter
              shopSlug={DEMO_SLUG}
              shopName={DEMO_NAME}
              appointments={[]}
              services={[]}
              className="h-full"
            />
            <InstantQuoteBookWidget shopName={DEMO_NAME} niche="general_contractor" />
          </div>
        </StorefrontBookingHost>
      </div>
    </section>
  );
}