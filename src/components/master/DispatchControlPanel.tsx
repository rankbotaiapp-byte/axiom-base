import { useEffect, useState } from "react";
import { Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OUTREACH_ACTIVE_VERTICAL,
  OUTREACH_NICHE_SEQUENCE,
  PLUMBING_CAMPAIGN_GREETING,
  PLUMBING_CAMPAIGN_HERO,
  PLUMBING_CAMPAIGN_TEMPLATE,
  PLUMBING_LEAD_DATASET_SIZE,
  outreachNicheLabel,
} from "@/lib/axiom/outreach-niche-batch";

type PlumbingQueue = {
  niche: string;
  catalogSize: number;
  loaded: number;
  ready: number;
  heroVideoUrl: string;
  greetingVideoUrl: string;
  template: string;
  samples?: Array<{ slug: string; business: string; city: string; href: string }>;
};

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
  plumbingQueue?: PlumbingQueue | null;
  error?: string;
};

function pct(sent: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, sent) / cap) * 100));
}

const FALLBACK_SHOT: EngineSnapshot = {
  state: {
    paused: false,
    smsDailyCap: 40,
    emailDailyCap: 80,
    smsSentToday: 0,
    emailSentToday: 0,
    cronEnabled: false,
    activeNiche: OUTREACH_ACTIVE_VERTICAL,
  },
  metrics: {
    smsSentToday: 0,
    emailSentToday: 0,
    smsRemaining: 40,
    emailRemaining: 80,
    queued: PLUMBING_LEAD_DATASET_SIZE,
  },
  mode: "simulation",
  plumbingQueue: {
    niche: "plumbing",
    catalogSize: PLUMBING_LEAD_DATASET_SIZE,
    loaded: 0,
    ready: 0,
    heroVideoUrl: PLUMBING_CAMPAIGN_HERO,
    greetingVideoUrl: PLUMBING_CAMPAIGN_GREETING,
    template: PLUMBING_CAMPAIGN_TEMPLATE,
  },
};

