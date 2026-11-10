import { useEffect, useState } from "react";
import { Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScheduleSnapshot = {
  dayNumber: number;
  activeNiche: string;
  activeLabel: string;
  heroVideoUrl: string;
  nextNiche: string;
  nextLabel: string;
  slate: Array<{ day: number; niche: string; label: string; heroVideoUrl: string }>;
  cronEnabled: boolean;
  scheduleStartedOn: string | null;
};

type EngineSnapshot = {
  state: {
    paused: boolean;
    smsDailyCap: number;
    emailDailyCap: number;
    smsSentToday: number;
    emailSentToday: number;
    cronEnabled?: boolean;
    activeNiche?: string;
  };
  metrics: {
    smsSentToday: number;
    emailSentToday: number;
    smsRemaining: number;
    emailRemaining: number;
    queued: number;
  };
  mode: "simulation" | "live";
  schedule?: ScheduleSnapshot;
  error?: string;
};

function pct(sent: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, sent) / cap) * 100));
}

export function DispatchControlPanel({ onChanged }: { onChanged?: () => void }) {
  const [shot, setShot] = useState<EngineSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/master/outbound-engine", { credentials: "same-origin" });
    const body = (await response.json()) as EngineSnapshot;
    if (!response.ok) throw new Error(body.error || "Dispatch desk could not load");
    setShot(body);
    return body;
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Dispatch desk could not load"));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  async function post(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const response = await fetch("/api/master/outbound-engine", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = (await response.json()) as EngineSnapshot & {
        dispatch?: { queued?: number; niche?: string };
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || "Dispatch refused");
      setShot(body);
      if (action === "dispatch_today" || action === "send_outreach") {
        setNote(
          `Plumbing outreach armed (${body.dispatch?.queued ?? 0} leads). Hands-free daily autopilot is on under 40 SMS / 80 email caps.`,
        );
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispatch refused");
    } finally {
      setBusy(null);
    }
  }

  const locked = !shot;
  const smsCap = shot?.state.smsDailyCap ?? 40;
  const emailCap = shot?.state.emailDailyCap ?? 80;
  const smsSent = shot?.metrics.smsSentToday ?? shot?.state.smsSentToday ?? 0;
  const emailSent = shot?.metrics.emailSentToday ?? shot?.state.emailSentToday ?? 0;
  const schedule = shot?.schedule;
  const cronOn = schedule?.cronEnabled ?? shot?.state.cronEnabled ?? false;
  const mode = shot?.mode ?? "simulation";

  return (
    <section className="overflow-hidden rounded-2xl bg-surface px-4 py-4 text-fg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Send className="size-5 text-accent" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Dispatch control</p>
        </div>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
          {mode === "live" ? "Live" : "Simulation"} · Day {schedule?.dayNumber ?? 1}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-none">Plumbing campaign queue</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Live vertical: Emergency Plumbing (20,330 records). Caps stay at {smsCap} SMS / {emailCap} email
        per Pacific day. Over-cap sends wait until tomorrow.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Progress
          label="SMS today"
          sent={smsSent}
          cap={smsCap}
          remaining={shot?.metrics.smsRemaining ?? Math.max(0, smsCap - smsSent)}
        />
        <Progress
          label="Email today"
          sent={emailSent}
          cap={emailCap}
          remaining={shot?.metrics.emailRemaining ?? Math.max(0, emailCap - emailSent)}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={locked || busy !== null}
          onClick={() => void post("send_outreach")}
        >
          <Send className="size-4" aria-hidden />
          {busy === "send_outreach" ? "Sending…" : "🚀 Send Outreach"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {cronOn
          ? "Hands-free daily autopilot is on. Plumbing fills remaining 40 SMS / 80 email room with 8–42s jitter; leftovers roll to the next Pacific day."
          : "🚀 Send Outreach arms today's plumbing batch and turns on hands-free daily autopilot."}
      </p>
      {note ? <p className="mt-2 text-sm text-ok">{note}</p> : null}
      {error ? (
        <p className="mt-2 text-sm text-danger">
          {/unauthor/i.test(error)
            ? "Unlock the studio with the owner key to send outreach and load live caps."
            : error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl bg-surface-2 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Active niche</p>
          <p className="mt-2 font-display text-2xl leading-none">{schedule?.activeLabel ?? "Emergency Plumbing & Water Systems"}</p>
          <p className="mt-2 font-mono text-[11px] text-faint">{schedule?.heroVideoUrl ?? "/media/axiom-plumber-hero.mp4"}</p>
          <p className="mt-4 text-sm text-muted">
            Next up: <span className="text-fg">{schedule?.nextLabel ?? "Emergency Plumbing & Water Systems"}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Day slate</p>
          <ul className="mt-3 space-y-2">
            {(schedule?.slate ?? [
              { day: 1, niche: "plumbing", label: "Emergency Plumbing & Water Systems", heroVideoUrl: "/media/axiom-plumber-hero.mp4" },
            ]).map((row) => {
              const active = row.niche === (schedule?.activeNiche ?? "plumbing");
              return (
                <li
                  key={row.niche}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-accent/15 text-fg" : "text-muted"
                  }`}
                >
                  <span>
                    Day {row.day} · {row.label}
                  </span>
                  {active ? <Zap className="size-4 text-accent" aria-hidden /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Progress({
  label,
  sent,
  cap,
  remaining,
}: {
  label: string;
  sent: number;
  cap: number;
  remaining: number;
}) {
  const fill = pct(sent, cap);
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="tabular text-muted">
          {sent.toLocaleString("en-US")} / {cap.toLocaleString("en-US")}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${fill}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">{remaining.toLocaleString("en-US")} remaining today</p>
    </div>
  );
}
