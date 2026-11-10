import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  beginStripeConnect,
  getOperatorData,
  inviteEmployee,
  refreshStripeConnect,
  removeEmployee,
  saveTradeProfile,
  setShopIntro,
  setShopNiche,
  updateEmployee,
  updateNotifyChannels,
  revalidateStorefront,
  updateShopBrand,
} from "@/lib/axiom/server";
import { getNicheActions } from "@/config/niche-actions";
import { AiContentAutopilotToggle } from "@/components/admin/ai-content-autopilot";
import { AssignmentLog, ConciergeDeck, HUD_CARD, HUD_SELECT, HudCard, HudHeading, HudStat, NeonBadge } from "@/components/admin/admin-hud";
import { ZeroUiOrchestrator } from "@/components/admin/zero-ui-orchestrator";
import { MakeItMineWizard } from "@/components/admin/make-it-mine-wizard";
import { HeroStudioMobile } from "@/components/admin/hero-studio-mobile";
import { studioDefaultButtons } from "@/config/niche-button-presets";
import { seedFilmPlates, type HeroHudConfig } from "@/lib/axiom/hero-hud";
import { OUTREACH_STRATEGIES } from "@/lib/axiom/funnel";
import { DispatchControlPanel } from "@/components/master/DispatchControlPanel";
import { automateOutreachDesk, readOutreachDesk } from "@/lib/axiom/master";
import { NICHES, NICHE_ORDER, PUBLIC_NICHE_ORDER, isPublicNiche, shopTradeLabel } from "@/lib/axiom/niches";
import { isCatalogNiche } from "@/config/catalog";
import { resolveHeroMedia, NICHE_MEDIA } from "@/lib/axiom/media";
import { HeroCustomizer } from "@/components/admin/HeroCustomizer";
import { HeroLibraryBench } from "@/components/admin/hero-library-bench";
import { AutopilotLoopsPanel } from "@/components/admin/autopilot-loops";
import { EmployeeOversight } from "@/components/admin/EmployeeOversight";
import { isCatalogHeroUrl, readMasterTelemetry } from "@/lib/axiom/hero-films";
import { PreviewStudio } from "@/components/preview-studio";
import { HeroTextCanvas } from "@/components/hero-text-canvas";
import { HeroSpatial } from "@/components/hero-spatial";
import { HeroLoopVideo } from "@/components/loop-video";
import { applyDepthStudio, hudVars, paintHero, setHeroLayer, type HeroLayerId, type StorefrontHud } from "@/lib/axiom/hud";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import { getBearerToken } from "@/lib/auth/client";
import { PRESENTATION_STYLES, isPresentationStyle, presentationForIntro, type IntroPreset } from "@/lib/axiom/intro";
import { LAYOUT_BLOCKS, type LayoutBlock } from "@/lib/axiom/storefront";
import { BrandStudio } from "@/components/brand-studio";
import { BrandedHeroStudio } from "@/components/branded-hero-studio";
import { HeroMotionDesk } from "@/components/hero-motion-desk";
import { compileBrandMark, parseBrandStudio, rippleTheme, themeSurface, type RippleThemeId } from "@/lib/axiom/brand-studio";
import { brandPlate, heroAtmosphereActive } from "@/lib/axiom/hero-brand";
import { shopCity } from "@/lib/axiom/avatar";
import { AdminWelcomeTour } from "@/components/admin-welcome-tour";
import { AiVoiceManager } from "@/components/AiVoiceManager";
import { AskEricAvatar } from "@/components/AskEricAvatar";
import { DesignCopilot } from "@/components/design-copilot";
import { setAvatarScreen } from "@/components/avatar-help-state";
import { CyberCompanionHud } from "@/components/CyberCompanionHud";
import { AlertsPanel, PaymentsPanel, ServicesPanel, SettingsPanel } from "@/components/operator-panels";
import { ProspectScan } from "@/components/prospect-scan";
import { TodayPost } from "@/components/today-post";
import { useAxiomRing } from "@/components/axiom-ring";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";
import { formatMoney } from "@/lib/utils";
import type { AccessMode, Appointment, Billing, Employee, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";
import { CinematicHero } from "@/components/cinematic-hero";
import { PaymentGate } from "@/components/payment-gate";
import { PricingSettings } from "@/components/pricing-settings";
import { AxiomStudio } from "@/components/axiom-studio";
import {
  AutopilotDesk,
  MISSION_TABS,
  MissionFrame,
  type MissionTab,
} from "@/components/mission-desk";

export const Route = createFileRoute("/$shopSlug/admin")({
  validateSearch: (s: Record<string, unknown>): { stripe?: "return" | "refresh"; desk?: "master" } => {
    const stripe = s.stripe === "return" || s.stripe === "refresh" ? s.stripe : undefined;
    const desk = s.desk === "master" ? "master" : undefined;
    return { ...(stripe ? { stripe } : {}), ...(desk ? { desk } : {}) };
  },
  component: AdminPage,
});

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
  payments: PaymentSetup;
  platformDesk?: boolean;
};

function operatorQuery(slug: string, desk?: "master") {
  return desk === "master" ? { slug, desk } : slug;
}

