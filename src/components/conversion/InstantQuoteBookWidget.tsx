"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { useStorefrontBookingOptional } from "@/components/conversion/StorefrontBookingHost";
import {
  computeInstantQuote,
  formatQuoteRange,
  INSTANT_QUOTE_URGENCIES,
  quoteServicesForNiche,
  type InstantQuoteService,
  type InstantQuoteUrgency,
} from "@/lib/axiom/instant-quote-catalog";
import { cn } from "@/lib/utils";

export function InstantQuoteBookWidget({
  shopName,
  niche,
  className,
}: {
  shopName: string;
  niche?: string | null;
  className?: string;
}) {
  const booking = useStorefrontBookingOptional();
  const services = useMemo(() => quoteServicesForNiche(niche), [niche]);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<InstantQuoteService>(services[0]!);
  const [urgency, setUrgency] = useState<InstantQuoteUrgency>(INSTANT_QUOTE_URGENCIES[1]!);

  useEffect(() => {
    if (!services.length) return;
    setService((current) => (services.some((row) => row.id === current.id) ? current : services[0]!));
    setStep(0);
  }, [services]);

  const estimate = useMemo(() => computeInstantQuote(service, urgency), [service, urgency]);

  if (!booking) return null;

  return (
    <section
      className={cn("storefront-cro-glass relative mx-auto max-w-2xl p-5 sm:p-6", className)}
      aria-labelledby="instant-quote-title"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand-primary)]">
        Instant price quote &amp; book
      </p>
      <h2 id="instant-quote-title" className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
        3-step lock for {shopName}
      </h2>
      <p className="mt-1 text-sm text-white/55">High-intent homeowners see a range in seconds — then talk to Axiom.</p>

      <ol className="mt-4 flex gap-2" aria-label="Progress">
        {["Service", "Urgency", "Lock in"].map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex-1 rounded-lg border border-white/10 px-2 py-1.5 text-center font-mono text-[8px] uppercase tracking-[0.12em] text-white/45",
              step === index && "storefront-quote-step-active text-[var(--brand-glow)]",
              step > index && "border-emerald-500/35 text-emerald-200/90",
            )}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {services.map((row) => (
            <button
              key={row.id}
              type="button"
              className={cn(
                "rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-white/25",
                service.id === row.id && "storefront-quote-step-active",
              )}
              onClick={() => setService(row)}
            >
              <p className="text-sm font-semibold text-white">{row.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/50">{row.detail}</p>
            </button>
          ))}
          <div className="sm:col-span-2 flex justify-end">
            <StepButton onClick={() => setStep(1)} label="Next · urgency" />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-4 space-y-2">
          {INSTANT_QUOTE_URGENCIES.map((row) => (
            <button
              key={row.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition hover:border-white/25",
                urgency.id === row.id && "storefront-quote-step-active",
              )}
              onClick={() => setUrgency(row)}
            >
              <span>
                <span className="block text-sm font-semibold text-white">{row.label}</span>
                <span className="text-[11px] text-white/45">ETA {row.eta}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-white/35" />
            </button>
          ))}
          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              className="min-h-10 rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.12em] text-white/55"
              onClick={() => setStep(0)}
            >
              Back
            </button>
            <StepButton onClick={() => setStep(2)} label="See estimate" />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[var(--brand-secondary)]/35 bg-[var(--brand-secondary)]/8 p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">Instant range (not final invoice)</p>
            <p className="mt-2 font-display text-3xl font-bold text-[var(--brand-glow)]">
              {formatQuoteRange(estimate.min, estimate.max)}
            </p>
            <p className="mt-2 text-xs text-white/55">
              {service.label} · {urgency.label}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/12 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand-glow)]"
              onClick={() =>
                booking.openVideoBooking({
                  serviceId: service.id,
                  urgencyId: urgency.id,
                  min: estimate.min,
                  max: estimate.max,
                  serviceLabel: service.label,
                  urgencyLabel: urgency.label,
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              Talk to Axiom — lock it in
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/15 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70"
              onClick={() => setStep(1)}
            >
              Adjust urgency
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StepButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--brand-primary)]/45 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand-glow)]"
      onClick={onClick}
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
