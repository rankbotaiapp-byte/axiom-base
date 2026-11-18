import type { Appointment, Service } from "@/lib/axiom/types";

export type ChaChingMetrics = {
  source: "live" | "simulated" | "hybrid";
  jobsBookedToday: number;
  pipelineRevenueCents: number;
  avgResponseSeconds: number;
  lastEventAt: string | null;
};

const DEFAULT_JOB_CENTS = 32_500;

function pacificYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d);
}

function todayPacific(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function estimateAppointmentCents(appointment: Appointment, services: Service[]): number {
  if (appointment.paymentCents > 0) return appointment.paymentCents;
  const row = services.find((s) => s.id === appointment.serviceId);
  if (row?.priceCents) return row.priceCents;
  return DEFAULT_JOB_CENTS;
}

/** Client-safe rollup from desk appointments payload. */
export function metricsFromAppointments(
  appointments: Appointment[],
  services: Service[],
): ChaChingMetrics | null {
  const today = todayPacific();
  const active = appointments.filter((a) => a.status !== "cancelled" && pacificYmd(a.startsAt) === today);
  if (active.length === 0) return null;

  const pipelineRevenueCents = active.reduce((sum, row) => sum + estimateAppointmentCents(row, services), 0);
  return {
    source: "live",
    jobsBookedToday: active.length,
    pipelineRevenueCents,
    avgResponseSeconds: 0,
    lastEventAt: active[0]?.startsAt ?? null,
  };
}

export function simulatedChaChingMetrics(shopSlug: string, day = new Date()): ChaChingMetrics {
  const key = `${shopSlug.toLowerCase()}:${todayPacific()}`;
  const h = hashSlug(key);
  const jobs = 2 + (h % 4);
  const revenue = (750 + (h % 9) * 125 + jobs * 180) * 100;
  const response = 12 + (h % 14);
  return {
    source: "simulated",
    jobsBookedToday: jobs,
    pipelineRevenueCents: revenue,
    avgResponseSeconds: response,
    lastEventAt: day.toISOString(),
  };
}

export function mergeChaChingMetrics(
  live: ChaChingMetrics | null,
  remote: ChaChingMetrics | null,
  shopSlug: string,
): ChaChingMetrics {
  const sim = simulatedChaChingMetrics(shopSlug);
  if (!live && !remote) return sim;
  if (live && !remote) {
    return {
      ...live,
      avgResponseSeconds: live.avgResponseSeconds || sim.avgResponseSeconds,
      source: live.jobsBookedToday > 0 ? "live" : "simulated",
    };
  }
  if (remote && !live) return remote;
  const merged = remote!;
  const jobs = Math.max(live!.jobsBookedToday, merged.jobsBookedToday);
  const revenue = Math.max(live!.pipelineRevenueCents, merged.pipelineRevenueCents);
  const response =
    merged.avgResponseSeconds > 0
      ? Math.round((merged.avgResponseSeconds + (live!.avgResponseSeconds || merged.avgResponseSeconds)) / 2)
      : live!.avgResponseSeconds || sim.avgResponseSeconds;
  return {
    source: jobs > 0 && merged.source === "live" ? "hybrid" : live!.jobsBookedToday > 0 ? "hybrid" : merged.source,
    jobsBookedToday: jobs,
    pipelineRevenueCents: revenue,
    avgResponseSeconds: response || sim.avgResponseSeconds,
    lastEventAt: merged.lastEventAt || live!.lastEventAt,
  };
}

export function formatPipelineDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, cents) / 100);
}