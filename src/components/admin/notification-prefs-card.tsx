import { useEffect, useState } from "react";
import { updateNotifyChannels } from "@/lib/axiom/server";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PrefToggle({
  id,
  checked,
  disabled,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border transition",
        checked
          ? "border-cyan-400/70 bg-cyan-400/25 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
          : "border-white/15 bg-black/40",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full transition",
          checked ? "left-6 bg-cyan-300" : "left-0.5 bg-slate-400",
        )}
      />
    </button>
  );
}

export function NotificationPrefsCard({
  slug,
  notifySmsEnabled,
  notificationPhone,
  notifyEmailEnabled,
  notificationEmail,
  readonly,
  onReload,
}: {
  slug: string;
  notifySmsEnabled: boolean;
  notificationPhone: string;
  notifyEmailEnabled: boolean;
  notificationEmail: string;
  readonly: boolean;
  onReload: () => void;
}) {
  const [smsOn, setSmsOn] = useState(notifySmsEnabled);
  const [emailOn, setEmailOn] = useState(notifyEmailEnabled);
  const [phone, setPhone] = useState(notificationPhone);
  const [email, setEmail] = useState(notificationEmail);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setSmsOn(notifySmsEnabled);
    setEmailOn(notifyEmailEnabled);
    setPhone(notificationPhone);
    setEmail(notificationEmail);
  }, [notifySmsEnabled, notifyEmailEnabled, notificationPhone, notificationEmail]);

  return (
    <form
      className="rounded-2xl border border-cyan-500/25 bg-[#07080C] p-5 shadow-[0_0_28px_rgba(6,182,212,0.12)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (readonly) return;
        setBusy(true);
        setNote(null);
        void updateNotifyChannels({
          data: {
            slug,
            notifyEmail: email,
            notifyPhone: phone,
            notificationEmail: email,
            notificationPhone: phone,
            notifySmsEnabled: smsOn,
            notifyEmailEnabled: emailOn,
          },
        })
          .then(() => {
            setNote("Notification routing saved.");
            onReload();
          })
          .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-400/80">Dispatch</p>
      <h3 className="mt-1 font-display text-xl text-slate-100">Notification preferences</h3>
      <p className="mt-2 text-sm text-slate-400">
        Emergency leads and bookings route to the cell and inbox you set here. Turn a channel off to keep alerts in the
        console only.
      </p>

      <div className="mt-5 rounded-xl border border-amber-400/20 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-200">SMS alerts</p>
            <p className="mt-0.5 text-xs text-slate-500">Twilio texts your personal cell on inbound jobs.</p>
          </div>
          <PrefToggle id="notify-sms" label="SMS alerts" checked={smsOn} disabled={readonly} onChange={setSmsOn} />
        </div>
        <Label htmlFor="notification-phone" className="mt-4 text-slate-300">
          Personal cell
        </Label>
        <Input
          id="notification-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="541-555-0100"
          value={phone}
          disabled={readonly || !smsOn}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-2 border-cyan-500/20 bg-black/50 text-slate-100"
        />
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-cyan-200">Email notifications</p>
            <p className="mt-0.5 text-xs text-slate-500">Resend delivers the same lead packet to your inbox.</p>
          </div>
          <PrefToggle
            id="notify-email"
            label="Email notifications"
            checked={emailOn}
            disabled={readonly}
            onChange={setEmailOn}
          />
        </div>
        <Label htmlFor="notification-email" className="mt-4 text-slate-300">
          Owner email
        </Label>
        <Input
          id="notification-email"
          type="email"
          autoComplete="email"
          placeholder="you@shop.com"
          value={email}
          disabled={readonly || !emailOn}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 border-cyan-500/20 bg-black/50 text-slate-100"
        />
      </div>

      {note ? <p className="mt-3 text-sm text-cyan-200/90">{note}</p> : null}
      <Button type="submit" className="mt-5" disabled={readonly || busy}>
        {busy ? "Saving" : "Save notification routing"}
      </Button>
    </form>
  );
}
