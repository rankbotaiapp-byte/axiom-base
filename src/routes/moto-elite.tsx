/**
 * Apex Midnight — Track-Spec Moto Hub
 * Route: /moto-elite
 *
 * Drop-in TanStack Router / TanStack Start file route.
 * Assets expected in /public/media:
 *   - garage-loop.mp4   (muted, faststart H.264 loop)
 *   - garage-poster.jpg (first-frame poster for instant paint + reduced-motion)
 *
 * Deep-linkable conversion intents (great for ads / QR / SMS):
 *   /moto-elite?intent=dyno | build | fab
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

/* ───────────────────────── Config ───────────────────────── */

const VIDEO_SRC = '/media/garage-loop.mp4'
const POSTER_SRC = '/media/garage-poster.jpg'
// Shared New Era demo endpoint — swap per client.
const LEAD_ENDPOINT = 'https://formspree.io/f/xykrkdky'

const INTENTS = {
  dyno: {
    label: 'Book Dyno Tune',
    code: 'DYN-01',
    blurb: 'Baseline pull, custom fuel + ignition map, three verification runs. Sheet emailed same day.',
    from: 'From $449',
  },
  build: {
    label: 'Configure Build',
    code: 'CFG-02',
    blurb: 'Spec a track-ready package — suspension, exhaust, ECU, brakes. We quote it line by line.',
    from: 'Packages from $2,400',
  },
  fab: {
    label: 'Request Custom Fabrication',
    code: 'FAB-03',
    blurb: 'TIG-welded subframes, titanium headers, one-off brackets. Send the idea, we send the CAD.',
    from: 'Quoted per project',
  },
} as const

type Intent = keyof typeof INTENTS
type MotoSearch = { intent?: Intent }

const isIntent = (v: unknown): v is Intent =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(INTENTS, v)

/* ───────────────────────── Route ───────────────────────── */

export const Route = createFileRoute('/moto-elite')({
  validateSearch: (search: Record<string, unknown>): MotoSearch => ({
    intent: isIntent(search.intent) ? search.intent : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Apex Midnight — Track-Spec Moto Hub' },
      {
        name: 'description',
        content: 'Dyno tuning, track-spec builds and custom fabrication. Book a bay in under a minute.',
      },
      { name: 'theme-color', content: '#030712' },
    ],
    links: [
      { rel: 'preload', as: 'image', href: POSTER_SRC },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: MotoElitePage,
})

/* ───────────────────────── Page ───────────────────────── */

function MotoElitePage() {
  const { intent } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const openIntent = useCallback(
    (next: Intent) => navigate({ search: { intent: next }, resetScroll: false }),
    [navigate],
  )
  const closeIntent = useCallback(
    () => navigate({ search: {}, resetScroll: false, replace: true }),
    [navigate],
  )

  return (
    <div className="mx-root relative min-h-[100svh] w-full overflow-x-clip bg-[#030712] text-slate-100 antialiased">
      <style>{STYLES}</style>
      <CinematicBackground />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1920px] flex-col px-4 pb-8 pt-4 sm:px-8 lg:px-12 2xl:px-20">
        <TopBar />

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 xl:gap-20">
          <Hero onIntent={openIntent} />
          <CommandCenter />
        </main>

        <ServiceRail onIntent={openIntent} />
        <footer className="mx-mono mt-8 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
          <span>Apex Midnight · Track-Spec Moto Hub</span>
          <span>Bay hours 0600 — 0200 · Appointment only</span>
        </footer>
      </div>

      <IntentSheet intent={intent} onClose={closeIntent} />
    </div>
  )
}

/* ─────────────── Cinematic video background ─────────────── */

function CinematicBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true

    // iOS / Safari require the property, not just the attribute, before play().
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true

    const shouldPlay = () => !reduceMotion.matches && !saveData && document.visibilityState === 'visible'

    const sync = () => {
      if (shouldPlay()) {
        const p = video.play()
        if (p) p.catch(() => {/* autoplay blocked → poster stays visible */})
      } else {
        video.pause()
      }
    }

    const onReady = () => setReady(true)

    if (!saveData) {
      video.src = VIDEO_SRC
      video.load()
    }
    video.addEventListener('playing', onReady)
    document.addEventListener('visibilitychange', sync)
    reduceMotion.addEventListener('change', sync)
    sync()

    return () => {
      // Full teardown: stop decode, drop the media resource, release listeners.
      video.removeEventListener('playing', onReady)
      document.removeEventListener('visibilitychange', sync)
      reduceMotion.removeEventListener('change', sync)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <img
        src={POSTER_SRC}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority="high"
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
        poster={POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
      />
      {/* Tactical tint */}
      <div className="absolute inset-0 bg-[#030712]/60" />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.35)_45%,rgba(3,7,18,0.92)_100%)]" />
      {/* Readability ramp on the left (where the headline lives) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/70 via-transparent to-transparent" />
      {/* HUD scanlines */}
      <div className="mx-scan absolute inset-0 opacity-[0.07]" />
    </div>
  )
}

