const STEPS = [
  {
    n: "01",
    title: "3-minute niche setup",
    body: "Pick the trade. Axiom loads preloaded regional leads and a cinematic 3D hero preview, so the storefront already looks like the shop instead of a blank template.",
  },
  {
    n: "02",
    title: "Make it yours from the truck",
    body: "Change the logo, services, prices, hours, and crew from the phone. The same desk takes online bookings and the cash or check you collect on site.",
  },
  {
    n: "03",
    title: "Let the back office run",
    body: "Customers book 24/7. Axiom routes the job, texts the tech, and keeps the field payment — card, tap, cash, or check — on the same ticket.",
  },
];

const AUTOMATED = ["Online booking", "Regional lead preload", "Cinematic 3D hero", "Field cash & checks", "Tap-to-pay", "SMS pay links", "Dispatch board", "One-click cancel"];

export default function HowItWorks() {
  return (
    <section id="how" className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 flex flex-wrap gap-2">
          {AUTOMATED.map((a) => (
            <span key={a} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-mist">
              {a}
            </span>
          ))}
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">How it works</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Play the demo. Put your name on it. Go back to the truck.
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-panel/60 p-7 transition-colors hover:border-copper/50">
              <span className="font-display text-sm font-semibold text-volt">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-mist">{s.body}</p>
            </div>
          ))}
        </div>

        <aside className="mt-8 rounded-2xl border border-copper/40 bg-copper/10 p-7 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-copper">On the job site</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">Mobile Field Payment Logger</h3>
          <p className="mt-3 max-w-3xl leading-relaxed text-mist">
            From the truck, log cash, a check, mobile tap-to-pay, or fire an SMS pay link before you pull out of the driveway.
            Cash and checks carry 0% platform fees. Card and pay-link bookings stay on Stripe Connect at 1.5%.
          </p>
        </aside>
      </div>
    </section>
  );
}
