"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useVelocity, type PanInfo } from "framer-motion";
import { AxiomBotCanvas } from "@/components/axiom/AxiomBotCanvas";
import { authClient, getBearerToken } from "@/lib/auth/client";

export type OrbitAnchor = { x: number; y: number };

export type AxiomDeskTelemetry = {
  trials?: number | null;
  creditSpend?: number | null;
  netProfit?: number | null;
  authError?: string | null;
};

export type AxiomAssistantWidgetProps = AxiomDeskTelemetry & {
  onAnchor?: (point: OrbitAnchor | null) => void;
};

type DeskMetrics = {
  trials: number | null;
  creditSpend: number | null;
  netProfit: number | null;
  authError: string | null;
  lastDispatch: string;
};

const IGNITION_VIBRATION = [90, 35, 30, 25, 45, 25, 35, 30, 25, 25, 35, 30, 20];
const HOVER_PULSE_VIBRATION = [18, 40, 24, 40, 18];
const DRAG_VIBRATION = [15, 30];
const DRAG_SETTLE_VIBRATION = [40];
const CLING_VIBRATION = [20, 40, 20];
const DROPLET_SPRING = { type: "spring" as const, stiffness: 400, damping: 25 };

type TrailSpark = {
  id: number;
  x: number;
  y: number;
  drift: number;
  color: string;
};

function triggerVibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported or restricted browser contexts
    }
  }
}

async function deskToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("better-auth.session_token");
  if (stored) return stored;
  const bearer = getBearerToken();
  if (bearer) return bearer;
  try {
    const session = await authClient.getSession();
    return session.data?.session?.token ?? null;
  } catch {
    return null;
  }
}

