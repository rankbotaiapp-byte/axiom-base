import { useEffect, useState, type ReactNode } from 'react'
import { BackgroundVideo } from './BackgroundVideo'
import { IntentDialog } from './IntentDialog'
import { CYBER_STINGER, INTENT_COPY, type Intent } from './config'
import { summarize, useSimulatedTelemetry, type NodeStatus, type ThreatEvent } from './useTelemetry'

interface Props {
  intent: Intent | undefined
  onIntentChange: (intent: Intent | undefined) => void
}

export function CyberStingerHub({ intent, onIntentChange }: Props) {
  const telemetry = useSimulatedTelemetry()
  const { active, total, avgBattery } = summarize(telemetry)
  const m = CYBER_STINGER.media

  return (
    <div className="cs-root relative isolate min-h-[100svh] overflow-x-clip text-white antialiased">
      <BackgroundVideo src={m.loop} poster={m.poster} portraitSrc={m.portraitLoop} portraitPoster={m.portraitPoster} portraitQuery={m.portraitQuery} />

      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1920px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-10 2xl:px-16">
        <TopBar active={active} total={total} />

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-12 lg:gap-10 lg:py-12 2xl:gap-16">
          {/* ── Hero ─────────────────────────────────────────── */}
          <section className="lg:col-span-6 2xl:col-span-5" aria-labelledby="cs-hero">
            <p className="cs-mono text-[11px] uppercase tracking-[0.3em] text-[#00ffcc] sm:text-xs">{CYBER_STINGER.division}</p>
            <h1 id="cs-hero" className="mt-4 text-[clamp(2.4rem,6vw,5.75rem)] font-bold uppercase leading-[0.92] tracking-tight">
              Autonomous
              <br />
              defense that
              <br />
              <span className="text-[#00ffcc] [text-shadow:0_0_32px_rgba(0,255,204,0.45)]">never sleeps.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg 2xl:text-xl">
              CyberStinger is a self-charging swarm of perimeter drones. Each node patrols, detects and escalates on its own,
              and hands a verified incident to your team in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Cta variant="primary" onClick={() => onIntentChange('demo')}>
                {INTENT_COPY.demo.cta}
              </Cta>
              <Cta variant="secondary" onClick={() => onIntentChange('deploy')}>
                {INTENT_COPY.deploy.cta}
              </Cta>
              <Cta variant="ghost" onClick={() => onIntentChange('contact')}>
                {INTENT_COPY.contact.cta}
              </Cta>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <Spec k="Response" v="< 8 s" />
              <Spec k="Endurance" v="24/7" />
              <Spec k="Coverage" v="200+ ac" />
            </dl>
          </section>

          {/* ── Command center ───────────────────────────────── */}
          <section className="grid gap-4 sm:grid-cols-2 lg:col-span-6 2xl:col-span-7 2xl:grid-cols-3" aria-label="Perimeter telemetry">
            <StatCard label="Active nodes" tag={CYBER_STINGER.telemetryLabel}>
              <div className="flex items-end gap-2">
                <span className="cs-mono text-5xl font-semibold tabular-nums">{active}</span>
                <span className="cs-mono pb-1.5 text-lg text-white/40">/ {total}</span>
              </div>
              <Bar value={(active / total) * 100} />
              <p className="mt-2 text-xs text-white/50">{total - active} docked or charging</p>
            </StatCard>

            <StatCard label="Fleet battery">
              <div className="flex items-end gap-1">
                <span className="cs-mono text-5xl font-semibold tabular-nums">{avgBattery}</span>
                <span className="cs-mono pb-1.5 text-lg text-white/40">%</span>
              </div>
              <Bar value={avgBattery} tone={avgBattery < 40 ? 'amber' : 'cyan'} />
              <p className="mt-2 text-xs text-white/50">Auto-rotation to pads below 22%</p>
            </StatCard>

            <StatCard label="Threat detection" className="sm:col-span-2 2xl:col-span-1">
              <div className="flex items-end gap-2">
                <span className="cs-mono text-5xl font-semibold tabular-nums text-[#f5c518]">{telemetry.threatsPerHour}</span>
                <span className="cs-mono pb-1.5 text-sm text-white/40">events / hr</span>
              </div>
              <Sparkline values={telemetry.history} />
            </StatCard>

            <GlassCard className="sm:col-span-2 2xl:col-span-2">
              <CardHead label="Perimeter nodes" right={<Uptime startedAt={telemetry.startedAt} />} />
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {telemetry.nodes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="cs-mono text-xs text-white/80">{n.id}</span>
                      <StatusDot status={n.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="cs-mono text-[10px] uppercase tracking-wider text-white/40">{n.sector}</span>
                      <span className="cs-mono text-[10px] tabular-nums text-white/60">{Math.round(n.battery)}%</span>
                    </div>
                    <Bar value={n.battery} thin tone={n.status === 'charging' ? 'amber' : 'cyan'} />
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="sm:col-span-2 2xl:col-span-1">
              <CardHead label="Event log" right={<span className="cs-mono text-[10px] text-white/40">Latest 6</span>} />
              <EventLog events={telemetry.events} />
            </GlassCard>
          </section>
        </main>

        <footer className="cs-mono flex flex-col gap-2 border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.2em] text-white/35 sm:flex-row sm:justify-between">
          <span>© {CYBER_STINGER.brand} · Built on Axiom</span>
          <span>Telemetry shown is a demonstration feed</span>
        </footer>
      </div>

      <IntentDialog intent={intent} onClose={() => onIntentChange(undefined)} />
    </div>
  )
}

/* ─────────────────────────── pieces ─────────────────────────── */

function TopBar({ active, total }: { active: number; total: number }) {
  const armed = active / total >= 0.6
  return (
    <header className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Mark />
        <div className="leading-tight">
          <p className="text-sm font-bold uppercase tracking-[0.18em]">{CYBER_STINGER.brand}</p>
          <p className="cs-mono hidden text-[10px] uppercase tracking-[0.2em] text-white/45 sm:block">Autonomous Defense Hub</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <span
          className={`cs-mono flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
            armed ? 'border-[#00ffcc]/40 text-[#00ffcc]' : 'border-[#f5c518]/40 text-[#f5c518]'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`cs-ping absolute inline-flex h-full w-full rounded-full ${armed ? 'bg-[#00ffcc]' : 'bg-[#f5c518]'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${armed ? 'bg-[#00ffcc]' : 'bg-[#f5c518]'}`} />
          </span>
          <span className="hidden min-[400px]:inline">{armed ? 'Perimeter armed' : 'Reduced coverage'}</span>
        </span>
        <Clock />
      </div>
    </header>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
      <path d="M16 2 29 9.5v13L16 30 3 22.5v-13Z" fill="none" stroke="#00ffcc" strokeWidth="1.5" />
      <path d="M16 8v10m0 0-4 6m4-6 4 6" stroke="#f5c518" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="18" r="2" fill="#00ffcc" />
    </svg>
  )
}

/** Client-only clock: renders a placeholder on the server to keep hydration stable. */
function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <time className="cs-mono hidden text-xs tabular-nums text-white/60 md:block" dateTime={now?.toISOString()}>
      {now ? `${now.toISOString().slice(11, 19)} UTC` : '--:--:-- UTC'}
    </time>
  )
}

function Uptime({ startedAt }: { startedAt: number | null }) {
  const [, force] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [])
  const s = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
  const hms = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  return <span className="cs-mono text-[10px] tabular-nums text-white/40">Session {hms}</span>
}

function Cta({ variant, onClick, children }: { variant: 'primary' | 'secondary' | 'ghost'; onClick: () => void; children: ReactNode }) {
  const base =
    'cs-cta group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] sm:py-3'
  const styles = {
    primary: 'cs-cta-primary bg-[#00ffcc] text-[#030712] shadow-[0_0_0_1px_#00ffcc,0_0_14px_rgba(0,255,204,0.35)]',
    secondary: 'border border-[#00ffcc]/60 bg-[#00ffcc]/[0.06] text-[#00ffcc] backdrop-blur-md hover:bg-[#00ffcc]/[0.12]',
    ghost: 'border border-white/15 bg-white/[0.03] text-white/85 backdrop-blur-md hover:border-[#00ffcc]/60 hover:text-[#00ffcc]',
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 8h10m-4-4 4 4-4 4" />
      </svg>
    </button>
  )
}

function GlassCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`cs-card rounded-2xl p-5 backdrop-blur-md ${className}`}>{children}</div>
}

function CardHead({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="cs-mono text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</h3>
      {right}
    </div>
  )
}

function StatCard({ label, tag, className, children }: { label: string; tag?: string; className?: string; children: ReactNode }) {
  return (
    <GlassCard className={className}>
      <CardHead
        label={label}
        right={tag && <span className="cs-mono rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/40">{tag}</span>}
      />
      <div className="mt-3" aria-live="off">
        {children}
      </div>
    </GlassCard>
  )
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="cs-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
      <dd className="mt-1 text-xl font-semibold sm:text-2xl">{v}</dd>
    </div>
  )
}

function Bar({ value, tone = 'cyan', thin }: { value: number; tone?: 'cyan' | 'amber'; thin?: boolean }) {
  const color = tone === 'amber' ? 'bg-[#f5c518] shadow-[0_0_10px_#f5c518]' : 'bg-[#00ffcc] shadow-[0_0_10px_#00ffcc]'
  return (
    <div className={`mt-3 w-full overflow-hidden rounded-full bg-white/10 ${thin ? 'h-0.5' : 'h-1'}`}>
      <div className={`h-full rounded-full transition-[width] duration-700 ${color}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  )
}

const STATUS: Record<NodeStatus, { c: string; label: string }> = {
  online: { c: 'bg-[#00ffcc]', label: 'Online' },
  patrol: { c: 'bg-sky-400', label: 'Patrolling' },
  charging: { c: 'bg-[#f5c518]', label: 'Charging' },
  offline: { c: 'bg-[#ff3b5c]', label: 'Offline' },
}
function StatusDot({ status }: { status: NodeStatus }) {
  const s = STATUS[status]
  return (
    <span className="flex items-center gap-1.5" title={s.label}>
      <span className="cs-mono hidden text-[9px] uppercase text-white/40 sm:inline">{s.label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${s.c} shadow-[0_0_8px_currentColor]`} />
    </span>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 240
  const h = 56
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - ((v - min) / (max - min || 1)) * (h - 6) - 3] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-14 w-full" preserveAspectRatio="none" role="img" aria-label="Threat rate, last 12 samples">
      <defs>
        <linearGradient id="cs-spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f5c518" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f5c518" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#cs-spark)" />
      <path d={line} fill="none" stroke="#f5c518" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#f5c518" />
    </svg>
  )
}

const SEV: Record<ThreatEvent['severity'], string> = {
  low: 'text-white/50 border-white/15',
  med: 'text-[#f5c518] border-[#f5c518]/40',
  high: 'text-[#ff3b5c] border-[#ff3b5c]/50',
}
function EventLog({ events }: { events: ThreatEvent[] }) {
  if (!events.length) return <p className="cs-mono mt-4 text-xs text-white/35">Listening for perimeter events…</p>
  return (
    <ol className="mt-3 space-y-1.5">
      {events.map((e) => (
        <li key={e.id} className="cs-event-in flex items-center gap-3 rounded-md px-2 py-1.5">
          <span className="cs-mono w-16 shrink-0 text-[10px] tabular-nums text-white/40">{new Date(e.at).toISOString().slice(11, 19)}</span>
          <span className="flex-1 truncate text-xs text-white/80">
            {e.kind} <span className="text-white/40">· {e.sector}</span>
          </span>
          <span className={`cs-mono rounded border px-1.5 text-[9px] uppercase ${SEV[e.severity]}`}>{e.severity}</span>
        </li>
      ))}
    </ol>
  )
}
