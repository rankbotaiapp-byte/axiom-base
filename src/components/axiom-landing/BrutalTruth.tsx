export default function BrutalTruth() {
  return (
    <section id="truth" className="w-full bg-void px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">The brutal truth</p>
        <h2 className="mt-3 max-w-4xl font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
          When your phone rings at 2:00 a.m., your competitor is sleeping. You shouldn't be losing that job.
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mist">
          Local plumbing, HVAC, and service contractors across Jackson and Josephine counties are losing 30% to 40% of
          emergency leads simply because nobody is sitting at a desk to pick up the phone.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-panel/50 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">The old way</p>
            <p className="mt-3 text-lg leading-relaxed text-mist">
              Missing calls while your crew is out in the field, playing phone tag for hours, and watching high-value
              emergency dispatch jobs go straight to voicemail.
            </p>
          </article>
          <article className="rounded-2xl border border-copper/40 bg-copper/10 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">The Axiom way</p>
            <p className="mt-3 text-lg leading-relaxed text-fg">
              24/7 automated emergency lead capture. Missed-call recovery for your crew. Instant phone alerts when an
              after-hours job drops — before the next shop even hears the ring.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
