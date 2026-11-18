import type { Metadata } from "next";
import Link from "next/link";
import {
  TERMS_AUTOPILOT_LIABILITY_CLAUSE,
  TERMS_PLATFORM_FEE_CLAUSE,
  TERMS_RENEWAL_CLAUSE,
} from "@/lib/axiom/legal-notices";

export const metadata: Metadata = {
  title: "Terms of Service · Gear Guardian LLC",
  description: "Trial renewal, Stripe Connect platform fees, and Autopilot liability terms for Gear Guardian LLC.",
};

const CLAUSES = [
  { title: "Automatic Renewal & Trial Terms", body: TERMS_RENEWAL_CLAUSE },
  { title: "Platform Fees & Stripe Connect", body: TERMS_PLATFORM_FEE_CLAUSE },
  { title: "Limitation of Liability for Autopilot", body: TERMS_AUTOPILOT_LIABILITY_CLAUSE },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-fg">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-hud">Gear Guardian LLC</p>
      <h1 className="mt-3 font-display text-4xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted">useaxiom.io/terms</p>
      <div className="mt-8 grid gap-4">
        {CLAUSES.map((clause) => (
          <section key={clause.title} className="rounded-2xl border border-line bg-field px-5 py-5">
            <h2 className="font-display text-xl">{clause.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{clause.body}</p>
          </section>
        ))}
      </div>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-sm text-hud">
        Back to Axiom
      </Link>
    </main>
  );
}
