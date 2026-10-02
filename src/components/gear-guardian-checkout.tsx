import { useState } from "react";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";

export function GearGuardianCheckout({
  amountCents,
  shopName,
  onPaid,
  onCancel,
}: {
  amountCents: number;
  shopName: string;
  onPaid: (paymentRef: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gear-guardian/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents, shopName }),
      });
      const json = (await res.json()) as { status?: string; paymentId?: string; error?: string };
      if (!res.ok || json.status !== "success" || !json.paymentId) {
        throw new Error(json.error || "Payment failed");
      }
      await onPaid(json.paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-accent">
          <ShieldCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-medium">Gear Guardian</p>
          <p className="text-xs text-muted">Mock processor · 2 second settle</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div>
          <Label htmlFor="gg-name">Name on card</Label>
          <Input id="gg-name" autoComplete="cc-name" placeholder="Sal Moretti" />
        </div>
        <div>
          <Label htmlFor="gg-num">Card number</Label>
          <Input
            id="gg-num"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            defaultValue="4242 4242 4242 4242"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="gg-exp">Expiry</Label>
            <Input id="gg-exp" placeholder="12 / 28" defaultValue="12 / 28" autoComplete="cc-exp" />
          </div>
          <div>
            <Label htmlFor="gg-cvc">CVC</Label>
            <Input id="gg-cvc" placeholder="123" defaultValue="123" autoComplete="cc-csc" />
          </div>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-5 flex flex-col gap-2">
        <Button type="button" size="lg" onClick={() => void pay()} disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Authorizing
            </>
          ) : (
            <>Pay {formatMoney(amountCents)}</>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
      <p className="mt-3 text-center text-[11px] text-faint">
        Card details stay in this browser. Nothing is stored or charged.
      </p>
    </div>
  );
}
