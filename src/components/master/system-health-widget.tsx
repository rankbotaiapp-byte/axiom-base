import { useEffect, useState } from "react";
import { Activity, ShieldAlert } from "lucide-react";

type Identity = {
  identity: string;
  channel: "sms" | "email";
  role: "primary" | "backup";
  status: "active" | "paused";
};

type Adjustment = {
  id: string;
  rule: string;
  summary: string;
  detail: string;
  minDelaySeconds: number | null;
  maxDelaySeconds: number | null;
  createdAt: string;
};

type HealthShot = {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  smsViolationRate: number;
  emailBounceRate: number;
  errorRate: number;
  conversionVelocity: number;
  datasetStatus: string;
  lastEvaluatedAt: string | null;
  identities: Identity[];
  adjustments: Adjustment[];
  error?: string;
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function when(iso: string | null): string {
  if (!iso) return "Waiting for the next hourly pass";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Waiting for the next hourly pass";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(t));
}

function ruleLabel(rule: string): string {
  if (rule === "sms_burn") return "SMS burn";
  if (rule === "email_bounce") return "Email domain";
  if (rule === "throttle") return "Throttle";
  return rule;
}

export function SystemHealthWidget() {
  const [shot, setShot] = useState<HealthShot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/master/outreach-health", { credentials: "same-origin" });
        const body = (await response.json()) as HealthShot & { error?: string };
        if (cancelled) return;
        if (!response.ok) {
          setError(body.error || "Could not load system health");
          return;
        }
        setError(null);
        setShot(body);
      } catch {
        if (!cancelled) setError("Could not load system health");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const paused = shot?.datasetStatus === "paused_reverify";
  const smsPaused = (shot?.identities ?? []).filter((row) => row.channel === "sms" && row.status === "paused");

  return (
    <section className="mt-4 overflow-hidden rounded-2xl bg-surface px-4 py-4 text-fg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-accent" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">System health</p>
        </div>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
          {shot ? `${shot.minDelaySeconds}–${shot.maxDelaySeconds}s delay` : "Autonomous loop"}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-none">System Health & Autonomous Adjustments</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Twilio and Resend webhooks feed the last 100 messages. Hourly, during 9:00 AM–4:00 PM, the loop pauses burned
        numbers, holds bounced chunks, and cools the trickle if error rate ticks up.
      </p>
      <p className="mt-2 text-xs text-muted">Last pass · {when(shot?.lastEvaluatedAt ?? null)}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Kpi label="SMS violations" value={pct(shot?.smsViolationRate ?? 0)} hint="Limit 5% per number" warn={(shot?.smsViolationRate ?? 0) > 0.05} />
        <Kpi label="Email bounce" value={pct(shot?.emailBounceRate ?? 0)} hint="Limit 2%" warn={(shot?.emailBounceRate ?? 0) > 0.02} />
        <Kpi label="Error rate" value={pct(shot?.errorRate ?? 0)} hint={`Conversion ${pct(shot?.conversionVelocity ?? 0)}`} warn={(shot?.errorRate ?? 0) > 0.05} />
      </div>

      {paused ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-danger">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Current plumbing dataset chunk is paused for manual re-verification.
        </p>
      ) : null}
      {smsPaused.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {smsPaused.map((row) => (
            <li key={row.identity} className="font-mono text-[12px] text-danger">
              {row.identity} paused · {row.role}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Autonomous adjustments</p>
        {shot?.adjustments && shot.adjustments.length > 0 ? (
          <ul className="mt-2 max-h-64 space-y-2 overflow-auto">
            {shot.adjustments.map((row) => (
              <li key={row.id} className="rounded-2xl bg-surface-2 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-accent">{ruleLabel(row.rule)}</p>
                <p className="mt-1 text-sm text-fg">{row.summary}</p>
                <p className="mt-1 text-xs text-muted">{row.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No autonomous changes yet. The loop writes here after each hourly pass.</p>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-danger">
          {/unauthor/i.test(error)
            ? "Unlock the studio with the owner key to load live health."
            : error}
        </p>
      ) : null}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl leading-none tabular ${warn ? "text-danger" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
