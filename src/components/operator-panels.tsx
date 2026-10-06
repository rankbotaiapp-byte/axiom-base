import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  beginStripeConnect,
  saveShopServices,
  updateNotifyChannels,
  updateShopProfile,
} from "@/lib/axiom/server";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { defaultPriceUnit, nicheCopy, PRICE_UNIT_LABEL, priceUnitsFor } from "@/lib/axiom/niches";
import { insertRow, moveRow, moveSection, nextSectionName, renameSection, sectionsOf } from "@/lib/axiom/menu";
import { formatMoney } from "@/lib/utils";
import type { Appointment, Billing, PaymentSetup, PriceUnit, Service, Shop, ShopNotice } from "@/lib/axiom/types";

export function SettingsPanel({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const [name, setName] = useState(shop.name);
  const [tagline, setTagline] = useState(shop.tagline);
  const [description, setDescription] = useState(shop.description);
  const [address, setAddress] = useState(shop.address);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(shop.name);
    setTagline(shop.tagline);
    setDescription(shop.description);
    setAddress(shop.address);
  }, [shop.address, shop.description, shop.name, shop.tagline]);

  return (
    <form
      className="max-w-xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (readonly) return;
        setBusy(true);
        setError(null);
        void updateShopProfile({
          data: { slug: shop.slug, name, tagline, description, address },
        })
          .then(() => onReload())
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Public page</p>
      <p className="mt-1 font-display text-3xl">Business</p>
      <Field label="Name" id="biz-name" value={name} onChange={setName} disabled={readonly} />
      <Field label="Tagline" id="biz-tag" value={tagline} onChange={setTagline} disabled={readonly} />
      <div className="mt-3">
        <Label htmlFor="biz-desc">Description</Label>
        <textarea
          id="biz-desc"
          value={description}
          disabled={readonly}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        />
      </div>
      <Field label="Address" id="biz-addr" value={address} onChange={setAddress} disabled={readonly} />
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="mt-5" disabled={readonly || busy}>
        {busy ? "Saving" : "Save business"}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-3">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

type DraftService = {
  key: string;
  id?: string;
  name: string;
  description: string;
  durationMin: string;
  price: string;
  group: string;
  priceUnit: PriceUnit;
};

function toDraft(service: Service, units: PriceUnit[]): DraftService {
  return {
    key: service.id,
    id: service.id,
    name: service.name,
    description: service.description,
    durationMin: String(service.durationMin),
    price: (service.priceCents / 100).toFixed(2),
    group: service.group,
    priceUnit: units.includes(service.priceUnit) ? service.priceUnit : "flat",
  };
}

function blankLine(group: string, priceUnit: PriceUnit): DraftService {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    description: "",
    durationMin: "45",
    price: "48.00",
    group,
    priceUnit,
  };
}

