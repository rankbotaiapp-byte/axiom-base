import type { ReactNode } from "react";
import type { PlumbingStripeCheckout } from "@/lib/axiom/plumbing-checkout";

/** Shared land-grab conversion control — Stripe trial only, never the onboard href. */
export function LandGrabStripeCta({
  checkout,
  label,
  className,
  icon,
}: {
  checkout: PlumbingStripeCheckout;
  label: string;
  className: string;
  icon?: ReactNode;
}) {
  const pending = checkout.busy && checkout.plan === "trial";
  const copy = pending ? (checkout.redirecting ? "Taking you to checkout…" : "Opening checkout…") : label;
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => void checkout.onTrial()}
    >
      {copy}
      {icon && !pending ? icon : null}
    </button>
  );
}
