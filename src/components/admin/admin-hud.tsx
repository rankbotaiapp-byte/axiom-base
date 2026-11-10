import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { acceptBooking } from "@/lib/axiom/server";
import { useAxiomRing } from "@/components/axiom-ring";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus, Employee, Service, ShopNotice } from "@/lib/axiom/types";

/* ───────────────────────── Obsidian HUD primitives ───────────────────────── */

/** The one card surface every tenant panel uses. */
export const HUD_CARD =
  "rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]";

/** Dark select — no white flash on open (see .admin-select in styles.css). */
export const HUD_SELECT = "admin-select";

export function HudCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn(HUD_CARD, "relative p-4 sm:p-5", className)}>{children}</section>;
}

export function HudHeading({ kicker, title, aside }: { kicker: string; title: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-400/80">{kicker}</p>
        <h3 className="mt-1 font-display text-xl text-slate-100">{title}</h3>
      </div>
      {aside}
    </div>
  );
}

type Tone = "cyan" | "amber" | "emerald" | "rose" | "fuchsia" | "slate";

const TONES: Record<Tone, string> = {
  cyan: "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.35)]",
  amber: "border-amber-400/60 bg-amber-400/10 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.3)]",
  emerald: "border-emerald-400/60 bg-emerald-400/10 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.3)]",
  rose: "border-rose-400/60 bg-rose-400/10 text-rose-300 shadow-[0_0_14px_rgba(251,113,133,0.3)]",
  fuchsia: "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_14px_rgba(232,121,249,0.3)]",
  slate: "border-slate-500/50 bg-slate-500/10 text-slate-300",
};

export function NeonBadge({ tone, pulse, children }: { tone: Tone; pulse?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
        TONES[tone],
      )}
    >
      {pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  pending: "amber",
  confirmed: "cyan",
  completed: "emerald",
  cancelled: "rose",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <NeonBadge tone={STATUS_TONE[status]}>{status}</NeonBadge>;
}