export function DispatchControlPanel({ onChanged }: { onChanged?: () => void }) {
  const [shot, setShot] = useState<EngineSnapshot | null>(FALLBACK_SHOT);
  const [niche, setNiche] = useState<string>(OUTREACH_ACTIVE_VERTICAL);
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
    void (async () => {
      try {
        await post("activate_plumbing", { niche: "plumbing" }, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dispatch desk could not load");
        void load().catch(() => undefined);
      }
    })();
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
    // post is stable for this desk; load plumbing once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function post(action: string, extra: Record<string, unknown> = {}, silent = false) {
    if (!silent) {
      setBusy(action);
      setError(null);
      setNote(null);
    }
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
      if (action === "activate_plumbing" || action === "select_niche") {
        const loaded = body.plumbingQueue?.loaded ?? body.metrics.queued ?? 0;
        const catalog = body.plumbingQueue?.catalogSize ?? PLUMBING_LEAD_DATASET_SIZE;
        setNote(
          `Plumbing queue live · ${loaded.toLocaleString("en-US")} records in Supabase (catalog ${catalog.toLocaleString("en-US")}). Storefront ${PLUMBING_CAMPAIGN_TEMPLATE}.`,
        );
      }
      if (action === "dispatch_today" || action === "send_outreach" || action === "send_trickle") {
        setNote(
          `Trickle armed (${body.dispatch?.queued ?? 0} leads in this window). Twilio SMS and Resend email dispatch in parallel chunks of 6 under daily caps.`,
        );
      }
      onChanged?.();
      return body;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispatch refused");
      if (silent) throw err;
      return null;
    } finally {
      if (!silent) setBusy(null);
    }
  }

  const smsCap = shot?.state.smsDailyCap ?? 40;
  const emailCap = shot?.state.emailDailyCap ?? 80;
  const smsSent = shot?.metrics.smsSentToday ?? shot?.state.smsSentToday ?? 0;
  const emailSent = shot?.metrics.emailSentToday ?? shot?.state.emailSentToday ?? 0;
  const schedule = shot?.schedule;
  const queue = shot?.plumbingQueue;
  const cronOn = schedule?.cronEnabled ?? shot?.state.cronEnabled ?? false;
  const mode = shot?.mode ?? "simulation";
  const loaded = queue?.loaded ?? shot?.metrics.queued ?? 0;
  const catalog = queue?.catalogSize ?? PLUMBING_LEAD_DATASET_SIZE;

  return (
    <section className="overflow-hidden rounded-2xl bg-surface px-4 py-4 text-fg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Send className="size-5 text-accent" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Master admin desk</p>
        </div>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
          {mode === "live" ? "Live" : "Simulation"} · Day {schedule?.dayNumber ?? 1}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-none">Plumbing campaign queue</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Selecting Plumbing loads the preloaded contractor dataset from Supabase into this queue, then binds every
        dispatch to the industrial storefront.
      </p>

      <label className="mt-4 grid gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-muted">Active niche</span>
        <select
          aria-label="Outreach niche"
          value={niche}
          className="h-11 rounded-xl bg-surface-2 px-3 text-sm text-fg"
          onChange={(event) => {
            const next = event.target.value;
            setNiche(next);
            if (next === "plumbing") void post("activate_plumbing", { niche: next });
            else setError("Live outreach is locked to Emergency Plumbing until that dataset is exhausted.");
          }}
        >
          {OUTREACH_NICHE_SEQUENCE.filter((id) => id !== "water-systems").map((id) => (
            <option key={id} value={id}>
              {outreachNicheLabel(id)}
              {id === "plumbing" ? ` · ${catalog.toLocaleString("en-US")} records` : " · later"}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Kpi label="Loaded" value={loaded.toLocaleString("en-US")} hint="Supabase plumbing rows" />
        <Kpi label="Ready" value={(queue?.ready ?? loaded).toLocaleString("en-US")} hint="Contactable" />
        <Kpi label="Catalog" value={catalog.toLocaleString("en-US")} hint="20,330+ dataset" />
      </div>

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

      <div className="mt-3 rounded-2xl bg-surface-2 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Template & assets</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-fg">{queue?.template ?? PLUMBING_CAMPAIGN_TEMPLATE}</p>
        <p className="mt-1 font-mono text-[11px] text-muted">Hero {queue?.heroVideoUrl ?? PLUMBING_CAMPAIGN_HERO}</p>
        <p className="mt-1 font-mono text-[11px] text-muted">Greeting {queue?.greetingVideoUrl ?? PLUMBING_CAMPAIGN_GREETING}</p>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="w-full min-h-12"
          disabled={busy !== null}
          onClick={() => void post("send_trickle")}
        >
          <Send className="size-4" aria-hidden />
          {busy === "send_trickle" ? "Arming trickle…" : "Send Trickle Outreach"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full min-h-12"
          disabled={busy !== null}
          onClick={() => void post("send_trickle")}
        >
          <Zap className="size-4" aria-hidden />
          {busy === "send_trickle" ? "Starting…" : "Master Autopilot"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {cronOn
          ? "Hands-free trickle is on. Messages leave under 40 SMS / 80 email caps, weekdays 9:00 AM–4:00 PM, with 45–90s jitter."
          : "Send Trickle Outreach queues today's plumbing batch and starts the worker in the background."}
      </p>
      {note ? <p className="mt-2 text-sm text-ok">{note}</p> : null}
      {error ? (
        <p className="mt-2 text-sm text-danger">
          {/unauthor/i.test(error)
            ? "Unlock the studio with the owner key to send outreach and load live caps."
            : error}
        </p>
      ) : null}

      {queue?.samples && queue.samples.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {queue.samples.slice(0, 5).map((row) => (
            <li key={row.slug} className="flex justify-between gap-3 text-muted">
              <span className="truncate text-fg">{row.business}</span>
              <a href={row.href} className="shrink-0 font-mono text-[11px] text-accent underline-offset-2 hover:underline">
                {row.href}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none tabular">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
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
