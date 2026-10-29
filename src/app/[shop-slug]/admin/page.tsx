"use client";

import { use, useEffect, useState } from "react";
import { AxiomRingProvider } from "@/components/axiom-ring";
import { DEFAULT_DASHBOARD } from "@/lib/axiom/dashboard";
import { getOperatorData } from "@/lib/axiom/server";
import { parseLayout, parseThemeProfile } from "@/lib/axiom/storefront";
import { defaultTradeProfile } from "@/lib/axiom/trade-layout";
import type { Appointment, Employee, Service, Shop } from "@/lib/axiom/types";
import { AdminShell, type OpData } from "@/routes/$shopSlug/admin";

/**
 * Operator desk for `/{shop-slug}/admin`.
 * `/demo/admin` is this page for the demo shop, not an industry named "admin".
 */
export default function ShopAdminPage({
  params,
}: {
  params: Promise<{ "shop-slug": string }>;
}) {
  const slug = use(params)["shop-slug"] || "demo";
  const [desk, setDesk] = useState<OpData>(() => demoOperatorDesk(slug));
  const [readonly, setReadonly] = useState(true);

  useEffect(() => {
    setDesk(demoOperatorDesk(slug));
    setReadonly(true);
    let cancelled = false;
    void getOperatorData({ data: slug })
      .then((next) => {
        if (cancelled) return;
        setDesk(next);
        setReadonly(next.mode !== "owner");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <AxiomRingProvider
      shopId={desk.shop.id}
      slug={desk.shop.slug}
      ringColor={desk.shop.ringColor}
      mode={desk.mode}
    >
      <AdminShell
        data={desk}
        readonly={readonly}
        onReload={() => {
          void getOperatorData({ data: slug })
            .then((next) => {
              setDesk(next);
              setReadonly(next.mode !== "owner");
            })
            .catch(() => undefined);
        }}
      />
    </AxiomRingProvider>
  );
}

function atHour(dayOffset: number, hour: number) {
  const when = new Date();
  when.setDate(when.getDate() + dayOffset);
  when.setHours(hour, 0, 0, 0);
  return when.toISOString();
}

function demoOperatorDesk(slug: string): OpData {
  const shopId = "shop_demo";
  const niche = "contractor" as const;
  const shop: Shop = {
    id: shopId,
    slug,
    name: "Axiom Studio",
    niche,
    customNiche: "",
    tagline: "The book stays open after the crew goes home.",
    description: "Hero, assets, and the overnight booking queue for the demo shop.",
    ringColor: "#2EE6D6",
    heroImageUrl: "",
    heroVideoUrl: "/media/orb-explosion-hero-animation.mp4",
    heroBlendPercent: 62,
    heroEffectType: "smoke",
    heroBrandingTagline: "Booked while you sleep",
    heroPrompt: "",
    morphDurationSec: 4.5,
    introPreset: "orbital-pulse",
    introSpeed: 40,
    introIntensity: 48,
    primaryServiceId: "svc_consult",
    ownerUserId: null,
    isShowcase: true,
    onboardingStep: "complete",
    onboarding: { hero: true, service: true, employee: true, testBooked: true },
    hours: {
      mon: "08:00-18:00",
      tue: "08:00-18:00",
      wed: "08:00-18:00",
      thu: "08:00-18:00",
      fri: "08:00-18:00",
      sat: "09:00-13:00",
      sun: "closed",
    },
    address: "New Era",
    acceptsCard: false,
    worksAlone: false,
    dashboardOverride: false,
    dashboardConfig: DEFAULT_DASHBOARD,
    themeProfile: parseThemeProfile(undefined, niche),
    neonAccent: "#2EE6D6",
    glowEnabled: true,
    layout: parseLayout(undefined),
    tradeProfile: defaultTradeProfile(niche),
    createdAt: new Date().toISOString(),
  };
  const services: Service[] = [
    {
      id: "svc_consult",
      shopId,
      name: "Project consultation",
      description: "Walk the house. Leave with a scope and a number.",
      durationMin: 60,
      priceCents: 15000,
      group: "Consult",
      priceUnit: "flat",
    },
    {
      id: "svc_measure",
      shopId,
      name: "Site measure",
      description: "Rooms, openings, and the list the crew builds from.",
      durationMin: 90,
      priceCents: 20000,
      group: "Consult",
      priceUnit: "flat",
    },
    {
      id: "svc_repair",
      shopId,
      name: "Repair call",
      description: "One problem. A leak, a door, a stair that moves.",
      durationMin: 120,
      priceCents: 28000,
      group: "Build",
      priceUnit: "flat",
    },
  ];
  const week = {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  };
  const employees: Employee[] = [
    {
      id: "emp_lena",
      shopId,
      displayName: "Lena Cho",
      title: "General contractor",
      bio: "Scopes the job, then stays on it.",
      phone: "",
      avatarUrl: "",
      inviteStatus: "claimed",
      serviceIds: ["svc_consult", "svc_measure"],
      dashboardConfig: DEFAULT_DASHBOARD,
      availability: week,
    },
    {
      id: "emp_owen",
      shopId,
      displayName: "Owen Briggs",
      title: "Lead carpenter",
      bio: "The repair calls and the first day on a room.",
      phone: "",
      avatarUrl: "",
      inviteStatus: "claimed",
      serviceIds: ["svc_repair"],
      dashboardConfig: DEFAULT_DASHBOARD,
      availability: { ...week, sat: true },
    },
  ];
  const appointments: Appointment[] = [
    {
      id: "apt_queue_1",
      shopId,
      employeeId: "emp_lena",
      employeeName: "Lena Cho",
      serviceId: "svc_consult",
      serviceName: "Project consultation",
      customerName: "Mara Ellison",
      customerPhone: "",
      startsAt: atHour(0, 18),
      status: "pending",
      paymentStatus: "unpaid",
      paymentCents: 15000,
      paymentRef: null,
    },
    {
      id: "apt_queue_2",
      shopId,
      employeeId: "emp_owen",
      employeeName: "Owen Briggs",
      serviceId: "svc_repair",
      serviceName: "Repair call",
      customerName: "Jonah Peck",
      customerPhone: "",
      startsAt: atHour(1, 9),
      status: "pending",
      paymentStatus: "unpaid",
      paymentCents: 28000,
      paymentRef: null,
    },
    {
      id: "apt_held",
      shopId,
      employeeId: "emp_lena",
      employeeName: "Lena Cho",
      serviceId: "svc_measure",
      serviceName: "Site measure",
      customerName: "Priya Shah",
      customerPhone: "",
      startsAt: atHour(1, 14),
      status: "confirmed",
      paymentStatus: "paid",
      paymentCents: 20000,
      paymentRef: "gg_demo",
    },
  ];
  return {
    mode: "preview",
    shop,
    appointments,
    billing: { plan: "axiom_pro", status: "active", priceCents: 49700, gearGuardianBps: 0 },
    services,
    employees,
    notices: [
      {
        id: "note_queue",
        channel: "inbox",
        kind: "booking_request",
        employeeId: "emp_lena",
        destination: "desk",
        subject: "Overnight request",
        body: "Project consultation is waiting on the book.",
        status: "queued",
        detail: "",
        createdAt: new Date().toISOString(),
      },
    ],
    notifyEmail: "",
    notifyPhone: "",
    payments: {
      processorReady: false,
      connected: false,
      chargesEnabled: false,
      connectStatus: "none",
    },
    platformDesk: false,
  };
}
