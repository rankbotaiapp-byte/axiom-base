import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  acceptBooking,
  getOperatorData,
  inviteEmployee,
  refreshStripeConnect,
  updateShopBrand,
  setShopIntro,
} from "@/lib/axiom/server";
import { NICHES, RING_PRESETS, nicheCopy } from "@/lib/axiom/niches";
import { resolveHeroMedia } from "@/lib/axiom/media";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import { getBearerToken } from "@/lib/auth/client";
import { INTRO_PRESETS, type IntroPreset } from "@/lib/axiom/intro";
import { LAYOUT_BLOCKS, NEON_PRESETS, type LayoutBlock } from "@/lib/axiom/storefront";
import { ShopDashboardPanel } from "@/components/dashboard-controls";
import { cityFromAddress } from "@/lib/axiom/avatar";
import { AskEricAvatar } from "@/components/AskEricAvatar";
import { AlertsPanel, PaymentsPanel, ServicesPanel, SettingsPanel } from "@/components/operator-panels";
import { useAxiomRing } from "@/components/axiom-ring";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";
import { formatMoney } from "@/lib/utils";
import type { AccessMode, Appointment, Billing, Employee, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";
import { CinematicHero } from "@/components/cinematic-hero";

export const Route = createFileRoute("/$shopSlug/admin")({
  validateSearch: (s: Record<string, unknown>): { stripe?: "return" | "refresh"; desk?: "master" } => {
    const stripe = s.stripe === "return" || s.stripe === "refresh" ? s.stripe : undefined;
    const desk = s.desk === "master" ? "master" : undefined;
    return { ...(stripe ? { stripe } : {}), ...(desk ? { desk } : {}) };
  },
  component: AdminPage,
});

type OpData = {
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

  if (isPending || (user && !data && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  if (error || !data) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-3xl">This console is locked.</p>
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

function AdminShell({
  data,
  readonly,
  onReload,
}: {
  data: OpData;
  readonly: boolean;
  onReload: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "settings" | "services" | "brand" | "team" | "alerts" | "billing">("overview");
  const copy = nicheCopy(data.shop.niche);
  const tabLabel: Record<typeof tab, string> = {
    overview: "Overview",
    settings: "Settings",
    services: copy.menuHeading,
    brand: "Look",
    team: copy.staffStep,
    alerts: "Alerts",
    billing: "Billing",
  };
  const setup = data.shop.onboarding;
  const needsSetup = !readonly && (!setup.hero || !setup.service || !setup.employee);

  return (
    <main className="min-h-dvh bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <div>
          <Wordmark />
          {data.platformDesk ? (
            <p className="mt-2 text-sm text-copper">Platform desk. Changes write onto this shop's book.</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            {data.shop.name}
            {readonly ? " · live demo preview" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {data.platformDesk ? (
            <Link
              to="/master-admin"
              className="inline-flex h-11 items-center rounded-xl px-3 text-sm text-copper hover:text-fg"
            >
              Master desk
            </Link>
          ) : null}
          <Link
            to="/$shopSlug"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg"
          >
            Customer site
          </Link>
          <Link
            to="/$shopSlug/employee"
            params={{ shopSlug: data.shop.slug }}
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg"
          >
            Station
          </Link>
        </div>
      </header>

      {needsSetup ? (
        <SetupStrip shop={data.shop} services={data.services} readonly={readonly} onDone={onReload} />
      ) : null}

      <nav className="flex gap-1 overflow-x-auto px-5 sm:px-8">
        {(["overview", "settings", "services", "brand", "team", "alerts", "billing"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="h-11 shrink-0 rounded-xl px-3 text-sm"
            style={
              tab === t
                ? { background: "var(--color-surface)", color: "var(--color-fg)" }
                : { color: "var(--color-muted)" }
            }
          >
            {tabLabel[t]}
          </button>
        ))}
      </nav>

      <div className="px-5 py-8 sm:px-8">
        {tab === "overview" ? (
          <Overview data={data} readonly={readonly} onReload={onReload} />
        ) : null}
        {tab === "settings" ? (
          <div className="grid gap-6">
            <SettingsPanel shop={data.shop} readonly={readonly} onReload={onReload} />
            <ShopDashboardPanel
              shop={data.shop}
              employees={data.employees}
              disabled={readonly && !data.shop.isShowcase}
              onReload={onReload}
            />
          </div>
        ) : null}
        {tab === "services" ? (
          <ServicesPanel shop={data.shop} services={data.services} readonly={readonly} onReload={onReload} />
        ) : null}
        {tab === "brand" ? (
          <BrandPanel
            shop={data.shop}
            services={data.services}
            readonly={readonly}
            onReload={onReload}
          />
        ) : null}
        {tab === "team" ? (
          <TeamPanel shop={data.shop} employees={data.employees} readonly={readonly} onReload={onReload} />
        ) : null}
        {tab === "alerts" ? (
          <AlertsPanel
            shop={data.shop}
            notifyEmail={data.notifyEmail}
            notifyPhone={data.notifyPhone}
            notices={data.notices}
            readonly={readonly}
            onReload={onReload}
          />
        ) : null}
        {tab === "billing" ? (
          <PaymentsPanel
            shop={data.shop}
            billing={data.billing}
            payments={data.payments}
            appointments={data.appointments}
            readonly={readonly}
            onReload={onReload}
          />
        ) : null}
      </div>
      <AskEricAvatar
        businessName={data.shop.name}
        trade={NICHES[data.shop.niche].label}
        city={cityFromAddress(data.shop.address)}
        welcome={data.mode === "owner" && !data.platformDesk ? data.shop.slug : undefined}
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
    <div className="mx-5 mb-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:mx-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Guided loop · admin setup</p>
      <p className="mt-1 font-display text-2xl">Three moves, then book yourself.</p>
      <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <li className={flags.hero ? "text-ok" : "text-muted"}>{flags.hero ? "Hero set" : "1 · Hero + blend"}</li>
        <li className={flags.service ? "text-ok" : "text-muted"}>
          {flags.service ? "Primary service" : "2 · Primary service"}
        </li>
        <li className={flags.employee ? "text-ok" : "text-muted"}>
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
}: {
  data: OpData;
  readonly: boolean;
  onReload: () => void;
}) {
  const ring = useAxiomRing();
  const pending = data.appointments.filter((a) => a.status === "pending");
  const paid = data.appointments.filter((a) => a.paymentStatus === "paid");
  const revenue = paid.reduce((s, a) => s + a.paymentCents, 0);
  const cancelled = data.appointments.filter((a) => a.status === "cancelled");
  const leaked = cancelled.reduce((sum, item) => sum + item.paymentCents, 0);
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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Captured" value={formatMoney(revenue)} />
        <Stat label="Bookings" value={String(data.appointments.length)} />
        <Stat label="Left on the table" value={formatMoney(leaked)} hint={`${cancelled.length} cancelled`} />
      </div>
        <div className="mt-4 h-48 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ring-color, #2ee6d6)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--ring-color, #2ee6d6)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#6d6d76" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#121216", border: "1px solid rgba(243,241,235,0.1)" }}
                formatter={(v: number) => formatMoney(v)}
              />
              <Area type="monotone" dataKey="cents" stroke="var(--ring-color, #2ee6d6)" fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <h3 className="mt-8 text-sm font-medium text-muted">Schedule</h3>
        <ul className="mt-3 divide-y divide-line">
          {data.appointments.slice(0, 12).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm">
                  {a.serviceName} · {a.employeeName}
                </p>
                <p className="text-xs text-muted">
                  {a.customerName} ·{" "}
                  {new Date(a.startsAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wider text-faint">{a.status}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted">Audit reports</h3>
        {data.notices.filter((notice) => notice.channel === "inbox" && notice.subject.startsWith("Audit")).length === 0 ? (
          <p className="mt-3 text-sm text-faint">No photo audits yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {data.notices
              .filter((notice) => notice.channel === "inbox" && notice.subject.startsWith("Audit"))
              .slice(0, 6)
              .map((notice) => (
                <li key={notice.id} className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                  <p className="font-medium">{notice.subject.replace(/^Audit · /, "")}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">{notice.body}</p>
                </li>
              ))}
          </ul>
        )}
        <h3 className="mt-8 text-sm font-medium text-muted">Incoming</h3>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-faint">Quiet board. New requests light the ring.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {pending.map((a) => (
              <li key={a.id} className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                <p className="font-medium">{a.customerName}</p>
                <p className="text-sm text-muted">
                  {a.serviceName} with {a.employeeName}
                </p>
                {!readonly || data.shop.isShowcase ? (
                  <Button
                    className="mt-3"
                    size="sm"
                    onClick={() => {
                      void (async () => {
                        const result = await acceptBooking({
                          data: { slug: data.shop.slug, appointmentId: a.id },
                        });
                        ring.announce(
                          {
                            id: `acc-${a.id}`,
                            type: "booking_confirmed",
                            appointmentId: a.id,
                            payload: result.detail,
                            createdAt: new Date().toISOString(),
                          },
                          true,
                        );
                        onReload();
                      })();
                    }}
                  >
                    Confirm
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="lift-card rounded-2xl bg-surface/80 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular">{value}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
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
  const [layout, setLayout] = useState<LayoutBlock[]>(shop.layout);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [replay, setReplay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [localVideo, setLocalVideo] = useState<string | null>(null);
  const canIntro = !readonly || shop.isShowcase;
  const hero = resolveHeroMedia(shop);
  const previewVideo = localVideo ?? hero.videoUrl;

  useEffect(() => {
    setLocalVideo((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [shop.heroVideoUrl]);

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
        await updateShopBrand({
          data: {
            slug: shop.slug,
            heroBlendPercent: blend,
            ringColor: color,
            introPreset: preset,
            introSpeed: speed,
            introIntensity: intensity,
            heroImageUrl: extra?.heroImageUrl,
            primaryServiceId: primary || undefined,
            markHero: true,
            markService: extra?.markService ?? Boolean(primary),
            neonAccent: neon,
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

  async function persistColor(next: string) {
    setColor(next);
    ring.setRingColor(next);
    await ring.persistRingColor(next);
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
      <div className="overflow-hidden rounded-[28px]" style={{ ["--neon" as string]: neon, ["--glow" as string]: glow ? "0.7" : "0" }}>
        <CinematicHero
          imageUrl={hero.imageUrl}
          videoUrl={previewVideo}
          blendPercent={blend}
          introPreset={preset}
          introSpeed={speed}
          introIntensity={intensity}
          tone={hero.tone}
          replayKey={replay}
          previewMode
          className="min-h-[420px]"
        >
          <div className="mt-auto p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Live preview</p>
            <p className="font-display text-4xl">{shop.name}</p>
          </div>
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
        <p className="mt-1 text-xs text-muted">{localVideo ? "Custom loop · unsaved preview" : hero.loopLabel}</p>

        <div className="mt-8 rounded-[24px] bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
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
              className="mt-2 block w-full text-sm text-muted"
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
          <div className="mt-4">
            <Label htmlFor="intro-preset">Preset</Label>
            <select
              id="intro-preset"
              value={preset}
              disabled={!canIntro}
              onChange={(e) => void persistIntro({ introPreset: e.target.value as IntroPreset })}
              className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
            >
              {INTRO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
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

        <div className="mt-6">
          <Label htmlFor="ring">Ring color · all dashboards</Label>
          <p className="mt-1 text-xs text-muted">
            Perimeter glow shared by customers, staff, and this console. Incoming books pulse it;
            confirmations lock it.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {RING_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-label={p.name}
                onClick={() => void persistColor(p.value)}
                className="size-10 rounded-full"
                style={{
                  background: p.value,
                  boxShadow:
                    color.toUpperCase() === p.value.toUpperCase()
                      ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${p.value}`
                      : "0 0 0 1px rgba(243,241,235,0.16)",
                }}
              />
            ))}
            <input
              id="ring"
              type="color"
              value={color}
              onChange={(e) => {
                const next = e.target.value;
                setColor(next);
                ring.setRingColor(next);
              }}
              onBlur={() => void persistColor(color)}
              className="h-11 w-16 cursor-pointer rounded-xl bg-surface-2"
            />
          </div>
        </div>
        <div className="mt-6">
          <Label htmlFor="neon-glow">Neon accent</Label>
          <p className="mt-1 text-xs text-muted">Glass edges on the public page. The ring stays the perimeter.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {NEON_PRESETS.map((presetColor) => (
              <button
                key={presetColor.value}
                type="button"
                aria-label={presetColor.name}
                disabled={readonly}
                onClick={() => {
                  setNeon(presetColor.value);
                  void updateShopBrand({
                    data: { slug: shop.slug, neonAccent: presetColor.value, glowEnabled: glow, layout },
                  }).then(() => onReload());
                }}
                className="size-10 rounded-full"
                style={{
                  background: presetColor.value,
                  boxShadow:
                    neon.toUpperCase() === presetColor.value
                      ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${presetColor.value}`
                      : "0 0 0 1px rgba(243,241,235,0.16)",
                }}
              />
            ))}
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
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2"
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
            className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
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
            className="mt-2 block w-full text-sm text-muted"
          />
        </div>
        <Button className="mt-6" disabled={saving || (!canIntro && readonly)} onClick={() => void save()}>
          Save brand
        </Button>
      </div>
    </div>
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
          <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            {e.avatarUrl ? (
              <img src={e.avatarUrl} alt="" className="size-14 rounded-xl object-cover" />
            ) : null}
            <div>
              <p className="font-medium">{e.displayName}</p>
              <p className="text-xs text-muted">
                {e.title} · {e.inviteStatus}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="rounded-2xl bg-surface p-4"
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
