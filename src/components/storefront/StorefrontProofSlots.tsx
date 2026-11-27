"use client";

import { useState } from "react";
import type { ProofBeforeAfter, ShopProofSlots } from "@/lib/axiom/shop-proof-slots";

export function StorefrontProofSlots({
  slots,
  bookHref,
}: {
  slots: ShopProofSlots;
  bookHref: string;
}) {
  const hasJobs = slots.recentJobs.length > 0;
  const hasPairs = slots.beforeAfter.length > 0;
  if (!hasJobs && !hasPairs) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-12">
      {hasJobs ? (
        <section aria-labelledby="recent-local-jobs">
          <h2 id="recent-local-jobs" className="text-2xl font-semibold tracking-tight text-[#f4f7fb]">
            Recent local jobs
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Owner-shot work in {slots.city || "your area"}. Book the same service without leaving this page.
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.recentJobs.map((job) => (
              <li key={job.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D12]">
                <img src={job.imageUrl} alt="" className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]" />
                <div className="space-y-3 p-4">
                  <p className="text-sm text-white/80">{job.caption}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#00ffcc]">{job.city}</p>
                  <a
                    href={bookHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#00ffcc] px-4 text-sm font-semibold text-[#050507]"
                  >
                    Book similar service
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {hasPairs ? (
        <section aria-labelledby="before-after-work">
          <h2 id="before-after-work" className="text-2xl font-semibold tracking-tight text-[#f4f7fb]">
            Before & after
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {slots.beforeAfter.map((pair) => (
              <LiveBeforeAfter key={pair.id} pair={pair} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function LiveBeforeAfter({ pair }: { pair: ProofBeforeAfter }) {
  const [split, setSplit] = useState(52);
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D12]">
      <div className="relative aspect-[4/5] sm:aspect-[5/4]">
        <img src={pair.beforeUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={pair.afterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        />
        <span className="absolute left-3 top-3 z-[1] rounded-full bg-[#050507]/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#00ffcc]">
          Before
        </span>
        <span className="absolute right-3 top-3 z-[1] rounded-full bg-[#050507]/80 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#FFE500]">
          After
        </span>
        <label className="absolute inset-x-3 bottom-3 z-[1]">
          <span className="sr-only">Compare before and after for {pair.title}</span>
          <input
            type="range"
            min={8}
            max={92}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            className="w-full accent-[#00ffcc]"
            aria-label={`Compare before and after for ${pair.title}`}
          />
        </label>
      </div>
      <figcaption className="p-4">
        <p className="font-semibold text-[#f4f7fb]">{pair.title}</p>
        {pair.summary ? <p className="mt-1 text-sm text-white/65">{pair.summary}</p> : null}
      </figcaption>
    </figure>
  );
}
