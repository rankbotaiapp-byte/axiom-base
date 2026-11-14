import { useEffect, useMemo, useState } from "react";
import { Gauge, Pause, Play, Radio, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MASTER_FUNNELS, type MasterFunnelId } from "@/lib/axiom/funnel";
import { ENGINE_REGIONS } from "@/lib/axiom/outbound-engine";

type EngineConfig = {
  paused: boolean;
  strategyId: MasterFunnelId;
  smsDailyCap: number;
  emailDailyCap: number;
  smsTemplate: string;
  emailSubject: string;
  emailBody: string;
  smsSentToday: number;
  emailSentToday: number;
};

type EngineSnapshot = {
  state: {
    paused: boolean;
    caps: number;
    sentToday: number;
  };
  engine?: EngineConfig;
  metrics: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    clicks: number;
    onboarded: number;
    deliveryRate: number;
    ctr: number;
    smsSentToday: number;
    emailSentToday: number;
    smsRemaining: number;
    emailRemaining: number;
  };
  log: Array<{
    id: string;
    county: string;
    region: string;
    channel: string;
    status: string;
    summary: string;
    created_at: string;
  }>;
  mode: "simulation" | "live";
  error?: string;
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function count(value: number): string {
  return value.toLocaleString("en-US");
}

export function FunnelStrategyControl({ onChanged }: { onChanged?: () => void }) {
  const [shot, setShot] = useState<EngineSnapshot | null>(null);
  const [smsTemplate, setSmsTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsCap, setSmsCap] = useState("40");
  const [emailCap, setEmailCap] = useState("80");
  const [injectSlug, setInjectSlug] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/master/outbound-engine", { credentials: "same-origin" });
    const body = (await response.json()) as EngineSnapshot;
    if (!response.ok) throw new Error(body.error || "Outbound engine could not load");
    setShot(body);
    const cfg = body.engine;
    if (cfg) {
      setSmsTemplate(cfg.smsTemplate ?? "");
      setEmailSubject(cfg.emailSubject ?? "");
      setEmailBody(cfg.emailBody ?? "");
      setSmsCap(String(cfg.smsDailyCap ?? 0));
      setEmailCap(String(cfg.emailDailyCap ?? 0));
    }
    return body;
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Outbound engine could not load"));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 2500);
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
      const body = (await response.json()) as EngineSnapshot & { tick?: { ticked: number } };
      if (!response.ok) throw new Error(body.error || "Outbound engine refused");
      setShot(body);
      const cfg = body.engine;
      if (cfg) {
        setSmsTemplate(cfg.smsTemplate);
        setEmailSubject(cfg.emailSubject);
        setEmailBody(cfg.emailBody);
        setSmsCap(String(cfg.smsDailyCap));
        setEmailCap(String(cfg.emailDailyCap));
      }
      if (action === "tick") setNote(`Tick released ${body.tick?.ticked ?? 0} messages.`);
      if (action === "pause") setNote("Engine paused. No further ticks leave the desk.");
      if (action === "resume") setNote("Engine resumed. Cron ticks will trickle under the daily caps.");
      if (action === "inject") setNote("Lead injected into the live queue log.");
      if (action === "configure") setNote("Funnel and caps saved.");
      if (action === "automate") {
        setNote(
          mode === "live"
            ? "Automate preloaded the sequence queue. Live trickle runs at 9 · 1 · 4 under daily caps."
            : "Automate preloaded the sequence queue. Simulation will process due slots as mock logs only.",
        );
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outbound engine refused");
    } finally {
      setBusy(null);
    }
  }

  const strategyId = shot?.engine?.strategyId ?? MASTER_FUNNELS[0].id;
  const paused = shot?.state.paused ?? shot?.engine?.paused ?? true;
  const mode = shot?.mode ?? "simulation";
  const regions = useMemo(() => {
    const counts: Record<string, number> = { Oregon: 0, Texas: 0, Florida: 0, Other: 0 };
    for (const line of shot?.log ?? []) {
      const region = ENGINE_REGIONS.includes(line.region as (typeof ENGINE_REGIONS)[number])
        ? line.region
        : "Other";
      counts[region] = (counts[region] ?? 0) + 1;
    }
    return counts;
  }, [shot?.log]);
  const regionMax = Math.max(1, ...Object.values(regions));

  return (
    <section className="mt-10 overflow-hidden rounded-2xl bg-surface px-5 py-5 text-fg shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Gauge className="size-5 text-accent" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Master outbound funnel</p>
        </div>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
          {paused ? "Paused" : mode === "live" ? "Live trickle" : "Simulation"}
        </p>
      </div>
      <h2 className="mt-3 font-display text-3xl leading-none">Throttling control center</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Ranked funnels A, B, and C. Daily SMS and email caps stay under carrier filters. The engine starts paused.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Queued" value={count(shot?.metrics.queued ?? 0)} />
        <Metric label="Sent" value={count(shot?.metrics.sent ?? 0)} />
        <Metric label="Delivery" value={pct(shot?.metrics.deliveryRate ?? 0)} />
        <Metric label="CTR" value={pct(shot?.metrics.ctr ?? 0)} />
        <Metric label="Onboarded" value={count(shot?.metrics.onboarded ?? 0)} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {MASTER_FUNNELS.map((funnel) => {
          const selected = funnel.id === strategyId;
          return (
            <button
              key={funnel.id}
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void post("configure", {
                  strategyId: funnel.id,
                  smsDailyCap: Number(smsCap),
                  emailDailyCap: Number(emailCap),
                  smsTemplate: funnel.text,
                  emailSubject: funnel.emailSubject,
                  emailBody: funnel.emailBody,
                })
              }
              className={`rounded-2xl px-4 py-4 text-left transition ${
                selected
                  ? "bg-surface-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
                  : "bg-surface-2/70"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Funnel {funnel.letter}</p>
              <p className="mt-2 font-display text-xl leading-none">{funnel.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{funnel.line}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">SMS template</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl bg-surface-2 px-3 py-3 text-sm text-fg"
            value={smsTemplate}
            onChange={(event) => setSmsTemplate(event.target.value)}
          />
        </label>
        <div>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">Email subject</span>
            <Input className="mt-2" value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} />
          </label>
          <label className="mt-3 block">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">Email body</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl bg-surface-2 px-3 py-3 text-sm text-fg"
              value={emailBody}
              onChange={(event) => setEmailBody(event.target.value)}
            />
          </label>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">Variables: {"{{business_name}}"} · {"{{city}}"} · {"{{preview_link}}"}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="sms-cap">SMS daily cap</Label>
          <Input id="sms-cap" inputMode="numeric" value={smsCap} onChange={(event) => setSmsCap(event.target.value)} />
          <p className="mt-1 text-xs text-muted">
            {count(shot?.metrics.smsSentToday ?? 0)} sent · {count(shot?.metrics.smsRemaining ?? 0)} remaining
          </p>
        </div>
        <div>
          <Label htmlFor="email-cap">Email daily cap</Label>
          <Input id="email-cap" inputMode="numeric" value={emailCap} onChange={(event) => setEmailCap(event.target.value)} />
          <p className="mt-1 text-xs text-muted">
            {count(shot?.metrics.emailSentToday ?? 0)} sent · {count(shot?.metrics.emailRemaining ?? 0)} remaining
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="sm:min-w-52"
          disabled={busy !== null}
          onClick={() => {
            setBusy("automate");
            setError(null);
            setNote(null);
            void fetch("/api/master/autopilot", {
              method: "POST",
              credentials: "same-origin",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ action: "automate" }),
            })
              .then(async (response) => {
                const body = (await response.json()) as EngineSnapshot & { error?: string };
                if (!response.ok) throw new Error(body.error || "Automate could not start");
                setNote(
                  mode === "live"
                    ? "Automate preloaded the sequence queue. Live trickle runs at 9 · 1 · 4 under daily caps."
                    : "Automate preloaded the sequence queue. Simulation will process due slots as mock logs only.",
                );
                onChanged?.();
                return load();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "Automate could not start"))
              .finally(() => setBusy(null));
          }}
        >
          <Zap className="size-4" aria-hidden />
          {busy === "automate" ? "Automating…" : "Automate"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() =>
            void post("configure", {
              strategyId,
              smsDailyCap: Number(smsCap),
              emailDailyCap: Number(emailCap),
              smsTemplate,
              emailSubject,
              emailBody,
            })
          }
        >
          {busy === "configure" ? "Saving" : "Save templates & caps"}
        </Button>
        <Button type="button" variant={paused ? "accent" : "secondary"} disabled={busy !== null} onClick={() => void post(paused ? "resume" : "pause")}>
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          {paused ? "Resume engine" : "Pause engine"}
        </Button>
        <Button type="button" variant="secondary" disabled={busy !== null || paused} onClick={() => void post("tick")}>
          {busy === "tick" ? "Ticking" : "Run tick now"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl bg-surface-2 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Target regions</p>
          <ul className="mt-3 space-y-3">
            {ENGINE_REGIONS.map((region) => (
              <li key={region}>
                <div className="flex items-center justify-between text-sm">
                  <span>{region}</span>
                  <span className="tabular text-muted">{count(regions[region] ?? 0)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.round(((regions[region] ?? 0) / regionMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-bg px-4 py-4">
          <div className="flex items-center gap-2 text-accent">
            <Radio className="size-4" aria-hidden />
            <p className="text-xs uppercase tracking-[0.16em]">Live queue</p>
          </div>
          <ul className="mt-3 max-h-56 space-y-1 overflow-auto font-mono text-xs leading-relaxed text-muted">
            {(shot?.log ?? []).length === 0 ? (
              <li>waiting for a tick…</li>
            ) : (
              shot?.log.map((line) => (
                <li key={line.id}>
                  <span className="text-accent">{line.region}</span>
                  {" · "}
                  {line.channel}
                  {" · "}
                  {line.status}
                  {" · "}
                  {line.summary}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-2 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Manual lead injection</p>
        <p className="mt-2 text-sm text-muted">Drops a test line into the live log without contacting anyone.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="lead-slug"
            value={injectSlug}
            onChange={(event) => setInjectSlug(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null || !injectSlug.trim()}
            onClick={() => void post("inject", { leadSlug: injectSlug.trim(), county: "Jackson County", channel: "sms" })}
          >
            Inject test lead
          </Button>
        </div>
      </div>

      {note ? <p className="mt-4 text-sm text-ok">{note}</p> : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-2 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl leading-none tabular sm:text-2xl">{value}</p>
    </div>
  );
}
