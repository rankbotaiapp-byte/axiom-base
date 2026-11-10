"use client";

import { Check } from "lucide-react";
import { PRICING, fmt, monthsOfStack } from "@/lib/axiom-landing/pricing";
import { RippleButton } from "./RippleButton";
import { TrustMarks } from "./TrustMarks";
import { useFunnel } from "./FunnelProvider";

export default function Pricing() {
  const { startOnboarding, selectedTemplateId } = useFunnel();
  const { lifetime, monthly, cinematic, roi } = PRICING;
  const months = monthsOfStack(lifetime.price);

  return (
    <section id="pricing" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-copper/10 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            One payment. Then the office runs without you.
          </h2>
          <p className="mt-5 text-lg text-mist">
            A typical booking + CRM stack is about {fmt(roi.typicalMonthlyStack)}/mo — {fmt(roi.typicalMonthlyStack * 12)} every year,
            forever. Axiom is a one-time buy. One after-hours job often covers it.
          </p>
        </div>

        <div className="mt-10 grid gap-3 text-sm text-mist sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-panel/50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-mist">Monthly software rent</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{fmt(roi.typicalMonthlyStack)}/mo</p>
            <p className="mt-1">Jobber-class stack. You never stop paying.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-mist">Custom shop site</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">
              {fmt(roi.agencySiteLow)}–{fmt(roi.agencySiteHigh)}
            </p>
            <p className="mt-1">Agency quote. Still no dispatch board.</p>
          </div>
          <div className="rounded-2xl border border-copper/40 bg-copper/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-copper">One missed evening call</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{fmt(roi.oneMissedJob)}</p>
            <p className="mt-1">The job the voicemail did not book. Axiom answers it.</p>
          </div>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div
            className="relative rounded-3xl border border-copper/50 bg-gradient-to-b from-[#1b140d] to-panel p-8 shadow-[0_40px_120px_-40px_rgb(224_138_60/0.6)] sm:p-10"
            data-sample-color="#e08a3c"
          >
            <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-ember to-copper px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
              Most shops choose this
            </span>
            <h3 className="font-display text-2xl font-semibold text-white">{lifetime.name}</h3>
            <p className="mt-2 text-mist">{lifetime.blurb}</p>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-6xl font-bold text-white">{fmt(lifetime.price)}</span>
              <span className="pb-2 text-mist">
                once
                <span className="ml-2 text-sm line-through decoration-copper/70">{fmt(lifetime.compareAt)}/yr rented</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-ember">
              Equals about {months} months of a {fmt(roi.typicalMonthlyStack)} stack — then $0.
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
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
              Own the back office — {fmt(lifetime.price)} once
            </RippleButton>
            <p className="mt-4 text-center text-sm text-mist">{PRICING.guarantee}</p>
            <TrustMarks compact />
          </div>

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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-volt" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist">
              Most owners switch to lifetime after the first week of night bookings. No penalty.
            </p>
            <div className="flex-1" />
            <RippleButton
              variant="ghost"
              className="mt-8 w-full"
              onClick={() => startOnboarding({ plan: "monthly", templateId: selectedTemplateId })}
            >
              Start a month — {fmt(monthly.price)}
            </RippleButton>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-volt/30 bg-volt/5 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-volt">Played a live demo?</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                {cinematic.name} — {fmt(cinematic.price)} once
              </h3>
              <p className="mt-2 text-mist">{cinematic.blurb}</p>
              <p className="mt-3 text-sm text-mist">
                Less than {monthsOfStack(cinematic.price)} months of rented software. A custom shop site from an agency
                is typically {fmt(roi.agencySiteLow)}–{fmt(roi.agencySiteHigh)} — and still cannot dispatch your crew.
              </p>
            </div>
            <div className="shrink-0 lg:w-72">
              <RippleButton
                variant="volt"
                className="w-full"
                onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}
              >
                Pick the demo to buy — {fmt(cinematic.price)}
              </RippleButton>
              <p className="mt-3 text-center text-xs text-mist">14-day money-back · Stripe checkout · your data stays yours</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
