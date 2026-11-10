import { Suspense, lazy, useState } from "react";
import { type LaunchPlan } from "@/lib/axiom/launch-plans";
import { PricingCardStack } from "./PricingCardStack";

/** Stripe.js only loads once someone actually opens checkout. */
const LaunchCheckoutDrawer = lazy(() =>
  import("./LaunchCheckoutDrawer").then((m) => ({ default: m.LaunchCheckoutDrawer })),
);

const BACKDROP_LOOP = "/media/holo-shard-loop.mp4";
const BACKDROP_POSTER = "/media/holo-shard-poster.jpg";

/** Pricing: holographic shard backdrop, 3D swipe stack, slide-up Stripe drawer. */
export function PricingSection() {
  const [selected, setSelected] = useState<LaunchPlan | null>(null);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  function provision(plan: LaunchPlan) {
    setDrawerMounted(true);
    setSelected(plan);
  }

  return (
    <section id="pricing" className="pricing-holo relative isolate snap-start overflow-hidden px-5 py-20 sm:px-10 sm:py-24">
      {!videoFailed ? (
        <video
          className="pricing-holo-video"
          src={BACKDROP_LOOP}
          poster={BACKDROP_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onError={() => setVideoFailed(true)}
        />
      ) : null}
      <div className="pricing-holo-grade" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/80">Pricing</p>
          <h2 className="mt-3 font-display text-3xl text-fg sm:text-4xl">Pick a shard. Provision a business.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Start live for a dollar, own your territory outright, or book a two-week build made by hand. Every plan
            lands you in tenant setup the moment payment clears.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center sm:max-w-md">
            {[
              ["Minutes", "to a live storefront"],
              ["24/7", "booking + text-back"],
              ["Stripe", "payments built in"],
            ].map(([k, v]) => (
              <div key={k} className="glass-card rounded-2xl px-2 py-3 backdrop-blur-md">
                <dt className="font-display text-lg text-fg">{k}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PricingCardStack onProvision={provision} />
      </div>

      {drawerMounted ? (
        <Suspense fallback={null}>
          <LaunchCheckoutDrawer plan={selected} onClose={() => setSelected(null)} />
        </Suspense>
      ) : null}
    </section>
  );
}
