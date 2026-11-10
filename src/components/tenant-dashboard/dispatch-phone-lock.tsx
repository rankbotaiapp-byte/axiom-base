"use client";

import { useEffect, useState } from "react";
import { Check, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  collectedDispatchPhone,
  isPlaceholderDispatchPhone,
  needsDispatchPhoneLock,
} from "@/lib/axiom/dispatch-phone";
import type { TenantOverlay } from "@/lib/axiom/tenant-overlay";
import { TestLiveDispatchButton } from "./test-live-dispatch-button";

export function DispatchPhoneLock({
  slug,
  overlay,
  paid,
  onLocked,
}: {
  slug: string;
  overlay: TenantOverlay;
  paid: boolean;
  onLocked: (phone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(overlay.dispatchPhone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(overlay.dispatchPhoneLocked && Boolean(collectedDispatchPhone(overlay.dispatchPhone)));
  const [proved, setProved] = useState(false);

  useEffect(() => {
    setOpen(needsDispatchPhoneLock({ paid, dispatchPhone: overlay.dispatchPhone, dispatchPhoneLocked: overlay.dispatchPhoneLocked }));
    if (overlay.dispatchPhone) setPhone(overlay.dispatchPhone);
    setLocked(overlay.dispatchPhoneLocked && Boolean(collectedDispatchPhone(overlay.dispatchPhone)));
  }, [overlay.dispatchPhone, overlay.dispatchPhoneLocked, paid]);

  if (!paid && !locked) return null;
  if (!open) return null;

  const step = !locked ? 2 : proved ? 3 : 3;

  async function lock() {
    setBusy(true);
    setError(null);
    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length >= 10 && isPlaceholderDispatchPhone(phone)) {
        throw new Error("Skip sample numbers like 555. Use the phone in your pocket.");
      }
      const res = await fetch("/api/axiom/lock-dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, phone }),
      });
      const body = (await res.json().catch(() => ({}))) as { phone?: string; error?: string };
      if (!res.ok) throw new Error(body.error || "Could not lock that number");
      const saved = body.phone || collectedDispatchPhone(phone);
      setLocked(true);
      onLocked(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not lock that number");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tenant-lock-veil" role="dialog" aria-modal="true" aria-labelledby="tenant-lock-title">
      <div className="tenant-lock-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">You're in</p>
        <h2 id="tenant-lock-title" className="mt-2 font-display text-2xl font-semibold text-fg">
          <Smartphone size={20} className="mr-2 inline text-copper" aria-hidden />
          Three steps to prove after-hours jobs hit your phone
        </h2>
        <ol className="tenant-lock-steps" aria-label="Setup checklist">
          <li data-done="true">
            <span className="tenant-lock-check" aria-hidden>
              <Check size={14} />
            </span>
            Payment received
          </li>
          <li data-done={locked ? "true" : undefined} data-current={!locked ? "true" : undefined}>
            <span className="tenant-lock-check" aria-hidden>
              {locked ? <Check size={14} /> : "2"}
            </span>
            Lock your dispatch cell
          </li>
          <li data-done={proved ? "true" : undefined} data-current={locked && !proved ? "true" : undefined}>
            <span className="tenant-lock-check" aria-hidden>
              {proved ? <Check size={14} /> : "3"}
            </span>
            Test Live SMS Dispatch
          </li>
        </ol>

        {locked ? (
          <div className="mt-5 grid gap-3">
            <p className="text-sm text-mist">
              Step {step}: tap the button. A real text should land on your phone in a few seconds.
            </p>
            <TestLiveDispatchButton slug={slug} onSent={() => setProved(true)} />
            <a
              href={`/admin/tenant?slug=${encodeURIComponent(slug)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 text-sm text-fg"
            >
              Open your shop desk
            </a>
            <Button variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
              Stay on this page
            </Button>
          </div>
        ) : (
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void lock();
            }}
          >
            <div>
              <Label htmlFor="dispatch-mobile">Your direct cell — the one in your pocket</Label>
              <Input
                id="dispatch-mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(541) 761-0140"
                required
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button variant="accent" className="min-h-11 w-full" disabled={busy} type="submit">
              <Lock size={16} aria-hidden />
              {busy ? "Saving…" : "Lock this cell"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
