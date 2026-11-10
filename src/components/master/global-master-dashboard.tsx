"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Cpu,
  Gauge,
  Layers,
  Mail,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MASTER_GLASS as GLASS, MasterCyberFrame } from "@/components/master/master-cyber-frame";
import type {
  AutopilotAction,
  AutopilotState,
  AutopilotStatus,
  ChannelStats,
  LogLevel,
  MasterTelemetry,
  MasterTenant,
  ServerStatus,
  SubscriptionStatus,
  TenantsResponse,
} from "@/lib/axiom/master-dashboard";

const nf = new Intl.NumberFormat("en-US");
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

interface PollResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
  setData: (d: T) => void;
}

function usePolling<T>(url: string, intervalMs: number): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setData((await res.json()) as T);
      setError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), intervalMs);
    return () => {
      window.clearInterval(id);
      controllerRef.current?.abort();
    };
  }, [load, intervalMs]);

  return { data, error, loading, refresh: () => void load(), setData };
}

function Panel({
  title,
  icon,
  right,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("relative p-5", GLASS, className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
          {icon}
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

function StatusDot({
  tone,
  pulse = true,
}: {
  tone: "cyan" | "red" | "blue" | "emerald" | "slate";
  pulse?: boolean;
}) {
  const map = {
    cyan: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
    red: "bg-red-500 shadow-[0_0_12px_#ef4444]",
    blue: "bg-blue-500 shadow-[0_0_12px_#3b82f6]",
    emerald: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
    slate: "bg-slate-600",
  } as const;
  return (
    <span className="relative inline-flex size-2.5">
      {pulse && tone !== "slate" ? (
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-70", map[tone])} />
      ) : null}
      <span className={cn("relative inline-flex size-2.5 rounded-full", map[tone])} />
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  tone?: "cyan" | "red" | "blue";
}) {
  const glow =
    tone === "red"
      ? "text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
      : tone === "blue"
        ? "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]"
        : "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]";
  return (
    <div className={cn("p-4", GLASS)}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="font-mono text-xs uppercase tracking-[0.2em]">{label}</span>
        <span className={glow}>{icon}</span>
      </div>
      <div className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", glow)}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function Bar({ value, max, tone = "cyan" }: { value: number; max: number; tone?: "cyan" | "red" | "blue" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = {
    cyan: "bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_10px_#22d3ee]",
    red: "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_#ef4444]",
    blue: "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_#3b82f6]",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 font-mono text-xs text-red-300">
      <AlertTriangle className="size-4" />
      {message}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="py-8 text-center font-mono text-xs text-slate-500">{message}</div>;
}

const SUB_STYLES: Record<SubscriptionStatus, string> = {
  active: "border-emerald-400/40 bg-emerald-950/60 text-emerald-300",
  trialing: "border-cyan-400/40 bg-cyan-950/60 text-cyan-300",
  past_due: "border-red-400/40 bg-red-950/50 text-red-300",
  unpaid: "border-red-500/50 bg-red-950/70 text-red-300",
  incomplete: "border-cyan-500/20 bg-slate-950 text-slate-400",
  canceled: "border-red-500/50 bg-red-950/70 text-red-400",
};

function SubBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={cn("rounded-md border px-2 py-0.5 font-mono text-xs uppercase tracking-wider", SUB_STYLES[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

function ChannelFlow({ label, icon, stats }: { label: string; icon: ReactNode; stats: ChannelStats }) {
  const total = stats.sent || 1;
  return (
    <div className={cn("p-4", GLASS)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyan-100">
          {icon}
          {label}
        </span>
        <span className="flex items-center gap-2 font-mono text-xs uppercase text-slate-400">
          <StatusDot
            tone={stats.healthy ? (stats.inFlight > 0 ? "cyan" : "emerald") : "red"}
            pulse={stats.inFlight > 0 || !stats.healthy}
          />
          {stats.healthy ? (stats.inFlight > 0 ? "streaming" : "healthy") : "fault"}
        </span>
      </div>
      <div className="relative mb-3 h-6 overflow-hidden rounded-md border border-cyan-500/30 bg-slate-950">
        {stats.inFlight > 0
          ? Array.from({ length: Math.min(6, stats.inFlight) }).map((_, i) => (
              <motion.span
                key={i}
                className={cn(
                  "absolute top-1/2 h-1.5 w-6 -translate-y-1/2 rounded-full",
                  stats.healthy ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-red-500 shadow-[0_0_8px_#ef4444]",
                )}
                initial={{ left: "-10%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.27, ease: "linear" }}
              />
            ))
          : null}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        {(
          [
            ["Sent", stats.sent, "text-slate-100"],
            ["Deliv", stats.delivered, "text-cyan-300"],
            ["Fail", stats.failed, "text-red-400"],
            ["Live", stats.inFlight, "text-blue-400"],
          ] as const
        ).map(([k, v, c]) => (
          <div key={k}>
            <div className={cn("text-lg tabular-nums", c)}>{nf.format(v)}</div>
            <div className="text-xs uppercase tracking-widest text-slate-500">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1">
        <Bar value={stats.delivered} max={total} />
        <Bar value={stats.failed} max={total} tone="red" />
      </div>
      <div className="mt-2 text-right font-mono text-xs text-slate-500">last event {timeAgo(stats.lastEventAt)}</div>
    </div>
  );
}

const LOG_TONE: Record<LogLevel, string> = {
  info: "text-slate-300",
  success: "text-cyan-300",
  warn: "text-blue-300",
  error: "text-red-400",
};

function AutopilotPanel() {
  const { data, error, setData, refresh } = usePolling<AutopilotStatus>("/api/master/autopilot", 5000);
  const [pending, setPending] = useState<AutopilotAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const send = useCallback(
    async (action: AutopilotAction) => {
      setPending(action);
      setActionError(null);
      try {
        const res = await fetch("/api/master/autopilot", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        setData((await res.json()) as AutopilotStatus);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Action failed");
        refresh();
      } finally {
        setPending(null);
      }
    },
    [setData, refresh],
  );

  const stateTone: Record<AutopilotState, "cyan" | "blue" | "red" | "slate"> = {
    running: "cyan",
    paused: "blue",
    error: "red",
    idle: "slate",
  };

  return (
    <Panel
      title="Autopilot Outreach Engine"
      icon={<Rocket className="size-4" />}
      right={
        data ? (
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-200">
            <StatusDot tone={stateTone[data.state]} />
            {data.state}
          </span>
        ) : null
      }
    >
      {error && !data ? <ErrorLine message={`Autopilot unreachable: ${error}`} /> : null}
      {data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {data.state === "running" ? (
              <button
                type="button"
                onClick={() => void send("pause")}
                disabled={pending !== null}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-300 transition hover:bg-red-950/70 disabled:opacity-50"
              >
                <Pause className="size-4" /> {pending === "pause" ? "Pausing…" : "Pause Engine"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void send("start")}
                disabled={pending !== null}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan-300 shadow-[0_0_20px_-4px_#22d3ee] transition hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <Play className="size-4" /> {pending === "start" ? "Engaging…" : "Engage Autopilot"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void send("automate")}
              disabled={pending !== null}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/70 bg-cyan-400/15 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-cyan-100 shadow-[0_0_28px_-4px_#22d3ee] transition hover:bg-cyan-400/25 disabled:opacity-50"
            >
              <Rocket className="size-4" /> {pending === "automate" ? "Automating…" : "Automate"}
            </button>
            <button
              type="button"
              onClick={() => void send("run_batch")}
              disabled={pending !== null || data.queued === 0}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-300 shadow-[0_0_20px_-4px_#ef4444] transition hover:bg-red-500/20 disabled:opacity-40"
            >
              <Rocket className="size-4" /> {pending === "run_batch" ? "Deploying…" : `Deploy Batch (${nf.format(data.queued)})`}
            </button>
            <div className="ml-auto font-mono text-xs text-slate-400">
              batch <span className="text-cyan-400">{data.currentBatchId ?? "—"}</span> · sent today{" "}
              <span className="text-cyan-400">{nf.format(data.sentToday)}</span>
            </div>
          </div>
          {actionError ? <ErrorLine message={actionError} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <ChannelFlow label="Twilio SMS" icon={<MessageSquare className="size-4 text-cyan-400" />} stats={data.sms} />
            <ChannelFlow label="Resend Email" icon={<Mail className="size-4 text-cyan-400" />} stats={data.email} />
          </div>
          <div className={cn("h-56 overflow-y-auto p-3 font-mono text-xs", GLASS)}>
            {data.logs.length === 0 ? (
              <Empty message="No autopilot events yet." />
            ) : (
              <AnimatePresence initial={false}>
                {data.logs.map((log) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 py-0.5">
                    <span className="shrink-0 text-slate-500">{new Date(log.at).toLocaleTimeString()}</span>
                    <span className="w-12 shrink-0 uppercase text-slate-400">{log.channel}</span>
                    <span className={LOG_TONE[log.level]}>{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function OverviewTab({ telemetry, telemetryError }: { telemetry: MasterTelemetry | null; telemetryError: string | null }) {
  const serverTone: Record<ServerStatus, "emerald" | "blue" | "red"> = {
    optimal: "emerald",
    degraded: "blue",
    down: "red",
  };
  return (
    <div className="space-y-6">
      {telemetryError && !telemetry ? <ErrorLine message={`Telemetry unreachable: ${telemetryError}`} /> : null}
      {telemetry ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Active Tenants" value={nf.format(telemetry.activeTenants)} icon={<Users className="size-4" />} />
            <Metric
              label="Aggregate Leads"
              value={nf.format(telemetry.totalLeads)}
              sub={`+${nf.format(telemetry.leadsLast24h)} last 24h`}
              icon={<Layers className="size-4" />}
            />
            <Metric
              label="Live Vapi Streams"
              value={nf.format(telemetry.activeVapiCalls)}
              sub="voice agents on call"
              icon={<Phone className="size-4" />}
              tone={telemetry.activeVapiCalls > 0 ? "cyan" : "red"}
            />
            <Metric
              label="P95 Latency"
              value={`${telemetry.server.p95LatencyMs}ms`}
              sub={`uptime ${formatUptime(telemetry.server.uptimeSeconds)}`}
              icon={<Gauge className="size-4" />}
              tone={telemetry.server.p95LatencyMs > 800 ? "red" : "blue"}
            />
          </div>
          <Panel
            title="Server Health"
            icon={<Server className="size-4" />}
            right={
              <span className="flex items-center gap-2 font-mono text-xs uppercase text-slate-200">
                <StatusDot tone={serverTone[telemetry.server.status]} />
                {telemetry.server.status}
              </span>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["CPU", telemetry.server.cpuPercent, <Cpu key="c" className="size-4" />],
                  ["Memory", telemetry.server.memoryPercent, <Activity key="m" className="size-4" />],
                ] as const
              ).map(([label, pct, icon]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between font-mono text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      {icon}
                      {label}
                    </span>
                    <span className={pct > 85 ? "text-red-400" : "text-cyan-400"}>{pct.toFixed(1)}%</span>
                  </div>
                  <Bar value={pct} max={100} tone={pct > 85 ? "red" : pct > 65 ? "blue" : "cyan"} />
                </div>
              ))}
            </div>
          </Panel>
        </>
      ) : null}
      <AutopilotPanel />
    </div>
  );
}

function TenantFleetTab({ tenants, error }: { tenants: MasterTenant[] | null; error: string | null }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const filtered = useMemo(() => {
    if (!tenants) return [];
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== "all" && t.subscriptionStatus !== statusFilter) return false;
      if (!q) return true;
      return [t.name, t.slug, t.niche, t.heroLoop, t.stripeCustomerId].some((f) => f.toLowerCase().includes(q));
    });
  }, [tenants, query, statusFilter]);

  return (
    <Panel
      title="Tenant Fleet"
      icon={<Users className="size-4" />}
      right={<span className="font-mono text-xs text-slate-400">{nf.format(filtered.length)} shown</span>}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, slug, niche, hero loop, Stripe ID…"
            className="h-11 w-full rounded-xl border border-cyan-500/30 bg-slate-950 py-2 pl-9 pr-3 font-mono text-sm text-cyan-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:shadow-[0_0_16px_-4px_#22d3ee]"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | "all")}
          className="h-11 rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-100 outline-none [color-scheme:dark] focus:border-cyan-400/60"
        >
          <option value="all">All statuses</option>
          {(Object.keys(SUB_STYLES) as SubscriptionStatus[]).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {error && !tenants ? <ErrorLine message={`Tenant registry unreachable: ${error}`} /> : null}
      {tenants && filtered.length === 0 ? <Empty message="No tenants match." /> : null}
      {filtered.length > 0 ? (
        <div className={cn("overflow-x-auto", GLASS)}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-950/90 font-mono text-xs uppercase tracking-[0.18em] text-cyan-400/70">
              <tr>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Niche / Hero Loop</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Last Webhook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/20">
              {filtered.map((t) => (
                <tr key={t.id} className="transition hover:bg-cyan-500/5">
                  <td className="px-4 py-3 text-slate-200">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">/{t.slug}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{t.niche}</div>
                    <div className="font-mono text-xs text-slate-500">{t.heroLoop}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-200">{nf.format(t.leadCount)}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{t.plan}</div>
                    <div className="font-mono text-xs text-slate-500">{usd.format(t.mrrCents / 100)}/mo</div>
                  </td>
                  <td className="px-4 py-3">
                    <SubBadge status={t.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{timeAgo(t.lastWebhookAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

function LeadAnalyticsTab({ telemetry, tenants }: { telemetry: MasterTelemetry | null; tenants: MasterTenant[] | null }) {
  const byState = useMemo(() => [...(telemetry?.leadsByState ?? [])].sort((a, b) => b.count - a.count), [telemetry]);
  const byNiche = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tenants ?? []) m.set(t.niche, (m.get(t.niche) ?? 0) + t.leadCount);
    return [...m.entries()].map(([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count);
  }, [tenants]);
  const topTenants = useMemo(() => [...(tenants ?? [])].sort((a, b) => b.leadCount - a.leadCount).slice(0, 8), [tenants]);
  const maxState = byState[0]?.count ?? 0;
  const maxNiche = byNiche[0]?.count ?? 0;
  const maxTenant = topTenants[0]?.leadCount ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Leads by State" icon={<BarChart3 className="size-4" />}>
        {byState.length === 0 ? (
          <Empty message="No state data reported." />
        ) : (
          <div className="space-y-3">
            {byState.map((s) => (
              <div key={s.state}>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-200">{s.state}</span>
                  <span className="text-cyan-400">{nf.format(s.count)}</span>
                </div>
                <Bar value={s.count} max={maxState} />
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Leads by Niche" icon={<Layers className="size-4" />}>
        {byNiche.length === 0 ? (
          <Empty message="No tenant lead data." />
        ) : (
          <div className="space-y-3">
            {byNiche.map((n) => (
              <div key={n.niche}>
                <div className="mb-1 flex justify-between font-mono text-xs">
                  <span className="text-slate-200">{n.niche}</span>
                  <span className="text-cyan-400">{nf.format(n.count)}</span>
                </div>
                <Bar value={n.count} max={maxNiche} />
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Top Producing Tenants" icon={<Activity className="size-4" />} className="lg:col-span-2">
        {topTenants.length === 0 ? (
          <Empty message="No tenants yet." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topTenants.map((t, i) => (
              <div key={t.id} className={cn("flex items-center gap-3 p-3", GLASS)}>
                <span className="w-6 font-mono text-sm text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-200">{t.name}</span>
                    <span className="font-mono text-cyan-400">{nf.format(t.leadCount)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={t.leadCount} max={maxTenant} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MasterBillingTab({ tenants, error }: { tenants: MasterTenant[] | null; error: string | null }) {
  const summary = useMemo(() => {
    const list = tenants ?? [];
    const counts: Record<SubscriptionStatus, number> = {
      active: 0,
      trialing: 0,
      past_due: 0,
      canceled: 0,
      incomplete: 0,
      unpaid: 0,
    };
    let mrr = 0;
    let atRisk = 0;
    for (const t of list) {
      counts[t.subscriptionStatus] += 1;
      if (t.subscriptionStatus === "active") mrr += t.mrrCents;
      if (t.subscriptionStatus === "past_due" || t.subscriptionStatus === "unpaid") atRisk += t.mrrCents;
    }
    const attention = list.filter((t) => ["past_due", "unpaid", "incomplete"].includes(t.subscriptionStatus));
    return { counts, mrr, atRisk, attention, total: list.length };
  }, [tenants]);

  if (error && !tenants) return <ErrorLine message={`Billing data unreachable: ${error}`} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active MRR" value={usd.format(summary.mrr / 100)} sub="from active subscriptions" icon={<CreditCard className="size-4" />} />
        <Metric label="ARR Run-Rate" value={usd.format((summary.mrr * 12) / 100)} icon={<BarChart3 className="size-4" />} />
        <Metric
          label="MRR at Risk"
          value={usd.format(summary.atRisk / 100)}
          sub="past due + unpaid"
          icon={<AlertTriangle className="size-4" />}
          tone={summary.atRisk > 0 ? "red" : "cyan"}
        />
        <Metric
          label="Paying / Total"
          value={`${summary.counts.active}/${summary.total}`}
          sub={`${summary.counts.trialing} trialing`}
          icon={<Users className="size-4" />}
        />
      </div>
      <Panel title="Subscription Mix" icon={<Layers className="size-4" />}>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(summary.counts) as SubscriptionStatus[]).map((s) => (
            <div key={s} className={cn("p-3 text-center", GLASS)}>
              <div className="font-mono text-2xl tabular-nums text-slate-200">{summary.counts[s]}</div>
              <div className="mt-1">
                <SubBadge status={s} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Needs Attention" icon={<AlertTriangle className="size-4 text-red-400" />}>
        {summary.attention.length === 0 ? (
          <Empty message="All subscriptions in good standing." />
        ) : (
          <div className="divide-y divide-cyan-500/20">
            {summary.attention.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1 text-slate-200">{t.name}</span>
                <span className="font-mono text-xs text-slate-500">{t.stripeCustomerId}</span>
                <span className="font-mono text-xs text-red-400">{usd.format(t.mrrCents / 100)}/mo</span>
                <SubBadge status={t.subscriptionStatus} />
                <span className="font-mono text-xs text-slate-500">
                  renews {t.currentPeriodEnd ? new Date(t.currentPeriodEnd).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "fleet", label: "Tenant Fleet", icon: Users },
  { id: "leads", label: "Lead Analytics", icon: BarChart3 },
  { id: "billing", label: "Master Billing", icon: CreditCard },
  { id: "ops", label: "Ops desk", icon: Radio },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GlobalMasterDashboard({ ops }: { ops?: ReactNode }) {
  const [tab, setTab] = useState<TabId>("overview");
  const telemetry = usePolling<MasterTelemetry>("/api/master/telemetry", 10000);
  const tenants = usePolling<TenantsResponse>("/api/master/tenants", 30000);
  const tenantList = tenants.data?.tenants ?? null;
  const systemOk = telemetry.data?.server.status === "optimal" && !telemetry.error;

  return (
    <MasterCyberFrame>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-mono text-4xl font-bold tracking-[0.25em] text-cyan-400 drop-shadow-[0_0_18px_rgba(34,211,238,0.7)]">
              AXIOM<span className="text-red-500 drop-shadow-[0_0_14px_rgba(239,68,68,0.8)]">//</span>
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Global Master Dashboard</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={cn("flex min-h-11 items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest", GLASS)}>
              <StatusDot tone={systemOk ? "emerald" : telemetry.data ? "blue" : "red"} />
              System {systemOk ? "Optimal" : telemetry.data ? telemetry.data.server.status : "Offline"}
            </div>
            <div className={cn("min-h-11 px-4 py-2 font-mono text-xs text-slate-400", GLASS)}>
              sync {telemetry.data ? timeAgo(telemetry.data.updatedAt) : "—"}
            </div>
            <button
              type="button"
              onClick={() => {
                telemetry.refresh();
                tenants.refresh();
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan-300 shadow-[0_0_20px_-4px_#22d3ee] transition hover:bg-cyan-500/20"
            >
              <RefreshCw className={cn("size-4", (telemetry.loading || tenants.loading) && "animate-spin")} /> Sync
            </button>
          </div>
        </header>

        <nav className={cn("mb-6 flex gap-2 overflow-x-auto p-1.5", GLASS)}>
          {TABS.map(({ id, label, icon: Icon }) => {
            if (id === "ops" && !ops) return null;
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition",
                  active ? "text-cyan-400" : "text-slate-500 hover:text-slate-200",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="axiom-tab"
                    className="absolute inset-0 rounded-xl border border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_-6px_#22d3ee]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative size-4" />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {tab === "overview" ? <OverviewTab telemetry={telemetry.data} telemetryError={telemetry.error} /> : null}
            {tab === "fleet" ? <TenantFleetTab tenants={tenantList} error={tenants.error} /> : null}
            {tab === "leads" ? <LeadAnalyticsTab telemetry={telemetry.data} tenants={tenantList} /> : null}
            {tab === "billing" ? <MasterBillingTab tenants={tenantList} error={tenants.error} /> : null}
            {tab === "ops" ? (
              <div className="[color-scheme:dark] [&_.neon-shell]:min-h-0 [&_.neon-shell]:bg-transparent [&_.neon-shell]:before:hidden [&_.glass-card]:bg-slate-900/60 [&_.glass-card]:backdrop-blur-xl [&_.glass-card]:border [&_.glass-card]:border-cyan-500/30">
                {ops}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </MasterCyberFrame>
  );
}
