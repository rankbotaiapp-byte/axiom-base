import { createFileRoute, Link } from "@tanstack/react-router";
import { SUBSCRIPTION_NOTICE } from "@/lib/axiom/legal-notices";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Axiom</p>
      <h1 className="mt-2 font-display text-4xl">Terms</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{SUBSCRIPTION_NOTICE}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Reply STOP to opt out of texts. Axiom supplies software and booking tools only. It is not a party to shop work.
      </p>
      <Link to="/" className="mt-8 inline-flex h-11 items-center text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
