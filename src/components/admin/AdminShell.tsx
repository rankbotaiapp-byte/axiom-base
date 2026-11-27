"use client";

import type { ReactNode } from "react";
import type { AccessMode, Appointment, Billing, Employee, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";
import { LiveDeskTelemetry } from "@/components/admin/LiveDeskTelemetry";
import { DispatchJobsCard } from "@/components/admin/DispatchJobsCard";
import { JobRadarSmsPreview } from "@/components/admin/JobRadarSmsPreview";
import { ChaChingRevenueCounter } from "@/components/admin/ChaChingRevenueCounter";
import { formatPipelineDollars, metricsFromAppointments } from "@/lib/axiom/cha-ching-metrics";
import { FounderWelcomeModal } from "@/components/admin/FounderWelcomeModal";
import { shopCity } from "@/lib/axiom/avatar";
import StripeConnectDashboard from "@/components/StripeConnectDashboard";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { AxiomTelemetryProvider } from "@/context/AxiomTelemetryContext";
import { AxiomBusinessNumberCard } from "@/components/storefront/AxiomBusinessNumberCard";
import { GoogleReviewUrlCard } from "@/components/admin/GoogleReviewUrlCard";
import { PriceBookCard } from "@/components/admin/PriceBookCard";
import { StorefrontStudio } from "@/components/storefront/StorefrontStudio";

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

/** Shop-owner desk: copy, uploads, billing. No 3D companion or AI generation studio. */
export function AdminShell({
  data,
  readonly,
}: {
  data: OpData;
  readonly: boolean;
  onReload?: () => void;
}) {
  return (
    <AxiomTelemetryProvider shopId={data.shop.slug}>
      <AdminShellInner data={data} readonly={readonly} />
    </AxiomTelemetryProvider>
  );
}

function AdminShellInner({ data, readonly }: { data: OpData; readonly: boolean }) {
  const billingStatus = (data.billing?.status || "").toLowerCase();
  const billingWarn = billingStatus === "past_due" || billingStatus === "canceled" || billingStatus === "unpaid";
  const roi = metricsFromAppointments(data.appointments, data.services, data.billing);

  return (
    <main className="min-h-dvh bg-[#050507] text-[#f4f7fb]">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-3 py-6 pb-24 sm:px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">Shop desk</p>
            <h1 className="text-xl font-semibold">{data.shop.name}</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
              {readonly ? "Preview mode" : "Owner mode"} · {data.shop.niche || "contractor"}
              {billingStatus ? (
                <span className={billingWarn ? " text-[#ff2a3d]" : " text-[#00f2fe]"}> · Billing {data.billing?.status}</span>
              ) : null}
              <span className=" text-[#00ffcc]">
                {" "}
                · Net ROI {formatPipelineDollars(roi.netRoiCents)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DeskLink href={`/${data.shop.slug}`}>View page</DeskLink>
            <DeskLink href={`/${data.shop.slug}/admin/billing`}>Billing</DeskLink>
            <DeskLink href={`/${data.shop.slug}/admin/autopilot`}>Autopilot</DeskLink>
          </div>
        </header>
        <AxiomBusinessNumberCard
          slug={data.shop.slug}
          businessName={data.shop.name}
          showInstructions
        />
        <GoogleReviewUrlCard slug={data.shop.slug} readonly={readonly} />
        <PriceBookCard slug={data.shop.slug} readonly={readonly} />
        <StorefrontStudio slug={data.shop.slug} />
        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <ChaChingRevenueCounter
            shopSlug={data.shop.slug}
            shopName={data.shop.name}
            appointments={data.appointments}
            services={data.services}
            billing={data.billing}
          />
          <JobRadarSmsPreview
            shopName={data.shop.name}
            shopSlug={data.shop.slug}
            city={shopCity(data.shop.address)}
            ownerPhone={data.notificationPhone || data.notifyPhone}
          />
        </div>
        <AutopilotDashboard
          shopName={data.shop.name}
          shopSlug={data.shop.slug}
          defaultScope="tenant"
          pollMs={15_000}
        />
        <DispatchJobsCard shopSlug={data.shop.slug} />
        <StripeConnectDashboard shopSlug={data.shop.slug} readonly={readonly} />
        <LiveDeskTelemetry shopSlug={data.shop.slug} />
      </div>
      <FounderWelcomeModal
        shopSlug={data.shop.slug}
        shopName={data.shop.name}
        ownerName={data.shop.name}
        niche={data.shop.niche || data.shop.customNiche || "contractor"}
        address={data.shop.address}
        readonly={readonly}
      />
    </main>
  );
}

function DeskLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.03] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition hover:border-[#00f2fe]/40 hover:text-white"
    >
      {children}
    </a>
  );
}
