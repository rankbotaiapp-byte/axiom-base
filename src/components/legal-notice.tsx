import type { ReactNode } from "react";
import {
  MESSAGING_UI_NOTICE,
  STRIPE_CONNECT_NOTICE,
  SUBSCRIPTION_NOTICE,
  TRIAL_CHECKOUT_DISCLOSURE,
} from "@/lib/axiom/legal-notices";

export function LegalNotice({ children }: { children: ReactNode }) {
  return <p className="legal-notice">{children}</p>;
}

export function SubscriptionDisclaimer() {
  return <LegalNotice>{SUBSCRIPTION_NOTICE}</LegalNotice>;
}

/** Mandatory trial authorization, placed directly above the payment button. */
export function TrialCheckoutDisclosure() {
  return (
    <p className="mb-3 rounded-md border border-line bg-obsidian/80 px-3 py-2 text-[11px] leading-relaxed text-muted">
      {TRIAL_CHECKOUT_DISCLOSURE}
    </p>
  );
}

export function StripeConnectNotice() {
  return <LegalNotice>{STRIPE_CONNECT_NOTICE}</LegalNotice>;
}

export function MessagingDisclaimer() {
  return <LegalNotice>{MESSAGING_UI_NOTICE}</LegalNotice>;
}