/* ───────────────────────── Top bar ───────────────────────── */

function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="mx-brand-mark grid h-9 w-9 place-items-center rounded-md border border-[#00ffcc]/40 bg-[#00ffcc]/5">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#00ffcc]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 18 12 4l9 14" />
            <path d="M7.5 18h9" />
          </svg>
        </span>
        <div className="leading-none">
          <div className="mx-display whitespace-nowrap text-sm font-bold tracking-[0.16em] sm:text-lg sm:tracking-[0.22em]">APEX MIDNIGHT</div>
          <div className="mx-mono mt-1 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-slate-400 sm:text-[10px] sm:tracking-[0.3em]">Track-spec moto hub</div>
        </div>
      </div>
      <div className="mx-glass mx-mono flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-300 sm:text-[11px]">
        <span className="mx-live h-1.5 w-1.5 rounded-full bg-[#00ffcc]" />
        Bay 02 · Live
      </div>
    </header>
  )
}

/* ───────────────────────── Hero ───────────────────────── */

function Hero({ onIntent }: { onIntent: (i: Intent) => void }) {
  return (
    <section className="max-w-3xl">
      <p className="mx-mono mb-5 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-[#00ffcc]">
        <span className="h-px w-8 bg-[#00ffcc]/70" />
        After-hours performance lab
      </p>
      <h1 className="mx-display text-[clamp(2.5rem,6.2vw,6.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.01em]">
        Built for the
        <br />
        <span className="mx-headline-glow text-[#00ffcc]">last apex</span> of the night.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base 2xl:text-lg">
        Dyno-proven tunes, race-grade builds, and one-off fabrication for riders who measure in tenths.
        Every bike leaves with a printed power sheet and a map you can trust at full lean.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <NeonButton variant="primary" onClick={() => onIntent('dyno')}>
          Book Dyno Tune
        </NeonButton>
        <NeonButton variant="ghost" onClick={() => onIntent('build')}>
          Configure Build
        </NeonButton>
        <NeonButton variant="ghost" onClick={() => onIntent('fab')}>
          Request Custom Fabrication
        </NeonButton>
      </div>

      <dl className="mx-mono mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <Stat k="Bikes tuned" v="1,240+" />
        <Stat k="Avg. gain" v="+14 whp" />
        <Stat k="Turnaround" v="48 hr" />
      </dl>
    </section>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd className="mx-display mt-1.5 text-xl font-semibold normal-case tracking-normal text-slate-100 sm:text-2xl">{v}</dd>
    </div>
  )
}

function NeonButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  variant: 'primary' | 'ghost'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-btn mx-display group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-md px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] transition-[transform,box-shadow,background-color,color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] active:scale-[0.98] ${
        variant === 'primary' ? 'mx-btn-primary text-[#030712]' : 'mx-btn-ghost text-[#00ffcc]'
      }`}
    >
      <span className="relative z-10">{children}</span>
      <svg viewBox="0 0 16 16" className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
      <span aria-hidden className="mx-btn-sweep absolute inset-0" />
    </button>
  )
}

/* ─────────────── Live telemetry (simulated) ─────────────── */

type Telemetry = {
  hp: number
  torque: number
  boost: number
  afr: number
  ect: number
  rpm: number
  curve: number[]
}

function useTelemetry(): Telemetry {
  const [t, setT] = useState<Telemetry>(() => ({
    hp: 211.4,
    torque: 88.6,
    boost: 15.8,
    afr: 12.7,
    ect: 92,
    rpm: 13200,
    curve: Array.from({ length: 40 }, (_, i) => dynoPoint(i / 39)),
  }))

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let phase = 0
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      phase += 0.18
      setT((prev) => {
        const jitter = (amp: number) => (Math.random() - 0.5) * amp
        const sweep = (Math.sin(phase) + 1) / 2 // 0..1
        return {
          hp: clamp(prev.hp + jitter(1.4), 206, 216),
          torque: clamp(prev.torque + jitter(0.8), 85, 92),
          boost: clamp(12.2 + sweep * 6.4 + jitter(0.25), 0, 19),
          afr: clamp(prev.afr + jitter(0.12), 12.2, 13.2),
          ect: clamp(prev.ect + jitter(0.6), 88, 97),
          rpm: Math.round(9000 + sweep * 5200),
          curve: prev.curve.map((v, i) => clamp(v + jitter(1.2), 0, 220) * 0.6 + dynoPoint(i / 39) * 0.4),
        }
      })
    }, 280)
    return () => window.clearInterval(id)
  }, [])

  return t
}

function dynoPoint(x: number) {
  // Smooth S-curve with a top-end roll-off — reads like a real sportbike pull.
  return 40 + 175 * Math.pow(Math.sin((x * Math.PI) / 2), 1.6) - 18 * Math.pow(Math.max(0, x - 0.85) / 0.15, 2)
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function CommandCenter() {
  const t = useTelemetry()
  return (
    <section aria-label="Live dyno telemetry" className="relative">
      <div className="mx-mono mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-400">
        <span>Command center</span>
        <span className="flex items-center gap-2 text-[#00ffcc]">
          <span className="mx-live h-1.5 w-1.5 rounded-full bg-[#00ffcc]" /> Telemetry · 3.6 Hz
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Dyno output — spans full width */}
        <GlassCard className="sm:col-span-2" label="Dyno output" tag="RUN 07 / SAE">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mx-display text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-none tabular-nums">
                {t.hp.toFixed(1)}
                <span className="ml-2 text-lg font-semibold text-slate-400">whp</span>
              </div>
              <div className="mx-mono mt-2 text-xs text-slate-400">
                <span className="text-[#00ffcc]">▲ +14.2</span> vs. baseline · {t.torque.toFixed(1)} lb-ft
              </div>
            </div>
            <div className="mx-mono text-right text-[11px] uppercase tracking-[0.2em] text-slate-400">
              <div>Engine speed</div>
              <div className="mx-display mt-1 text-2xl font-semibold tracking-normal text-slate-100 tabular-nums">
                {t.rpm.toLocaleString()} <span className="text-sm text-slate-400">rpm</span>
              </div>
            </div>
          </div>
          <DynoCurve points={t.curve} />
        </GlassCard>

        <GlassCard label="Boost pressure" tag="MAP SENSOR">
          <BoostGauge psi={t.boost} />
        </GlassCard>

        <GlassCard label="Fuel map status" tag="ECU · FLASHED">
          <FuelMap afr={t.afr} ect={t.ect} />
        </GlassCard>
      </div>
    </section>
  )
}

function GlassCard({
  label,
  tag,
  className = '',
  children,
}: {
  label: string
  tag: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mx-glass mx-card relative overflow-hidden rounded-xl p-4 sm:p-5 2xl:p-6 ${className}`}>
      <span aria-hidden className="mx-corner mx-corner-tl" />
      <span aria-hidden className="mx-corner mx-corner-br" />
      <div className="mx-mono mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.24em]">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{tag}</span>
      </div>
      {children}
    </div>
  )
}

