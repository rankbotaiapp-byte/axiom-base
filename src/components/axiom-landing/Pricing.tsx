"use client";

import { Check } from "lucide-react";
import { PRICING, fmt, monthsOfStack } from "@/lib/axiom-landing/pricing";
import { RippleButton } from "./RippleButton";
import { TrustMarks } from "./TrustMarks";
import { useFunnel } from "./FunnelProvider";

export default function Pricing() {
  const { startOnboarding, selectedTemplateId } = useFunnel();
  const { trial, lifetime, roi } = PRICING;
  const months = monthsOfStack(lifetime.price);

  return (
    <section id="pricing" data-book-anchor="" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div id="book" className="absolute -top-24" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-copper/10 blur-[130px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            $1 for 14 days. Then $150 a month.
          </h2>
          <p className="mt-5 text-lg text-mist">
            The trial rolls into a {fmt(trial.renewalDollars)}/month subscription. Cancel in one click from Admin Billing
            before the 14 days end and it does not renew. Online bookings take a 1.5% Stripe Connect split. Cash and
            checks logged in the field are 0%.
          </p>
        </div>

        <div className="mt-10 grid gap-3 text-sm text-mist sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-panel/50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-mist">Missed evening call</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{fmt(roi.oneMissedJob)}</p>
            <p className="mt-1">The job voicemail never booked. Axiom answers it.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-mist">Typical software rent</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{fmt(roi.typicalMonthlyStack)}/mo</p>
            <p className="mt-1">Jobber-class stacks keep billing forever.</p>
          </div>
          <div className="rounded-2xl border border-copper/40 bg-copper/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-copper">Agency shop site</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">
              {fmt(roi.agencySiteLow)}–{fmt(roi.agencySiteHigh)}
            </p>
            <p className="mt-1">Still no 24/7 booking engine.</p>
          </div>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-volt/40 bg-volt/5 p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Most contractors start here</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-white">{trial.name}</h3>
            <p className="mt-2 text-mist">{trial.blurb}</p>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-6xl font-bold text-white">
                {fmt(trial.floorDollars)}
              </span>
              <span className="pb-2 text-mist">
                today · 14 days
                <span className="ml-2 text-sm text-volt">then {fmt(trial.renewalDollars)}/mo</span>
              </span>
            </div>
            <ul className="mt-7 space-y-3">
              {trial.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#e8edf3]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-volt" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <RippleButton
              variant="volt"
              className="mt-9 w-full text-base"
              onClick={() => startOnboarding({ plan: "trial", templateId: selectedTemplateId })}
            >
              Start the $1 trial
            </RippleButton>
          </div>

          <div
            className="relative rounded-3xl border border-copper/50 bg-gradient-to-b from-[#1b140d] to-panel p-8 shadow-[0_40px_120px_-40px_rgb(224_138_60/0.6)] sm:p-10"
            data-sample-color="#e08a3c"
          >
            <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-ember to-copper px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
              Founder offer
            </span>
            <h3 className="font-display text-2xl font-semibold text-white">{lifetime.name}</h3>
            <p className="mt-2 text-mist">{lifetime.blurb}</p>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-6xl font-bold text-white">{fmt(lifetime.price)}</span>
              <span className="pb-2 text-mist">once · no monthly fee</span>
            </div>
            <p className="mt-2 text-sm text-ember">
              About {months} months of a {fmt(roi.typicalMonthlyStack)} stack — then $0 rent forever.
            </p>
            <ul className="mt-7 space-y-3">
              {lifetime.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#e8edf3]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-copper" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <RippleButton
              variant="primary"
              className="mt-9 w-full text-base"
              onClick={() => startOnboarding({ plan: "lifetime", templateId: selectedTemplateId })}
            >
              Get Founder&apos;s Lifetime — {fmt(lifetime.price)}
            </RippleButton>
            <p className="mt-4 text-center text-sm text-mist">{PRICING.guarantee}</p>
            <TrustMarks compact />
          </div>
        </div>
      </div>
    </section>
  );
}
