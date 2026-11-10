"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarCheck, MessageSquareText, PhoneIncoming, PhoneMissed, Play } from "lucide-react";
import {
  missedCallScenarioFor,
  nextMissedCallStep,
  renderMissedCallSms,
  type MissedCallSimStep,
} from "@/lib/axiom/missed-call-sim";
import { cn } from "@/lib/utils";

const STEP_MS = 900;

export function MissedCallRecoverySim({
  businessName,
  niche,
  trade = "",
  bookHref = "#guest-book",
  className,
}: {
  businessName: string;
  niche: string;
  trade?: string;
  bookHref?: string;
  className?: string;
}) {
  const scenario = missedCallScenarioFor(niche, trade);
  const [step, setStep] = useState<MissedCallSimStep>("idle");
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, []);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function run() {
    if (busy) return;
    clearTimers();
    setBusy(true);
    setStep("ringing");
    const sequence: MissedCallSimStep[] = ["ringing", "inquiry", "sms", "booked"];
    sequence.forEach((target, index) => {
      const id = window.setTimeout(() => {
        setStep(target);
        if (target === "booked") setBusy(false);
      }, STEP_MS * (index + 1));
      timers.current.push(id);
    });
  }

  function reset() {
    clearTimers();
    setBusy(false);
    setStep("idle");
  }

  const sms = renderMissedCallSms(scenario.smsReply, {
    business: businessName,
    bookUrl: bookHref.startsWith("http") ? bookHref : bookHref || "#guest-book",
  });

  return (
    <section
      className={cn(
        "relative z-20 mx-auto w-full max-w-5xl px-5 pb-16 pt-4 sm:px-8",
        className,
      )}
      aria-label="Missed call recovery simulation"
    >
      <div className="overflow-hidden rounded-[28px] bg-surface px-5 py-6 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)] sm:px-7 sm:py-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/85">Live simulation</p>
        <h2 className="mt-2 font-display text-2xl text-fg sm:text-3xl">Missed-call recovery</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Watch Axiom catch an emergency inquiry while {businessName} is on a job — automated SMS, then a calendar
          booking on the desk.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy}
            className={cn(
              "inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 py-3",
              "text-sm font-bold text-obsidian transition hover:bg-accent/90",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 disabled:opacity-70",
            )}
          >
            {busy ? <PhoneIncoming className="size-4 animate-pulse" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {busy ? "Running…" : scenario.cta}
          </button>
          {step !== "idle" ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center rounded-full px-5 text-sm text-fg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_14%,transparent)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <ol className="mt-6 grid gap-3">
          <SimCard
            active={step === "ringing" || stepRank(step) > 0}
            done={stepRank(step) > 0}
            icon={<PhoneMissed className="size-4" aria-hidden />}
            title="Missed inbound"
            body={
              step === "idle"
                ? "Press the button to simulate a customer calling while you're on site."
                : `${scenario.caller} · ${scenario.callerPhone}`
            }
          />
          <SimCard
            active={step === "inquiry" || stepRank(step) > 1}
            done={stepRank(step) > 1}
            icon={<PhoneIncoming className="size-4" aria-hidden />}
            title="Emergency inquiry"
            body={stepRank(step) >= 2 ? scenario.inquiry : "Waiting for the inbound message…"}
          />
          <SimCard
            active={step === "sms" || stepRank(step) > 2}
            done={stepRank(step) > 2}
            icon={<MessageSquareText className="size-4" aria-hidden />}
            title="Automated SMS"
            body={stepRank(step) >= 3 ? sms : "SMS fires the moment the call is missed."}
          />
          <SimCard
            active={step === "booked"}
            done={step === "booked"}
            icon={<CalendarCheck className="size-4" aria-hidden />}
            title="Calendar booking"
            body={
              step === "booked"
                ? `${scenario.booking} · ${scenario.slotLabel}`
                : "Customer picks a slot from the SMS link."
            }
          />
        </ol>

        {step === "booked" ? (
          <div className="mt-5 rounded-2xl bg-accent/15 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-accent">On the desk</p>
            <p className="mt-2 font-display text-xl text-fg">{scenario.booking}</p>
            <p className="mt-1 text-sm text-muted">
              {scenario.caller} · {scenario.slotLabel} · {businessName}
            </p>
            <a
              href={bookHref}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg"
            >
              Open booking calendar
            </a>
          </div>
        ) : null}
      </div>
      {/* Keep nextMissedCallStep referenced for unit tests / future keyboard advance */}
      <span className="sr-only">{nextMissedCallStep(step)}</span>
    </section>
  );
}

function stepRank(step: MissedCallSimStep): number {
  if (step === "idle") return 0;
  if (step === "ringing") return 1;
  if (step === "inquiry") return 2;
  if (step === "sms") return 3;
  return 4;
}

function SimCard({
  active,
  done,
  icon,
  title,
  body,
}: {
  active: boolean;
  done: boolean;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li
      className={cn(
        "rounded-2xl px-4 py-3 transition",
        active
          ? "bg-surface-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
          : "bg-surface-2/40 text-muted",
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
        <span className={cn(done || active ? "text-accent" : "text-muted")}>{icon}</span>
        <span>{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fg">{body}</p>
    </li>
  );
}