function DynoCurve({ points }: { points: number[] }) {
  const gid = useId().replace(/:/g, '')
  const w = 400
  const h = 90
  const max = 230
  const d = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * w).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-5 h-20 w-full sm:h-24" aria-hidden>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} stroke="white" strokeOpacity="0.06" strokeDasharray="2 4" />
      ))}
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#g${gid})`} />
      <path d={d} fill="none" stroke="#00ffcc" strokeWidth="1.75" vectorEffect="non-scaling-stroke" className="mx-trace" />
    </svg>
  )
}

function BoostGauge({ psi }: { psi: number }) {
  const max = 20
  const pct = clamp(psi / max, 0, 1)
  const r = 52
  const arc = Math.PI * r // semicircle length
  const hot = psi > 18.3
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 70" className="h-[84px] w-[140px] shrink-0" aria-hidden>
        <path d={`M8,62 A${r},${r} 0 0 1 112,62`} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="8" strokeLinecap="round" />
        <path
          d={`M8,62 A${r},${r} 0 0 1 112,62`}
          fill="none"
          stroke={hot ? '#ff3b5c' : '#00ffcc'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={arc * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 280ms linear, stroke 300ms', filter: `drop-shadow(0 0 6px ${hot ? '#ff3b5c' : '#00ffcc'})` }}
        />
      </svg>
      <div>
        <div className="mx-display text-4xl font-bold leading-none tabular-nums">
          {psi.toFixed(1)}
          <span className="ml-1.5 text-sm font-semibold text-slate-400">psi</span>
        </div>
        <div className={`mx-mono mt-2 text-[11px] uppercase tracking-[0.18em] ${hot ? 'text-[#ff3b5c]' : 'text-slate-400'}`}>
          {hot ? 'Near target ceiling' : 'Target 18.0 psi'}
        </div>
      </div>
    </div>
  )
}

function FuelMap({ afr, ect }: { afr: number; ect: number }) {
  // 6x4 "fuel table" — cells light by load; the active cell tracks live AFR.
  const active = Math.round(clamp((afr - 12.2) / 1.0, 0, 1) * 23)
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="mx-display text-xl font-bold tracking-wide text-[#00ffcc]">MAP B · TRACK</span>
        <span className="mx-mono rounded border border-[#00ffcc]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-[#00ffcc]">
          Locked
        </span>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="h-3 rounded-[2px] transition-colors duration-300"
            style={{
              background:
                i === active ? '#00ffcc' : `rgba(0,255,204,${0.06 + ((i % 6) / 5) * 0.16 + Math.floor(i / 6) * 0.04})`,
              boxShadow: i === active ? '0 0 10px #00ffcc' : 'none',
            }}
          />
        ))}
      </div>
      <div className="mx-mono mt-3 flex justify-between text-[11px] text-slate-400">
        <span>
          AFR <b className="font-medium text-slate-100 tabular-nums">{afr.toFixed(2)}</b>
        </span>
        <span>
          ECT <b className="font-medium text-slate-100 tabular-nums">{ect.toFixed(0)}°C</b>
        </span>
        <span>
          Knock <b className="font-medium text-[#00ffcc]">0</b>
        </span>
      </div>
    </div>
  )
}

/* ───────────────────────── Service rail ───────────────────────── */

