"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Radar,
  RefreshCw,
  Rocket,
  Save,
  ShieldOff,
  Zap,
} from "lucide-react";
import { SMS_DRIP_STEPS } from "@/lib/axiom/sms-drip";
import { OUTREACH_PITCH_ANGLES, type OutreachPitchAngleId } from "@/lib/axiom/outreach-pitch-angles";
import type { AutopilotLog, AutopilotStatus, ChannelStats } from "@/lib/axiom/master-dashboard";

type DeskSnapshot = AutopilotStatus & {
  mode?: "simulation" | "live";
  totalLeads?: number;
  remainingQueue?: number;
  emailCount?: number;
  smsCount?: number;
  summary?: string;
  error?: string;
};

type TemplateDraft = {
  smsTemplate: string;
  emailSubject: string;
  emailBody: string;
  smsDailyCap: number;
  emailDailyCap: number;
  pitchAngleId: OutreachPitchAngleId;
};

const EMPTY_CHANNEL: ChannelStats = {
  sent: 0,
  delivered: 0,
  failed: 0,
  inFlight: 0,
  healthy: true,
  lastEventAt: null,
};

function pct(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function num(value: number | undefined): string {
  return (value ?? 0).toLocaleString("en-US");
}

function MetricCard({
  label,
  value,
  hint,
  accent = "cyan",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "cyan" | "crimson" | "amber";
}) {
  const ring =
    accent === "crimson"
      ? "border-[#ff2a3d]/25 shadow-[0_0_24px_rgba(255,42,61,0.08)]"
      : accent === "amber"
        ? "border-amber-400/25"
        : "border-[#00f2fe]/25 shadow-[0_0_24px_rgba(0,242,254,0.08)]";
  return (
    <article className={`rounded-2xl border bg-[#030712]/70 px-4 py-4 backdrop-blur-xl ${ring}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 font-display text-3xl text-white tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </article>
  );
}

function ChannelPanel({ title, icon, stats }: { title: string; icon: ReactNode; stats: ChannelStats }) {
  const rate = stats.sent > 0 ? ((stats.delivered || stats.sent - stats.failed) / stats.sent) * 100 : 0;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[#00f2fe]">
        {icon}
        <h3 className="font-display text-lg text-white">{title}</h3>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Sent</dt>
          <dd className="mt-1 tabular-nums text-zinc-100">{num(stats.sent)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Delivery</dt>
          <dd className="mt-1 tabular-nums text-zinc-100">{pct(rate)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">In flight</dt>
          <dd className="mt-1 tabular-nums text-zinc-100">{num(stats.inFlight)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Failed</dt>
          <dd className="mt-1 tabular-nums text-[#ff8a95]">{num(stats.failed)}</dd>
        </div>
      </dl>
      <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.14em] ${stats.healthy ? "text-emerald-400" : "text-[#ff2a3d]"}`}>
        {stats.healthy ? "Channel healthy" : "Channel degraded"}
      </p>
    </section>
  );
}

/**
 * Glassmorphic Cyber-Obsidian campaign manager — lead queue, drip templates,
 * launch controls, and live Twilio/Resend telemetry.
 */
export type AutopilotScope = "master" | "tenant";

export function AutopilotDashboard({
  shopName = "Axiom",
  pollMs = 12_000,
  defaultScope = "master",
  shopSlug,
}: {
  shopName?: string;
  pollMs?: number;
  /** Master operators see fleet outreach; tenants see their shop social/SEO loop. */
  defaultScope?: AutopilotScope;
  shopSlug?: string;
}) {
  const [scope, setScope] = useState<AutopilotScope>(defaultScope);
  const [shot, setShot] = useState<DeskSnapshot | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>({
    smsTemplate: "",
    emailSubject: "",
    emailBody: "",
    smsDailyCap: 40,
    emailDailyCap: 80,
    pitchAngleId: "founder_video",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyShot = useCallback((next: DeskSnapshot) => {
    setShot(next);
    if (next.templates) {
      setDraft({
        smsTemplate: next.templates.smsTemplate,
        emailSubject: next.templates.emailSubject,
        emailBody: next.templates.emailBody,
        smsDailyCap: next.templates.smsDailyCap,
        emailDailyCap: next.templates.emailDailyCap,
        pitchAngleId: (next.templates.pitchAngleId as OutreachPitchAngleId) || "founder_video",
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/master/autopilot", { credentials: "same-origin" });
      const body = (await res.json()) as DeskSnapshot;
      if (!res.ok) throw new Error(body.error || "Could not load Autopilot");
      applyShot(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Autopilot");
    }
  }, [applyShot]);

  useEffect(() => {
    void refresh();
    if (pollMs <= 0) return;
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  async function command(action: string, extra?: Record<string, unknown>, dry = false) {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/master/autopilot${dry ? "?dry=1" : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra, ...(dry ? { dryRun: true } : {}) }),
      });
      const body = (await res.json()) as DeskSnapshot & { message?: string; dryRun?: boolean };
      if (!res.ok) throw new Error(body.error || "Autopilot command failed");
      applyShot(body);
      setNote(body.message || body.summary || `Action ${action} complete.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Autopilot command failed");
    } finally {
      setBusy(null);
    }
  }

  const state = shot?.state ?? "idle";
  const dripSteps = shot?.templates?.dripSteps ?? SMS_DRIP_STEPS.map((s) => ({
    id: s.id,
    day: s.day,
    label: s.label,
    template: s.template,
  }));

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 text-fg">
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-[#00f2fe]/60" aria-hidden />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-[#00f2fe]/60" aria-hidden />

      <header className="relative overflow-hidden rounded-2xl border border-[#00f2fe]/25 bg-[#030712]/85 p-6 shadow-[0_0_48px_rgba(0,242,254,0.08)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00f2fe]/70 to-transparent" />
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00f2fe]">
          {scope === "master" ? "Master outbound · Mechanical Heart" : "Tenant social & SEO loop"}
        </p>
        <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
          {scope === "master" ? `Campaign engine · ${shopName}` : `${shopName} · Autopilot desk`}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {scope === "master"
            ? "Queue regional trade leads, Twilio/Resend drips, and fleet social publishing. STOP replies and hard-bounces quarantine automatically."
            : "Monitor your shop’s social publishing queue, auto-reply conversion logs, and local Google ranking telemetry powered by the Mechanical Heart engine."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/15 p-0.5" role="group" aria-label="Autopilot scope">
            <button
              type="button"
              onClick={() => setScope("master")}
              className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                scope === "master" ? "bg-[#00f2fe]/20 text-[#00f2fe]" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Master operator
            </button>
            <button
              type="button"
              onClick={() => setScope("tenant")}
              className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                scope === "tenant" ? "bg-[#FFE500]/15 text-[#FFE500]" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Trade contractor
            </button>
          </div>
          <span
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
              state === "running"
                ? "border-emerald-400/40 text-emerald-300"
                : state === "error"
                  ? "border-[#ff2a3d]/40 text-[#ff8a95]"
                  : "border-white/15 text-zinc-400"
            }`}
          >
            {state}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            {shot?.mode === "live" ? "Live send path" : "Simulation default"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs text-zinc-300 transition hover:border-[#00f2fe]/40 hover:text-[#00f2fe]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {scope === "tenant" ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00f2fe]">Social queue</p>
            <p className="mt-2 text-2xl tabular-nums text-white">{num(shot?.queued ?? 0)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Posts staged for {shopSlug || shopName} · GBP / IG / FB
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Auto-reply converts</p>
            <p className="mt-2 text-2xl tabular-nums text-white">{num(shot?.activeReplies)}</p>
            <p className="mt-1 text-xs text-zinc-500">Comment → book intents (7-day)</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">Local SEO</p>
            <p className="mt-2 text-2xl tabular-nums text-white">{pct(shot?.deliveryRate)}</p>
            <p className="mt-1 text-xs text-zinc-500">Publish + ranking signal health</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Lead queue" value={num(shot?.queued ?? shot?.remainingQueue)} hint="Pending dispatch" />
        <MetricCard label="Sent today" value={num(shot?.sentToday)} hint="SMS + email under daily caps" />
        <MetricCard label="Delivery rate" value={pct(shot?.deliveryRate)} hint="7-day telemetry window" />
        <MetricCard
          label="Active replies"
          value={num(shot?.activeReplies)}
          hint={`${num(shot?.quarantined)} quarantined`}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChannelPanel title="SMS · Twilio" icon={<MessageSquare className="h-4 w-4" />} stats={shot?.sms ?? EMPTY_CHANNEL} />
        <ChannelPanel title="Email · Resend" icon={<Mail className="h-4 w-4" />} stats={shot?.email ?? EMPTY_CHANNEL} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#030712]/75 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">Drip templates</p>
            <h2 className="mt-1 font-display text-2xl text-white">SMS + email cadence</h2>
          </div>
          <button
            type="button"
            disabled={busy === "save_templates"}
            onClick={() => void command("save_templates", draft)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00f2fe]/40 bg-[#00f2fe]/10 px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#00f2fe] transition hover:bg-[#00f2fe]/20 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            Save templates
          </button>
        </div>

        <label className="mt-4 block max-w-md space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Pitch angle · live hook</span>
          <select
            value={draft.pitchAngleId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, pitchAngleId: e.target.value as OutreachPitchAngleId }))
            }
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00f2fe]/45"
          >
            {OUTREACH_PITCH_ANGLES.map((angle) => (
              <option key={angle.id} value={angle.id}>
                {angle.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">
            Hooks prepend at send time — saved templates stay intact for active sequences.
          </p>
        </label>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">SMS body · Day 1 hook</span>
            <textarea
              value={draft.smsTemplate}
              onChange={(e) => setDraft((d) => ({ ...d, smsTemplate: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00f2fe]/45"
            />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">Daily SMS cap</span>
              <input
                type="number"
                min={0}
                max={500}
                value={draft.smsDailyCap}
                onChange={(e) => setDraft((d) => ({ ...d, smsDailyCap: Number(e.target.value) || 0 }))}
                className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm tabular-nums text-white outline-none focus:border-[#00f2fe]/45"
              />
            </div>
          </label>

          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Email subject</span>
              <input
                value={draft.emailSubject}
                onChange={(e) => setDraft((d) => ({ ...d, emailSubject: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00f2fe]/45"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Email body</span>
              <textarea
                value={draft.emailBody}
                onChange={(e) => setDraft((d) => ({ ...d, emailBody: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00f2fe]/45"
              />
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">Daily email cap</span>
              <input
                type="number"
                min={0}
                max={500}
                value={draft.emailDailyCap}
                onChange={(e) => setDraft((d) => ({ ...d, emailDailyCap: Number(e.target.value) || 0 }))}
                className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm tabular-nums text-white outline-none focus:border-[#00f2fe]/45"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {dripSteps.map((step) => (
            <article key={step.id} className="rounded-xl border border-[#00f2fe]/15 bg-[#00f2fe]/[0.04] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#00f2fe]">Day {step.day}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{step.label}</p>
              <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-zinc-400">{step.template}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">Launch controls</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void command("start")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 text-sm text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
          >
            <Play className="h-4 w-4" />
            Start engine
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void command("pause")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-zinc-200 transition hover:border-white/30 disabled:opacity-40"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void command("run_batch", {}, true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-4 text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-40"
          >
            <Radar className="h-4 w-4" />
            Dry-run batch
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void command("run_batch")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00f2fe]/45 bg-[#00f2fe]/15 px-4 text-sm text-[#00f2fe] transition hover:bg-[#00f2fe]/25 disabled:opacity-40"
          >
            <Rocket className="h-4 w-4" />
            Launch campaign
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => {
              setBusy("regional");
              setError(null);
              void fetch("/api/autopilot/outreach", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  action: "run",
                  county: "josephine",
                  trade: "hvac",
                  dryRun: false,
                }),
              })
                .then(async (res) => {
                  const json = (await res.json()) as { ok?: boolean; error?: string; plan?: { summary?: string } };
                  if (!res.ok || json.ok === false) throw new Error(json.error || "Regional outreach failed");
                  setNote(json.plan?.summary || "Regional outreach batch queued.");
                  await refresh();
                })
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "Regional outreach failed");
                })
                .finally(() => setBusy(null));
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#FFE500]/35 bg-[#FFE500]/10 px-4 text-sm text-[#FFE500] transition hover:bg-[#FFE500]/20 disabled:opacity-40"
          >
            <Radar className="h-4 w-4" />
            Josephine HVAC batch
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void command("automate")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00f2fe]/30 px-4 text-sm text-zinc-100 transition hover:border-[#00f2fe]/60 disabled:opacity-40"
          >
            <Zap className="h-4 w-4" />
            Automate trickle
          </button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-zinc-500">
          <ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff2a3d]/80" />
          Rate limits: Pacific business hours, 45–90s trickle gaps, {draft.smsDailyCap} SMS / {draft.emailDailyCap} email
          caps per identity. Quarantined STOP/bounce destinations are excluded from every batch.
        </p>
        {note ? (
          <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {note}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl border border-[#ff2a3d]/30 bg-[#ff2a3d]/10 px-3 py-2 text-sm text-[#ff8a95]">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#030712]/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-display text-xl text-white">
          <Activity className="h-4 w-4 text-[#00f2fe]" />
          Live dispatch log
        </h2>
        <ul className="mt-4 space-y-2">
          {(shot?.logs ?? []).length === 0 ? (
            <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-sm text-zinc-500">
              No dispatch events yet. Launch a dry-run or campaign to populate telemetry.
            </li>
          ) : (
            (shot?.logs ?? []).slice(0, 12).map((row: AutopilotLog) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 font-mono text-xs"
              >
                <span className="text-zinc-300">
                  <span className="text-[#00f2fe]">{row.channel}</span>
                  {" · "}
                  {row.message}
                </span>
                <span className="shrink-0 text-zinc-500">{new Date(row.at).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
