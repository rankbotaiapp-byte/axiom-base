"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DollarSign, Timer, TrendingUp, Zap } from "lucide-react";
import { HudGlassPanel, HudSectionTitle } from "@/components/studio/ObsidianHudChrome";
import type { Appointment, Billing, Service } from "@/lib/axiom/types";
import {
  emptyChaChingMetrics,
  formatPipelineDollars,
  mergeChaChingMetrics,
  metricsFromAppointments,
  type ChaChingMetrics,
} from "@/lib/axiom/cha-ching-metrics";
import { cn } from "@/lib/utils";
import "./cha-ching.css";

export function ChaChingRevenueCounter({
  shopSlug,
  shopName,
  appointments,
  services,
  billing,
  className,
  pollMs = 20_000,
}: {
  shopSlug: string;
  shopName: string;
  appointments: Appointment[];
  services: Service[];
  billing?: Billing | null;
  className?: string;
  pollMs?: number;
}) {
  const local = useMemo(
    () =>
      metricsFromAppointments(appointments, services, {
        plan: billing?.plan,
        status: billing?.status,
        priceCents: billing?.priceCents,
      }),
    [appointments, services, billing?.plan, billing?.status, billing?.priceCents],
  );
  const [remote, setRemote] = useState<ChaChingMetrics | null>(null);
  const [glowRevenue, setGlowRevenue] = useState(false);
  const prevJobs = useRef<number | null>(null);

  const metrics = useMemo(
    () =>
      mergeChaChingMetrics(local, remote, shopSlug, {
        plan: billing?.plan,
        status: billing?.status,
        priceCents: billing?.priceCents,
      }),
    [local, remote, shopSlug, billing?.plan, billing?.status, billing?.priceCents],
  );

  const fetchRemote = useCallback(async () => {
    try {
      const res = await fetch(`/api/cha-ching?shopSlug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as Partial<ChaChingMetrics>;
      if (typeof json.jobsBookedToday === "number" && typeof json.pipelineRevenueCents === "number") {
        setRemote({
          source: "live",
          jobsBookedToday: json.jobsBookedToday,
          pipelineRevenueCents: json.pipelineRevenueCents,
          paidRevenueCents: typeof json.paidRevenueCents === "number" ? json.paidRevenueCents : 0,
          subscriptionCostCents: typeof json.subscriptionCostCents === "number" ? json.subscriptionCostCents : 0,
          netRoiCents: typeof json.netRoiCents === "number" ? json.netRoiCents : 0,
          emptyBook: Boolean(json.emptyBook),
          emptyMessage: json.emptyMessage || "",
          avgResponseSeconds: typeof json.avgResponseSeconds === "number" ? json.avgResponseSeconds : 0,
          lastEventAt: json.lastEventAt ?? null,
        });
      }
    } catch {
      setRemote(null);
    }
  }, [shopSlug]);

  useEffect(() => {
    void fetchRemote();
    const id = window.setInterval(() => void fetchRemote(), pollMs);
    return () => window.clearInterval(id);
  }, [fetchRemote, pollMs]);

  useEffect(() => {
    if (prevJobs.current !== null && metrics.jobsBookedToday > prevJobs.current) {
      setGlowRevenue(true);
      const t = window.setTimeout(() => setGlowRevenue(false), 1400);
      return () => window.clearTimeout(t);
    }
    prevJobs.current = metrics.jobsBookedToday;
    return undefined;
  }, [metrics.jobsBookedToday]);

  return (
    <HudGlassPanel className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <HudSectionTitle
          className="mb-0"
          kicker="Financial telemetry"
          title="Axiom paid for itself"
          subtitle={
            metrics.emptyBook
              ? metrics.emptyMessage
              : `Verified book for ${shopName} — never simulated.`
          }
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-100">
          <span className="cha-ching-live-dot h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          Live book
        </span>
      </div>

      {metrics.emptyBook ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center font-display text-lg text-[#00ffcc]">
          {metrics.emptyMessage || emptyChaChingMetrics().emptyMessage}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={Zap}
            label="Jobs booked today"
            value={String(metrics.jobsBookedToday)}
            hint="Pacific day · verified only"
            live
          />
          <MetricCard
            icon={DollarSign}
            label="Verified pipeline"
            value={formatPipelineDollars(metrics.pipelineRevenueCents)}
            hint="Booked + paid · is_simulated = false"
            glow={glowRevenue}
            emphasis
          />
          <MetricCard
            icon={Timer}
            label="AI response speed"
            value={metrics.avgResponseSeconds ? `${metrics.avgResponseSeconds}s` : "—"}
            hint="SMS round-trip avg"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          Net ROI
        </p>
        <p className="cha-ching-ticker font-display text-sm font-semibold text-[var(--brand-glow)]">
          {formatPipelineDollars(metrics.netRoiCents)}{" "}
          <span className="text-white/45">verified − {formatPipelineDollars(metrics.subscriptionCostCents)}</span>
        </p>
      </div>
    </HudGlassPanel>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  live,
  glow,
  emphasis,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  hint: string;
  live?: boolean;
  glow?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "cha-ching-metric-card px-4 py-4",
        glow && "cha-ching-metric-card--glow",
        emphasis && "text-[var(--brand-glow)]",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">{label}</p>
        {live ? <span className="cha-ching-live-dot ml-auto h-2 w-2 rounded-full bg-emerald-400" aria-hidden /> : null}
      </div>
      <p className={cn("mt-3 font-display text-3xl font-bold tabular text-white", emphasis && "text-[var(--brand-glow)]")}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-white/45">{hint}</p>
    </div>
  );
}
