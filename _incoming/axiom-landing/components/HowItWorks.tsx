const STEPS = [
  {
    n: "01",
    title: "Pick your trade",
    body: "Choose a pre-built template made for plumbers, electricians, HVAC, barbers, mobile techs and more. Services, pricing and job flow are already set up.",
  },
  {
    n: "02",
    title: "Make it yours in minutes",
    body: "Your admin dashboard lets you change your logo, colors, services, prices, hours and crew — from your phone. No developer, no waiting.",
  },
  {
    n: "03",
    title: "Let the back office run",
    body: "Customers book 24/7. Axiom routes jobs by area, texts your tech the details, sends reminders, and asks for the review when the job's done.",
  },
];

const AUTOMATED = ["Online booking", "AI receptionist", "Job routing", "Dispatch board", "Text reminders", "Review requests", "Customer records", "Installable phone app"];

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
          No two-week builds. You&apos;re live before your coffee&apos;s cold.
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
      </div>
    </section>
  );
}
