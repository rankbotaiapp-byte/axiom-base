"use client";

/**
 * OrbitStage — fullscreen video + CSS 3D camera-orbit parallax.
 * Strict video teardown on unmount (pause → clear src → load).
 */
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

type OrbitStageProps = {
  src: string;
  poster?: string;
  maxTilt?: number;
  children?: ReactNode;
};

const IDLE_AFTER_MS = 2200;

export function OrbitStage({ src, poster, maxTilt = 8, children }: OrbitStageProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const input = useRef({ x: 0, y: 0, last: 0 });
  const idleMix = useRef(1);
  const gyroBase = useRef<{ beta: number; gamma: number } | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const spring = { stiffness: 55, damping: 20, mass: 0.9 };
  const sx = useSpring(rawX, spring);
  const sy = useSpring(rawY, spring);

  const rotateY = useTransform(sx, (v) => v * maxTilt);
  const rotateX = useTransform(sy, (v) => -v * maxTilt * 0.7);
  const shiftX = useTransform(sx, (v) => v * -18);
  const shiftY = useTransform(sy, (v) => v * -12);

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      input.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
        last: performance.now(),
      };
    };
    const onLeave = () => {
      input.current.last = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (!gyroBase.current) gyroBase.current = { beta: e.beta, gamma: e.gamma };
      input.current = {
        x: clamp((e.gamma - gyroBase.current.gamma) / 25),
        y: clamp((e.beta - gyroBase.current.beta) / 25),
        last: performance.now(),
      };
    };

    type IOSOrientation = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as
      | IOSOrientation
      | undefined;

    const enable = () => window.addEventListener("deviceorientation", onOrient, true);
    const askOnTap = () => {
      void DOE?.requestPermission?.()
        .then((s) => {
          if (s === "granted") enable();
        })
        .catch(() => undefined);
    };

    if (DOE?.requestPermission) window.addEventListener("pointerdown", askOnTap, { once: true });
    else enable();

    return () => {
      window.removeEventListener("deviceorientation", onOrient, true);
      window.removeEventListener("pointerdown", askOnTap);
    };
  }, [reduceMotion]);

  useAnimationFrame((t) => {
    if (reduceMotion) return;
    const idle = performance.now() - input.current.last > IDLE_AFTER_MS;
    idleMix.current += ((idle ? 1 : 0) - idleMix.current) * 0.03;
    const driftX = Math.sin(t / 3800) * 0.75;
    const driftY = Math.sin(t / 5300 + 1.2) * 0.4;
    const k = idleMix.current;
    rawX.set(input.current.x * (1 - k) + driftX * k);
    rawY.set(input.current.y * (1 - k) + driftY * k);
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      void v.play().catch(() => undefined);
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, [src]);

  return (
    <div className="obsidian-core fixed inset-0 overflow-hidden bg-[#030712]" style={{ perspective: "1100px" }}>
      <motion.div
        className="absolute inset-0"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformStyle: "preserve-3d" }}
      >
        <div className="absolute -inset-[12%]" style={{ transform: "translateZ(-140px)" }}>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        </div>
        <div className="absolute inset-0" style={{ transform: "translateZ(60px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
