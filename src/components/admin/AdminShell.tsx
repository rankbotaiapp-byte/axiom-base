"use client";

import type { AccessMode, Appointment, Billing, Employee, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";
import { LiveDeskTelemetry } from "@/components/admin/LiveDeskTelemetry";

export type OpData = {
  mode: AccessMode;
  shop: Shop;
  appointments: Appointment[];
  billing: Billing | null;
  services: Service[];
  employees: Employee[];
  notices: ShopNotice[];
  notifyEmail: string;
  notifyPhone: string;
  notifySmsEnabled: boolean;
  notifyEmailEnabled: boolean;
  notificationPhone: string;
  notificationEmail: string;
  payments: PaymentSetup;
  platformDesk?: boolean;
};

/** Next.js App Router admin desk shell — avoids pulling the TanStack route tree into the build. */
export function AdminShell({
  data,
  readonly,
}: {
  data: OpData;
  readonly: boolean;
  onReload?: () => void;
}) {
  return (
    <main className="min-h-dvh bg-obsidian px-4 py-8 text-fg">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="rounded-2xl border border-hud/20 bg-studio px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-hud">Operator desk</p>
          <h1 className="mt-2 font-display text-3xl">{data.shop.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {readonly ? "Preview mode" : "Owner mode"} · /{data.shop.slug}
          </p>
        </header>
        <LiveDeskTelemetry shopSlug={data.shop.slug} />
        <section className="rounded-2xl border border-line bg-surface px-5 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Book</p>
          <p className="mt-2 font-display text-2xl tabular">{data.appointments.length}</p>
          <p className="mt-1 text-sm text-muted">Appointments loaded for this shop.</p>
        </section>
      </div>
    </main>
  );
}
