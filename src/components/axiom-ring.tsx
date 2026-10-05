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
import { acceptBooking, listShopEvents, setShopRingColor } from "@/lib/axiom/server";
import type { AccessMode, ShopEvent } from "@/lib/axiom/types";

export type RingState = "idle" | "pulse" | "flash" | "awaiting" | "lock" | "solid" | "cycle";

const CYCLE_MS = 1650;

type RingContextValue = {
  state: RingState;
  message: string | null;
  cycle: number;
  pendingId: string | null;
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
  children,
}: {
  shopId: string;
  slug: string;
  ringColor: string;
  mode: AccessMode;
  children: ReactNode;
}) {
  const [state, setState] = useState<RingState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [cycle, setCycle] = useState(0);
  const [color, setColor] = useState(initialColor);
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

  const burst = useCallback((settle: RingState, msg: string | null) => {
    setCycle((n) => n + 1);
    setState("cycle");
    setMessage(msg);
    window.clearTimeout(flashTimer.current);
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
      const dedupeKey = `${event.type}:${event.appointmentId ?? event.id}`;
      if (seenRef.current.has(dedupeKey)) return;
      seenRef.current.add(dedupeKey);

      if (event.type === "ring_color" && event.payload) {
        setColor(event.payload);
        burst("idle", null);
      }
      if (event.type === "booking_request") {
        if (staffRef.current && !local) burst("awaiting", "New booking request");
        else burst("pulse", "Waiting for confirmation");
      }
      if (event.type === "booking_confirmed") {
        burst("idle", staffRef.current ? "Confirmation sent" : "You're booked — locked in");
      }
      if (typeof window !== "undefined" && local) {
        broadcast(shopId, event);
      }
    },
    [burst, shopId],
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
    const confirm = (appointmentId: string, eventId: string) => {
      announce(
        {
          id: eventId,
          type: "booking_confirmed",
          appointmentId,
          payload: null,
          createdAt: new Date().toISOString(),
        },
        true,
      );
    };
    let appointmentId = pendingId;
    let eventId = `local-${Date.now()}`;
    if (!appointmentId) {
      const events = await listShopEvents({ data: { slug } });
      const latest = events.find((e) => e.type === "booking_request");
      if (!latest?.appointmentId) return;
      appointmentId = latest.appointmentId;
      eventId = latest.id;
    }
    confirm(appointmentId, eventId);
    await acceptBooking({ data: { slug, appointmentId } });
  }, [announce, pendingId, slug]);

  const value = useMemo(
    () => ({
      state,
      message,
      cycle,
      pendingId,
      ringColor: color,
      setPendingId,
      setRingColor,
      persistRingColor,
      announce,
      accept,
    }),
    [state, message, cycle, pendingId, color, setPendingId, setRingColor, persistRingColor, announce, accept],
  );

  return (
    <RingContext.Provider value={value}>
      <div style={{ ["--ring-color" as string]: color }}>{children}</div>
    </RingContext.Provider>
  );
}

export function AxiomRing() {
  const { state, message, cycle } = useAxiomRing();
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
    </>
  );
}
