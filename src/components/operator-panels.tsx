import { useEffect, useState } from "react";
import {
  beginStripeConnect,
  saveShopServices,
  updateNotifyChannels,
  updateShopProfile,
} from "@/lib/axiom/server";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { Appointment, Billing, PaymentSetup, Service, Shop, ShopNotice } from "@/lib/axiom/types";

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
};

function toDraft(service: Service): DraftService {
  return {
    key: service.id,
    id: service.id,
    name: service.name,
    description: service.description,
    durationMin: String(service.durationMin),
    price: (service.priceCents / 100).toFixed(2),
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
  const [rows, setRows] = useState<DraftService[]>(() => services.map(toDraft));
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(services.map(toDraft));
    setRemoved([]);
  }, [services]);

  return (
    <form
      className="grid max-w-3xl gap-3"
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
            })),
          },
        })
          .then(() => onReload())
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Menu</p>
        <p className="mt-1 font-display text-3xl">Services and prices</p>
      </div>
      {rows.map((row, index) => (
        <div key={row.key} className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
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
              <Label htmlFor={`svc-price-${row.key}`}>Price USD</Label>
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
          <div className="mt-3">
            <Label htmlFor={`svc-desc-${row.key}`}>Description</Label>
            <Input
              id={`svc-desc-${row.key}`}
              value={row.description}
              disabled={readonly}
              onChange={(e) => updateRow(setRows, index, { description: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-muted hover:text-fg"
            disabled={readonly || rows.length < 2}
            onClick={() => {
              if (row.id) setRemoved((ids) => [...ids, row.id as string]);
              setRows((current) => current.filter((_, i) => i !== index));
            }}
          >
            Remove
          </button>
        </div>
      ))}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={readonly}
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                key: `new-${current.length}-${Date.now()}`,
                name: "",
                description: "",
                durationMin: "45",
                price: "48.00",
              },
            ])
          }
        >
          Add service
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
