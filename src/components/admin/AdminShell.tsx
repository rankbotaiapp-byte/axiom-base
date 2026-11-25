"use client";

import { useState, type ReactNode } from "react";
import type { AccessMode, Appointment, Billing, Employee, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";
import { LiveDeskTelemetry } from "@/components/admin/LiveDeskTelemetry";
import { AxiomStudioInterface } from "@/components/studio/AxiomStudioInterface";
import { AxiomChatDrawer } from "@/components/AxiomChatDrawer";
import AxiomContentCreator from "@/components/AxiomContentCreator";
import { StudioAutoBuildPanel } from "@/components/studio/StudioAutoBuildPanel";
import { AxiomStudioHudShell } from "@/components/studio/ObsidianHudChrome";
import { JobRadarSmsPreview } from "@/components/admin/JobRadarSmsPreview";
import { ChaChingRevenueCounter } from "@/components/admin/ChaChingRevenueCounter";
import { FounderWelcomeModal } from "@/components/admin/FounderWelcomeModal";
import { shopCity } from "@/lib/axiom/avatar";
import StripeConnectDashboard from "@/components/StripeConnectDashboard";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { AxiomTelemetryProvider, useAxiomTelemetry } from "@/context/AxiomTelemetryContext";
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
    <AxiomTelemetryProvider shopId={data.shop.slug}>
      <AdminShellInner data={data} readonly={readonly} />
    </AxiomTelemetryProvider>
  );
}

function AdminShellInner({ data, readonly }: { data: OpData; readonly: boolean }) {
  const telemetry = useAxiomTelemetry();
  const [chatOpen, setChatOpen] = useState(false);
  const billingStatus = (data.billing?.status || "").toLowerCase();
  const billingWarn = billingStatus === "past_due" || billingStatus === "canceled" || billingStatus === "unpaid";

  return (
    <AxiomStudioHudShell brandTitle={data.shop.name} deskSlug={data.shop.slug} themeId="cyber_cyan">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-3 pb-24 sm:px-4 lg:px-6">
        <StorefrontStudio slug={data.shop.slug} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
          <p className="min-w-0 break-words font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            {readonly ? "Preview mode" : "Owner mode"} · {data.shop.niche || "contractor"} · Companion {telemetry.status}
            {billingStatus ? (
              <span className={billingWarn ? " text-[#ff2a3d]" : " text-[#00f2fe]"}> · Billing {data.billing?.status}</span>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DeskLink href={`/${data.shop.slug}/admin/billing`}>Billing</DeskLink>
            <DeskLink href={`/${data.shop.slug}/admin/autopilot`}>Autopilot</DeskLink>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="axiom-hud-cta-primary min-h-9 px-4 py-2"
            >
              Receptionist chat
            </button>
          </div>
        </div>
        <StudioAutoBuildPanel
          shopSlug={data.shop.slug}
          shopName={data.shop.name}
          niche={data.shop.niche || "contractor"}
          readonly={readonly}
          previewHref={`/${data.shop.slug}`}
          embedInShell
        />
        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <ChaChingRevenueCounter
            shopSlug={data.shop.slug}
            shopName={data.shop.name}
            appointments={data.appointments}
            services={data.services}
          />
          <JobRadarSmsPreview
            shopName={data.shop.name}
            shopSlug={data.shop.slug}
            city={shopCity(data.shop.address)}
            ownerPhone={data.notificationPhone || data.notifyPhone}
          />
        </div>
        {!readonly ? (
          <AxiomContentCreator
            shopSlug={data.shop.slug}
            businessName={data.shop.name}
            compact
          />
        ) : null}
        <AutopilotDashboard
          shopName={data.shop.name}
          shopSlug={data.shop.slug}
          defaultScope="tenant"
          pollMs={15_000}
        />
        <StripeConnectDashboard shopSlug={data.shop.slug} readonly={readonly} />
        <AxiomStudioInterface
          shopSlug={data.shop.slug}
          shopName={data.shop.name}
          serviceLine={data.shop.tagline}
          readonly={readonly}
          liveHref={`/${data.shop.slug}`}
        />
        <LiveDeskTelemetry shopSlug={data.shop.slug} />
      </div>
      <AxiomChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        deskLabel={data.shop.name}
      />
      <FounderWelcomeModal
        shopSlug={data.shop.slug}
        shopName={data.shop.name}
        ownerName={data.shop.name}
        niche={data.shop.niche || data.shop.customNiche || "contractor"}
        address={data.shop.address}
        readonly={readonly}
      />
    </AxiomStudioHudShell>
  );
}

function DeskLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.03] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition hover:border-[var(--brand-primary)]/40 hover:text-white"
    >
      {children}
    </a>
  );
}