export function HudStat({ label, value, hint, tone = "cyan" }: { label: string; value: string; hint?: string; tone?: Tone }) {
  const glow: Record<Tone, string> = {
    cyan: "text-cyan-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    fuchsia: "text-fuchsia-300",
    slate: "text-slate-200",
  };
  return (
    <div className={cn(HUD_CARD, "p-4")}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className={cn("mt-1.5 font-mono text-2xl tabular-nums tracking-tight sm:text-3xl", glow[tone])}>{value}</p>
      {hint ? <p className="mt-1 font-mono text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* ───────────────────────── Concierge deck ───────────────────────── */

type Triage = { reviewed: string[]; closed: string[] };

function readTriage(slug: string): Triage {
  try {
    const raw = window.localStorage.getItem(`concierge-triage:${slug}`);
    if (!raw) return { reviewed: [], closed: [] };
    const parsed = JSON.parse(raw) as Partial<Triage>;
    return {
      reviewed: Array.isArray(parsed.reviewed) ? parsed.reviewed.slice(-200) : [],
      closed: Array.isArray(parsed.closed) ? parsed.closed.slice(-200) : [],
    };
  } catch {
    return { reviewed: [], closed: [] };
  }
}

function writeTriage(slug: string, next: Triage) {
  try {
    window.localStorage.setItem(`concierge-triage:${slug}`, JSON.stringify(next));
  } catch {
    /* private window — triage still works for this session */
  }
}

type DeckItem =
  | { kind: "booking"; id: string; at: string; appointment: Appointment }
  | { kind: "inquiry"; id: string; at: string; notice: ShopNotice };

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Waveform({ live }: { live: boolean }) {
  return (
    <span className={cn("concierge-wave", live && "is-live")} aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => (
        <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

export function ConciergeDeck({
  slug,
  appointments,
  notices,
  canAct,
  scheduleLocked,
  onReload,
}: {
  slug: string;
  appointments: Appointment[];
  notices: ShopNotice[];
  canAct: boolean;
  scheduleLocked: boolean;
  onReload: () => void;
}) {
  const ring = useAxiomRing();
  const [triage, setTriage] = useState<Triage>({ reviewed: [], closed: [] });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setTriage(readTriage(slug)), [slug]);

  const items = useMemo<DeckItem[]>(() => {
    const bookings: DeckItem[] = appointments
      .filter((a) => a.status === "pending")
      .map((a) => ({ kind: "booking", id: a.id, at: a.startsAt, appointment: a }));
    const inquiries: DeckItem[] = notices
      .filter((n) => n.channel === "inbox" && n.kind === "inquiry")
      .slice(0, 12)
      .map((n) => ({ kind: "inquiry", id: n.id, at: n.createdAt, notice: n }));
    return [...bookings, ...inquiries].sort((a, b) => {
      const ar = triage.reviewed.includes(a.id) ? 1 : 0;
      const br = triage.reviewed.includes(b.id) ? 1 : 0;
      return ar - br;
    });
  }, [appointments, notices, triage.reviewed]);

  const open = items.filter((item) => !triage.closed.includes(item.id));
  const closedCount = items.length - open.length;
  const fresh = open.filter((item) => !triage.reviewed.includes(item.id)).length;

  function update(next: Triage) {
    setTriage(next);
    writeTriage(slug, next);
  }

  function markReviewed(id: string) {
    if (triage.reviewed.includes(id)) return;
    update({ ...triage, reviewed: [...triage.reviewed, id] });
  }

  function close(id: string) {
    update({ ...triage, closed: [...triage.closed.filter((x) => x !== id), id] });
  }

  async function schedule(a: Appointment) {
    setBusy(a.id);
    setError(null);
    try {
      const result = await acceptBooking({ data: { slug, appointmentId: a.id } });
      ring.announce(
        {
          id: `acc-${a.id}`,
          type: "booking_confirmed",
          appointmentId: a.id,
          payload: result.detail,
          createdAt: new Date().toISOString(),
        },
        true,
      );
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule");
    } finally {
      setBusy(null);
    }
  }

  return (
    <HudCard className="overflow-hidden">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
      <HudHeading
        kicker="Voice concierge · live"
        title="Incoming requests"
        aside={
          <div className="flex items-center gap-2">
            {fresh > 0 ? (
              <NeonBadge tone="fuchsia" pulse>
                {fresh} new
              </NeonBadge>
            ) : (
              <NeonBadge tone="slate">Board clear</NeonBadge>
            )}
            <Waveform live={fresh > 0} />
          </div>
        }
      />

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">{error}</p>
      ) : null}

      {open.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-xl border border-dashed border-cyan-500/25 py-10 text-center">
          <Waveform live={false} />
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Listening</p>
          <p className="mt-1 text-sm text-slate-500">New calls and booking requests land here.</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3">
          {open.map((item) => {
            const reviewed = triage.reviewed.includes(item.id);
            const isBooking = item.kind === "booking";
            const name = isBooking ? item.appointment.customerName : item.notice.subject.replace(/^Inquiry\s*[·:-]\s*/i, "");
            return (
              <li
                key={item.id}
                className={cn(
                  "concierge-request rounded-xl border bg-slate-950/70 p-4 transition-all duration-300",
                  reviewed
                    ? "border-slate-700/70 opacity-70"
                    : "border-cyan-500/40 shadow-[0_0_22px_rgba(6,182,212,0.12)]",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {reviewed ? (
                      <NeonBadge tone="slate">Reviewed</NeonBadge>
                    ) : isBooking ? (
                      <NeonBadge tone="amber" pulse>
                        Awaiting confirm
                      </NeonBadge>
                    ) : (
                      <NeonBadge tone="fuchsia" pulse>
                        New inquiry
                      </NeonBadge>
                    )}
                    <NeonBadge tone="cyan">{isBooking ? "Booking" : item.notice.channel}</NeonBadge>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {isBooking ? when(item.at) : ago(item.at)}
                  </span>
                </div>

                <p className="mt-3 text-base font-semibold text-slate-100">{name || "Unknown caller"}</p>
                {isBooking && item.appointment.customerPhone ? (
                  <a
                    href={`tel:${item.appointment.customerPhone}`}
                    className="font-mono text-xs text-cyan-400 underline-offset-4 hover:underline"
                  >
                    {item.appointment.customerPhone}
                  </a>
                ) : null}

                <div className="concierge-transcript mt-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/70">
                    {isBooking ? "Request readout" : "Transcript"}
                  </p>
                  {isBooking ? (
                    <div className="grid gap-0.5 font-mono text-[13px] leading-relaxed text-slate-200">
                      <p>
                        <span className="text-cyan-500">›</span> {item.appointment.serviceName}
                      </p>
                      <p>
                        <span className="text-cyan-500">›</span> Chair: {item.appointment.employeeName}
                      </p>
                      <p>
                        <span className="text-cyan-500">›</span> {when(item.appointment.startsAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="max-h-40 overflow-y-auto whitespace-pre-line font-mono text-[13px] leading-relaxed text-slate-200">
                      {item.notice.body || "No transcript captured."}
                    </p>
                  )}
                </div>

                {canAct ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {isBooking ? (
                      <button
                        type="button"
                        disabled={scheduleLocked || busy === item.id}
                        onClick={() => void schedule(item.appointment)}
                        className="concierge-action h-11 rounded-lg border border-cyan-300 bg-cyan-400 font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.55)] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                        title={scheduleLocked ? "Link payments to confirm bookings" : undefined}
                      >
                        {busy === item.id ? "…" : "Schedule"}
                      </button>
                    ) : (
                      <a
                        href={`/${slug}/book`}
                        className="concierge-action grid h-11 place-items-center rounded-lg border border-cyan-300 bg-cyan-400 font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.55)] hover:bg-cyan-300"
                      >
                        Schedule
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={reviewed}
                      onClick={() => markReviewed(item.id)}
                      className="concierge-action h-11 rounded-lg border border-amber-400/70 bg-amber-400/10 font-mono text-xs font-bold uppercase tracking-[0.14em] text-amber-300 hover:bg-amber-400/20 disabled:opacity-40"
                    >
                      {reviewed ? "Reviewed" : "Mark reviewed"}
                    </button>
                    <button
                      type="button"
                      onClick={() => close(item.id)}
                      className="concierge-action h-11 rounded-lg border border-rose-400/60 bg-rose-500/10 font-mono text-xs font-bold uppercase tracking-[0.14em] text-rose-300 hover:bg-rose-500/20"
                    >
                      Close
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {closedCount > 0 ? (
        <div className="mt-4 flex items-center justify-between border-t border-cyan-500/15 pt-3 font-mono text-[11px] text-slate-500">
          <span>{closedCount} closed from this board</span>
          <button
            type="button"
            onClick={() => update({ ...triage, closed: [] })}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Restore
          </button>
        </div>
      ) : null}
    </HudCard>
  );
}

/* ───────────────────────── Staff oversight / assignment log ───────────────────────── */

type Window = "today" | "week" | "upcoming" | "past";

const WINDOWS: { id: Window; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Next 7 days" },
  { id: "upcoming", label: "All upcoming" },
  { id: "past", label: "Past 7 days" },
];

function inWindow(iso: string, w: Window) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = 86_400_000;
  switch (w) {
    case "today":
      return t >= start.getTime() && t < start.getTime() + day;
    case "week":
      return t >= start.getTime() && t < start.getTime() + 7 * day;
    case "upcoming":
      return t >= now;
    case "past":
      return t < now && t >= now - 7 * day;
  }
}

export function AssignmentLog({
  appointments,
  employees,
  services,
}: {
  appointments: Appointment[];
  employees: Employee[];
  services: Service[];
}) {
  const [chair, setChair] = useState("all");
  const [service, setService] = useState("all");
  const [win, setWin] = useState<Window>("week");
  const seen = useRef<Set<string> | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());

  // Light up rows that arrive between polls.
  useEffect(() => {
    const ids = new Set(appointments.map((a) => `${a.id}:${a.status}`));
    if (seen.current) {
      const added = new Set([...ids].filter((id) => !seen.current!.has(id)).map((id) => id.split(":")[0]!));
      if (added.size > 0) {
        setFlash(added);
        const t = window.setTimeout(() => setFlash(new Set()), 2400);
        seen.current = ids;
        return () => window.clearTimeout(t);
      }
    }
    seen.current = ids;
  }, [appointments]);

  const scoped = useMemo(
    () => appointments.filter((a) => inWindow(a.startsAt, win) && (service === "all" || a.serviceId === service)),
    [appointments, service, win],
  );

  const load = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of scoped) {
      if (a.status === "cancelled") continue;
      counts.set(a.employeeId, (counts.get(a.employeeId) ?? 0) + 1);
    }
    return counts;
  }, [scoped]);
  const peak = Math.max(1, ...load.values());

  const rows = useMemo(
    () =>
      scoped
        .filter((a) => chair === "all" || a.employeeId === chair)
        .sort((a, b) =>
          win === "past"
            ? new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
            : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )
        .slice(0, 40),
    [chair, scoped, win],
  );

  return (
    <HudCard>
      <HudHeading
        kicker="Staff oversight"
        title="Assignment log"
        aside={<span className="font-mono text-[11px] text-slate-500">{rows.length} shown · auto-sync 12s</span>}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Chair</span>
          <select value={chair} onChange={(e) => setChair(e.target.value)} className={HUD_SELECT}>
            <option value="all">All chairs</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)} className={HUD_SELECT}>
            <option value="all">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Time</span>
          <select value={win} onChange={(e) => setWin(e.target.value as Window)} className={HUD_SELECT}>
            {WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {employees.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {employees.map((e) => {
            const n = load.get(e.id) ?? 0;
            const on = chair === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setChair(on ? "all" : e.id)}
                aria-pressed={on}
                className={cn(
                  "group relative min-w-[8.5rem] overflow-hidden rounded-lg border px-3 py-2 text-left transition-all",
                  on
                    ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                    : "border-slate-700/80 bg-slate-950/60 hover:border-cyan-500/50",
                )}
              >
                <span className="block truncate text-sm text-slate-100">{e.displayName}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {n} booked · {e.inviteStatus === "claimed" ? "on station" : "invite pending"}
                </span>
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] transition-all duration-500"
                  style={{ width: `${(n / peak) * 100}%` }}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-cyan-500/20 py-8 text-center font-mono text-xs text-slate-500">
          No assignments in this window.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-cyan-500/10 overflow-hidden rounded-xl border border-cyan-500/15 bg-slate-950/50">
          {rows.map((a) => (
            <li
              key={a.id}
              className={cn(
                "grid grid-cols-[4.75rem_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors duration-700 sm:grid-cols-[6.5rem_1fr_auto]",
                flash.has(a.id) ? "bg-cyan-400/15" : "hover:bg-cyan-400/[0.04]",
              )}
            >
              <span className="font-mono text-[11px] leading-tight text-cyan-300 tabular-nums">
                {new Date(a.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                <br />
                <span className="text-slate-400">
                  {new Date(a.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-slate-100">{a.serviceName}</span>
                <span className="block truncate font-mono text-[11px] text-slate-500">
                  <span className="text-cyan-300">→ {a.employeeName}</span> · {a.customerName}
                </span>
              </span>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ol>
      )}
    </HudCard>
  );
}
