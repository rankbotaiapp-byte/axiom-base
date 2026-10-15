import { Button } from "@/components/ui/button";

export function PaymentGate({
  pending,
  busy,
  error,
  onLink,
}: {
  pending: boolean;
  busy: boolean;
  error: string | null;
  onLink: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-bg/80 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-gate-title"
        className="w-full max-w-lg rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Payments</p>
        <h2 id="payment-gate-title" className="mt-2 font-display text-3xl leading-none">
          Link Your Payment Account to Go Live
        </h2>
        <p className="mt-3 text-sm text-muted">
          {pending
            ? "Stripe still lists this account as pending. Lead dispatch and booking stay locked until the account is verified."
            : "Lead dispatch and booking stay locked until a Stripe account is connected and verified."}
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button type="button" className="mt-5" disabled={busy} onClick={onLink}>
          {busy ? "Opening Stripe" : "Link Your Payment Account to Go Live"}
        </Button>
      </div>
    </div>
  );
}
