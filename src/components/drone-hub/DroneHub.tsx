import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { DroneSceneController, HubMode } from './droneScene'
import { DEFAULT_DRONE_HUB_CONFIG, type CommandMode, type DroneHubConfig } from './config'
import './drone-hub.css'

// useLayoutEffect warns during SSR (TanStack Start); fall back to useEffect there
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const COMMAND_ORDER: CommandMode[] = ['diagnostic', 'thermal', 'route']

/* Route overlay drawn over the video feed: viewBox is 160×90 */
const ROUTE_POINTS: Array<[number, number]> = [
  [12, 78], [44, 58], [78, 64], [112, 34], [148, 16],
]
function smoothPath(pts: Array<[number, number]>) {
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`
  }
  return d
}
const ROUTE_D = smoothPath(ROUTE_POINTS)

interface Telemetry {
  battery: number
  bars: number
  temp: number
  alt: number
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface DroneHubProps {
  config?: DroneHubConfig
}

export function DroneHub({ config = DEFAULT_DRONE_HUB_CONFIG }: DroneHubProps) {
  const rootRef = useRef<HTMLElement>(null)
  const sceneHostRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const wipeRef = useRef<HTMLDivElement>(null)
  const routePathRef = useRef<SVGPathElement>(null)
  const sceneRef = useRef<DroneSceneController | null>(null)
  const gsapCtxRef = useRef<gsap.Context | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const modeRef = useRef<HubMode>('standby')

  const [mode, setMode] = useState<HubMode>('standby')
  const [running, setRunning] = useState(false)
  const [logCount, setLogCount] = useState(0)
  const [wpCount, setWpCount] = useState(0)
  const [thermalOn, setThermalOn] = useState(false)
  const [acquiring, setAcquiring] = useState(false)
  const [prompt, setPrompt] = useState<CommandMode | null>(null)
  const [feedPlaying, setFeedPlaying] = useState(true)
  const [clock, setClock] = useState('--:--:--')
  const [announce, setAnnounce] = useState('')
  // deterministic initial values → no SSR hydration mismatch
  const [tm, setTm] = useState<Telemetry>({ battery: 87, bars: 4, temp: 41.2, alt: 0 })

  /* ---------- Three.js scene: lazy-loaded, client only, fully disposed ---------- */
  useEffect(() => {
    const host = sceneHostRef.current
    const root = rootRef.current
    if (!host || !root) return
    let cancelled = false

    import('./droneScene')
      .then(({ createDroneScene }) => {
        if (cancelled) return
        try {
          sceneRef.current = createDroneScene(host, { reducedMotion: prefersReducedMotion() })
          sceneRef.current.setMode(modeRef.current)
        } catch {
          // No WebGL: the CSS workshop backdrop still carries the look
        }
      })
      .catch(() => {})

    const fine = window.matchMedia('(pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      sceneRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    }
    if (fine) root.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      cancelled = true
      root.removeEventListener('pointermove', onMove)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  /* ---------- GSAP context: entrance + every command timeline ---------- */
  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return
      gsap.from('.dh-in', { y: 22, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'all' })
      // frame never fades: on slow GPUs a long fade reads as a see-through video
      gsap.from('.dh-frame', { y: 26, scale: 0.975, duration: 1, ease: 'power3.out', delay: 0.15, clearProps: 'transform' })
      gsap.from('.dh-cmd', { x: (i: number) => (i % 2 ? 18 : -18), autoAlpha: 0, duration: 0.7, ease: 'power2.out', stagger: 0.07, delay: 0.35, clearProps: 'all' })
      gsap.from('.dh-panel', { autoAlpha: 0, scale: 0.96, duration: 0.6, ease: 'power2.out', stagger: 0.06, delay: 0.6, clearProps: 'all' })
    }, rootRef)
    gsapCtxRef.current = ctx
    return () => {
      timelineRef.current = null
      gsapCtxRef.current = null
      ctx.revert() // kills entrance tweens + any running command timeline
    }
  }, [])

  /* ---------- live telemetry + clock ---------- */
  useEffect(() => {
    const fmt = () => new Date().toISOString().slice(11, 19)
    setClock(fmt())
    const id = window.setInterval(() => {
      setClock(fmt())
      setTm((t) => ({
        battery: Math.max(12, +(t.battery - 0.04).toFixed(2)),
        bars: Math.max(3, Math.min(5, t.bars + (Math.random() < 0.5 ? -1 : 1))),
        temp: +(40.5 + Math.random() * 2.2).toFixed(1),
        alt: modeRef.current === 'standby' ? 0 : Math.min(120, t.alt + 6 + Math.random() * 4),
      }))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  /* ---------- video: play only on screen, respect pause + reduced motion ---------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (prefersReducedMotion()) setFeedPlaying(false)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && v.dataset.userPaused !== '1' && !prefersReducedMotion()) v.play().catch(() => {})
      else v.pause()
    })
    io.observe(v)
    return () => {
      io.disconnect()
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [])

  const toggleFeed = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.dataset.userPaused = '0'
      v.play().catch(() => {})
      setFeedPlaying(true)
    } else {
      v.dataset.userPaused = '1'
      v.pause()
      setFeedPlaying(false)
    }
  }, [])

  /* ---------- command runner ---------- */
  const applyMode = useCallback((next: HubMode) => {
    modeRef.current = next
    setMode(next)
    sceneRef.current?.setMode(next)
  }, [])

  const standby = useCallback(() => {
    timelineRef.current?.kill()
    timelineRef.current = null
    setRunning(false)
    setPrompt(null)
    setThermalOn(false)
    setAcquiring(false)
    setLogCount(0)
    setWpCount(0)
    applyMode('standby')
    setAnnounce('Standby. All commands idle.')
  }, [applyMode])

  const runCommand = useCallback(
    (cmd: CommandMode) => {
      const ctx = gsapCtxRef.current
      if (!ctx) return
      timelineRef.current?.kill()
      setPrompt(null)
      setLogCount(0)
      setWpCount(0)
      setAcquiring(false)
      setRunning(true)
      if (cmd !== 'thermal') setThermalOn(false)
      applyMode(cmd)
      setAnnounce(`${config.commands[cmd].label} started.`)

      ctx.add(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            setRunning(false)
            setPrompt(cmd)
            setAnnounce(`${config.commands[cmd].label} complete. ${config.commands[cmd].prompt.title}`)
          },
        })

        if (cmd === 'diagnostic') {
          config.diagnosticLog.forEach((_, i) => tl.call(() => setLogCount(i + 1), [], 0.35 + i * 0.5))
          tl.to({}, { duration: 0.6 })
        }

        if (cmd === 'thermal') {
          const wipe = wipeRef.current
          if (wipe) {
            tl.set(wipe, { autoAlpha: 1, xPercent: -110 })
            tl.to(wipe, { xPercent: 110, duration: 1.3, ease: 'power2.inOut' })
            tl.to(wipe, { autoAlpha: 0, duration: 0.2 })
          }
          tl.call(() => setThermalOn(true), [], 0.62) // swap palette as the bar crosses centre
          tl.to({}, { duration: 1.6 })
        }

        if (cmd === 'route') {
          tl.call(() => setAcquiring(true), [], 0)
          tl.call(() => setAcquiring(false), [], 1.1)
          const path = routePathRef.current
          if (path) {
            const len = path.getTotalLength()
            tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 3.2, ease: 'power2.inOut' }, 0.3)
          }
          config.waypoints.slice(0, ROUTE_POINTS.length).forEach((_, i) => tl.call(() => setWpCount(i + 1), [], 0.4 + i * 0.7))
          tl.to({}, { duration: 0.5 })
        }

        if (prefersReducedMotion()) tl.progress(1) // jump straight to result
        timelineRef.current = tl
      })
    },
    [applyMode, config],
  )

  /* ---------- hotkeys: 1/2/3 run, Esc → standby ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === 'Escape') return standby()
      const cmd = COMMAND_ORDER.find((m) => config.commands[m].hotkey === e.key)
      if (cmd) runCommand(cmd)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config, runCommand, standby])

  const modeLabel = useMemo(() => (mode === 'standby' ? 'STANDBY' : config.commands[mode].label.toUpperCase()), [mode, config])
  const lowBattery = tm.battery < 25
  const promptCfg = prompt ? config.commands[prompt].prompt : null

  const cmdButton = (cmd: CommandMode, i: number) => {
    const c = config.commands[cmd]
    const active = mode === cmd
    return (
      <button
        key={cmd}
        type="button"
        className="dh-cmd"
        data-accent={cmd === 'thermal' ? 'heat' : cmd === 'route' ? 'red' : 'cyan'}
        data-active={active || undefined}
        data-running={(active && running) || undefined}
        aria-pressed={active}
        onClick={() => runCommand(cmd)}
      >
        <span className="dh-cmd-idx" aria-hidden="true">0{i + 1}</span>
        <span className="dh-cmd-body">
          <span className="dh-cmd-label">{c.label}</span>
          <span className="dh-cmd-sub">{active && running ? 'Running…' : active ? 'Complete' : c.sub}</span>
        </span>
        <kbd className="dh-cmd-key" aria-hidden="true">{c.hotkey}</kbd>
        <span className="dh-cmd-led" aria-hidden="true" />
      </button>
    )
  }

  return (
    <section ref={rootRef} className="dh-root" data-mode={mode} aria-labelledby="dh-title">
      {/* ---------- workshop atmosphere ---------- */}
      <div className="dh-bg" aria-hidden="true">
        <div className="dh-bg-metal" />
        <div className="dh-lamps">
          <span className="dh-lamp dh-lamp--a" />
          <span className="dh-lamp dh-lamp--b" />
          <span className="dh-lamp dh-lamp--c" />
        </div>
        <div ref={sceneHostRef} className="dh-scene" />
        <div className="dh-frost" />
        <div className="dh-vignette" />
      </div>

      <div className="dh-content">
        <header className="dh-head">
          <div className="dh-head-copy">
            <p className="dh-eyebrow dh-in">
              <span className="dh-live-dot" aria-hidden="true" />
              {config.brand} · Tactical Ops <span className="dh-dim">// Live</span>
            </p>
            <h1 id="dh-title" className="dh-title dh-in">{config.headline}</h1>
            <p className="dh-sub dh-in">{config.subhead}</p>
          </div>
          <dl className="dh-chips dh-in">
            <div><dt>Unit</dt><dd>{config.unitName}</dd></div>
            <div><dt>Link</dt><dd>5.8 GHz · AES</dd></div>
            <div><dt>UTC</dt><dd suppressHydrationWarning>{clock}</dd></div>
          </dl>
        </header>

        <div className="dh-stage">
          <div className="dh-rail dh-rail--left" role="group" aria-label="Flight commands">
            {cmdButton('diagnostic', 0)}
            {cmdButton('thermal', 1)}
          </div>

          {/* ---------- cinematic display ---------- */}
          <div className="dh-frame" data-mode={mode}>
            <span className="dh-edge" aria-hidden="true" />
            <span className="dh-corner dh-corner--tl" aria-hidden="true" />
            <span className="dh-corner dh-corner--tr" aria-hidden="true" />
            <span className="dh-corner dh-corner--bl" aria-hidden="true" />
            <span className="dh-corner dh-corner--br" aria-hidden="true" />
            <div className="dh-leds" aria-hidden="true">
              <i className="dh-led dh-led--red" />
              <i className="dh-led dh-led--cyan" />
              <i className="dh-led dh-led--cyan dh-led--slow" />
            </div>

            <div className="dh-screen">
              <video
                ref={videoRef}
                className={`dh-video${thermalOn ? ' dh-video--thermal' : ''}`}
                src={config.videoSrc}
                poster={config.posterSrc}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                aria-label={`${config.unitName} live drone feed`}
              />
              <div className="dh-scanlines" aria-hidden="true" />
              <div ref={wipeRef} className="dh-wipe" aria-hidden="true" />

              {/* route overlay */}
              <svg className="dh-route" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
                <path className="dh-route-shadow" d={ROUTE_D} />
                <path ref={routePathRef} className="dh-route-line" d={ROUTE_D} />
              </svg>
              <div className="dh-wps" aria-hidden="true">
                {ROUTE_POINTS.map(([x, y], i) => (
                  <span
                    key={i}
                    className="dh-wp"
                    data-on={(mode === 'route' && i < wpCount) || undefined}
                    style={{ left: `${(x / 160) * 100}%`, top: `${(y / 90) * 100}%` }}
                  >
                    <b>{config.waypoints[i]?.id}</b>
                  </span>
                ))}
              </div>

              <svg className="dh-reticle" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="30" className="dh-reticle-ring" />
                <circle cx="50" cy="50" r="2" />
                <path d="M50 8v14M50 78v14M8 50h14M78 50h14" />
              </svg>

              {/* telemetry */}
              <div className="dh-hud">
                <div className="dh-panel dh-panel--tl" data-warn={lowBattery || undefined}>
                  <span className="dh-panel-k">Battery</span>
                  <span className="dh-panel-v">{Math.round(tm.battery)}<small>%</small></span>
                  <span className="dh-cells" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => (
                      <i key={i} data-on={i < Math.round(tm.battery / 10) || undefined} />
                    ))}
                  </span>
                  <span className="dh-panel-meta">6S · {(21 + (tm.battery / 100) * 4.2).toFixed(1)}V</span>
                </div>

                <div className="dh-panel dh-panel--tr" data-state={acquiring ? 'acq' : 'lock'}>
                  <span className="dh-panel-k">Signal</span>
                  <span className="dh-bars" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((b) => (
                      <i key={b} data-on={(!acquiring && b <= tm.bars) || undefined} style={{ height: `${b * 20}%` }} />
                    ))}
                  </span>
                  <span className="dh-panel-v dh-panel-v--sm">{acquiring ? 'ACQUIRING' : 'LOCKED'}</span>
                  <span className="dh-panel-meta">{-48 - (5 - tm.bars) * 6} dBm</span>
                </div>

                <div className="dh-panel dh-panel--bl" data-state={mode === 'thermal' ? 'scan' : 'ok'}>
                  <span className="dh-panel-k">Thermal</span>
                  <span className="dh-panel-v">{tm.temp}<small>°C core</small></span>
                  <span className="dh-heatbar" aria-hidden="true">
                    <i style={{ left: `${Math.min(95, ((tm.temp - 20) / 40) * 100)}%` }} />
                  </span>
                  <span className="dh-panel-meta">{mode === 'thermal' ? (thermalOn ? 'IR LIVE · Δ18.4°C HOTSPOT' : 'CALIBRATING IR…') : 'NOMINAL · AMB −6°C'}</span>
                </div>

                <div className="dh-panel dh-panel--br">
                  <span className="dh-panel-k">Mode</span>
                  <span className="dh-panel-v dh-panel-v--sm">{modeLabel}</span>
                  <span className="dh-panel-meta">ALT {Math.round(tm.alt)}m · {config.coords}</span>
                  <span className="dh-panel-actions">
                    <button type="button" className="dh-mini" onClick={toggleFeed} aria-pressed={!feedPlaying}>
                      {feedPlaying ? 'Pause feed' : 'Play feed'}
                    </button>
                    {mode !== 'standby' && (
                      <button type="button" className="dh-mini" onClick={standby}>
                        Standby <kbd>Esc</kbd>
                      </button>
                    )}
                  </span>
                </div>
              </div>

              {mode === 'diagnostic' && (
                <ol className="dh-log" aria-label="Diagnostic log">
                  {config.diagnosticLog.slice(0, logCount).map((line, i) => (
                    <li key={i} data-last={i === config.diagnosticLog.length - 1 || undefined}>
                      <span aria-hidden="true">&gt; </span>{line}
                    </li>
                  ))}
                  {running && <li className="dh-caret" aria-hidden="true">_</li>}
                </ol>
              )}

              {mode === 'route' && (
                <ol className="dh-wplist" aria-label="Route waypoints">
                  {config.waypoints.slice(0, wpCount).map((w) => (
                    <li key={w.id}><b>{w.id}</b> {w.name} <span>{w.dist}</span></li>
                  ))}
                </ol>
              )}

              {promptCfg && prompt && (
                <div className="dh-prompt" role="dialog" aria-labelledby="dh-prompt-title" data-accent={prompt}>
                  <p className="dh-prompt-k">{config.commands[prompt].label} · complete</p>
                  <p id="dh-prompt-title" className="dh-prompt-title">{promptCfg.title}</p>
                  <p className="dh-prompt-body">{promptCfg.body}</p>
                  <div className="dh-prompt-actions">
                    <a className="dh-btn dh-btn--primary" href={config.bookingHref}>{promptCfg.cta} →</a>
                    <button type="button" className="dh-btn dh-btn--ghost" onClick={() => setPrompt(null)}>Keep exploring</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="dh-rail dh-rail--right" role="group" aria-label="Mission commands">
            {cmdButton('route', 2)}
            <a className="dh-cmd dh-cmd--book" href={config.bookingHref} data-accent="book">
              <span className="dh-cmd-idx" aria-hidden="true">→</span>
              <span className="dh-cmd-body">
                <span className="dh-cmd-label">Book a Flight</span>
                <span className="dh-cmd-sub">Pick a date in 60 seconds</span>
              </span>
            </a>
          </div>
        </div>

        <ul className="dh-creds dh-in">
          {config.credentials.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>

      {/* Ironbow false-colour palette for the thermal feed */}
      <svg className="dh-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="dh-thermal" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.02 0.18 0.55 0.86 0.98 1 1" />
            <feFuncG type="table" tableValues="0.01 0.02 0.05 0.25 0.55 0.85 1" />
            <feFuncB type="table" tableValues="0.12 0.42 0.58 0.42 0.08 0.15 0.9" />
          </feComponentTransfer>
        </filter>
      </svg>

      <p className="dh-sr" aria-live="polite">{announce}</p>
    </section>
  )
}

export default DroneHub
