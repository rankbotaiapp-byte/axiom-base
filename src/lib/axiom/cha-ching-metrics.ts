import type { Appointment, Service } from "@/lib/axiom/types";
import { axiomSubscriptionCostCents, EMPTY_BOOK_MESSAGE, netRoiCents, type BillingForRoi } from "./closed-job.ts";

export type ChaChingMetrics = {
  source: "live";
  jobsBookedToday: number;
  pipelineRevenueCents: number;
  paidRevenueCents: number;
  subscriptionCostCents: number;
  netRoiCents: number;
  emptyBook: boolean;
  emptyMessage: string;
  avgResponseSeconds: number;
  lastEventAt: string | null;
};

function pacificYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d);
}

function todayPacific(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

export function estimateAppointmentCents(appointment: Appointment, services: Service[]): number {
  if (appointment.paymentCents > 0) return appointment.paymentCents;
  const row = services.find((s) => s.id === appointment.serviceId);
  return row?.priceCents ? row.priceCents : 0;
}

export function emptyChaChingMetrics(billing?: BillingForRoi | null): ChaChingMetrics {
  const subscriptionCostCents = axiomSubscriptionCostCents(billing);
  return {
    source: "live",
    jobsBookedToday: 0,
    pipelineRevenueCents: 0,
    paidRevenueCents: 0,
    subscriptionCostCents,
    netRoiCents: netRoiCents(0, billing),
    emptyBook: true,
    emptyMessage: EMPTY_BOOK_MESSAGE,
    avgResponseSeconds: 0,
    lastEventAt: null,
  };
}

function withRoi(
  base: Omit<ChaChingMetrics, "subscriptionCostCents" | "netRoiCents" | "emptyBook" | "emptyMessage" | "source">,
  billing?: BillingForRoi | null,
): ChaChingMetrics {
  const verified = Math.max(base.paidRevenueCents, base.pipelineRevenueCents);
  const emptyBook = base.jobsBookedToday <= 0 && verified <= 0;
  return {
    ...base,
    source: "live",
    emptyBook,
    emptyMessage: emptyBook ? EMPTY_BOOK_MESSAGE : "",
    subscriptionCostCents: axiomSubscriptionCostCents(billing),
    netRoiCents: netRoiCents(verified, billing),
  };
}

/** Client-safe rollup from desk appointments payload. Never invents jobs. */
export function metricsFromAppointments(
  appointments: Appointment[],
  services: Service[],
  billing?: BillingForRoi | null,
): ChaChingMetrics {
  const today = todayPacific();
  const active = appointments.filter((row) => {
    if (row.status === "cancelled") return false;
    const simulated = (row as Appointment & { isSimulated?: boolean }).isSimulated;
    if (simulated) return false;
    return pacificYmd(row.startsAt) === today;
  });
  const paid = appointments.filter((row) => {
    const simulated = (row as Appointment & { isSimulated?: boolean }).isSimulated;
    if (simulated) return false;
    return row.paymentStatus === "paid";
  });
  if (active.length === 0 && paid.length === 0) return emptyChaChingMetrics(billing);

  const pipelineRevenueCents = active.reduce((sum, row) => sum + estimateAppointmentCents(row, services), 0);
  const paidRevenueCents = paid.reduce((sum, row) => sum + estimateAppointmentCents(row, services), 0);
  return withRoi(
    {
      jobsBookedToday: active.length,
      pipelineRevenueCents,
      paidRevenueCents,
      avgResponseSeconds: 0,
      lastEventAt: active[0]?.startsAt ?? paid[0]?.startsAt ?? null,
    },
    billing,
  );
}

/** @deprecated Simulated ticker is forbidden. Kept as a zero live book. */
export function simulatedChaChingMetrics(_shopSlug?: string, _day?: Date): ChaChingMetrics {
  return emptyChaChingMetrics();
}

export function mergeChaChingMetrics(
  live: ChaChingMetrics | null,
  remote: ChaChingMetrics | null,
  _shopSlug?: string,
  billing?: BillingForRoi | null,
): ChaChingMetrics {
  if (!live && !remote) return emptyChaChingMetrics(billing);
  if (live && !remote) return live.emptyBook ? live : live;
  if (remote && !live) return remote;
  const jobs = Math.max(live!.jobsBookedToday, remote!.jobsBookedToday);
  const pipeline = Math.max(live!.pipelineRevenueCents, remote!.pipelineRevenueCents);
  const paid = Math.max(live!.paidRevenueCents, remote!.paidRevenueCents);
  return withRoi(
    {
      jobsBookedToday: jobs,
      pipelineRevenueCents: pipeline,
      paidRevenueCents: paid,
      avgResponseSeconds: remote!.avgResponseSeconds || live!.avgResponseSeconds,
      lastEventAt: remote!.lastEventAt || live!.lastEventAt,
    },
    billing,
  );
}

export function formatPipelineDollars(cents: number): string {
  const value = cents / 100;
  const sign = value < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value))}`;
}
