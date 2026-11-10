import type { Metadata } from "next";
import Link from "next/link";
import { StartForm } from "@/components/funnel/StartForm";
import { nicheIds, niches, plans, site, type PlanId } from "@/config/storefront";

export const metadata: Metadata = {
  title: "Launch your app",
  description: `Set up your ${site.name} booking app, dashboard and content engine in minutes.`,
  robots: { index: false, follow: true },
};

export default async function StartPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: raw } = await searchParams;
  const plan: PlanId = raw && raw in plans ? (raw as PlanId) : "starter";
  const p = plans[plan];
  return (
    <main className="ambient min-h-svh px-5 py-8">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="display text-xl">
          {site.name}
          <span className="text-[var(--color-ice)]">.</span>
        </Link>
        <p className="eyebrow mt-10">{p.label}</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">
          {plan === "custom" ? "Book your 2-week build." : "Let's launch your app."}
        </h1>
        <p className="mt-3 text-white/65">
          {plan === "custom"
            ? "Tell us about the business. We'll reply within one business day to schedule a kickoff call."
            : `${p.price} — ${p.fine}. Your booking app is live the moment you finish.`}
        </p>
        <StartForm plan={plan} niches={nicheIds.map((id) => ({ id, label: niches[id].label }))} />
      </div>
    </main>
  );
}
