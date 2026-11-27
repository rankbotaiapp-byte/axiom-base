import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import {
  TERMS_AUTOPILOT_LIABILITY_CLAUSE,
  TERMS_PLATFORM_FEE_CLAUSE,
  TERMS_RENEWAL_CLAUSE,
  TERMS_SMS_PROGRAM_CLAUSE,
} from "@/lib/axiom/legal-notices";

export const metadata: Metadata = {
  title: "Terms of Service · Gear Guardian LLC",
  description:
    "Trial renewal, Stripe Connect fees, SMS STOP/HELP, and Autopilot terms for Gear Guardian LLC (New Era Apps / Axiom).",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service">
      <LegalSection title="Automatic Renewal & Trial Terms" body={TERMS_RENEWAL_CLAUSE} />
      <LegalSection title="Platform Fees & Stripe Connect" body={TERMS_PLATFORM_FEE_CLAUSE} />
      <LegalSection title="SMS program (STOP / HELP)" body={TERMS_SMS_PROGRAM_CLAUSE} />
      <LegalSection title="Limitation of Liability for Autopilot" body={TERMS_AUTOPILOT_LIABILITY_CLAUSE} />
    </LegalDocument>
  );
}
