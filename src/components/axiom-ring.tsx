import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { acceptBooking, confirmLatestAudit, listShopEvents, setShopRingColor } from "@/lib/axiom/server";
import { pulseHaptic, readFeedback } from "@/lib/axiom/feedback";
import type { AccessMode, ShopEvent } from "@/lib/axiom/types";

export type RingState = "idle" | "pulse" | "flash" | "awaiting" | "lock" | "solid" | "cycle" | "alert";

const CYCLE_MS = 1650;

type RingContextValue = {
  state: RingState;
  message: string | null;
  cycle: number;
  pendingId: string | null;
  incoming: "booking" | "estimate" | null;
  locked: string | null;
  clearLocked: () => void;
  ringColor: string;
  setPendingId: (id: string | null) => void;
  setRingColor: (color: string) => void;
  persistRingColor: (color: string) => Promise<void>;
  announce: (event: ShopEvent, local: boolean) => void;
  accept: () => Promise<void>;
};

const RingContext = createContext<RingContextValue | null>(null);

const CHANNEL_PREFIX = "axiom-ring:";

function channelName(shopId: string) {
  return CHANNEL_PREFIX + shopId;
}

function broadcast(shopId: string, event: ShopEvent) {
  try {
    const ch = new BroadcastChannel(channelName(shopId));
    ch.postMessage(event);
    ch.close();
  } catch {
    /* BroadcastChannel optional */
  }
}

export function useAxiomRing() {
  const ctx = useContext(RingContext);
  if (!ctx) throw new Error("AxiomRingProvider missing");
  return ctx;
}

