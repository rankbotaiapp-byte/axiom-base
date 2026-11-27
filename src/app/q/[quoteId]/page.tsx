import { notFound } from "next/navigation";
import { loadShopQuote } from "@/lib/axiom/closed-job.server";
import { gearGuardianFeeCents } from "@/lib/axiom/merchant-pricing";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ quoteId: string }> };

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function QuoteDepositPage({ params }: PageProps) {
  const { quoteId } = await params;
  const quote = await loadShopQuote(quoteId);
  if (!quote) notFound();
  const fee = gearGuardianFeeCents(quote.deposit_cents);
  const paid = quote.status === "paid" || quote.status === "deposit_paid";

  return (
    <main className="min-h-dvh bg-[#050507] text-[#f4f7fb]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ffcc]">1-tap quote</p>
        <h1 className="text-2xl font-semibold">{quote.shop_name}</h1>
        <p className="text-sm text-white/60">Approve the scope and lock the crew with a deposit.</p>
        <section className="rounded-2xl border border-[#00ffcc]/25 bg-white/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Scope</p>
          <p className="mt-2 text-base">{quote.description || "Service visit"}</p>
          <dl className="mt-5 space-y-2 font-mono text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-white/50">Total</dt>
              <dd>{dollars(quote.total_cents)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[#00ffcc]">
              <dt>Due now (deposit)</dt>
              <dd>{dollars(quote.deposit_cents)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-white/40">
              <dt>Platform fee 1.5%</dt>
              <dd>{dollars(fee)}</dd>
            </div>
          </dl>
        </section>
        {paid ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Payment received. Your spot is locked.
          </p>
        ) : quote.stripe_checkout_url ? (
          <a
            href={quote.stripe_checkout_url}
            className="inline-flex items-center justify-center rounded-xl bg-[#00ffcc] px-4 py-3 text-center text-sm font-semibold text-[#050507]"
          >
            Approve &amp; pay {dollars(quote.deposit_cents)}
          </a>
        ) : (
          <p className="text-sm text-white/50">Checkout is not ready. Ask the shop to resend the quote.</p>
        )}
        <p className="font-mono text-[10px] text-white/35">Gear Guardian · Stripe Connect · HUD lock</p>
      </div>
    </main>
  );
}