export function ServicesPanel({
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
  const [rows, setRows] = useState<DraftService[]>(() => {
    const allowed = priceUnitsFor(shop.niche);
    return services.map((service) => toDraft(service, allowed));
  });
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The admin desk refreshes on a timer. Ignore a new array that still holds the same menu,
  // or an in-progress edit is wiped before Save.
  const serverMenu = services
    .map((service) =>
      [service.id, service.name, service.description, service.durationMin, service.priceCents, service.group, service.priceUnit].join("\u001f"),
    )
    .join("\u001e");

  useEffect(() => {
    const allowed = priceUnitsFor(shop.niche);
    setRows(services.map((service) => toDraft(service, allowed)));
    setRemoved([]);
    // serverMenu is the identity of this menu. `services` is read from the render that changed it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMenu, shop.niche]);

  const copy = nicheCopy(shop.niche);
  const units = priceUnitsFor(shop.niche);
  const sections = sectionsOf(rows);
  const showUnits = units.length > 1;

  return (
    <form
      className="grid max-w-3xl gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (readonly) return;
        setBusy(true);
        setError(null);
        void saveShopServices({
          data: {
            slug: shop.slug,
            removeIds: removed,
            services: rows.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description,
              durationMin: Number(row.durationMin),
              priceCents: Math.round(Number(row.price) * 100),
              group: row.group,
              priceUnit: row.priceUnit,
            })),
          },
        })
          .then(() => onReload())
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.menuKicker}</p>
        <p className="mt-1 font-display text-3xl">{copy.menuHeading}</p>
        <p className="text-sm text-muted">
          Rename a section, reorder the lines, and set the price, the length, and how that price is charged.
          Lines that share a section name sit together on the customer page.
        </p>
      </div>
      {sections.map((section, sectionIndex) => (
        <section
          key={`section-${section.start}`}
          className="rounded-[24px] bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        >
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor={`section-${section.start}`}>Section</Label>
              <Input
                id={`section-${section.start}`}
                value={section.label}
                maxLength={40}
                placeholder="No heading"
                disabled={readonly}
                onChange={(event) =>
                  setRows((current) => renameSection(current, section.start, section.count, event.target.value))
                }
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-11 px-0"
              aria-label="Move section up"
              disabled={readonly || sectionIndex === 0}
              onClick={() => setRows((current) => moveSection(current, sectionIndex, -1))}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-11 px-0"
              aria-label="Move section down"
              disabled={readonly || sectionIndex === sections.length - 1}
              onClick={() => setRows((current) => moveSection(current, sectionIndex, 1))}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {rows.slice(section.start, section.start + section.count).map((row, offset) => {
              const index = section.start + offset;
              return (
                <div key={row.key} className="rounded-2xl bg-surface-2 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem]">
                    <div>
                      <Label htmlFor={`svc-name-${row.key}`}>Name</Label>
                      <Input
                        id={`svc-name-${row.key}`}
                        value={row.name}
                        disabled={readonly}
                        onChange={(e) => updateRow(setRows, index, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`svc-price-${row.key}`}>
                        {row.priceUnit === "person" ? "USD / person" : row.priceUnit === "boat" ? "USD / boat" : "Price USD"}
                      </Label>
                      <Input
                        id={`svc-price-${row.key}`}
                        inputMode="decimal"
                        value={row.price}
                        disabled={readonly}
                        onChange={(e) => updateRow(setRows, index, { price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`svc-min-${row.key}`}>Minutes</Label>
                      <Input
                        id={`svc-min-${row.key}`}
                        inputMode="numeric"
                        value={row.durationMin}
                        disabled={readonly}
                        onChange={(e) => updateRow(setRows, index, { durationMin: e.target.value })}
                      />
                    </div>
                  </div>
                  {showUnits ? (
                    <fieldset className="mt-3" disabled={readonly}>
                      <legend className="text-sm text-muted">Charge</legend>
                      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Charge">
                        {units.map((unit) => (
                          <Button
                            key={unit}
                            type="button"
                            size="md"
                            variant={row.priceUnit === unit ? "primary" : "secondary"}
                            aria-pressed={row.priceUnit === unit}
                            onClick={() => updateRow(setRows, index, { priceUnit: unit })}
                          >
                            {PRICE_UNIT_LABEL[unit]}
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  <div className="mt-3">
                    <Label htmlFor={`svc-desc-${row.key}`}>Description</Label>
                    <Input
                      id={`svc-desc-${row.key}`}
                      value={row.description}
                      disabled={readonly}
                      onChange={(e) => updateRow(setRows, index, { description: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Move line up"
                      disabled={readonly || index === 0}
                      onClick={() => setRows((current) => moveRow(current, index, -1))}
                    >
                      <ChevronUp className="size-4" />
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Move line down"
                      disabled={readonly || index === rows.length - 1}
                      onClick={() => setRows((current) => moveRow(current, index, 1))}
                    >
                      <ChevronDown className="size-4" />
                      Down
                    </Button>
                    <button
                      type="button"
                      className="ml-auto text-sm text-muted hover:text-fg"
                      disabled={readonly || rows.length < 2}
                      onClick={() => {
                        if (row.id) setRemoved((ids) => [...ids, row.id as string]);
                        setRows((current) => current.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            disabled={readonly}
            onClick={() =>
              setRows((current) => insertRow(current, section.start + section.count, blankLine(section.label, defaultPriceUnit(shop.niche))))
            }
          >
            Add line
          </Button>
        </section>
      ))}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={readonly || rows.length >= 24}
          onClick={() =>
            setRows((current) => {
              const name = nextSectionName(sectionsOf(current).map((section) => section.label));
              return [...current, blankLine(name, defaultPriceUnit(shop.niche))];
            })
          }
        >
          Add section
        </Button>
        <Button type="submit" disabled={readonly || busy}>
          {busy ? "Saving" : "Save menu"}
        </Button>
      </div>
    </form>
  );
}

function updateRow(setRows: (value: (current: DraftService[]) => DraftService[]) => void, index: number, patch: Partial<DraftService>) {
  setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
}

export function AlertsPanel({
  shop,
  notifyEmail,
  notifyPhone,
  notices,
  readonly,
  onReload,
}: {
  shop: Shop;
  notifyEmail: string;
  notifyPhone: string;
  notices: ShopNotice[];
  readonly: boolean;
  onReload: () => void;
}) {
  const [email, setEmail] = useState(notifyEmail);
  const [phone, setPhone] = useState(notifyPhone);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(notifyEmail);
    setPhone(notifyPhone);
  }, [notifyEmail, notifyPhone]);

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <form
        className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        onSubmit={(event) => {
          event.preventDefault();
          if (readonly) return;
          setBusy(true);
          setError(null);
          void updateNotifyChannels({ data: { slug: shop.slug, notifyEmail: email, notifyPhone: phone } })
            .then(() => onReload())
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
            .finally(() => setBusy(false));
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hooks</p>
        <p className="mt-1 font-display text-3xl">Alerts</p>
        <p className="mt-2 text-sm text-muted">
          Every booking and inquiry lands in this console. Email and SMS go out when this workspace has a provider connected.
        </p>
        <Field label="Email" id="alert-email" value={email} onChange={setEmail} disabled={readonly} />
        <Field label="Mobile" id="alert-phone" value={phone} onChange={setPhone} disabled={readonly} />
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="mt-5" disabled={readonly || busy}>
          {busy ? "Saving" : "Save alerts"}
        </Button>
      </form>
      <ul className="grid gap-2">
        {notices.length === 0 ? (
          <li className="text-sm text-faint">No alerts yet.</li>
        ) : (
          notices.map((notice) => (
            <li key={notice.id} className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
              <p className="text-xs uppercase tracking-wider text-faint">
                {notice.channel} · {notice.status}
              </p>
              <p className="mt-1 font-medium">{notice.subject}</p>
              <p className="mt-1 text-sm text-muted">{notice.body}</p>
              {notice.detail ? <p className="mt-1 text-xs text-danger">{notice.detail}</p> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function PaymentsPanel({
  shop,
  billing,
  payments,
  appointments,
  readonly,
  onReload,
}: {
  shop: Shop;
  billing: Billing | null;
  payments: PaymentSetup;
  appointments: Appointment[];
  readonly: boolean;
  onReload: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const volume = appointments.reduce((sum, appointment) => sum + appointment.paymentCents, 0);
  const fee = billing ? Math.round((volume * billing.gearGuardianBps) / 10000) : 0;

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">SaaS</p>
        <p className="mt-2 font-display text-3xl">Axiom Pro</p>
        <p className="mt-1 text-sm text-muted">
          {billing ? `${formatMoney(billing.priceCents)} / month · ${billing.status}` : "No plan"}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Platform fee</p>
            <p className="tabular">{billing ? `${(billing.gearGuardianBps / 100).toFixed(2)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-muted">Fees on paid bookings</p>
            <p className="tabular">{formatMoney(fee)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Stripe Connect</p>
        <p className="mt-2 font-display text-3xl">
          {payments.chargesEnabled ? "Cards are live" : payments.connected ? "Finish Stripe setup" : "Connect payouts"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {readonly
            ? "Demo shops keep the mock checkout so the tour can run. Your own shop connects a Stripe account and guests pay that account."
            : "Guests pay on Stripe Checkout. Funds settle to the connected account, with the platform fee taken on each charge."}
        </p>
        {!payments.processorReady && !readonly ? (
          <p className="mt-3 text-sm text-muted">Card payments are not configured for this workspace yet. Guests can still request a time.</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button
          type="button"
          className="mt-5"
          disabled={readonly || busy || !payments.processorReady}
          onClick={() => {
            setBusy(true);
            setError(null);
            void beginStripeConnect({ data: shop.slug })
              .then((result) => {
                window.location.href = result.url;
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Could not open Stripe");
                setBusy(false);
              });
          }}
        >
          {busy ? "Opening Stripe" : payments.connected ? "Update Stripe account" : "Connect Stripe"}
        </Button>
        <button type="button" className="mt-3 block text-sm text-muted hover:text-fg" onClick={onReload}>
          Refresh status
        </button>
      </div>
    </div>
  );
}
