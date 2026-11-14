'use client';

import { useEffect, useState } from 'react';
import { haptic } from '@/lib/axiom/haptics';
import { field } from '@/lib/axiom/guided-fishing/useStudioPreview';
import type { GuidedFishingConfig, TripSelection } from '@/lib/axiom/guided-fishing/types';
import { formatPrice } from './primitives';

interface BookingWidgetProps {
  pricing: GuidedFishingConfig['pricing'];
  selection: TripSelection;
  onChange: (next: TripSelection) => void;
  /** Called when the visitor commits to a trip; parent scrolls to the lead form. */
  onReserve: () => void;
}

export default function BookingWidget({ pricing, selection, onChange, onReserve }: BookingWidgetProps) {
  const [minDate, setMinDate] = useState('');

  // Computed after mount so server and client markup always match.
  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    setMinDate(local.toISOString().slice(0, 10));
  }, []);

  const selected = pricing.tiers.find((tier) => tier.id === selection.tierId) ?? pricing.tiers[0];
  const setAnglers = (count: number) => {
    haptic('select');
    onChange({ ...selection, anglers: Math.min(Math.max(count, 1), pricing.maxAnglers) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
      <div role="radiogroup" aria-label="Choose a trip" className="grid gap-4">
        {pricing.tiers.map((tier, index) => {
          const active = tier.id === selected?.id;
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                haptic('select');
                onChange({ ...selection, tierId: tier.id });
              }}
              className={`group relative w-full rounded-2xl border p-5 text-left transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:p-6 ${
                active
                  ? 'border-amber-300/70 bg-amber-300/[0.07] shadow-[0_0_0_1px_rgba(252,211,77,0.25),0_24px_60px_-30px_rgba(252,211,77,0.35)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 {...field(`pricing.tiers.${index}.name`)} className="font-serif text-xl text-stone-50 sm:text-2xl">
                      {tier.name}
                    </h3>
                    {tier.featured ? (
                      <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-950">
                        Most booked
                      </span>
                    ) : null}
                  </div>
                  <p {...field(`pricing.tiers.${index}.duration`)} className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                    {tier.duration}
                  </p>
                </div>
                <p {...field(`pricing.tiers.${index}.price`)} className="shrink-0 font-serif text-2xl text-amber-200 sm:text-3xl">
                  {formatPrice(tier.price, tier.priceSuffix)}
                </p>
              </div>
              <p {...field(`pricing.tiers.${index}.blurb`)} className="mt-3 text-sm leading-relaxed text-stone-300">
                {tier.blurb}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-stone-400">
                {tier.includes.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span aria-hidden className={`h-1 w-1 rounded-full ${active ? 'bg-amber-300' : 'bg-stone-500'}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:sticky lg:top-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Your trip</p>
        <p className="mt-2 font-serif text-2xl text-stone-50">{selected?.name}</p>

        <label className="mt-6 block text-xs font-medium uppercase tracking-wider text-stone-400" htmlFor="trip-date">
          Preferred date
        </label>
        <input
          id="trip-date"
          type="date"
          min={minDate || undefined}
          value={selection.date}
          onChange={(event) => onChange({ ...selection, date: event.target.value })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-stone-100 [color-scheme:dark] focus:border-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-300/30"
        />

        <p className="mt-5 text-xs font-medium uppercase tracking-wider text-stone-400" id="anglers-label">
          Anglers
        </p>
        <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby="anglers-label">
          <button
            type="button"
            onClick={() => setAnglers(selection.anglers - 1)}
            disabled={selection.anglers <= 1}
            aria-label="Fewer anglers"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-lg text-stone-200 transition hover:bg-white/10 disabled:opacity-30"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-[2ch] text-center font-serif text-2xl text-stone-50">
            {selection.anglers}
          </span>
          <button
            type="button"
            onClick={() => setAnglers(selection.anglers + 1)}
            disabled={selection.anglers >= pricing.maxAnglers}
            aria-label="More anglers"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-lg text-stone-200 transition hover:bg-white/10 disabled:opacity-30"
          >
            +
          </button>
          <span className="text-xs text-stone-500">up to {pricing.maxAnglers} per boat</span>
        </div>

        <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-5">
          <span className="text-sm text-stone-400">{selected?.priceSuffix ? 'Starting at' : 'Boat rate'}</span>
          <span className="font-serif text-3xl text-amber-200">{selected ? formatPrice(selected.price, selected.priceSuffix) : ''}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic('tap');
            onReserve();
          }}
          {...field('pricing.reserveCta')}
          className="mt-5 w-full rounded-full bg-amber-300 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-stone-950 transition hover:bg-amber-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {pricing.reserveCta}
        </button>
        <p {...field('pricing.finePrint')} className="mt-4 text-[11px] leading-relaxed text-stone-500">
          {pricing.finePrint}
        </p>
      </div>
    </div>
  );
}
