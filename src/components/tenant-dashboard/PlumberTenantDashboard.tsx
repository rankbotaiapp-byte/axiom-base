"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CreditCard,
  ExternalLink,
  MapPin,
  MessageSquareText,
  Phone,
  Radio,
  Store,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ensureFunnelSession } from "@/lib/axiom/master";
import { openTenantBilling } from "@/lib/axiom/tenant-billing.functions";
import {
  TENANT_FILM_OPTIONS,
  capturedCopy,
  overlayFilmSrc,
  type TenantOverlay,
} from "@/lib/axiom/tenant-overlay";
import { DispatchPhoneLock } from "./dispatch-phone-lock";
import { TestLiveDispatchButton } from "./test-live-dispatch-button";
import { useTenantOverlay } from "./use-tenant-overlay";

function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`tenant-glass ${className}`.trim()}>{children}</section>;
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`tenant-switch ${checked ? "is-on" : ""}`}
    >
      <span className="tenant-switch-knob" />
      <span className="tenant-switch-copy">{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function LiveHeader({ overlay }: { overlay: TenantOverlay }) {
  return (
    <div className="tenant-live-header">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Live page header</p>
        <p className="mt-1 truncate font-display text-xl font-semibold text-fg">{overlay.company}</p>
        <p className="mt-1 truncate text-sm text-mist">
          {overlay.county}
          {overlay.city ? ` · ${overlay.city}` : ""}
        </p>
      </div>
      <a className="tenant-live-phone" href={`tel:${overlay.phone.replace(/[^\d+]/g, "")}`}>
        <Phone size={16} aria-hidden />
        {overlay.phone}
      </a>
      {overlay.smsDispatch ? (
        <p className="tenant-counter sm:col-span-2">{capturedCopy(overlay.capturedThisMonth)}</p>
      ) : (
        <p className="tenant-counter is-paused sm:col-span-2">After-hours dispatch is paused. Missed calls will sit in voicemail.</p>
      )}
    </div>
  );
}

export function PlumberTenantDashboard({ slug, stripeReturn = false }: { slug: string; stripeReturn?: boolean }) {
  const { overlay, patch } = useTenantOverlay(slug);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const filmSrc = overlayFilmSrc(overlay);

  useEffect(() => {
    if (!stripeReturn) return;
    if (!overlay.dispatchPhoneLocked) patch({ paidAwaitingDispatch: true });
  }, [overlay.dispatchPhoneLocked, patch, stripeReturn]);
  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({ niche: "plumbing" });
    if (overlay.greetEnabled) params.set("greet", "1");
    return `/t/${encodeURIComponent(slug)}?${params.toString()}`;
  }, [overlay.greetEnabled, slug]);

  async function openBilling(intent: "upgrade" | "manage") {
    setBillingBusy(true);
    setBillingError(null);
    try {
      await ensureFunnelSession();
      const started = await openTenantBilling({ data: { slug, intent } });
      if (!started.url?.startsWith("https://")) throw new Error("Stripe did not return a checkout session");
      window.location.assign(started.url);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Stripe could not open.");
      setBillingBusy(false);
    }
  }

  const trial = overlay.plan === "trial";

  return (
    <div className="tenant-dash">
      <DispatchPhoneLock
        slug={slug}
        overlay={overlay}
        paid={stripeReturn || overlay.paidAwaitingDispatch}
        onLocked={(phone) => patch({ dispatchPhone: phone, dispatchPhoneLocked: true, paidAwaitingDispatch: false })}
      />
      <header className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Your shop desk</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Change the name, phone, and county on your live page.
          </h1>
          <p className="mt-2 max-w-xl text-mist">
            Public page, owner desk, crew board. Lock your cell, then tap Test Live SMS Dispatch — your phone should buzz in seconds.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <a
            href={`/t/${encodeURIComponent(slug)}?niche=plumbing${overlay.greetEnabled ? "&greet=1" : ""}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 text-sm text-fg backdrop-blur-xl"
          >
            Open live page <ExternalLink size={15} aria-hidden />
          </a>
          <TestLiveDispatchButton slug={slug} compact />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="grid gap-5">
          <Glass>
            <h2 className="font-display text-lg font-semibold text-fg">
              <Store size={18} className="mr-2 inline text-copper" aria-hidden />
              Business identity
            </h2>
            <p className="mt-1 text-sm text-mist">These three fields paint the header and the missed-call counter.</p>
            <div className="mt-5 grid gap-4">
              <div>
                <Label htmlFor="tenant-name">Business name</Label>
                <Input
                  id="tenant-name"
                  value={overlay.company}
                  onChange={(e) => patch({ company: e.target.value })}
                  autoComplete="organization"
                />
              </div>
              <div>
                <Label htmlFor="tenant-phone">Local phone number</Label>
                <Input
                  id="tenant-phone"
                  value={overlay.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  inputMode="tel"
                  placeholder="(541) 555-0100"
                />
              </div>
              <div>
                <Label htmlFor="tenant-county">Service area / county</Label>
                <Input
                  id="tenant-county"
                  value={overlay.county}
                  onChange={(e) => patch({ county: e.target.value })}
                  placeholder="Jackson & Josephine Counties"
                />
              </div>
            </div>
            <LiveHeader overlay={overlay} />
          </Glass>

          <Glass>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-fg">
                  <Radio size={18} className="mr-2 inline text-copper" aria-hidden />
                  Missed-call recovery & after-hours job alerts
                </h2>
                <p className="mt-1 text-sm text-mist">
                  When this is on, missed calls text back and you get instant phone alerts when an after-hours job drops.
                </p>
              </div>
              <Switch
                checked={overlay.smsDispatch}
                onChange={(smsDispatch) => patch({ smsDispatch })}
                label="Missed-call recovery and after-hours job alerts"
              />
            </div>
            <p className="tenant-counter mt-5">{capturedCopy(overlay.capturedThisMonth)}</p>
            {overlay.dispatchPhoneLocked ? (
              <p className="mt-3 text-sm text-mist">Job alerts go to your locked cell, not the public shop line.</p>
            ) : (
              <p className="mt-3 text-sm text-mist">After checkout, lock your direct cell so Test Live SMS Dispatch can prove the line.</p>
            )}
            <div className="mt-4">
              <TestLiveDispatchButton slug={slug} />
            </div>
          </Glass>

          <Glass>
            <h2 className="font-display text-lg font-semibold text-fg">
              <Video size={18} className="mr-2 inline text-copper" aria-hidden />
              Branding & video
            </h2>
            <p className="mt-1 text-sm text-mist">Pick the film that loops at the top of your page.</p>
            <div className="mt-5 grid gap-3">
              {TENANT_FILM_OPTIONS.map((film) => {
                const active = overlay.filmTier === film.id;
                return (
                  <button
                    key={film.id}
                    type="button"
                    onClick={() => patch({ filmTier: film.id })}
                    className={`tenant-film ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                  >
                    <span className="tenant-film-still">
                      <video src={film.src} muted loop playsInline autoPlay preload="metadata" aria-hidden />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block font-display text-base font-semibold text-fg">{film.title}</span>
                      <span className="mt-1 block text-sm text-mist">{film.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-fg">Eric says hello first</p>
                <p className="text-sm text-mist">Turns on Eric’s short greeting before your page loads.</p>
              </div>
              <Switch
                checked={overlay.greetEnabled}
                onChange={(greetEnabled) => patch({ greetEnabled })}
                label="Eric says hello first"
              />
            </div>
          </Glass>

          <Glass>
            <h2 className="font-display text-lg font-semibold text-fg">
              <CreditCard size={18} className="mr-2 inline text-copper" aria-hidden />
              Subscription & license
            </h2>
            <div className="tenant-plan mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">
                {trial ? "$1 trial floor active" : "Founder's lifetime license"}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-fg">
                {trial ? "$1 this month · $150/mo recurring" : "$1,500 one-time · zero ongoing fees"}
              </p>
              <p className="mt-2 text-sm text-mist">
                {trial
                  ? "Try 24/7 emergency lead capture on your town this month. Day 31 it becomes $150 a month unless you buy the license."
                  : "Pay once. Keep the booking page, missed-call recovery, and job alerts. No monthly software rent."}
              </p>
            </div>
            {billingError ? <p className="mt-3 text-sm text-danger">{billingError}</p> : null}
            <Button
              variant="accent"
              className="mt-5 w-full min-h-11"
              disabled={billingBusy}
              onClick={() => void openBilling(trial ? "upgrade" : "manage")}
            >
              {billingBusy ? "Opening Stripe…" : trial ? "Upgrade / manage billing" : "Manage billing in Stripe"}
            </Button>
          </Glass>
        </div>

        <Glass className="xl:sticky xl:top-6 xl:self-start">
          <div className="tenant-preview-bar">
            <h2 className="font-display text-lg font-semibold text-fg">Live preview</h2>
            <span className="text-xs uppercase tracking-[0.16em] text-mist">
              {overlay.greetEnabled ? "Greeting armed" : "Greeting off"}
            </span>
            <TestLiveDispatchButton slug={slug} compact />
          </div>
          <LiveHeader overlay={overlay} />
          <div className="tenant-preview-film mt-4">
            <video key={filmSrc} src={filmSrc} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-mist">
            <MessageSquareText size={14} aria-hidden />
            {overlay.smsDispatch ? capturedCopy(overlay.capturedThisMonth) : "Dispatch paused"}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-mist">
            <MapPin size={14} aria-hidden />
            {overlay.phone} · {overlay.county}
          </p>
          <iframe
            title={`${overlay.company} live page`}
            src={previewSrc}
            className="tenant-preview-frame mt-4"
          />
        </Glass>
      </div>
    </div>
  );
}
