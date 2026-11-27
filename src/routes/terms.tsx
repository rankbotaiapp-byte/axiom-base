import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TERMS_AUTOPILOT_LIABILITY_CLAUSE,
  TERMS_PLATFORM_FEE_CLAUSE,
  TERMS_RENEWAL_CLAUSE,
  TERMS_SMS_PROGRAM_CLAUSE,
} from "@/lib/axiom/legal-notices";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Gear Guardian LLC</p>
      <h1 className="mt-2 font-display text-4xl">Terms of Service</h1>
      <h2 className="mt-8 text-lg">Automatic Renewal & Trial Terms</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{TERMS_RENEWAL_CLAUSE}</p>
      <h2 className="mt-8 text-lg">Platform Fees & Stripe Connect</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{TERMS_PLATFORM_FEE_CLAUSE}</p>
      <h2 className="mt-8 text-lg">SMS program (STOP / HELP)</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{TERMS_SMS_PROGRAM_CLAUSE}</p>
      <h2 className="mt-8 text-lg">Limitation of Liability for Autopilot</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{TERMS_AUTOPILOT_LIABILITY_CLAUSE}</p>
      <Link to="/" className="mt-8 inline-flex h-11 items-center text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
