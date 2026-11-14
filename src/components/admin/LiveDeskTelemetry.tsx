import { useLiveDeskState } from "@/hooks/use-live-desk-state";

export function LiveDeskTelemetry({ shopSlug }: { shopSlug: string }) {
  const { state, updatedAt, error } = useLiveDeskState(shopSlug);
  return (
    <section
      className="grid gap-2 rounded-2xl border border-hud/20 bg-studio px-4 py-4 sm:grid-cols-3"
      aria-label="Live desk telemetry"
      data-live-desk={shopSlug}
    >
      <Kpi label="Engine" value={state.paused ? "Paused" : "Live"} hint={error ? "Waiting on shop records" : "Shop + outbound_engine_state"} />
      <Kpi label="Daily cap" value={state.caps.toLocaleString("en-US")} hint="SMS + email from live caps" />
      <Kpi label="Sent today" value={state.sentToday.toLocaleString("en-US")} hint={updatedAt ? "Realtime" : "Loading"} />
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular leading-none text-hud">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