function money(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function dispatchLine(metrics: DeskMetrics): string {
  if (metrics.authError) return metrics.authError;
  if (metrics.trials == null || metrics.netProfit == null) return metrics.lastDispatch;
  return `${metrics.trials} trials active • $${metrics.netProfit.toFixed(2)} net margin`;
}

export function AxiomAssistantWidget({
  trials,
  creditSpend,
  netProfit,
  authError,
  onAnchor,
}: AxiomAssistantWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [thrusters, setThrusters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [blinkToken, setBlinkToken] = useState(0);
  const [celebrateToken, setCelebrateToken] = useState(0);
  const [sweepStatus, setSweepStatus] = useState<string | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sparks, setSparks] = useState<TrailSpark[]>([]);
  const [metrics, setMetrics] = useState<DeskMetrics>({
    trials: trials ?? null,
    creditSpend: creditSpend ?? null,
    netProfit: netProfit ?? null,
    authError: authError ?? null,
    lastDispatch: authError || "Awaiting master desk session...",
  });

  const widgetRef = useRef<HTMLButtonElement | null>(null);
  const lookRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  /** Shared with WebGL — mutated on pointer move, never setState. */
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const velocityX = useVelocity(dragX);
  const velocityY = useVelocity(dragY);
  const stretchX = useMotionValue(1);
  const stretchY = useMotionValue(1);
  const dragTravel = useRef(0);
  const dragging = useRef(false);
  const clung = useRef(false);
  const restBox = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const stretchAnim = useRef<Array<{ stop: () => void }>>([]);
  const dragVibe = useRef<number | null>(null);
  const sparkId = useRef(0);
  const sparkTimers = useRef<number[]>([]);
  const anchorFrame = useRef(0);

  useEffect(() => {
    if (trials === undefined && creditSpend === undefined && netProfit === undefined && authError === undefined) return;
    setMetrics((prev) => {
      const next: DeskMetrics = {
        trials: trials === undefined ? prev.trials : trials,
        creditSpend: creditSpend === undefined ? prev.creditSpend : creditSpend,
        netProfit: netProfit === undefined ? prev.netProfit : netProfit,
        authError: authError === undefined ? prev.authError : authError,
        lastDispatch: prev.lastDispatch,
      };
      next.lastDispatch = dispatchLine(next);
      return next;
    });
  }, [trials, creditSpend, netProfit, authError]);

  const trialRevenue = metrics.trials ?? 0;
  const eyeMood: "ALERT" | "JOYFUL" | "STEADY" = metrics.authError
    ? "ALERT"
    : metrics.trials == null || metrics.trials === 0
      ? "STEADY"
      : (metrics.creditSpend ?? 0) > trialRevenue
        ? "ALERT"
        : (metrics.netProfit ?? 0) >= 0
          ? "JOYFUL"
          : "ALERT";

  const fetchDeskTelemetry = useCallback(async () => {
    try {
      const token = await deskToken();
      const res = await fetch("/api/master/telemetry", {
        method: "GET",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json()) as {
        error?: string;
        trials?: number;
        creditSpend?: number;
        netProfit?: number;
        lastDispatch?: string;
      };
      if (!res.ok) {
        const reason = data?.error || `Desk refused (${res.status})`;
        setMetrics({
          trials: null,
          creditSpend: null,
          netProfit: null,
          authError: reason,
          lastDispatch: reason,
        });
        return;
      }
      const trials = data.trials ?? 0;
      const netProfit = data.netProfit ?? 0;
      setMetrics({
        trials,
        creditSpend: data.creditSpend ?? 0,
        netProfit,
        authError: null,
        lastDispatch: data.lastDispatch ?? `${trials} trials active • $${netProfit.toFixed(2)} net margin`,
      });
    } catch {
      setMetrics((prev) => ({
        ...prev,
        authError: "Desk telemetry unreachable",
        lastDispatch: "Desk telemetry unreachable",
      }));
    }
  }, []);

  useEffect(() => {
    void fetchDeskTelemetry();
  }, [fetchDeskTelemetry]);

  const pokeBlink = useCallback(() => {
    setBlinkToken((n) => n + 1);
  }, []);

  const handleOpen = () => {
    triggerVibrate(IGNITION_VIBRATION);
    pokeBlink();
    setIsOpen(true);
    void fetchDeskTelemetry();
  };

  const handleClose = useCallback(() => {
    triggerVibrate(0);
    setBlinkToken((n) => n + 1);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    let pulseCount = 0;
    const interval = window.setInterval(() => {
      pulseCount += 1;
      if (pulseCount > 4) {
        window.clearInterval(interval);
        return;
      }
      triggerVibrate(HOVER_PULSE_VIBRATION);
    }, 1600);
    return () => {
      window.clearInterval(interval);
      triggerVibrate(0);
    };
  }, [isOpen]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const node = lookRef.current ?? widgetRef.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const spanX = Math.max(rect.width * 0.9, window.innerWidth * 0.22);
        const spanY = Math.max(rect.height * 0.9, window.innerHeight * 0.22);
        pointerRef.current.x = Math.max(-1, Math.min(1, (event.clientX - centerX) / spanX));
        pointerRef.current.y = Math.max(-1, Math.min(1, (event.clientY - centerY) / spanY));
        return;
      }
      // Fallback NDC when the look target is unmounted mid-transition.
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const stopDragHaptic = useCallback(() => {
    if (dragVibe.current != null) {
      window.clearInterval(dragVibe.current);
      dragVibe.current = null;
    }
    triggerVibrate(0);
  }, []);

  const publishAnchor = useCallback(() => {
    if (!onAnchor) return;
    if (anchorFrame.current) return;
    anchorFrame.current = window.requestAnimationFrame(() => {
      anchorFrame.current = 0;
      const node = widgetRef.current;
      if (!node || isOpen) {
        onAnchor(null);
        return;
      }
      const rect = node.getBoundingClientRect();
      onAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
  }, [isOpen, onAnchor]);

  useEffect(() => {
    if (isOpen) {
      onAnchor?.(null);
      return;
    }
    publishAnchor();
    window.addEventListener("resize", publishAnchor);
    return () => {
      window.removeEventListener("resize", publishAnchor);
      if (anchorFrame.current) window.cancelAnimationFrame(anchorFrame.current);
    };
  }, [isOpen, onAnchor, publishAnchor]);

  useEffect(() => {
    return () => {
      stopDragHaptic();
      for (const timer of sparkTimers.current) window.clearTimeout(timer);
      sparkTimers.current = [];
    };
  }, [stopDragHaptic]);

  const emitTrail = (x: number, y: number) => {
    const id = sparkId.current + 1;
    sparkId.current = id;
    const spark: TrailSpark = {
      id,
      x,
      y,
      drift: (Math.random() - 0.5) * 16,
      color: id % 2 === 0 ? "#00f0ff" : "#d4a348",
    };
    setSparks((prev) => [...prev.slice(-32), spark]);
    const timer = window.setTimeout(() => {
      setSparks((prev) => prev.filter((item) => item.id !== id));
      sparkTimers.current = sparkTimers.current.filter((item) => item !== timer);
    }, 600);
    sparkTimers.current.push(timer);
  };

  const applyDroplet = () => {
    const box = restBox.current;
    if (!box.width) return;
    const left = box.left + dragX.get();
    const top = box.top + dragY.get();
    const rightGap = window.innerWidth - (left + box.width);
    const bottomGap = window.innerHeight - (top + box.height);
    const pull = (gap: number) => Math.max(0, Math.min(1, (64 - gap) / 64));
    const horizontal = Math.max(pull(left), pull(rightGap));
    const vertical = Math.max(pull(top), pull(bottomGap));
    const speedX = Math.min(0.22, Math.abs(velocityX.get()) / 2400);
    const speedY = Math.min(0.22, Math.abs(velocityY.get()) / 2400);
    const alongX = horizontal + speedX;
    const alongY = vertical + speedY;
    const sx = alongX >= alongY ? 1 + alongX * 0.36 : 1 - Math.min(0.14, alongY * 0.14);
    const sy = alongY > alongX ? 1 + alongY * 0.36 : 1 - Math.min(0.14, alongX * 0.14);
    stretchX.set(sx);
    stretchY.set(sy);
    const clinging = Math.max(sx, sy) >= 1.24;
    if (clinging && !clung.current) {
      clung.current = true;
      triggerVibrate(CLING_VIBRATION);
    } else if (!clinging) {
      clung.current = false;
    }
  };

  const releaseDroplet = () => {
    stretchAnim.current.forEach((run) => run.stop());
    stretchAnim.current = [
      animate(stretchX, 1, DROPLET_SPRING),
      animate(stretchY, 1, DROPLET_SPRING),
    ];
  };

  const onHeadDrag = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    dragTravel.current += Math.hypot(info.delta.x, info.delta.y);
    applyDroplet();
    if (dragTravel.current > 4 && !dragging.current) {
      dragging.current = true;
      setIsDragging(true);
      stopDragHaptic();
      triggerVibrate(DRAG_VIBRATION);
      dragVibe.current = window.setInterval(() => triggerVibrate(DRAG_VIBRATION), 120);
    }
    if (!dragging.current) return;
    const node = widgetRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    emitTrail(rect.left + rect.width / 2, rect.bottom - 2);
    publishAnchor();
  };

  const onHeadDragEnd = (_event?: unknown, _info?: unknown) => {
    const moved = dragging.current;
    dragging.current = false;
    setIsDragging(false);
    clung.current = false;
    if (moved) {
      stopDragHaptic();
      triggerVibrate(DRAG_SETTLE_VIBRATION);
      pokeBlink();
    }
    releaseDroplet();
    publishAnchor();
  };

  const onHeadClick = () => {
    if (dragTravel.current > 8) {
      dragTravel.current = 0;
      return;
    }
    dragTravel.current = 0;
    handleOpen();
  };

  const handleDryRunSweep = async () => {
    setIsSweeping(true);
    setSweepStatus(null);
    try {
      const token = await deskToken();
      const res = await fetch("/api/master/autopilot", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        logged?: number;
        shops?: unknown[];
        cues?: unknown[];
      };
      if (!res.ok) {
        const reason = data?.error || `Refused (${res.status})`;
        setSweepStatus(reason);
        if (res.status === 401 || res.status === 403) {
          setMetrics((prev) => ({
            ...prev,
            trials: null,
            creditSpend: null,
            netProfit: null,
            authError: reason,
            lastDispatch: reason,
          }));
        }
      } else {
        const cues = Array.isArray(data.cues) ? data.cues.length : 0;
        const shops = Array.isArray(data.shops) ? data.shops.length : 0;
        const logged = Number(data.logged ?? 0);
        const headline = data.message || "Dry-run sweep complete (0 live messages sent).";
        setSweepStatus(`${headline} ${cues} queued cues across ${shops} shops. ${logged} simulation lines logged.`);
        setCelebrateToken((n) => n + 1);
        pokeBlink();
      }
    } catch {
      setSweepStatus("Sweep request failed");
      pokeBlink();
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div ref={stageRef} className="pointer-events-none fixed inset-0 z-50 select-none" data-axiom-assistant="">
      {sparks.map((spark) => (
        <motion.span
          key={spark.id}
          aria-hidden
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
          style={{
            left: spark.x,
            top: spark.y,
            background: spark.color,
            boxShadow: `0 0 8px ${spark.color}`,
          }}
          initial={{ opacity: 0.95, x: 0, y: 0 }}
          animate={{ opacity: 0, x: spark.drift, y: 26 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="collapsed-head"
            ref={(node) => {
              widgetRef.current = node;
              lookRef.current = node;
            }}
            type="button"
            aria-label="Open Axiom AI Co-Pilot"
            drag
            dragConstraints={stageRef}
            dragElastic={0.35}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            style={{ x: dragX, y: dragY, scaleX: stretchX, scaleY: stretchY }}
            onDragStart={() => {
              dragTravel.current = 0;
              clung.current = false;
              setThrusters(true);
              stretchAnim.current.forEach((run) => run.stop());
              const node = widgetRef.current;
              if (!node) return;
              lookRef.current = node;
              const rect = node.getBoundingClientRect();
              restBox.current = {
                left: rect.left - dragX.get(),
                top: rect.top - dragY.get(),
                width: rect.width / (stretchX.get() || 1),
                height: rect.height / (stretchY.get() || 1),
              };
            }}
            onDrag={onHeadDrag}
            onDragEnd={(event, info) => {
              setThrusters(false);
              onHeadDragEnd(event, info);
            }}
            onClick={onHeadClick}
            onHoverStart={() => setThrusters(true)}
            onHoverEnd={() => {
              if (!dragging.current) setThrusters(false);
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="group pointer-events-auto absolute bottom-6 right-6 flex cursor-grab touch-none flex-col items-center border-0 bg-transparent p-0 focus:outline-none active:cursor-grabbing"
          >
            <div className="relative w-40">
              <AxiomBotCanvas
                mood={eyeMood}
                pointerRef={pointerRef}
                thrusters={thrusters}
                dragging={isDragging}
                focused={thrusters}
                blinkToken={blinkToken}
                celebrateToken={celebrateToken}
              />
            </div>
          </motion.button>
        ) : (
          <motion.section
            key="expanded-rig"
            role="dialog"
            aria-label="Axiom assistant"
            style={{ x: dragX, y: dragY }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="pointer-events-auto absolute bottom-6 right-6 w-[min(100vw-3rem,340px)]"
          >
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: [16, -4, 0] }}
            transition={{ duration: 0.35, times: [0, 0.72, 1], ease: "easeOut" }}
            className="rounded-3xl border border-[#d4a348]/40 bg-[#090a0f]/95 p-5 text-zinc-100 shadow-[0_24px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${eyeMood === "ALERT" ? "animate-ping bg-[#ffb020]" : "animate-pulse bg-[#00ffcc]"}`} />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#d4a348]">Axiom Master Co-Pilot</span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 font-mono text-[11px] text-zinc-300 hover:bg-white/10"
              >
                Collapse (Esc)
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div
                ref={(node) => {
                  lookRef.current = node;
                }}
                className="relative w-[7.6rem] shrink-0"
              >
                <AxiomBotCanvas
                  mood={eyeMood}
                  pointerRef={pointerRef}
                  thrusters
                  focused
                  isExpanded
                  blinkToken={blinkToken}
                  celebrateToken={celebrateToken}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00ffcc]">Axiom Dispatch</p>
                <ul className="space-y-1 font-mono text-[11px] text-zinc-200">
                  <li className="flex items-center justify-between gap-3">
                    <span>Trials</span>
                    <span className="text-[#00ffcc]">{metrics.authError || metrics.trials == null ? "—" : metrics.trials}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Credit spend</span>
                    <span className="text-[#00ffcc]">{metrics.authError ? "—" : money(metrics.creditSpend)}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Net profit</span>
                    <span className="text-[#00ffcc]">{metrics.authError ? "—" : money(metrics.netProfit)}</span>
                  </li>
                </ul>
                <p className={`text-[11px] leading-relaxed ${metrics.authError ? "text-[#ffb020]" : "text-zinc-400"}`}>{metrics.lastDispatch}</p>
                {sweepStatus ? <p className="text-[11px] leading-relaxed text-zinc-200">{sweepStatus}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    pokeBlink();
                    void handleDryRunSweep();
                  }}
                  disabled={isSweeping}
                  className="min-h-11 w-full rounded-xl bg-[#00ffcc] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#04120f] disabled:opacity-50"
                >
                  {isSweeping ? "Sweeping…" : "Run Autopilot Sweep"}
                </button>
              </div>
            </div>
          </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
