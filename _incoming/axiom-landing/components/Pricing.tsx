"use client";

import { PRICING, fmt } from "@/lib/pricing";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";

export default function Pricing() {
  const { startOnboarding, selectedTemplateId } = useFunnel();
  const { lifetime, monthly } = PRICING;
  const yearsToBreakEven = (lifetime.price / monthly.price / 12).toFixed(1);

  return (
    <section id="pricing" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-copper/10 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">Pay once. Own it forever.</h2>
          <p className="mt-5 text-lg text-mist">
            Most contractor software rents you your own business by the month. Axiom doesn&apos;t. One payment, your back
            office for life — no subscription, ever.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Lifetime */}
          <div
            className="relative rounded-3xl border border-copper/50 bg-gradient-to-b from-[#1b140d] to-panel p-8 shadow-[0_40px_120px_-40px_rgb(224_138_60/0.6)] sm:p-10"
            data-sample-color="#e08a3c"
          >
            <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-ember to-copper px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
              Most popular · Best value
            </span>
            <h3 className="font-display text-2xl font-semibold text-white">{lifetime.name}</h3>
            <p className="mt-2 text-mist">{lifetime.blurb}</p>
            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-6xl font-bold text-white">{fmt(lifetime.price)}</span>
              <span className="pb-2 text-mist">
                one time
                <span className="ml-2 text-sm line-through decoration-copper/70">{fmt(lifetime.compareAt)}/yr typical stack</span>
              </span>
            </div>
            {PRICING.FOUNDING_SPOTS !== null && (
              <p className="mt-3 text-sm font-semibold text-ember">Founding price · {PRICING.FOUNDING_SPOTS} spots left</p>
            )}
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {lifetime.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#e8edf3]">
                  <span className="mt-0.5 text-copper">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <RippleButton
              variant="primary"
              className="mt-9 w-full text-base"
              onClick={() => startOnboarding({ plan: "lifetime", templateId: selectedTemplateId })}
            >
              Get Lifetime Access — {fmt(lifetime.price)} once
            </RippleButton>
            <p className="mt-4 text-center text-sm text-mist">{PRICING.guarantee}</p>
          </div>

          {/* Monthly */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-panel/60 p-8 sm:p-10">
            <h3 className="font-display text-2xl font-semibold text-white">{monthly.name}</h3>
            <p className="mt-2 text-mist">{monthly.blurb}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="font-display text-5xl font-bold text-white">{fmt(monthly.price)}</span>
              <span className="pb-2 text-mist">/ month</span>
            </div>
            <ul className="mt-7 space-y-3">
              {monthly.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-mist">
                  <span className="mt-0.5 text-volt">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist">
              Lifetime pays for itself in about <span className="font-semibold text-white">{yearsToBreakEven} years</span> of
              monthly — then it&apos;s free forever.
            </p>
            <div className="flex-1" />
            <RippleButton
              variant="ghost"
              className="mt-8 w-full"
              onClick={() => startOnboarding({ plan: "monthly", templateId: selectedTemplateId })}
            >
              Start Monthly
            </RippleButton>
          </div>
        </div>
      </div>
    </section>
  );
}
