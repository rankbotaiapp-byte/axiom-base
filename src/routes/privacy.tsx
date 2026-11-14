import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Axiom</p>
      <h1 className="mt-2 font-display text-4xl">Privacy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Shop pages collect booking names, phones, and emails so the business can confirm the appointment. Axiom stores
        that data for the shop that owns the page. We do not sell it. Outreach messages are business-to-business notes
        about a prepared listing.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Reply STOP to opt out of texts. Write unsubscribe to halt email. Card data is handled by Stripe, not Axiom.
      </p>
      <Link to="/" className="mt-8 inline-flex h-11 items-center text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
