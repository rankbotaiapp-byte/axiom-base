import { useEffect, useState } from 'react'

export type NodeStatus = 'online' | 'patrol' | 'charging' | 'offline'

export interface PerimeterNode {
  id: string
  sector: string
  status: NodeStatus
  battery: number // 0–100
}

export interface ThreatEvent {
  id: number
  at: number // epoch ms
  sector: string
  kind: 'Motion' | 'Thermal' | 'RF probe' | 'Acoustic' | 'Breach attempt'
  severity: 'low' | 'med' | 'high'
}

export interface Telemetry {
  nodes: PerimeterNode[]
  threatsPerHour: number
  history: number[] // last N threat-rate samples, oldest first
  events: ThreatEvent[] // newest first
  startedAt: number | null // null until mounted on the client
}

const SECTORS = ['N-01', 'N-02', 'E-01', 'E-02', 'S-01', 'S-02', 'W-01', 'W-02', 'GATE', 'ROOF', 'DOCK', 'YARD']
const KINDS: ThreatEvent['kind'][] = ['Motion', 'Thermal', 'RF probe', 'Acoustic', 'Breach attempt']

/**
 * Deterministic initial state: identical on server and client,
 * so TanStack Start hydration never mismatches. Randomness starts in the effect.
 */
function initialTelemetry(): Telemetry {
  return {
    nodes: SECTORS.map((sector, i) => ({
      id: `CS-${String(i + 1).padStart(2, '0')}`,
      sector,
      status: i === 7 ? 'charging' : i % 3 === 0 ? 'patrol' : 'online',
      battery: i === 7 ? 34 : 96 - ((i * 7) % 23),
    })),
    threatsPerHour: 14,
    history: [9, 11, 10, 13, 12, 15, 14, 12, 16, 14, 13, 14],
    events: [],
    startedAt: null,
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]

function tick(prev: Telemetry, eventId: number): Telemetry {
  const nodes = prev.nodes.map((n): PerimeterNode => {
    if (n.status === 'offline') return Math.random() < 0.25 ? { ...n, status: 'charging' } : n
    if (n.status === 'charging') {
      const battery = clamp(n.battery + 3 + Math.random() * 3, 0, 100)
      return { ...n, battery, status: battery >= 98 ? 'online' : 'charging' }
    }
    const drain = n.status === 'patrol' ? 0.9 : 0.25
    const battery = clamp(n.battery - drain - Math.random() * 0.4, 0, 100)
    if (battery < 22) return { ...n, battery, status: 'charging' }
    const flip = Math.random() < 0.08
    return { ...n, battery, status: flip ? (n.status === 'patrol' ? 'online' : 'patrol') : n.status }
  })

  const threatsPerHour = clamp(Math.round(prev.threatsPerHour + (Math.random() - 0.5) * 4), 4, 32)
  const history = [...prev.history.slice(1), threatsPerHour]

  const events =
    Math.random() < 0.55
      ? [
          {
            id: eventId,
            at: Date.now(),
            sector: pick(SECTORS),
            kind: pick(KINDS),
            severity: (Math.random() < 0.12 ? 'high' : Math.random() < 0.4 ? 'med' : 'low') as ThreatEvent['severity'],
          },
          ...prev.events,
        ].slice(0, 6)
      : prev.events

  return { ...prev, nodes, threatsPerHour, history, events }
}

/**
 * Simulated perimeter feed. Replace the body with a Supabase realtime
 * channel / websocket when a real fleet is wired in — the return shape stays the same.
 */
export function useSimulatedTelemetry(intervalMs = 1800): Telemetry {
  const [t, setT] = useState(initialTelemetry)

  useEffect(() => {
    let id = 0
    setT((p) => ({ ...p, startedAt: Date.now() }))
    const timer = window.setInterval(() => {
      if (document.hidden) return // no work while the tab is in the background
      setT((p) => tick(p, ++id))
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return t
}

export function summarize(t: Telemetry) {
  const active = t.nodes.filter((n) => n.status === 'online' || n.status === 'patrol').length
  const avgBattery = Math.round(t.nodes.reduce((s, n) => s + n.battery, 0) / t.nodes.length)
  return { active, total: t.nodes.length, avgBattery }
}
