"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useVelocity,
  type PanInfo,
} from "framer-motion";
import type { CompanionTelemetryStatus } from "@/lib/axiom/companion-telemetry";
import { useAxiomTelemetry } from "@/context/AxiomTelemetryContext";
import { useAxiomAudioVibrations } from "@/hooks/useAxiomAudioVibrations";
import { useGracefulVideo } from "@/hooks/useGracefulVideo";

const VIDEO_SRC = "/media/axiom-greeting.mp4";
const POSTER_SRC = "/media/ai-male.png";

const STATUS_HUE: Record<
  CompanionTelemetryStatus,
  {
    border: string;
    borderHot: string;
    inset: string;
    outer: string;
    outerHot: string;
    wash: string;
  }
> = {
  idle: {
    border: "border-cyan-500/35",
    borderHot: "border-cyan-400/70",
    inset: "inset 0 -8px 16px rgba(34,211,238,0.45)",
    outer: "0 0 24px rgba(6,182,212,0.28)",
    outerHot: "0 0 44px rgba(6,182,212,0.6),0 0 80px rgba(0,242,254,0.3)",
    wash: "radial-gradient(circle at 50% 88%, rgba(34,211,238,0.2), transparent 48%)",
  },
  good: {
    border: "border-emerald-400/45",
    borderHot: "border-emerald-300/80",
    inset: "inset 0 -8px 16px rgba(16,185,129,0.55)",
    outer: "0 0 26px rgba(16,185,129,0.4)",
    outerHot: "0 0 48px rgba(16,185,129,0.65),0 0 84px rgba(52,211,153,0.35)",
    wash: "radial-gradient(circle at 50% 88%, rgba(16,185,129,0.28), transparent 48%)",
  },
  warning: {
    border: "border-amber-400/45",
    borderHot: "border-amber-300/80",
    inset: "inset 0 -8px 16px rgba(245,158,11,0.5)",
    outer: "0 0 26px rgba(245,158,11,0.38)",
    outerHot: "0 0 48px rgba(245,158,11,0.6),0 0 84px rgba(251,191,36,0.32)",
    wash: "radial-gradient(circle at 50% 88%, rgba(245,158,11,0.26), transparent 48%)",
  },
  alert: {
    border: "border-[#ff2a3d]/50",
    borderHot: "border-[#ff2a3d]/85",
    inset: "inset 0 -8px 16px rgba(255,42,61,0.5)",
    outer: "0 0 26px rgba(255,42,61,0.42)",
    outerHot: "0 0 48px rgba(255,42,61,0.65),0 0 84px rgba(255,77,94,0.35)",
    wash: "radial-gradient(circle at 50% 88%, rgba(255,42,61,0.28), transparent 48%)",
  },
};

const SIZE_MAP = {
  sm: { frame: "h-28 w-28", label: "text-[10px]", title: "text-xs" },
  md: { frame: "h-40 w-40", label: "text-[10px]", title: "text-sm" },
  lg: { frame: "h-56 w-56 sm:h-64 sm:w-64", label: "text-xs", title: "text-base" },
} as const;

const DROPLET_SPRING = { type: "spring" as const, stiffness: 420, damping: 18, mass: 0.55 };
const JIGGLE_SPRING = { type: "spring" as const, stiffness: 520, damping: 12, mass: 0.4 };

type TrailSpark = {
  id: number;
  x: number;
  y: number;
  drift: number;
  size: number;
  color: string;
};

export type AxiomVideoCompanionProps = {
  size?: keyof typeof SIZE_MAP;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
  /** Viewport-draggable liquid droplet (admin desk). */
  draggable?: boolean;
  /** Tilt toward pointer (local card or global via lookTarget). */
  attentionLook?: boolean;
  /** When set with attentionLook, track this global cursor point instead of local pointer. */
  lookTarget?: { x: number; y: number } | null;
  /** Override telemetry hue; defaults to live AxiomTelemetryContext status. */
  status?: CompanionTelemetryStatus;
  /** Optional live voice stream for AnalyserNode-driven liquid agitation. */
  voiceStream?: MediaStream | null;
  /** Optional media element (file/TTS playback) to tap for audio intensity. */
  voiceMedia?: HTMLMediaElement | null;
  /** Disable audio-reactive liquid (idle bob only). */
  audioReactive?: boolean;
};

