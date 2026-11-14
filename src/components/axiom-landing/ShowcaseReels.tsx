"use client";

import { useState } from "react";
import { SHOWCASE_TABS, type StorefrontFilmTab } from "@/lib/axiom-landing/storefront-films";
import { plumbingBeatFromFilm, plumbingTelemetryForBeat, type PlumbingBeat } from "@/lib/axiom/plumbing-sequence";
import { TelemetryLog } from "@/components/telemetry-log";

export function ShowcaseReels({ tabs = SHOWCASE_TABS }: { tabs?: readonly StorefrontFilmTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "heart");
  const [beat, setBeat] = useState<PlumbingBeat>("locate");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink shadow-[0_24px_80px_-32px_rgb(0_0_0/0.85)]">
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-2" role="tablist" aria-label="Showcase films">
        {tabs.map((tab) => {
          const on = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setActiveId(tab.id);
                setBeat("locate");
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                on ? "bg-white/12 text-white" : "text-mist hover:bg-white/6 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="relative aspect-video bg-obsidian">
        <video
          key={active.src}
          className="absolute inset-0 h-full w-full object-cover"
          src={active.src}
          poster={active.poster}
          autoPlay
          muted
          loop
          playsInline
          onTimeUpdate={(event) => {
            if (!active.telemetry) return;
            const next = plumbingBeatFromFilm(event.currentTarget.currentTime);
            setBeat((current) => (current === next ? current : next));
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/90 to-transparent" />
        <p className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
          {active.kicker}
        </p>
      </div>
      {active.telemetry ? (
        <div className="border-t border-white/10 p-3">
          <TelemetryLog dataset={plumbingTelemetryForBeat(beat)} />
        </div>
      ) : null}
    </div>
  );
}