function AdminPage() {
  const { shopSlug } = Route.useParams();
  const { stripe, desk } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const heroStudio =
    pathname.endsWith("/admin/hero-studio") ||
    pathname.endsWith("/admin/brand-studio") ||
    pathname.includes("/admin/branding/hero-library") ||
    pathname.endsWith("/admin/autopilot");
  const [data, setData] = useState<OpData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    void getOperatorData({ data: operatorQuery(shopSlug, desk) })
      .then((next) => {
        if (!cancelled) {
          setError(null);
          setData(next);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Forbidden");
      });
    return () => {
      cancelled = true;
    };
  }, [desk, isPending, shopSlug, userId]);

  useEffect(() => {
    if (!user || !stripe) return;
    void refreshStripeConnect({ data: shopSlug })
      .then(() => getOperatorData({ data: operatorQuery(shopSlug, desk) }))
      .then(setData)
      .catch(() => undefined);
  }, [desk, shopSlug, stripe, user]);

  useEffect(() => {
    if (isPending || !userId) return;
    const id = window.setInterval(() => {
      void getOperatorData({ data: operatorQuery(shopSlug, desk) })
        .then(setData)
        .catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(id);
  }, [desk, isPending, shopSlug, userId]);

  if (isPending) {
    return (
      <main className="admin-hud grid min-h-dvh place-items-center bg-slate-950">
        <div className="h-10 w-48 animate-pulse rounded-full border border-cyan-500/30 bg-slate-900/60 shadow-[0_0_30px_rgba(6,182,212,0.15)]" />
      </main>
    );
  }
  if (!user) {
    return (
      <RedirectToSignIn
        to="/login"
        next={heroStudio ? `/${shopSlug}/admin/hero-studio` : `/${shopSlug}/admin`}
      />
    );
  }
  if (heroStudio) return <Outlet />;
  if (!data && !error) {
    return (
      <main className="admin-hud grid min-h-dvh place-items-center bg-slate-950">
        <div className="h-10 w-48 animate-pulse rounded-full border border-cyan-500/30 bg-slate-900/60 shadow-[0_0_30px_rgba(6,182,212,0.15)]" />
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="neon-shell admin-hud grid min-h-dvh place-items-center bg-slate-950 px-6 text-center">
        <div className={`${HUD_CARD} px-8 py-10`}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Operator</p>
          <p className="mt-3 font-display text-3xl">This console is locked.</p>
          <p className="mt-2 text-sm text-muted">Create your own shop to get the operator view.</p>
          <Link to="/onboard" className="mt-4 inline-block text-sm underline-offset-4 hover:underline">
            Start onboarding
          </Link>
        </div>
      </main>
    );
  }
  if (data.mode === "employee") {
    return <Navigate to="/$shopSlug/employee" params={{ shopSlug }} />;
  }

  return <AdminShell data={data} readonly={data.mode === "preview"} onReload={() => {
    void getOperatorData({ data: operatorQuery(shopSlug, desk) }).then(setData);
  }} />;
}

export function AdminShell({
  data,
  readonly,
  onReload,
}: {
  data: OpData;
  readonly: boolean;
  onReload: () => void;
}) {
  const [tab, setTab] = useState<MissionTab>("overview");
  const [linking, setLinking] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const paymentsLocked =
    !readonly && !data.platformDesk && data.payments.processorReady && !data.payments.chargesEnabled;

  useEffect(() => {
    const screen = tab === "services" || tab === "hero" ? "storefront_editor" : "lead_dashboard";
    setAvatarScreen(screen);
    return () => setAvatarScreen(null);
  }, [tab]);
  const incoming = data.appointments.filter((a) => a.status === "pending").length;
  const setup = data.shop.onboarding;
  const needsSetup = !readonly && (!setup.hero || !setup.service || !setup.employee);

  return (
    <main className="neon-shell admin-hud bg-slate-950">
      <header className={`${HUD_CARD} relative mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 overflow-hidden px-5 py-4 sm:mx-6 sm:px-6`}>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
        <div>
          <Wordmark />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <NeonBadge tone="emerald" pulse>Live</NeonBadge>
            {incoming > 0 ? <NeonBadge tone="fuchsia" pulse>{incoming} incoming</NeonBadge> : null}
            <NeonBadge tone="cyan">{data.employees.length} {data.employees.length === 1 ? "chair" : "chairs"}</NeonBadge>
          </div>
          {data.platformDesk ? (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-copper">Platform desk · live writes</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-mono text-slate-100">{data.shop.name}</span>
            {readonly ? " · live demo preview" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.platformDesk ? (
            <Link
              to="/master-admin"
              className="inline-flex h-11 items-center rounded-xl border border-amber-400/50 bg-amber-400/10 px-3 font-mono text-xs uppercase tracking-[0.14em] text-amber-300 hover:bg-amber-400/20"
            >
              Master desk
            </Link>
          ) : null}
          <Link
            to="/$shopSlug"
            params={{ shopSlug: data.shop.slug }}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-xl border border-cyan-300 bg-cyan-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:bg-cyan-300"
          >
            View Customer-Facing Site
          </Link>
          <Link
            to="/$shopSlug/admin/brand-studio"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl border border-cyan-500/30 bg-slate-900/60 px-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
          >
            Brand studio
          </Link>
          <Link
            to="/$shopSlug/admin/branding/hero-library"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl border border-cyan-500/30 bg-slate-900/60 px-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
          >
            Hero library
          </Link>
          <Link
            to="/$shopSlug/admin/autopilot"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl border border-cyan-500/30 bg-slate-900/60 px-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
          >
            Autopilot
          </Link>
          <Link
            to="/$shopSlug/employee"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl border border-cyan-500/30 bg-slate-900/60 px-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
          >
            Station
          </Link>
        </div>
      </header>

      {needsSetup ? (
        <SetupStrip shop={data.shop} services={data.services} readonly={readonly} onDone={onReload} />
      ) : null}

      <nav className="mission-tabs" aria-label="Mission control">
        {MISSION_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? "is-on" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <MissionFrame>
        {tab === "overview" ? (
          <div className="grid gap-8">
            <ZeroUiOrchestrator shop={data.shop} readonly={readonly} onReload={onReload} />
            <MakeItMineWizard shop={data.shop} readonly={readonly} onReload={onReload} />
            <Overview data={data} readonly={readonly} onReload={onReload} paymentsLocked={paymentsLocked} />
            <PaymentsPanel
              shop={data.shop}
              billing={data.billing}
              payments={data.payments}
              appointments={data.appointments}
              readonly={readonly}
              onReload={onReload}
            />
          </div>
        ) : null}
        {tab === "services" ? (
          <div className="grid gap-8">
            <ServicesPanel shop={data.shop} services={data.services} readonly={readonly} onReload={onReload} />
            <PricingSettings slug={data.shop.slug} readonly={readonly} />
          </div>
        ) : null}
        {tab === "staff" ? (
          <div className="grid gap-8">
            <TeamPanel shop={data.shop} employees={data.employees} readonly={readonly} onReload={onReload} />
            <EmployeeOversight shop={data.shop} employees={data.employees} readonly={readonly} onReload={onReload} />
          </div>
        ) : null}
        {tab === "hero" ? (
          <div className="grid gap-6">
            <HeroStudioMobile shop={data.shop} readonly={readonly} onReload={onReload} />
            <HeroLibraryBench shop={data.shop} readonly={readonly} onReload={onReload} />
            <details className="mission-more">
              <summary>Branding tools</summary>
              <div className="grid gap-8 pt-4">
                <BrandPanel shop={data.shop} services={data.services} readonly={readonly} onReload={onReload} />
                <HeroMotionDesk shop={data.shop} readonly={readonly} onReload={onReload} />
                <BrandedHeroStudio shop={data.shop} readonly={readonly} onReload={onReload} />
                <AxiomStudio shop={data.shop} readonly={readonly} onReload={onReload} />
              </div>
            </details>
          </div>
        ) : null}
        {tab === "autopilot" ? (
          <div className="grid gap-6">
            <AiContentAutopilotToggle shop={data.shop} readonly={readonly && !data.shop.isShowcase} />
            <AutopilotLoopsPanel shop={data.shop} readonly={readonly && !data.shop.isShowcase} onReload={onReload} />
            <AutopilotDesk
              slug={data.shop.slug}
              appointments={data.appointments}
              notices={data.notices}
              disabled={readonly && !data.shop.isShowcase}
            />
            <details className="mission-more">
              <summary>Channels and the shop card</summary>
              <div className="grid gap-8 pt-4">
                <AlertsPanel
                  shop={data.shop}
                  notifyEmail={data.notifyEmail}
                  notifyPhone={data.notifyPhone}
                  notices={data.notices}
                  readonly={readonly}
                  onReload={onReload}
                />
                <SettingsPanel shop={data.shop} readonly={readonly} onReload={onReload} />
                <StorefrontPanel
                  shop={data.shop}
                  notifyEmail={data.notifyEmail}
                  notifyPhone={data.notifyPhone}
                  readonly={readonly}
                  platformDesk={Boolean(data.platformDesk)}
                  onReload={onReload}
                />
              </div>
            </details>
          </div>
        ) : null}
        {paymentsLocked && tab === "overview" ? (
          <PaymentGate
            pending={data.payments.connectStatus === "pending"}
            busy={linking}
            error={gateError}
            onLink={() => {
              setLinking(true);
              setGateError(null);
              void beginStripeConnect({ data: data.shop.slug })
                .then((result) => {
                  window.location.href = result.url;
                })
                .catch((err: unknown) => {
                  setGateError(err instanceof Error ? err.message : "Could not open Stripe");
                  setLinking(false);
                });
            }}
          />
        ) : null}
      </MissionFrame>
      <AdminWelcomeTour
        shopSlug={data.shop.slug}
        shopName={data.shop.name}
        active={data.mode === "owner" && !data.platformDesk}
      />
      <div className="fixed right-4 bottom-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-end gap-3">
        <AskEricAvatar
          docked
          businessName={data.shop.name}
          trade={shopTradeLabel(data.shop)}
          city={shopCity(data.shop.address)}
          welcome={data.mode === "owner" && !data.platformDesk ? data.shop.slug : undefined}
        />
        <AiVoiceManager />
      </div>
      <DesignCopilot slug={data.shop.slug} readonly={readonly} onApplied={onReload} />
      <CyberCompanionHud
        environment="admin"
        shopName={data.shop.name}
        shopSlug={data.shop.slug}
      />
    </main>
  );
}

function SetupStrip({
  shop,
  services,
  readonly,
  onDone,
}: {
  shop: Shop;
  services: Service[];
  readonly: boolean;
  onDone: () => void;
}) {
  const flags = shop.onboarding;
  return (
    <div className={`${HUD_CARD} mx-3 mt-3 p-4 sm:mx-6`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Guided loop · admin setup</p>
      <p className="mt-1 font-display text-2xl">Three moves, then book yourself.</p>
      <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <li className={flags.hero ? "text-emerald-300" : "text-slate-400"}>{flags.hero ? "Hero set" : "1 · Hero + blend"}</li>
        <li className={flags.service ? "text-emerald-300" : "text-slate-400"}>
          {flags.service ? "Primary service" : "2 · Primary service"}
        </li>
        <li className={flags.employee ? "text-emerald-300" : "text-slate-400"}>
          {shop.worksAlone
            ? flags.employee
              ? "You're on the book"
              : "3 · Put your name on the book"
            : flags.employee
              ? "Staff invited"
              : "3 · Invite one employee"}
        </li>
      </ol>
      {!readonly && flags.hero && flags.service && flags.employee ? (
        <Link
          to="/$shopSlug"
          params={{ shopSlug: shop.slug }}
          search={{ loop: true }}
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm font-medium text-bg"
        >
          Book a test appointment
        </Link>
      ) : null}
      <span className="hidden">{services.length}</span>
    </div>
  );
}

function Overview({
  data,
  readonly,
  onReload,
  paymentsLocked,
}: {
  data: OpData;
  readonly: boolean;
  onReload: () => void;
  paymentsLocked: boolean;
}) {
  const pending = data.appointments.filter((a) => a.status === "pending");
  const paid = data.appointments.filter((a) => a.paymentStatus === "paid");
  const revenue = paid.reduce((s, a) => s + a.paymentCents, 0);
  const cancelled = data.appointments.filter((a) => a.status === "cancelled");
  const leaked = cancelled.reduce((sum, item) => sum + item.paymentCents, 0);
  const audits = data.notices.filter((notice) => notice.channel === "inbox" && notice.subject.startsWith("Audit"));
  const chart = useMemo(() => {
    const days: { day: string; cents: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const cents = paid
        .filter((a) => new Date(a.startsAt).toDateString() === key)
        .reduce((s, a) => s + a.paymentCents, 0);
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        cents,
      });
    }
    return days;
  }, [paid]);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HudStat label="Captured" value={formatMoney(revenue)} tone="cyan" />
        <HudStat label="Bookings" value={String(data.appointments.length)} tone="slate" />
        <HudStat label="Incoming" value={String(pending.length)} hint="awaiting confirm" tone={pending.length ? "fuchsia" : "slate"} />
        <HudStat label="Left on the table" value={formatMoney(leaked)} hint={`${cancelled.length} cancelled`} tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <ConciergeDeck
          slug={data.shop.slug}
          appointments={data.appointments}
          notices={data.notices}
          canAct={!readonly || data.shop.isShowcase}
          scheduleLocked={paymentsLocked}
          onReload={onReload}
        />
        <div className="grid content-start gap-5">
          <HudCard>
            <HudHeading kicker="Revenue · 7 days" title={formatMoney(revenue)} />
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: "rgba(34,211,238,0.35)" }}
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(6,182,212,0.35)",
                      borderRadius: 10,
                      color: "#e2e8f0",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#67e8f9" }}
                    formatter={(v: number) => formatMoney(v)}
                  />
                  <Area type="monotone" dataKey="cents" stroke="#22d3ee" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </HudCard>
          <HudCard>
            <HudHeading kicker="Inbox" title="Audit reports" />
            {audits.length === 0 ? (
              <p className="mt-3 font-mono text-xs text-slate-500">No photo audits yet.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {audits.slice(0, 6).map((notice) => (
                  <li key={notice.id} className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3">
                    <p className="text-sm font-medium text-slate-100">{notice.subject.replace(/^Audit · /, "")}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-400">{notice.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </HudCard>
        </div>
      </div>

      <AssignmentLog appointments={data.appointments} employees={data.employees} services={data.services} />

      <div className="grid gap-5 lg:grid-cols-2">
        <HudCard>
          <TodayPost slug={data.shop.slug} />
        </HudCard>
        <HudCard>
          <ProspectScan
            slug={data.shop.slug}
            city={shopCity(data.shop.address)}
            disabled={paymentsLocked || (readonly && !data.shop.isShowcase)}
          />
        </HudCard>
      </div>
    </div>
  );
}

function BrandPanel({
  shop,
  services,
  readonly,
  onReload,
}: {
  shop: Shop;
  services: Service[];
  readonly: boolean;
  onReload: () => void;
}) {
  const ring = useAxiomRing();
  const [blend, setBlend] = useState(shop.heroBlendPercent);
  const [color, setColor] = useState(shop.ringColor);
  const [primary, setPrimary] = useState(shop.primaryServiceId ?? services[0]?.id ?? "");
  const [preset, setPreset] = useState<IntroPreset>(shop.introPreset);
  const [speed, setSpeed] = useState(shop.introSpeed);
  const [intensity, setIntensity] = useState(shop.introIntensity);
  const [glow, setGlow] = useState(shop.glowEnabled);
  const [neon, setNeon] = useState(shop.neonAccent || shop.ringColor);
  const [theme, setTheme] = useState<RippleThemeId | "">(shop.tradeProfile.studio.theme);
  const [header, setHeader] = useState(shop.tradeProfile.studio.header || shop.name);
  const [brandLine, setBrandLine] = useState(shop.tradeProfile.studio.tagline || shop.tagline);
  const [layout, setLayout] = useState<LayoutBlock[]>(shop.layout);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [replay, setReplay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [localVideo, setLocalVideo] = useState<string | null>(null);
  const nicheFilm = NICHE_MEDIA[shop.niche]?.heroVideoUrl ?? "";
  const storedPin =
    isCatalogHeroUrl(shop.heroVideoUrl) && shop.heroVideoUrl !== nicheFilm
      ? shop.heroVideoUrl
      : "";
  const [catalog, setCatalog] = useState(storedPin);
  const canIntro = !readonly || shop.isShowcase;
  const hero = resolveHeroMedia(shop);
  const previewVideo = localVideo ?? (catalog || hero.videoUrl);
  const nicheActions = getNicheActions(shop.niche);
  const [liveHud, setLiveHud] = useState<HeroHudConfig>(() =>
    seedFilmPlates(shop.heroHud && shop.heroHud.buttons.length > 0 ? shop.heroHud : { title: "", buttons: studioDefaultButtons(shop.niche, previewVideo, `/${shop.slug}/book`), plates: [] }, {
      name: shop.name,
      tagline: shop.tagline,
      city: shopCity(shop.address),
      badge: nicheActions?.badge ?? "",
      bookHref: `/${shop.slug}/book`,
      services: nicheActions?.services ?? [],
    }),
  );
  const liveHudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onLiveHud(next: HeroHudConfig, commit = false) {
    setLiveHud(next);
    if (readonly || !commit) return;
    if (liveHudTimer.current) clearTimeout(liveHudTimer.current);
    liveHudTimer.current = setTimeout(() => {
      const identity = next.plates.find((plate) => plate.id === "plate_identity");
      const name = identity?.lines.find((line) => line.id === "line_name")?.text.trim();
      const tagline = identity?.lines.find((line) => line.id === "line_tag")?.text.trim();
      void updateShopBrand({
        data: {
          slug: shop.slug,
          heroHud: next,
          markHero: true,
          ...(name ? { name } : {}),
          ...(tagline ? { tagline } : {}),
        },
      })
        .then(() => revalidateStorefront({ data: shop.slug }))
        .catch(() => undefined);
    }, 320);
  }

  useEffect(() => {
    setLocalVideo((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [shop.heroVideoUrl]);

  useEffect(() => {
    setCatalog(storedPin);
  }, [storedPin]);

  useEffect(() => {
    setColor(shop.ringColor);
    setNeon(shop.neonAccent || shop.ringColor);
    setTheme(shop.tradeProfile.studio.theme);
    setHeader(shop.tradeProfile.studio.header || shop.name);
    setBrandLine(shop.tradeProfile.studio.tagline || shop.tagline);
  }, [shop]);

  function studioPayload(next?: { theme?: RippleThemeId | ""; presentation?: IntroPreset }) {
    const presentation = next?.presentation ?? preset;
    return parseBrandStudio({
      header,
      tagline: brandLine,
      theme: next?.theme ?? theme,
      presentation: isPresentationStyle(presentation) ? presentation : shop.tradeProfile.studio.presentation,
      motion: shop.tradeProfile.studio.motion,
    });
  }

  async function saveStudio(next?: { theme?: RippleThemeId | ""; presentation?: IntroPreset }) {
    const studio = studioPayload(next);
    await saveTradeProfile({ data: { slug: shop.slug, profile: { ...shop.tradeProfile, studio } } });
    return studio;
  }

  async function save(extra?: { heroImageUrl?: string; markService?: boolean }) {
    setSaving(true);
    try {
      if (canIntro) {
        await setShopIntro({
          data: {
            slug: shop.slug,
            introPreset: preset,
            introSpeed: speed,
            introIntensity: intensity,
          },
        });
      }
      if (!readonly) {
        const studio = studioPayload();
        const chosen = rippleTheme(studio.theme);
        await saveTradeProfile({ data: { slug: shop.slug, profile: { ...shop.tradeProfile, studio } } });
        await updateShopBrand({
          data: {
            slug: shop.slug,
            heroBlendPercent: blend,
            ringColor: chosen?.ring ?? color,
            introPreset: preset,
            introSpeed: speed,
            introIntensity: intensity,
            heroImageUrl: extra?.heroImageUrl,
            primaryServiceId: primary || undefined,
            markHero: true,
            markService: extra?.markService ?? Boolean(primary),
            neonAccent: chosen?.accent ?? neon,
            glowEnabled: glow,
            layout,
          },
        });
      }
      onReload();
    } finally {
      setSaving(false);
    }
  }

  async function onCatalog(value: string) {
    const next = value === "default" ? "" : value;
    setCatalog(next);
    if (readonly) return;
    setSaving(true);
    try {
      // Pin historical archive selection onto shops.hero_background_loop (+ hero_video_url).
      await updateShopBrand({
        data: {
          slug: shop.slug,
          catalogFilm: value,
          heroFilm: value === "default" ? undefined : next,
          clearHeroVideo: value === "default" ? true : undefined,
          markHero: true,
        },
      });
      await revalidateStorefront({ data: shop.slug });
      onReload();
    } finally {
      setSaving(false);
    }
  }

  async function persistIntro(next?: {
    introPreset?: IntroPreset;
    introSpeed?: number;
    introIntensity?: number;
  }) {
    const p = next?.introPreset ?? preset;
    const s = next?.introSpeed ?? speed;
    const n = next?.introIntensity ?? intensity;
    setPreset(p);
    setSpeed(s);
    setIntensity(n);
    setReplay((v) => v + 1);
    if (!canIntro) return;
    try {
      await setShopIntro({
        data: { slug: shop.slug, introPreset: p, introSpeed: s, introIntensity: n },
      });
      if (!readonly && isPresentationStyle(p)) await saveStudio({ presentation: p });
    } catch {
      /* preview still shows locally */
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const url = await fileToDataUrl(file, 900);
    await save({ heroImageUrl: url });
  }

  async function onVideo(file: File | undefined) {
    if (!file || readonly) return;
    const mp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!mp4) {
      setVideoError("Upload an .mp4 file");
      return;
    }
    if (file.size > HERO_VIDEO_MAX_BYTES) {
      setVideoError("Video must be 12 MB or smaller");
      return;
    }
    setVideoError(null);
    const preview = URL.createObjectURL(file);
    setLocalVideo((current) => {
      if (current) URL.revokeObjectURL(current);
      return preview;
    });
    setReplay((n) => n + 1);
    setUploading(true);
    try {
      const token = getBearerToken();
      const res = await fetch(`/api/hero-video/${shop.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "video/mp4",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
      if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "Upload failed");
      onReload();
    } catch (err) {
      setLocalVideo((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setVideoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div
        className="relative min-h-[100dvh] overflow-hidden lg:min-h-[36rem]"
        style={{
          ["--neon" as string]: neon,
          ["--glow" as string]: glow ? "0.7" : "0",
          ...(rippleTheme(theme) ? themeSurface(rippleTheme(theme)!) : {}),
        }}
      >
        <CinematicHero
          imageUrl=""
          videoUrl={previewVideo}
          blendPercent={blend}
          introPreset={preset}
          introSpeed={speed}
          introIntensity={intensity}
          tone={hero.tone}
          replayKey={replay}
          previewMode
          brand={{
            name: shop.name,
            accent: neon,
            logoUrl: header ? compileBrandMark(header, brandLine, rippleTheme(theme)?.accent || neon).dataUrl : shop.tradeProfile?.logoUrl || undefined,
            city: shopCity(shop.address),
            trade: shopTradeLabel(shop),
          }}
          effect={null}
          brandTagline=""
          brandSticker=""
          telemetry={readMasterTelemetry()}
          hud={liveHud}
          hudEditable={!readonly}
          onHudChange={onLiveHud}
          bookHref={`/${shop.slug}/book`}
          className="absolute inset-0 min-h-full"
        >
          <p className="pointer-events-none absolute bottom-4 left-4 max-w-[12rem] font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Live preview
          </p>
        </CinematicHero>
      </div>
      <div>
        <Label htmlFor="blend">Hero blend {blend}%</Label>
        <input
          id="blend"
          type="range"
          min={35}
          max={90}
          value={blend}
          disabled={readonly}
          onChange={(e) => setBlend(Number(e.target.value))}
          onPointerUp={() => void save()}
          className="mt-2 w-full accent-accent"
        />
        <p className="mt-2 text-xs text-muted">
          Masks the still into the page so the bottom of the hero dissolves into the dark field.
        </p>
        <p className="mt-1 text-xs text-muted">
          {localVideo
            ? "Custom loop · unsaved preview"
            : catalog
              ? `Pinned archive · ${catalog.split("/").pop()}`
              : `Live loop · ${(hero.videoUrl || "").split("/").pop() || "niche default"}`}
        </p>

        <div className={`${HUD_CARD} mt-8 p-4`}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Axiom Hero Studio Editor</p>
          <p className="mt-1 font-display text-2xl">Camera entrance</p>
          <p className="mt-1 text-xs text-muted">
            An uploaded film replaces this shop's default loop. The entrance plays first. Scroll this page and the film, wash, and title move apart.
          </p>
          <div className="mt-4">
            <Label htmlFor="hero-video">Background video</Label>
            <input
              id="hero-video"
              type="file"
              accept="video/mp4,.mp4"
              disabled={readonly || uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void onVideo(file);
              }}
              className="admin-file mt-2 block w-full text-sm text-slate-400"
            />
            <p className="mt-2 text-xs text-muted">
              {readonly
                ? "This preview keeps the niche film. A shop you own can replace it."
                : uploading
                  ? "Saving the film…"
                  : ".mp4, up to 12 MB. Stored for this shop only."}
            </p>
            {videoError ? <p className="mt-2 text-sm text-danger">{videoError}</p> : null}
          </div>
          <HeroCustomizer
            niche={shop.niche}
            selectedUrl={catalog || hero.videoUrl}
            disabled={readonly || uploading}
            onSelect={(value) => void onCatalog(value)}
          />
          <div className="mt-4">
            <Label htmlFor="intro-preset">Presentation</Label>
            <select
              id="intro-preset"
              value={presentationForIntro(preset)}
              disabled={!canIntro}
              onChange={(e) => void persistIntro({ introPreset: e.target.value as IntroPreset })}
              className={`${HUD_SELECT} mt-2`}
            >
              {PRESENTATION_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <Label htmlFor="intro-speed">Speed {speed}</Label>
            <input
              id="intro-speed"
              type="range"
              min={1}
              max={100}
              value={speed}
              disabled={!canIntro}
              onChange={(e) => {
                setSpeed(Number(e.target.value));
                setReplay((n) => n + 1);
              }}
              onPointerUp={(e) =>
                void persistIntro({ introSpeed: Number((e.currentTarget as HTMLInputElement).value) })
              }
              className="mt-2 w-full accent-accent"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="intro-intensity">Intensity {intensity}</Label>
            <input
              id="intro-intensity"
              type="range"
              min={0}
              max={100}
              value={intensity}
              disabled={!canIntro}
              onChange={(e) => {
                setIntensity(Number(e.target.value));
                setReplay((n) => n + 1);
              }}
              onPointerUp={(e) =>
                void persistIntro({
                  introIntensity: Number((e.currentTarget as HTMLInputElement).value),
                })
              }
              className="mt-2 w-full accent-accent"
            />
            <p className="mt-2 text-xs text-muted">
              Higher intensity widens the scroll split and gives a film a slight rate lift while the hero is on screen.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-4"
            disabled={!canIntro}
            onClick={() => setReplay((n) => n + 1)}
          >
            Replay preview
          </Button>
        </div>

        <BrandStudio
          header={header}
          tagline={brandLine}
          theme={theme}
          disabled={readonly}
          onHeader={setHeader}
          onTagline={setBrandLine}
          onTheme={(id) => {
            const next = rippleTheme(id);
            if (!next) return;
            setTheme(id);
            setColor(next.ring);
            setNeon(next.accent);
            ring.setRingColor(next.ring);
            if (readonly) return;
            void (async () => {
              await saveStudio({ theme: id });
              await updateShopBrand({
                data: { slug: shop.slug, ringColor: next.ring, neonAccent: next.accent, glowEnabled: glow, layout },
              });
              onReload();
            })();
          }}
        />
        <div className="mt-6">
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              id="neon-glow"
              type="button"
              disabled={readonly}
              aria-pressed={glow}
              onClick={() => {
                const next = !glow;
                setGlow(next);
                void updateShopBrand({
                  data: { slug: shop.slug, neonAccent: neon, glowEnabled: next, layout },
                }).then(() => onReload());
              }}
              className="glass-btn h-11 rounded-full px-4 text-sm"
            >
              {glow ? "Glow on" : "Glow off"}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Label>Page order</Label>
          <ul className="mt-3 grid gap-2">
            {layout.map((block, index) => (
              <li
                key={block}
                draggable={!readonly}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex == null || dragIndex === index) return;
                  const next = [...layout];
                  const [item] = next.splice(dragIndex, 1);
                  if (!item) return;
                  next.splice(index, 0, item);
                  setDragIndex(null);
                  setLayout(next);
                  void updateShopBrand({
                    data: { slug: shop.slug, neonAccent: neon, glowEnabled: glow, layout: next },
                  }).then(() => onReload());
                }}
                className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-slate-950/60 px-3 py-2"
              >
                <span className="text-sm capitalize">{block}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={readonly || index === 0}
                    className="h-9 rounded-lg px-2 text-xs text-muted disabled:opacity-40"
                    onClick={() => {
                      const next = [...layout];
                      const [item] = next.splice(index, 1);
                      if (!item) return;
                      next.splice(index - 1, 0, item);
                      setLayout(next);
                      void updateShopBrand({
                        data: { slug: shop.slug, neonAccent: neon, glowEnabled: glow, layout: next },
                      }).then(() => onReload());
                    }}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={readonly || index === layout.length - 1}
                    className="h-9 rounded-lg px-2 text-xs text-muted disabled:opacity-40"
                    onClick={() => {
                      const next = [...layout];
                      const [item] = next.splice(index, 1);
                      if (!item) return;
                      next.splice(index + 1, 0, item);
                      setLayout(next);
                      void updateShopBrand({
                        data: { slug: shop.slug, neonAccent: neon, glowEnabled: glow, layout: next },
                      }).then(() => onReload());
                    }}
                  >
                    Down
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-faint">The film stays first. {LAYOUT_BLOCKS.join(", ")} follow it.</p>
        </div>
        <div className="mt-6">
          <Label htmlFor="primary">Primary service</Label>
          <select
            id="primary"
            value={primary}
            disabled={readonly}
            onChange={(e) => {
              const v = e.target.value;
              setPrimary(v);
              void (async () => {
                if (readonly) return;
                setSaving(true);
                try {
                  await updateShopBrand({
                    data: {
                      slug: shop.slug,
                      heroBlendPercent: blend,
                      ringColor: color,
                      introPreset: preset,
                      introSpeed: speed,
                      introIntensity: intensity,
                      primaryServiceId: v,
                      markHero: true,
                      markService: true,
                    },
                  });
                  onReload();
                } finally {
                  setSaving(false);
                }
              })();
            }}
            className={`${HUD_SELECT} mt-2`}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6">
          <Label htmlFor="hero-file">Replace hero still</Label>
          <input
            id="hero-file"
            type="file"
            accept="image/*"
            disabled={readonly}
            onChange={(e) => void onFile(e.target.files?.[0])}
            className="admin-file mt-2 block w-full text-sm text-slate-400"
          />
        </div>
        <Button className="mt-6" disabled={saving || (!canIntro && readonly)} onClick={() => void save()}>
          Save brand
        </Button>
      </div>
    </div>
  );
}

function StorefrontPanel({
  shop,
  notifyEmail,
  notifyPhone,
  readonly,
  platformDesk,
  onReload,
}: {
  shop: Shop;
  notifyEmail: string;
  notifyPhone: string;
  readonly: boolean;
  platformDesk: boolean;
  onReload: () => void;
}) {
  const [phone, setPhone] = useState(notifyPhone);
  const [email, setEmail] = useState(notifyEmail);
  const [niche, setNiche] = useState(isCatalogNiche(shop.niche) ? shop.niche : PUBLIC_NICHE_ORDER[0]);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outreach, setOutreach] = useState<{
    mode: string;
    chunkSize: number;
    intervalSeconds: number;
    slotLabels?: string[];
    smsDailyCap?: number;
    emailDailyCap?: number;
  } | null>(null);
  const [outreachError, setOutreachError] = useState<string | null>(null);
  const [automateBusy, setAutomateBusy] = useState(false);
  const [automateNote, setAutomateNote] = useState<string | null>(null);
  const [hud, setHud] = useState<StorefrontHud>(shop.tradeProfile.hud);
  const [activeLayer, setActiveLayer] = useState<HeroLayerId>("headline");
  const stageRef = useRef<HTMLDivElement>(null);
  const bookPath = `/${shop.slug}/book`;
  const previewNiche = isCatalogNiche(niche) ? niche : shop.niche;
  const nicheMedia = NICHE_MEDIA[previewNiche];
  const painted = paintHero(nicheMedia.heroImageUrl, nicheMedia.heroVideoUrl || null, hud);
  const legacyLabel = NICHES[shop.niche].label;

  useEffect(() => {
    setNiche(isCatalogNiche(shop.niche) ? shop.niche : PUBLIC_NICHE_ORDER[0]);
    setHud(shop.tradeProfile.hud);
  }, [shop.niche, shop.tradeProfile]);

  useEffect(() => {
    setPhone(notifyPhone);
    setEmail(notifyEmail);
  }, [notifyEmail, notifyPhone]);

  function persistHud(next: StorefrontHud) {
    if (readonly) return;
    void saveTradeProfile({
      data: { slug: shop.slug, profile: { ...shop.tradeProfile, hud: next } },
    }).catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not save the hero"));
  }

  useEffect(() => {
    if (!platformDesk) return;
    let cancelled = false;
    void readOutreachDesk()
      .then((config) => {
        if (!cancelled) setOutreach(config);
      })
      .catch((err: unknown) => {
        if (!cancelled) setOutreachError(err instanceof Error ? err.message : "Outreach settings are unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [platformDesk]);

  return (
    <form
      className={`${HUD_CARD} max-w-5xl p-5`}
      onSubmit={(event) => {
        event.preventDefault();
        if (readonly) return;
        setBusy(true);
        setNote(null);
        void (async () => {
          await saveTradeProfile({ data: { slug: shop.slug, profile: { ...shop.tradeProfile, hud } } });
          await updateNotifyChannels({ data: { slug: shop.slug, notifyEmail: email, notifyPhone: phone } });
          if (isPublicNiche(niche) && niche !== shop.niche) {
            await setShopNiche({ data: { slug: shop.slug, niche } });
          }
        })()
          .then(() => {
            setNote("Saved");
            onReload();
          })
          .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Storefront</p>
      <p className="mt-1 font-display text-3xl">Brand and book</p>
      <p className="mt-2 text-sm text-muted">The mark, the ripple theme, and the glass tint are set on the brand tab.</p>
      <div className="mt-3">
        <Label htmlFor="sf-phone">Contact phone</Label>
        <Input id="sf-phone" value={phone} disabled={readonly} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="mt-3">
        <Label htmlFor="sf-email">Contact email</Label>
        <Input id="sf-email" value={email} disabled={readonly} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mt-3">
        <Label htmlFor="sf-niche">Trade</Label>
        <select
          id="sf-niche"
          value={niche}
          disabled={readonly}
          onChange={(e) => {
            const next = e.target.value as typeof niche;
            setNiche(next);
            setHud((current) => applyDepthStudio(current, next));
          }}
          className={`${HUD_SELECT} mt-2`}
        >
          {!isCatalogNiche(shop.niche) ? (
            <option value={shop.niche} disabled>
              {legacyLabel} (legacy)
            </option>
          ) : null}
          {NICHE_ORDER.map((id) => (
            <option key={id} value={id}>
              {NICHES[id].label}
              {isPublicNiche(id) ? "" : " · archive"}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <Label htmlFor="sf-book">Booking link</Label>
        <div className="mt-2 flex gap-2">
          <Input id="sf-book" readOnly value={bookPath} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(bookPath).then(() => setCopied(true));
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <div
        ref={stageRef}
        className="storefront-stage mt-6"
        data-wash={hud.wash}
        data-rim={hud.rim ? "on" : "off"}
        data-scan={hud.scan ? "on" : "off"}
        style={hudVars(hud, shop.neonAccent || shop.ringColor)}
      >
        <HeroSpatial rootRef={stageRef} />
        <div className="relative min-h-[28rem] overflow-hidden">
          <div className="hero-blend absolute inset-0">
            {painted.imageUrl ? (
              <img src={painted.imageUrl} alt="" className="hero-plate absolute -inset-[8%] h-[116%] w-[116%]" />
            ) : painted.videoUrl ? (
              <HeroLoopVideo
                className="hero-plate pointer-events-none absolute -inset-[8%] h-[116%] w-[116%]"
                src={painted.videoUrl}
                muted
                playsInline
                loop
                autoPlay
                aria-hidden
              />
            ) : null}
            <div className="hero-subject absolute inset-0">
              {painted.imageUrl ? <img src={painted.imageUrl} alt="" className="hero-frame absolute inset-0 h-full w-full" /> : null}
              {painted.videoUrl ? (
                <HeroLoopVideo className="hero-frame absolute inset-0 z-[1] h-full w-full object-cover" src={painted.videoUrl} autoPlay loop muted playsInline />
              ) : null}
            </div>
            <div className="hero-scan pointer-events-none absolute inset-0" />
          </div>
          <HeroTextCanvas
            layers={hud.layers}
            fallbacks={{
              headline: shop.name,
              subheadline: hud.headline || shop.tagline,
              cta_button: "Book a time",
            }}
            editable={!readonly}
            activeLayer={activeLayer}
            onActiveLayer={setActiveLayer}
            onLayerChange={(id, layer, persist) => {
              setHud((current) => {
                const next = setHeroLayer(current, id, layer);
                if (persist) persistHud(next);
                return next;
              });
            }}
          />
        </div>
      </div>
      <PreviewStudio
        variant="admin"
        hud={hud}
        onChange={setHud}
        onCommit={(next) => persistHud(next)}
        heroChoices={[
          { id: "film", label: nicheMedia.loopLabel },
          ...(nicheMedia.heroImageUrl ? [{ id: "still" as const, label: "Niche still" }] : []),
          { id: "url", label: "Custom URL" },
        ]}
        activeLayer={activeLayer}
        onActiveLayer={setActiveLayer}
      />
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
      <Button type="submit" className="mt-5" disabled={readonly || busy}>
        {busy ? "Saving" : "Save storefront"}
      </Button>
      {platformDesk ? (
        <div className="mt-8 border-t border-cyan-500/20 pt-6">
          <DispatchControlPanel />
          <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted">Outreach</p>
          <p className="mt-1 font-display text-2xl">Campaign parameters</p>
          <p className="mt-2 text-sm text-muted">
            Live queue is Emergency Plumbing (20,330 records) with the axiom plumber hero. Automate / Dispatch
            preload sequences onto the trickle clock. Simulation never hits Twilio or Resend.
          </p>
          {outreach ? (
            <p className="mt-3 text-sm">
              Mode {outreach.mode}. Chunk {outreach.chunkSize}. Slots{" "}
              {(outreach.slotLabels ?? ["9:00 AM", "1:00 PM", "4:00 PM"]).join(" · ")}. Caps{" "}
              {outreach.smsDailyCap ?? 40} SMS / {outreach.emailDailyCap ?? 80} email.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">{outreachError ?? "Reading outreach settings…"}</p>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              className="h-12 min-w-[12rem] text-base font-semibold"
              disabled={automateBusy || readonly}
              onClick={() => {
                setAutomateBusy(true);
                setAutomateNote(null);
                void automateOutreachDesk()
                  .then((result) => {
                    const slots = (result.slots ?? ["9:00 AM", "1:00 PM", "4:00 PM"]).join(" · ");
                    setAutomateNote(
                      result.simulation
                        ? `Queued ${result.queued} leads · ${result.sequences} sequences. Simulation trickle at ${slots}.`
                        : `Queued ${result.queued} leads · ${result.sequences} sequences. Live trickle at ${slots}.`,
                    );
                    return readOutreachDesk().then(setOutreach);
                  })
                  .catch((err: unknown) => {
                    setAutomateNote(err instanceof Error ? err.message : "Automate could not start");
                  })
                  .finally(() => setAutomateBusy(false));
              }}
            >
              {automateBusy ? "Automating…" : "Automate"}
            </Button>
            <p className="text-xs text-muted">Starts the trickle worker under daily caps.</p>
          </div>
          {automateNote ? <p className="mt-3 text-sm text-muted">{automateNote}</p> : null}
          <ul className="mt-4 grid gap-3">
            {OUTREACH_STRATEGIES.map((item) => (
              <li key={item.id} className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3 text-sm">
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-muted">{item.line}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-faint">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

function TeamPanel({
  shop,
  employees,
  readonly,
  onReload,
}: {
  shop: Shop;
  employees: Employee[];
  readonly: boolean;
  onReload: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      {shop.worksAlone ? (
        <p className="text-sm text-muted lg:col-span-2">
          You started alone. The customer books you. Add a second name here when the book needs one.
        </p>
      ) : null}
      <ul className="grid gap-3">
        {employees.map((e) => (
          <StaffRow key={e.id} shopSlug={shop.slug} employee={e} readonly={readonly} onReload={onReload} />
        ))}
      </ul>
      <form
        className={`${HUD_CARD} p-4`}
        onSubmit={(ev) => {
          ev.preventDefault();
          if (readonly) return;
          setBusy(true);
          void inviteEmployee({
            data: { slug: shop.slug, displayName, phone },
          })
            .then((r) => {
              setInvitePath(r.invitePath);
              setDisplayName("");
              setPhone("");
              onReload();
            })
            .finally(() => setBusy(false));
        }}
      >
        <p className="font-display text-2xl">Invite staff</p>
        <p className="mt-1 text-sm text-muted">
          Enter a name and phone. They sign in and claim the link — no shared PIN.
        </p>
        <div className="mt-4">
          <Label htmlFor="en">Name</Label>
          <Input id="en" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="mt-3">
          <Label htmlFor="ep">Phone</Label>
          <Input id="ep" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1…" />
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={readonly || busy}>
          Create invite
        </Button>
        {invitePath ? (
          <p className="mt-3 break-all text-xs text-muted">
            Invite link: {invitePath}. The chair is already live on your booking page.
          </p>
        ) : null}
        {shop.onboarding.hero && shop.onboarding.service && (shop.onboarding.employee || invitePath) ? (
          <Link
            to="/$shopSlug"
            params={{ shopSlug: shop.slug }}
            search={{ loop: true }}
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg"
          >
            Book a test appointment
          </Link>
        ) : null}
      </form>
    </div>
  );
}

function StaffRow({
  shopSlug,
  employee,
  readonly,
  onReload,
}: {
  shopSlug: string;
  employee: Employee;
  readonly: boolean;
  onReload: () => void;
}) {
  const [name, setName] = useState(employee.displayName);
  const [title, setTitle] = useState(employee.title);
  const [bio, setBio] = useState(employee.bio);
  const [phone, setPhone] = useState(employee.phone);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(employee.displayName);
    setTitle(employee.title);
    setBio(employee.bio);
    setPhone(employee.phone);
  }, [employee.bio, employee.displayName, employee.phone, employee.title]);

  return (
    <li className={`${HUD_CARD} p-4`}>
      <NeonBadge tone={employee.inviteStatus === "claimed" ? "emerald" : "amber"}>
        {employee.inviteStatus === "claimed" ? "On station" : "Invite pending"}
      </NeonBadge>
      <div className="mt-3 grid gap-3">
        <div>
          <Label htmlFor={`staff-name-${employee.id}`}>Name</Label>
          <Input id={`staff-name-${employee.id}`} value={name} disabled={readonly} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`staff-title-${employee.id}`}>Title</Label>
          <Input id={`staff-title-${employee.id}`} value={title} disabled={readonly} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`staff-bio-${employee.id}`}>Bio</Label>
          <Input id={`staff-bio-${employee.id}`} value={bio} disabled={readonly} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`staff-phone-${employee.id}`}>Phone</Label>
          <Input id={`staff-phone-${employee.id}`} value={phone} disabled={readonly} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      {note ? <p className="mt-2 text-sm text-danger">{note}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          disabled={readonly || busy}
          onClick={() => {
            setBusy(true);
            setNote(null);
            void updateEmployee({
              data: { slug: shopSlug, employeeId: employee.id, displayName: name, title, bio, phone },
            })
              .then(() => onReload())
              .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not save"))
              .finally(() => setBusy(false));
          }}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={readonly || busy}
          onClick={() => {
            setBusy(true);
            setNote(null);
            void removeEmployee({ data: { slug: shopSlug, employeeId: employee.id } })
              .then(() => onReload())
              .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not remove"))
              .finally(() => setBusy(false));
          }}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

async function fileToDataUrl(file: File, maxEdge: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}
