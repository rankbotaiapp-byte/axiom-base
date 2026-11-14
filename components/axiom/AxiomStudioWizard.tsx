"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, CreditCard, MessageSquare, Sparkles, Store } from "lucide-react";
import { InViewVideo } from "./MediaSections";
import { haptic } from "./haptics";
import { landingConfig } from "./landing.config";

type Studio = typeof landingConfig.studio;
type NicheId = Studio["niches"][number]["id"];
type PlanId = Studio["plans"][number]["id"];

export type StudioSignup = {
  businessName: string;
  niche: NicheId;
  accent: string;
  plan: PlanId;
};

const STEPS = [
  { label: "Business", icon: Store },
  { label: "Preview", icon: Sparkles },
  { label: "Booking", icon: CalendarCheck },
  { label: "Checkout", icon: CreditCard },
] as const;

/** Next three calendar days, labelled for the booking test. */
function nextDays() {
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
  return [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return offset === 0 ? "Today" : fmt.format(d);
  });
}

/**
 * Four-step try-it-live wizard. Steps 1-3 run entirely in the browser and send
 * nothing. Step 4 hands the visitor's choices to `onCheckout`: connect that to
 * your real Stripe checkout + storefront provisioning. Without it, the button
 * says checkout is not connected instead of pretending to sign anyone up.
 */