export function AxiomRingProvider({
  shopId,
  slug,
  ringColor: initialColor,
  mode,
  watchEmployeeId = null,
  children,
}: {
  shopId: string;
  slug: string;
  ringColor: string;
  mode: AccessMode;
  watchEmployeeId?: string | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<RingState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [cycle, setCycle] = useState(0);
  const [color, setColor] = useState(initialColor);
  const [incoming, setIncoming] = useState<"booking" | "estimate" | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const prefsRef = useRef(readFeedback("shop"));
  const [pendingId, setPendingIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`axiom:pending:${shopId}`);
  });
  const afterRef = useRef<string | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const seenRef = useRef(new Set<string>());
  const recentColor = useRef<{ payload: string; at: number } | null>(null);
  const mountedAt = useRef(Date.now());
  const isStaff = mode === "owner" || mode === "employee" || mode === "preview";
  const staffRef = useRef(isStaff);
  staffRef.current = isStaff;

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const setPendingId = useCallback(
    (id: string | null) => {
      setPendingIdState(id);
      if (typeof window === "undefined") return;
      if (id) sessionStorage.setItem(`axiom:pending:${shopId}`, id);
      else sessionStorage.removeItem(`axiom:pending:${shopId}`);
    },
    [shopId],
  );

  const setRingColor = useCallback((next: string) => {
    setColor(next);
  }, []);

  useEffect(() => {
    const sync = () => {
      prefsRef.current = readFeedback("shop");
    };
    window.addEventListener("axiom-feedback", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("axiom-feedback", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const play = useCallback((start: RingState, settle: RingState, msg: string | null) => {
    const flash = !staffRef.current || prefsRef.current.neon;
    window.clearTimeout(flashTimer.current);
    if (!flash) {
      setMessage(msg);
      flashTimer.current = window.setTimeout(() => setMessage(null), CYCLE_MS);
      return;
    }
    setCycle((n) => n + 1);
    setState(start);
    setMessage(msg);
    flashTimer.current = window.setTimeout(() => {
      setState(settle);
      setMessage(null);
    }, CYCLE_MS);
  }, []);

  const announce = useCallback(
    (event: ShopEvent, local: boolean) => {
      if (event.type === "ring_color" && event.payload) {
        const now = Date.now();
        const recent = recentColor.current;
        if (recent && recent.payload === event.payload && now - recent.at < CYCLE_MS + 500) return;
        recentColor.current = { payload: event.payload, at: now };
      }
      const dedupeKey =
        event.type === "audit_confirmed"
          ? `audit_confirmed:${event.payload?.split("|")[0] ?? event.id}`
          : `${event.type}:${event.appointmentId ?? event.id}`;
      if (seenRef.current.has(dedupeKey)) return;
      if (mode === "employee" && event.employeeId && event.employeeId !== watchEmployeeId) {
        seenRef.current.add(dedupeKey);
        return;
      }
      seenRef.current.add(dedupeKey);

      if (event.type === "ring_color" && event.payload) {
        setColor(event.payload);
        if (!staffRef.current || prefsRef.current.neon) play("cycle", "idle", null);
      }
      if (event.type === "booking_request") {
        if (staffRef.current && !local) {
          setIncoming("booking");
          play("awaiting", "awaiting", "New booking request");
          if (prefsRef.current.haptics) pulseHaptic("incoming");
        } else play("pulse", "pulse", "Waiting for confirmation");
      }
      if (event.type === "payment_received") {
        if (staffRef.current) {
          play("alert", "idle", "Payment received");
          if (!local && prefsRef.current.haptics) pulseHaptic("incoming");
        } else play("pulse", "idle", "Payment received");
      }
      if (event.type === "audit_request") {
        if (staffRef.current) {
          setIncoming("estimate");
          play("alert", "idle", "New estimate");
          if (!local && prefsRef.current.haptics) pulseHaptic("incoming");
        } else play("pulse", "idle", "Estimate sent");
      }
      if (event.type === "booking_confirmed" || event.type === "audit_confirmed") {
        const detail =
          event.type === "audit_confirmed"
            ? (event.payload?.split("|").slice(1).join("|") || "Estimate locked in")
            : event.payload || "You're booked — locked in";
        if (staffRef.current) {
          setIncoming(null);
          play("lock", "idle", "Confirmation sent");
          if (prefsRef.current.haptics) pulseHaptic("confirm");
        } else {
          setLocked(detail);
          play("lock", "solid", event.type === "audit_confirmed" ? "Estimate locked in" : "You're booked — locked in");
          pulseHaptic("confirm");
        }
      }
      if (typeof window !== "undefined" && local) {
        broadcast(shopId, event);
      }
    },
    [mode, play, shopId, watchEmployeeId],
  );

  const persistRingColor = useCallback(
    async (next: string) => {
      const event: ShopEvent = {
        id: `ring-${Date.now()}`,
        type: "ring_color",
        appointmentId: null,
        payload: next,
        createdAt: new Date().toISOString(),
      };
      announce(event, true);
      try {
        await setShopRingColor({ data: { slug, ringColor: next } });
      } catch {
        /* local preview still shows the color */
      }
    },
    [announce, slug],
  );

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(channelName(shopId));
      ch.onmessage = (ev: MessageEvent<ShopEvent>) => {
        if (!ev.data?.type) return;
        announce(ev.data, false);
      };
    } catch {
      ch = null;
    }
    return () => ch?.close();
  }, [announce, shopId]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const events = await listShopEvents({
          data: { slug, after: afterRef.current },
        });
        if (cancelled || events.length === 0) return;
        const ordered = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        afterRef.current = ordered[ordered.length - 1]?.createdAt;
        const freshAfter = mountedAt.current - 1500;
        for (const e of ordered) {
          const at = new Date(e.createdAt).getTime();
          if (Number.isFinite(at) && at < freshAfter) continue;
          announce(e, false);
        }
      } catch {
        /* poll is best-effort */
      }
    };
    const id = window.setInterval(tick, 400);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [announce, slug]);

  const accept = useCallback(async () => {
    if (incoming === "estimate") {
      const result = await confirmLatestAudit({ data: slug });
      announce(
        {
          id: `audit-${result.id}`,
          type: "audit_confirmed",
          appointmentId: null,
          payload: `${result.id}|${result.detail}`,
          createdAt: new Date().toISOString(),
        },
        true,
      );
      setIncoming(null);
      return;
    }
    let appointmentId = pendingId;
    if (!appointmentId) {
      const events = await listShopEvents({ data: { slug } });
      const latest = events.find((e) => e.type === "booking_request" && e.appointmentId);
      if (!latest?.appointmentId) return;
      appointmentId = latest.appointmentId;
    }
    const result = await acceptBooking({ data: { slug, appointmentId } });
    announce(
      {
        id: `acc-${appointmentId}`,
        type: "booking_confirmed",
        appointmentId,
        payload: result.detail,
        createdAt: new Date().toISOString(),
      },
      true,
    );
    setIncoming(null);
  }, [announce, incoming, pendingId, slug]);

  const value = useMemo(
    () => ({
      state,
      message,
      cycle,
      pendingId,
      incoming,
      locked,
      clearLocked: () => setLocked(null),
      ringColor: color,
      setPendingId,
      setRingColor,
      persistRingColor,
      announce,
      accept,
    }),
    [state, message, cycle, pendingId, incoming, locked, color, setPendingId, setRingColor, persistRingColor, announce, accept],
  );

  return (
    <RingContext.Provider value={value}>
      <div style={{ ["--ring-color" as string]: color }}>{children}</div>
    </RingContext.Provider>
  );
}

export function AxiomRing() {
  const { state, message, cycle, locked, clearLocked } = useAxiomRing();
  return (
    <>
      <div key={cycle} className="axiom-ring" data-state={state} aria-hidden="true">
        <span className="axiom-ring-bloom" />
        <span className="axiom-ring-edge" />
      </div>
      <AnimatePresence>
        {message ? (
          <motion.div
            key={cycle}
            initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[10000] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]"
          >
            <p className="rounded-full bg-surface/90 px-4 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.1)]">
              {message}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {locked ? (
        <div className="fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(46,230,214,0.45)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Locked in</p>
            <p className="mt-2 text-sm">{locked}</p>
            <button type="button" className="mt-3 text-sm text-muted" onClick={clearLocked}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