/** Cinematic looping water-droplet companion (`/media/axiom-greeting.mp4`). */
export function AxiomVideoCompanion({
  size = "md",
  showLabel = false,
  onClick,
  className = "",
  draggable = false,
  attentionLook = true,
  lookTarget = null,
  status: statusProp,
  voiceStream = null,
  voiceMedia = null,
  audioReactive = true,
}: AxiomVideoCompanionProps) {
  const telemetry = useAxiomTelemetry();
  const status = statusProp ?? telemetry.status;
  const hue = STATUS_HUE[status] ?? STATUS_HUE.idle;
  const reduceMotion = useReducedMotion();
  const { audioIntensity, isSpeaking, bassIntensity } = useAxiomAudioVibrations({
    enabled: audioReactive && !reduceMotion,
    mediaStream: voiceStream,
    mediaElement: voiceMedia,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Always prefer the looping MP4; only hard media errors may fall back to the poster.
  const graceful = useGracefulVideo({
    enabled: true,
    honorReducedMotion: false,
    honorSaveData: false,
    fallbackOnSuspend: false,
    fallbackOnPlayReject: false,
  });
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sparks, setSparks] = useState<TrailSpark[]>([]);
  const [radius, setRadius] = useState("9999px");
  const dragTravel = useRef(0);
  const sparkId = useRef(0);
  const sparkTimers = useRef<number[]>([]);
  const stretchAnim = useRef<Array<{ stop: () => void }>>([]);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const stretchX = useMotionValue(1);
  const stretchY = useMotionValue(1);
  const velocityX = useVelocity(dragX);
  const velocityY = useVelocity(dragY);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const lookScale = useMotionValue(1);

  const MAX_TILT = 15;
  const TILT_LERP = 0.1;
  const IDLE_MS = 1400;

  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const currentTiltRef = useRef({ x: 0, y: 0 });
  const pointerActiveRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const tiltRafRef = useRef<number | null>(null);
  const specularRef = useRef<HTMLDivElement | null>(null);
  const glossPrimaryRef = useRef<HTMLDivElement | null>(null);
  const glossDotRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;

  useEffect(() => {
    if (!graceful.showVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    const play = () => {
      void el.play().catch(() => {
        /* Keep the <video> mounted; browser may still paint frames / poster. */
      });
    };
    play();
    el.addEventListener("loadeddata", play);
    el.addEventListener("canplay", play);
    return () => {
      el.removeEventListener("loadeddata", play);
      el.removeEventListener("canplay", play);
    };
  }, [graceful.showVideo]);

  useEffect(() => {
    return () => {
      for (const timer of sparkTimers.current) window.clearTimeout(timer);
      stretchAnim.current.forEach((run) => run.stop());
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      if (tiltRafRef.current != null) cancelAnimationFrame(tiltRafRef.current);
    };
  }, []);

  /** Sync optional parent-provided lookTarget into the cursor ref */
  useEffect(() => {
    if (!lookTarget) return;
    cursorRef.current = { x: lookTarget.x, y: lookTarget.y };
    pointerActiveRef.current = true;
    if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      pointerActiveRef.current = false;
      cursorRef.current = null;
    }, IDLE_MS);
  }, [lookTarget]);

  /**
   * High-end 3D cursor-tracking tilt engine:
   * window mousemove → normalized delta from companion center → clamped target tilt
   * → rAF lerp damping → perspective(1000px) rotateX/Y + specular shift.
   */
  useEffect(() => {
    if (!attentionLook || reduceMotion) {
      rotateX.set(0);
      rotateY.set(0);
      lookScale.set(1);
      currentTiltRef.current = { x: 0, y: 0 };
      targetTiltRef.current = { x: 0, y: 0 };
      return;
    }

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const computeTargetFromCursor = (clientX: number, clientY: number) => {
      const node = cardRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize by a soft span so far cursors still produce organic tilt
      const spanX = Math.max(rect.width * 1.6, window.innerWidth * 0.22);
      const spanY = Math.max(rect.height * 1.6, window.innerHeight * 0.22);
      const nx = clamp((clientX - cx) / spanX, -1, 1);
      const ny = clamp((clientY - cy) / spanY, -1, 1);
      // Cursor right → positive rotateY; cursor up → negative rotateX (tilt toward cursor)
      targetTiltRef.current = {
        x: clamp(-ny * MAX_TILT, -MAX_TILT, MAX_TILT),
        y: clamp(nx * MAX_TILT, -MAX_TILT, MAX_TILT),
      };
    };

    const armIdleNeutral = () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        pointerActiveRef.current = false;
        cursorRef.current = null;
        targetTiltRef.current = { x: 0, y: 0 };
      }, IDLE_MS);
    };

    const onMove = (event: MouseEvent) => {
      if (draggingRef.current) return;
      cursorRef.current = { x: event.clientX, y: event.clientY };
      pointerActiveRef.current = true;
      computeTargetFromCursor(event.clientX, event.clientY);
      armIdleNeutral();
    };

    const onLeave = () => {
      pointerActiveRef.current = false;
      cursorRef.current = null;
      targetTiltRef.current = { x: 0, y: 0 };
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    };

    const tick = () => {
      // Prefer live window cursor; fall back to last known / lookTarget sync
      if (pointerActiveRef.current && cursorRef.current && !draggingRef.current) {
        computeTargetFromCursor(cursorRef.current.x, cursorRef.current.y);
      } else if (draggingRef.current) {
        targetTiltRef.current = { x: 0, y: 0 };
      }

      const cur = currentTiltRef.current;
      const tgt = targetTiltRef.current;
      cur.x += (tgt.x - cur.x) * TILT_LERP;
      cur.y += (tgt.y - cur.y) * TILT_LERP;

      // Snap near-zero to avoid perpetual micro-motion
      if (Math.abs(cur.x) < 0.01 && Math.abs(tgt.x) < 0.01) cur.x = 0;
      if (Math.abs(cur.y) < 0.01 && Math.abs(tgt.y) < 0.01) cur.y = 0;

      rotateX.set(cur.x);
      rotateY.set(cur.y);

      const mag = Math.hypot(cur.x, cur.y);
      lookScale.set(mag > 0.35 ? 1.02 : 1 + mag * 0.0012);

      // Specular / glass reflection — shift lighting with tilt (DOM, no React re-render)
      const sx = clamp(50 + (cur.y / MAX_TILT) * 36, 8, 92);
      const sy = clamp(28 - (cur.x / MAX_TILT) * 28, 6, 70);
      const strength = 0.22 + Math.min(0.42, (mag / MAX_TILT) * 0.35);
      const specularEl = specularRef.current;
      if (specularEl) {
        specularEl.style.background = `radial-gradient(ellipse 55% 42% at ${sx}% ${sy}%, rgba(255,255,255,${strength}), rgba(0,242,254,${strength * 0.22}) 28%, transparent 58%)`;
        specularEl.style.boxShadow = `inset ${((sx - 50) / 50) * 6}px ${((sy - 30) / 40) * 4}px 18px rgba(255,255,255,${0.08 + strength * 0.2})`;
      }
      const gloss = glossPrimaryRef.current;
      if (gloss) {
        gloss.style.left = `${clamp(sx - 14, 6, 58)}%`;
        gloss.style.top = `${clamp(sy - 6, 4, 36)}%`;
      }
      const glossDot = glossDotRef.current;
      if (glossDot) {
        glossDot.style.left = `${clamp(sx - 18, 4, 62)}%`;
        glossDot.style.top = `${clamp(sy + 2, 8, 42)}%`;
      }

      tiltRafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseleave", onLeave);
    tiltRafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      if (tiltRafRef.current != null) cancelAnimationFrame(tiltRafRef.current);
      tiltRafRef.current = null;
    };
  }, [attentionLook, reduceMotion, rotateX, rotateY, lookScale]);

  const resetLocalTilt = useCallback(() => {
    setHovered(false);
  }, []);

  const emitTrail = useCallback((x: number, y: number) => {
    const id = ++sparkId.current;
    const spark: TrailSpark = {
      id,
      x,
      y,
      drift: (Math.random() - 0.5) * 28,
      size: 3 + Math.random() * 5,
      color: id % 3 === 0 ? "#67e8f9" : id % 2 === 0 ? "#00f2fe" : "#22d3ee",
    };
    setSparks((prev) => [...prev.slice(-40), spark]);
    const timer = window.setTimeout(() => {
      setSparks((prev) => prev.filter((item) => item.id !== id));
      sparkTimers.current = sparkTimers.current.filter((t) => t !== timer);
    }, 700);
    sparkTimers.current.push(timer);
  }, []);

  const applyViscousStretch = useCallback(() => {
    const speedX = Math.min(0.34, Math.abs(velocityX.get()) / 1800);
    const speedY = Math.min(0.34, Math.abs(velocityY.get()) / 1800);
    const dominantX = speedX >= speedY;
    const sx = dominantX ? 1 + speedX * 0.55 : 1 - Math.min(0.16, speedY * 0.35);
    const sy = !dominantX ? 1 + speedY * 0.55 : 1 - Math.min(0.16, speedX * 0.35);
    stretchX.set(sx);
    stretchY.set(sy);
    const deform = Math.max(sx, sy) - 1;
    const round = Math.max(38, 50 - deform * 40);
    setRadius(`${round}% ${100 - round}% ${round + 2}% ${100 - round - 2}% / ${52 + deform * 20}% ${48 - deform * 10}% ${52 + deform * 8}% ${48}%`);
  }, [stretchX, stretchY, velocityX, velocityY]);

  const releaseSurfaceTension = useCallback(() => {
    stretchAnim.current.forEach((run) => run.stop());
    stretchAnim.current = [
      animate(stretchX, [1.12, 0.92, 1.06, 0.98, 1], JIGGLE_SPRING),
      animate(stretchY, [0.88, 1.1, 0.94, 1.04, 1], JIGGLE_SPRING),
    ];
    setRadius("9999px");
  }, [stretchX, stretchY]);

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      dragTravel.current += Math.hypot(info.delta.x, info.delta.y);
      if (!dragging && dragTravel.current > 3) setDragging(true);
      applyViscousStretch();
      const node = cardRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      emitTrail(rect.left + rect.width / 2, rect.bottom - 2);
      if (Math.random() > 0.4) {
        emitTrail(
          rect.left + rect.width * (0.32 + Math.random() * 0.36),
          rect.bottom - 6 + Math.random() * 8,
        );
      }
    },
    [applyViscousStretch, dragging, emitTrail],
  );

  const onDragEnd = useCallback(() => {
    const moved = dragTravel.current > 8;
    setDragging(false);
    releaseSurfaceTension();
    if (!moved) {
      dragTravel.current = 0;
      return;
    }
    dragTravel.current = 0;
  }, [releaseSurfaceTension]);

  const handleActivate = useCallback(() => {
    if (dragTravel.current > 8) {
      dragTravel.current = 0;
      return;
    }
    onClick?.();
  }, [onClick]);

  const dims = SIZE_MAP[size];
  const interactive = typeof onClick === "function";
  const hot = hovered || dragging;
  const glowClass = hot ? hue.borderHot : hue.border;
  const speaking = isSpeaking || audioIntensity > 0.04;
  const ripple = reduceMotion ? 0 : audioIntensity;
  const churn = reduceMotion ? 1 : 1 + bassIntensity * 2.4 + audioIntensity * 1.6;
  const liquidScale = reduceMotion ? 1 : 1 + ripple * 0.055;
  const liquidSquash = reduceMotion ? 1 : 1 + ripple * 0.04;
  const coreGlow = 0.22 + ripple * 0.75;
  const turbFreq = 0.012 + ripple * 0.045;
  const turbScale = 8 + ripple * 28;

  const droplet = (
    <motion.div
      ref={cardRef}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={draggable ? handleActivate : onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={resetLocalTilt}
      drag={draggable && !reduceMotion}
      dragConstraints={draggable ? stageRef : undefined}
      dragElastic={0.28}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 400, bounceDamping: 22 }}
      onDragStart={() => {
        dragTravel.current = 0;
        stretchAnim.current.forEach((run) => run.stop());
      }}
      onDrag={draggable ? onDrag : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={`group relative overflow-visible outline-none [transform-style:preserve-3d] ${interactive || draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
        draggable ? "pointer-events-auto touch-none" : ""
      }`}
      data-companion-voice={speaking ? "speaking" : "idle"}
      style={{
        overflow: "visible",
        x: draggable ? dragX : undefined,
        y: draggable ? dragY : undefined,
        scaleX: draggable ? stretchX : undefined,
        scaleY: draggable ? stretchY : undefined,
        // High-end 3D cursor tilt: perspective(1000px) + clamped rotate + soft scale
        perspective: 1000,
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        scale: reduceMotion || draggable ? undefined : lookScale,
        transformStyle: "preserve-3d",
        willChange: "transform",
        clipPath: "none",
      }}
      animate={
        draggable || reduceMotion
          ? undefined
          : speaking
            ? {
                y: [0, -4 - ripple * 6, 0],
                transition: { duration: Math.max(0.35, 1.1 - ripple * 0.7), repeat: Infinity, ease: "easeInOut" },
              }
            : { y: [0, -6, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }
      }
      transition={
        reduceMotion || draggable
          ? DROPLET_SPRING
          : { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }
      whileHover={
        reduceMotion || dragging || draggable
          ? undefined
          : { scale: 1.05, y: -8 }
      }
      aria-label={showLabel || interactive || draggable ? "Talk to Axiom AI assistant" : undefined}
    >
      {/* Sphere stage — inside tilt/drag motion wrapper */}
      <div
        className={`relative overflow-visible ${dims.frame}`}
        style={{ overflow: "visible", transformStyle: "preserve-3d" }}
      >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id="axiom-liquid-ripple" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={turbFreq}
              numOctaves={2}
              seed={3}
              result="noise"
            >
              {speaking && !reduceMotion ? (
                <animate
                  attributeName="baseFrequency"
                  values={`${turbFreq};${turbFreq + 0.02};${turbFreq}`}
                  dur={`${Math.max(0.25, 0.9 - ripple * 0.55)}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={turbScale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        className={`relative z-[1] isolate h-full w-full overflow-hidden border bg-zinc-950/75 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${glowClass}`}
        data-companion-status={status}
        style={{
          borderRadius: radius,
          transform: `scale3d(${liquidScale}, ${1 / Math.sqrt(liquidScale) * liquidSquash}, 1)`,
          filter: speaking && !reduceMotion ? "url(#axiom-liquid-ripple)" : undefined,
          boxShadow: [
            "inset 0 2px 4px rgba(255,255,255,0.55)",
            "inset 0 0 14px rgba(2,6,23,0.7)",
            hue.inset,
            "0 16px 32px -8px rgba(0,0,0,0.8)",
            hot || speaking ? hue.outerHot : hue.outer,
            speaking
              ? `0 0 ${18 + ripple * 36}px rgba(0,242,254,${0.18 + ripple * 0.45})`
              : null,
          ]
            .filter(Boolean)
            .join(", "),
        }}
      >
        {graceful.showVideo ? (
          <video
            ref={videoRef}
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.08] object-cover object-[50%_42%] bg-zinc-950"
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden
            onError={graceful.onError}
          />
        ) : (
          <div className="axiom-companion-poster-fallback pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden>
            <img
              src={POSTER_SRC}
              alt=""
              className="h-full w-full scale-[1.08] object-cover object-[50%_42%]"
              draggable={false}
            />
            <div className="axiom-companion-poster-glow absolute inset-0" />
          </div>
        )}

        {/* Micro-bubbles — churn faster while speaking */}
        <div
          aria-hidden
          className={`axiom-liquid-bubbles pointer-events-none absolute inset-0 ${speaking ? "is-speaking" : ""}`}
          style={
            {
              ["--bubble-speed" as string]: `${Math.max(0.35, 2.8 / churn)}s`,
              ["--bubble-drift" as string]: `${-6 - bassIntensity * 18}px`,
              opacity: 0.35 + ripple * 0.45,
            } as CSSProperties
          }
        >
          <span className="bubble b1" />
          <span className="bubble b2" />
          <span className="bubble b3" />
          <span className="bubble b4" />
          <span className="bubble b5" />
        </div>

        {/* Neon core resonance */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] h-[42%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform,filter] duration-100"
          style={{
            opacity: coreGlow,
            transform: `translate(-50%, -50%) scale(${0.9 + ripple * 0.35})`,
            background: `radial-gradient(circle, rgba(0,242,254,${0.35 + ripple * 0.5}) 0%, transparent 68%)`,
            filter: `blur(${6 + ripple * 10}px)`,
            boxShadow: speaking
              ? `0 0 ${12 + ripple * 40}px rgba(0,242,254,${0.25 + ripple * 0.55})`
              : undefined,
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            background: hue.wash,
          }}
        />
        {/* Specular glass reflection — shifts with tiltX / tiltY lighting angle */}
        <div
          ref={specularRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[15] rounded-[inherit] mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 32% 22%, rgba(255,255,255,0.28), rgba(0,242,254,0.06) 28%, transparent 58%)",
            boxShadow: "inset 0 2px 18px rgba(255,255,255,0.12)",
          }}
        />
        <div
          ref={glossPrimaryRef}
          aria-hidden
          className="pointer-events-none absolute z-20 h-3 w-6 -rotate-[25deg] rounded-full bg-gradient-to-b from-white/85 to-transparent"
          style={{ left: "18%", top: "12%" }}
        />
        <div
          ref={glossDotRef}
          aria-hidden
          className="pointer-events-none absolute z-20 h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          style={{ left: "14%", top: "18%" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-1 ring-inset ring-white/25"
        />
      </div>

      </div>
    </motion.div>
  );

  const fallbackStyles = (
    <style>{`
      @keyframes axiom-companion-ambient-glow {
        0%, 100% { opacity: 0.45; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.06); }
      }
      .axiom-companion-poster-glow {
        background:
          radial-gradient(circle at 50% 58%, rgba(0, 242, 254, 0.35), transparent 55%),
          radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.12), transparent 40%);
        animation: axiom-companion-ambient-glow 3.2s ease-in-out infinite;
        mix-blend-mode: screen;
      }
      @keyframes axiom-bubble-rise {
        0% { transform: translate3d(0, 18px, 0) scale(0.55); opacity: 0; }
        20% { opacity: 0.7; }
        100% { transform: translate3d(var(--bubble-x, 0px), var(--bubble-drift, -14px), 0) scale(1); opacity: 0; }
      }
      .axiom-liquid-bubbles .bubble {
        position: absolute;
        bottom: 18%;
        width: 5px;
        height: 5px;
        border-radius: 9999px;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(0,242,254,0.35));
        box-shadow: 0 0 6px rgba(0,242,254,0.45);
        animation: axiom-bubble-rise var(--bubble-speed, 2.6s) ease-in infinite;
        will-change: transform, opacity;
      }
      .axiom-liquid-bubbles .b1 { left: 28%; --bubble-x: -4px; animation-delay: 0s; }
      .axiom-liquid-bubbles .b2 { left: 42%; width: 4px; height: 4px; --bubble-x: 3px; animation-delay: 0.35s; }
      .axiom-liquid-bubbles .b3 { left: 55%; width: 6px; height: 6px; --bubble-x: -2px; animation-delay: 0.7s; }
      .axiom-liquid-bubbles .b4 { left: 66%; width: 3px; height: 3px; --bubble-x: 5px; animation-delay: 1.05s; }
      .axiom-liquid-bubbles .b5 { left: 38%; width: 4px; height: 4px; --bubble-x: 1px; animation-delay: 1.4s; }
      .axiom-liquid-bubbles.is-speaking .bubble {
        animation-duration: var(--bubble-speed, 0.8s);
      }
      @media (prefers-reduced-motion: reduce) {
        .axiom-companion-poster-glow { animation: none; opacity: 0.6; }
        .axiom-liquid-bubbles .bubble { animation: none; opacity: 0.25; }
      }
    `}</style>
  );

  if (draggable) {
    return (
      <div
        ref={stageRef}
        className={`pointer-events-none fixed inset-0 z-[60] select-none ${className}`}
        data-axiom-video-companion=""
      >
        {fallbackStyles}
        {sparks.map((spark) => (
          <motion.span
            key={spark.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              left: spark.x,
              top: spark.y,
              width: spark.size,
              height: spark.size,
              background: spark.color,
              boxShadow: `0 0 10px ${spark.color}`,
            }}
            initial={{ opacity: 0.95, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: spark.drift, y: 30, scale: 0.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          />
        ))}
        <div
          className="pointer-events-none absolute bottom-6 right-6 overflow-visible"
          style={{ overflow: "visible", perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          {droplet}
          {showLabel ? (
            <div className="pointer-events-none mt-4 flex flex-col items-center text-center">
              <span className={`font-mono font-semibold uppercase tracking-[0.22em] text-[#00f2fe] ${dims.label}`}>
                AI Assistant
              </span>
              <span className={`mt-0.5 font-bold text-white ${dims.title}`}>Talk to Axiom</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center overflow-visible ${className}`}
      style={{ overflow: "visible", perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      {fallbackStyles}
      {droplet}
      {showLabel ? (
        <div className="mt-5 flex flex-col items-center text-center">
          <span className={`font-mono font-semibold uppercase tracking-[0.22em] text-[#00f2fe] ${dims.label}`}>
            AI Assistant
          </span>
          <span className={`mt-0.5 font-bold text-white ${dims.title}`}>Talk to Axiom</span>
        </div>
      ) : null}
    </div>
  );
}
