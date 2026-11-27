import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL_ENTITY_LINE } from "@/lib/axiom/legal-notices";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-fg">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-hud">Gear Guardian LLC</p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">{LEGAL_ENTITY_LINE}</p>
      <div className="mt-8 grid gap-4">{children}</div>
      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
        <Link href="/privacy" className="inline-flex min-h-11 items-center text-sm text-hud">
          Privacy
        </Link>
        <Link href="/terms" className="inline-flex min-h-11 items-center text-sm text-hud">
          Terms
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted">
          Back to Axiom
        </Link>
      </nav>
    </main>
  );
}

export function LegalSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-line bg-field px-5 py-5">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}
