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
import { acceptBooking, listShopEvents } from "@/lib/axiom/server";
import type { AccessMode, ShopEvent } from "@/lib/axiom/types";

export type RingState = "idle" | "pulse" | "flash" | "awaiting" | "solid";

type RingContextValue = {
  state: RingState;
  message: string | null;
  pendingId: string | null;
  setPendingId: (id: string | null) => void;
  announce: (event: ShopEvent, local: boolean) => void;
  accept: () => Promise<void>;
};

const RingContext = createContext<RingContextValue | null>(null);

const CHANNEL_PREFIX = "axiom-ring:";

function channelName(shopId: string) {
  return CHANNEL_PREFIX + shopId;
}

export function useAxiomRing() {
  const ctx = useContext(RingContext);
  if (!ctx) throw new Error("AxiomRingProvider missing");
  return ctx;
}

export function AxiomRingProvider({
  shopId,
  slug,
  ringColor,
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
  const [pendingId, setPendingIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`axiom:pending:${shopId}`);
  });
  const afterRef = useRef<string | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const isStaff = mode === "owner" || mode === "employee";

  const setPendingId = useCallback(
    (id: string | null) => {
      setPendingIdState(id);
      if (typeof window === "undefined") return;
      if (id) sessionStorage.setItem(`axiom:pending:${shopId}`, id);
      else sessionStorage.removeItem(`axiom:pending:${shopId}`);
    },
    [shopId],
  );

  const announce = useCallback(
    (event: ShopEvent, local: boolean) => {
      if (event.type === "booking_request") {
        if (local || event.appointmentId === pendingId) {
          setState("pulse");
          setMessage("Waiting for confirmation");
        } else if (isStaff) {
          setState("flash");
          window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setState("awaiting"), 1100);
          setMessage("New booking request");
        }
      }
      if (event.type === "booking_confirmed") {
        if (!isStaff && (local || event.appointmentId === pendingId)) {
          setState("flash");
          window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setState("solid"), 1100);
          setMessage("You're booked");
        } else if (isStaff) {
          setState("solid");
          setMessage("Booking confirmed");
        }
      }
      if (typeof window !== "undefined" && local) {
        try {
          const ch = new BroadcastChannel(channelName(shopId));
          ch.postMessage(event);
          ch.close();
        } catch {
          /* BroadcastChannel optional */
        }
      }
    },
    [isStaff, pendingId, shopId],
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
        for (const e of ordered) announce(e, false);
      } catch {
        /* poll is best-effort */
      }
    };
    const id = window.setInterval(tick, 1400);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [announce, slug]);

  const accept = useCallback(async () => {
    if (!pendingId) {
      const events = await listShopEvents({ data: { slug } });
      const latest = events.find((e) => e.type === "booking_request");
      if (!latest?.appointmentId) return;
      await acceptBooking({ data: { slug, appointmentId: latest.appointmentId } });
      announce(
        {
          id: latest.id,
          type: "booking_confirmed",
          appointmentId: latest.appointmentId,
          createdAt: new Date().toISOString(),
        },
        true,
      );
      return;
    }
    await acceptBooking({ data: { slug, appointmentId: pendingId } });
    announce(
      {
        id: `local-${Date.now()}`,
        type: "booking_confirmed",
        appointmentId: pendingId,
        createdAt: new Date().toISOString(),
      },
      true,
    );
  }, [announce, pendingId, slug]);

  const value = useMemo(
    () => ({ state, message, pendingId, setPendingId, announce, accept }),
    [state, message, pendingId, setPendingId, announce, accept],
  );

  return (
    <RingContext.Provider value={value}>
      <div style={{ ["--ring-color" as string]: ringColor }}>{children}</div>
    </RingContext.Provider>
  );
}

export function AxiomRing() {
  const { state, message } = useAxiomRing();
  return (
    <>
      <div className="axiom-ring" data-state={state} aria-hidden="true" />
      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
