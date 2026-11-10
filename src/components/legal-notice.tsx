import type { ReactNode } from "react";
import {
  MESSAGING_UI_NOTICE,
  STRIPE_CONNECT_NOTICE,
  SUBSCRIPTION_NOTICE,
} from "@/lib/axiom/legal-notices";

export function LegalNotice({ children }: { children: ReactNode }) {
  return <p className="legal-notice">{children}</p>;
}

export function SubscriptionDisclaimer() {
  return <LegalNotice>{SUBSCRIPTION_NOTICE}</LegalNotice>;
}

export function StripeConnectNotice() {
  return <LegalNotice>{STRIPE_CONNECT_NOTICE}</LegalNotice>;
}

export function MessagingDisclaimer() {
  return <LegalNotice>{MESSAGING_UI_NOTICE}</LegalNotice>;
}
