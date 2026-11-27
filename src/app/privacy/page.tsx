import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import {
  PRIVACY_DATA_USE_CLAUSE,
  PRIVACY_MOBILE_NO_SALE_CLAUSE,
  PRIVACY_SMS_OPTOUT_CLAUSE,
  TRIAL_CHECKOUT_DISCLOSURE,
} from "@/lib/axiom/legal-notices";

export const metadata: Metadata = {
  title: "Privacy Policy · Gear Guardian LLC",
  description:
    "How Gear Guardian LLC (New Era Apps / Axiom) uses booking data, SMS STOP/HELP, and never sells or shares mobile numbers for third-party marketing.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <LegalSection title="Who we are" body="Gear Guardian LLC operates Axiom (also branded New Era Apps) at rankbotapp.com, including www.rankbotapp.com. This policy covers the public site, shop storefronts, and the SMS dispatch program." />
      <LegalSection title="$1 unlock, monthly plan, and platform fee" body={TRIAL_CHECKOUT_DISCLOSURE} />
      <LegalSection title="What we collect" body={PRIVACY_DATA_USE_CLAUSE} />
      <LegalSection title="SMS STOP and HELP" body={PRIVACY_SMS_OPTOUT_CLAUSE} />
      <LegalSection title="No sale or sharing of mobile numbers" body={PRIVACY_MOBILE_NO_SALE_CLAUSE} />
      <LegalSection
        title="Contact"
        body="Privacy questions: hello@axiom.shop. California and similar rights requests can use the same address. We honor STOP on the number that received the text without requiring a web form."
      />
    </LegalDocument>
  );
}