export default function AxiomStudioWizard({
  studio = landingConfig.studio,
  onCheckout,
}: {
  studio?: Studio;
  onCheckout?: (signup: StudioSignup) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState<NicheId>(studio.niches[0].id);
  const [accent, setAccent] = useState<string>(studio.accents[0].value);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [job, setJob] = useState(0);
  const [booked, setBooked] = useState(false);
  const [plan, setPlan] = useState<PlanId>(studio.plans[0].id);
  const [status, setStatus] = useState<"idle" | "working" | "unconnected" | "error">("idle");

  const days = useMemo(nextDays, []);
  const nicheData = studio.niches.find((n) => n.id === niche) ?? studio.niches[0];
  const business = name.trim() || `Your ${nicheData.label} Business`;
  const canContinue = step === 0 ? name.trim().length > 1 : true;

  const posts = [
    `${business} is now booking online, 24/7. Tap to grab a time that suits you.`,
    `${nicheData.jobs[0]}? ${business} can be on the way today. Book in under a minute.`,
    `Thank you for supporting a local business. ${nicheData.tagline}.`,
  ];

  const go = (next: number) => {
    haptic(10);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

  const checkout = async () => {
    haptic([14, 40, 14]);
    if (!onCheckout) {
      setStatus("unconnected");
      return;
    }
    try {
      setStatus("working");
      await onCheckout({ businessName: business, niche, accent, plan });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="text-white" style={{ ["--accent" as string]: accent }}>
      {/* Step indicator */}
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => i <= step && go(i)}
                disabled={i > step}
                aria-current={active ? "step" : undefined}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-xs transition disabled:opacity-40 sm:flex-row sm:justify-center sm:gap-2 sm:text-sm"
                style={{
                  borderColor: active || done ? accent : "rgba(255,255,255,0.12)",
                  background: active ? `${accent}1a` : "transparent",
                  color: active || done ? accent : "rgba(255,255,255,0.7)",
                }}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                <span>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Fixed minimum height so stepping never shifts the page below */}
      <div className="mt-6 min-h-[430px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="grid gap-6">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Business name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rogue Valley Plumbing"
                    maxLength={48}
                    autoComplete="organization"
                    className="min-h-12 rounded-xl border border-white/15 bg-black/40 px-4 text-base outline-none transition placeholder:text-white/35 focus:border-[var(--accent)]"
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium">Your trade</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {studio.niches.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        aria-pressed={niche === n.id}
                        onClick={() => { haptic(8); setNiche(n.id); setJob(0); setBooked(false); }}
                        className="min-h-12 rounded-xl border px-3 text-sm font-medium transition"
                        style={{ borderColor: niche === n.id ? accent : "rgba(255,255,255,0.15)", background: niche === n.id ? `${accent}1a` : "transparent", color: niche === n.id ? accent : "white" }}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-medium">Accent color</legend>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {studio.accents.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        aria-label={a.label}
                        aria-pressed={accent === a.value}
                        onClick={() => { haptic(8); setAccent(a.value); }}
                        className="grid h-12 w-12 place-items-center rounded-full border-2 transition"
                        style={{ borderColor: accent === a.value ? "white" : "transparent" }}
                      >
                        <span className="h-8 w-8 rounded-full" style={{ background: a.value, boxShadow: `0 0 18px ${a.value}88` }} />
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/50">Sample storefront hero</p>
                  <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black" style={{ borderColor: `${accent}66`, boxShadow: `0 0 36px ${accent}33` }}>
                    <InViewVideo src={studio.previewVideo} poster={studio.previewPoster} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="truncate text-lg font-semibold sm:text-xl">{business}</p>
                      <p className="truncate text-sm" style={{ color: accent }}>{nicheData.tagline}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/50">Sample social posts</p>
                  <ul className="grid gap-2">
                    {posts.map((post, i) => (
                      <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white/85">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
                        <span>{post}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5">
                <p className="text-sm text-white/65">This is what your customer sees. It is a test: no booking is created and no text is sent.</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {nicheData.jobs.map((j, i) => (
                    <button key={j} type="button" aria-pressed={job === i} onClick={() => { haptic(8); setJob(i); setBooked(false); }}
                      className="min-h-11 rounded-xl border px-3 text-sm transition"
                      style={{ borderColor: job === i ? accent : "rgba(255,255,255,0.15)", color: job === i ? accent : "white", background: job === i ? `${accent}1a` : "transparent" }}>
                      {j}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {days.map((d, i) => (
                    <button key={d} type="button" aria-pressed={day === i} onClick={() => { haptic(8); setDay(i); setBooked(false); }}
                      className="min-h-11 flex-1 rounded-xl border px-2 text-sm transition"
                      style={{ borderColor: day === i ? accent : "rgba(255,255,255,0.15)", color: day === i ? accent : "white" }}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {studio.slots.map((s) => (
                    <button key={s} type="button" aria-pressed={slot === s} onClick={() => { haptic(8); setSlot(s); setBooked(false); }}
                      className="min-h-11 rounded-xl border px-2 text-sm tabular-nums transition"
                      style={{ borderColor: slot === s ? accent : "rgba(255,255,255,0.15)", background: slot === s ? accent : "transparent", color: slot === s ? "#050507" : "white" }}>
                      {s}
                    </button>
                  ))}
                </div>
                {booked && slot ? (
                  <div role="status" className="rounded-xl border p-4 text-sm" style={{ borderColor: `${accent}88`, background: `${accent}14` }}>
                    <p className="font-medium" style={{ color: accent }}>Test booking confirmed</p>
                    <p className="mt-1 text-white/80">
                      Your customer would get: &ldquo;{business}: you&rsquo;re booked for {nicheData.jobs[job].toLowerCase()} on {days[day].toLowerCase()} at {slot}. Reply C to change.&rdquo;
                    </p>
                  </div>
                ) : (
                  <button type="button" disabled={!slot} onClick={() => { haptic([12, 30, 12]); setBooked(true); }}
                    className="min-h-12 rounded-full px-6 text-base font-semibold text-[#050507] transition disabled:opacity-40"
                    style={{ background: accent }}>
                    {slot ? `Book ${slot}` : "Pick a time"}
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {studio.plans.map((p) => {
                    const on = plan === p.id;
                    return (
                      <button key={p.id} type="button" aria-pressed={on} onClick={() => { haptic(8); setPlan(p.id); setStatus("idle"); }}
                        className="rounded-2xl border p-5 text-left transition"
                        style={{ borderColor: on ? accent : "rgba(255,255,255,0.15)", background: on ? `${accent}14` : "rgba(0,0,0,0.3)", boxShadow: on ? `0 0 30px ${accent}33` : "none" }}>
                        <span className="block text-sm text-white/70">{p.name}</span>
                        <span className="mt-2 flex items-baseline gap-2">
                          <span className="text-4xl font-semibold tabular-nums" style={{ color: on ? accent : "white" }}>{p.price}</span>
                          <span className="text-sm text-white/60">{p.cadence}</span>
                        </span>
                        <span className="mt-2 block text-sm text-white/70">{p.after}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={checkout} disabled={status === "working"}
                  className="min-h-13 rounded-full px-6 py-3.5 text-base font-semibold text-[#050507] transition hover:brightness-110 disabled:opacity-60"
                  style={{ background: accent, boxShadow: `0 0 32px ${accent}66` }}>
                  {status === "working" ? "Opening checkout…" : (studio.plans.find((p) => p.id === plan) ?? studio.plans[0]).cta}
                </button>
                <p role="status" className="min-h-5 text-center text-sm text-white/60">
                  {status === "unconnected" && "Checkout isn't connected on this preview yet."}
                  {status === "error" && "Checkout didn't open. Try again."}
                  {status === "idle" && `Storefront for ${business} is set up after payment.`}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm transition hover:bg-white/5 disabled:invisible">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" onClick={() => go(step + 1)} disabled={!canContinue}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-[#050507] transition disabled:opacity-40"
            style={{ background: accent }}>
            {step === 0 && !canContinue ? "Enter a business name" : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
