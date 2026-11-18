"use client";

import { useLiveDeskState } from "@/hooks/use-live-desk-state";
import { HudGlassPanel, HudSectionTitle } from "@/components/studio/ObsidianHudChrome";

export function LiveDeskTelemetry({ shopSlug }: { shopSlug: string }) {
  const { state, updatedAt, error } = useLiveDeskState(shopSlug);
  return (
    <section aria-label="Live desk telemetry" data-live-desk={shopSlug}>
      <HudGlassPanel>
        <HudSectionTitle
          className="mb-3"
          kicker="Outbound engine"
          title="Live desk telemetry"
          subtitle={error ? "Waiting on shop records." : "SMS + email caps from outbound engine."}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Engine" value={state.paused ? "Paused" : "Live"} hint="Shop + outbound_engine_state" />
          <Kpi label="Daily cap" value={state.caps.toLocaleString("en-US")} hint="Combined SMS + email ceiling" />
          <Kpi
            label="Sent today"
            value={state.sentToday.toLocaleString("en-US")}
            hint={updatedAt ? "Polling" : "Loading"}
          />
        </div>
      </HudGlassPanel>
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-md">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-1 font-display text-2xl tabular leading-none text-[var(--brand-glow)]">{value}</p>
      <p className="mt-1 text-[11px] text-white/45">{hint}</p>
    </div>
  );
}