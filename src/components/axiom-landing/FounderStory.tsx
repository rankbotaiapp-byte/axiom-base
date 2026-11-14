"use client";

import { GreetingPitchHud } from "./GreetingPitchHud";

export default function FounderStory() {
  return (
    <section id="about" className="relative overflow-hidden bg-void py-24 sm:py-32">
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(16rem,24rem)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">From the founder</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
            Built by a guy who has been on the truck.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-mist">
            Eric built Axiom because contractors lose work every time they cannot pick up. The greeting is here — not
            over the hero — so you can hear the pitch without covering the storefront.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-mist">
            <li className="rounded-xl border border-white/10 bg-panel/50 px-4 py-3">
              Missed calls turn into booked jobs, not a voicemail the next shop answers first.
            </li>
            <li className="rounded-xl border border-white/10 bg-panel/50 px-4 py-3">
              Pages already exist for the trades that actually roll — plumbing, electrical, HVAC, and more.
            </li>
            <li className="rounded-xl border border-white/10 bg-panel/50 px-4 py-3">
              You own the page. You are not renting a calendar forever.
            </li>
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <GreetingPitchHud
            kicker="Tap for sound"
            caption="Eric, in his own words — why voicemail is costing you jobs."
          />
        </div>
      </div>
    </section>
  );
}
