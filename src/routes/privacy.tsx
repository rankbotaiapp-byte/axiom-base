import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Gear Guardian LLC</p>
      <h1 className="mt-2 font-display text-4xl">Privacy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Gear Guardian LLC (New Era Apps / Axiom) collects booking names, phones, and emails so the shop can confirm the
        job. Reply STOP to opt out of texts. Reply HELP for help. We do not sell mobile numbers and do not share them
        with unaffiliated third parties for their own marketing.
      </p>
      <Link to="/" className="mt-8 inline-flex h-11 items-center text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
