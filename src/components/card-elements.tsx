import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

export function CardElements({
  publishableKey,
  clientSecret,
  onPaid,
  onCancel,
}: {
  publishableKey: string;
  clientSecret: string;
  onPaid: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
      <CardFields onPaid={onPaid} onCancel={onCancel} />
    </Elements>
  );
}

function CardFields({
  onPaid,
  onCancel,
}: {
  onPaid: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        setError(null);
        void stripe
          .confirmPayment({ elements, redirect: "if_required" })
          .then((result) => {
            if (result.error) {
              setError(result.error.message ?? "Payment did not complete");
              setBusy(false);
              return;
            }
            const id = result.paymentIntent?.id ?? "";
            if (!id) {
              setError("Payment did not complete");
              setBusy(false);
              return;
            }
            onPaid(id);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Payment did not complete");
            setBusy(false);
          });
      }}
    >
      <PaymentElement />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" disabled={!stripe || busy}>
        {busy ? "Paying" : "Pay now"}
      </Button>
      <button type="button" className="text-sm text-muted hover:text-fg" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