function ServiceRail({ onIntent }: { onIntent: (i: Intent) => void }) {
  return (
    <section aria-label="Services" className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      {(Object.keys(INTENTS) as Intent[]).map((key) => {
        const s = INTENTS[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => onIntent(key)}
            className="mx-glass mx-card mx-rail group relative overflow-hidden rounded-xl p-5 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
          >
            <div className="mx-mono flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
              <span>{s.code}</span>
              <span className="text-[#00ffcc] opacity-0 transition-opacity duration-300 group-hover:opacity-100">Open →</span>
            </div>
            <div className="mx-display mt-3 text-lg font-semibold uppercase tracking-[0.08em]">{s.label}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.blurb}</p>
            <div className="mx-mono mt-4 text-xs text-[#00ffcc]">{s.from}</div>
          </button>
        )
      })}
    </section>
  )
}

/* ───────────────────────── Intent sheet (lead capture) ───────────────────────── */

function IntentSheet({ intent, onClose }: { intent?: Intent; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Sync URL state → native <dialog>.
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (intent && !dlg.open) {
      setState('idle')
      dlg.showModal()
    } else if (!intent && dlg.open) {
      dlg.close()
    }
  }, [intent])

  // Close on unmount so the top layer never leaks.
  useEffect(() => {
    const dlg = dialogRef.current
    return () => {
      if (dlg?.open) dlg.close()
    }
  }, [])

  const s = intent ? INTENTS[intent] : undefined

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!intent) return
    const data = new FormData(e.currentTarget)
    data.set('intent', intent)
    data.set('source', 'moto-elite')
    setState('sending')
    try {
      const res = await fetch(LEAD_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // backdrop click
      }}
      className="mx-dialog m-auto w-[min(560px,calc(100vw-2rem))] rounded-2xl bg-transparent p-0 text-slate-100 backdrop:bg-[#030712]/70 backdrop:backdrop-blur-sm"
    >
      {s && (
        <div className="mx-glass mx-card relative rounded-2xl p-6 sm:p-8">
          <span aria-hidden className="mx-corner mx-corner-tl" />
          <span aria-hidden className="mx-corner mx-corner-br" />
          <div className="mx-mono flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-slate-500">
            <span>{s.code} · Request</span>
            <button type="button" onClick={onClose} className="rounded px-2 py-1 text-slate-400 hover:text-[#00ffcc]" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mx-display mt-3 text-2xl font-bold uppercase tracking-[0.06em] sm:text-3xl">{s.label}</h2>
          <p className="mt-2 text-sm text-slate-400">{s.blurb}</p>

          {state === 'sent' ? (
            <div className="mt-8 rounded-lg border border-[#00ffcc]/40 bg-[#00ffcc]/5 p-5">
              <div className="mx-display text-lg font-semibold text-[#00ffcc]">Locked in.</div>
              <p className="mt-1 text-sm text-slate-300">A tech will text you within the hour to confirm your bay time.</p>
              <button type="button" onClick={onClose} className="mx-mono mt-4 text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-[#00ffcc]">
                Back to the garage <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-3">
              <Field name="name" label="Name" autoComplete="name" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="phone" label="Mobile" type="tel" autoComplete="tel" required />
                <Field name="email" label="Email" type="email" autoComplete="email" />
              </div>
              <Field name="bike" label="Bike (year / make / model)" placeholder="2024 Yamaha R1M" required />
              <label className="grid gap-1.5">
                <span className="mx-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">Notes</span>
                <textarea
                  name="message"
                  rows={3}
                  className="mx-input resize-none rounded-md px-3 py-2.5 text-sm"
                  placeholder="Current mods, goals, track days coming up…"
                />
              </label>
              {state === 'error' && (
                <p className="text-sm text-[#ff3b5c]">Couldn't send — check your connection and try again.</p>
              )}
              <div className="mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="mx-mono text-[11px] text-slate-500">{s.from} · No deposit to request</span>
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="mx-btn mx-btn-primary mx-display relative overflow-hidden rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#030712] disabled:opacity-60"
                >
                  <span className="relative z-10">{state === 'sending' ? 'Transmitting…' : 'Send request'}</span>
                  <span aria-hidden className="mx-btn-sweep absolute inset-0" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </dialog>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5">
      <span className="mx-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <input {...props} className="mx-input rounded-md px-3 py-2.5 text-sm" />
    </label>
  )
}

/* ───────────────────────── Scoped styles ───────────────────────── */

const STYLES = `
.mx-root { --neon: #00ffcc; --ink: #030712; }
.mx-display { font-family: 'Chakra Petch', ui-sans-serif, system-ui, sans-serif; }
.mx-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }

.mx-glass {
  background: linear-gradient(155deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02) 55%, rgba(0,255,204,0.03));
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.09);
}
.mx-card {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 0 0 1px rgba(0,255,204,0.06),
    0 20px 60px -20px rgba(0,0,0,0.7);
}
.mx-card::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(130deg, rgba(0,255,204,0.55), transparent 30%, transparent 70%, rgba(0,255,204,0.25));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0.55;
}
.mx-rail:hover { box-shadow: 0 0 0 1px rgba(0,255,204,0.35), 0 0 32px -6px rgba(0,255,204,0.45), 0 20px 60px -20px rgba(0,0,0,0.7); }

.mx-corner { position: absolute; width: 14px; height: 14px; border-color: var(--neon); opacity: 0.8; pointer-events: none; }
.mx-corner-tl { top: 8px; left: 8px; border-top: 1.5px solid; border-left: 1.5px solid; }
.mx-corner-br { bottom: 8px; right: 8px; border-bottom: 1.5px solid; border-right: 1.5px solid; }

.mx-btn-primary {
  background: var(--neon);
  box-shadow: 0 0 0 1px var(--neon), 0 0 18px -2px rgba(0,255,204,0.65), inset 0 0 12px rgba(255,255,255,0.35);
}
.mx-btn-primary:hover { box-shadow: 0 0 0 1px var(--neon), 0 0 36px 2px rgba(0,255,204,0.75), inset 0 0 14px rgba(255,255,255,0.5); }
.mx-btn-ghost {
  background: rgba(0,255,204,0.04);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px rgba(0,255,204,0.55), 0 0 0 0 rgba(0,255,204,0);
}
.mx-btn-ghost:hover {
  background: rgba(0,255,204,0.1); color: #eafffa;
  box-shadow: inset 0 0 0 1px var(--neon), 0 0 28px -2px rgba(0,255,204,0.6), inset 0 0 18px rgba(0,255,204,0.18);
}
.mx-btn-sweep {
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%);
  transform: translateX(-120%);
}
.mx-btn:hover .mx-btn-sweep { animation: mx-sweep 900ms ease; }

.mx-headline-glow { text-shadow: 0 0 22px rgba(0,255,204,0.45), 0 0 2px rgba(0,255,204,0.8); }
.mx-brand-mark { box-shadow: 0 0 18px -4px rgba(0,255,204,0.6); }
.mx-live { box-shadow: 0 0 8px var(--neon); animation: mx-pulse 1.6s ease-in-out infinite; }
.mx-trace { filter: drop-shadow(0 0 4px rgba(0,255,204,0.8)); }

.mx-scan {
  background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
}

.mx-input {
  background: rgba(3,7,18,0.55); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;
  transition: border-color 200ms, box-shadow 200ms;
}
.mx-input::placeholder { color: rgba(148,163,184,0.6); }
.mx-input:focus { outline: none; border-color: var(--neon); box-shadow: 0 0 0 3px rgba(0,255,204,0.15), 0 0 16px -4px rgba(0,255,204,0.6); }

.mx-dialog[open] { animation: mx-rise 320ms cubic-bezier(.2,.8,.2,1); }
.mx-dialog[open] > div { background-color: rgba(8,13,26,0.82); }

@keyframes mx-sweep { from { transform: translateX(-120%); } to { transform: translateX(120%); } }
@keyframes mx-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes mx-rise { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .mx-live, .mx-dialog[open], .mx-btn:hover .mx-btn-sweep { animation: none !important; }
}
`
