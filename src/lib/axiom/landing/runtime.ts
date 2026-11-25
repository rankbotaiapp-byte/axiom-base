"use client";

/**
 * Shared, allocation-free runtime state read inside R3F useFrame loops.
 * Canvases are pointer-events:none (so copy + CTAs underneath stay clickable),
 * so pointer & scroll are tracked on window and written here.
 */
import { useEffect } from "react";

export const axiomRuntime = {
  /** Pointer in NDC (-1..1), +y up. */
  pointer: { x: 0, y: 0, active: false },
  /** 0..1 page scroll progress. */
  scroll: 0,
  /** Smoothed absolute scroll velocity, ~0..1+. */
  scrollVelocity: 0,
  /** Set by AxiomCharacter each frame. */
  hovering: false,
  /** Incremented on a click/tap on Axiom. */
  boops: 0,
  reducedMotion: false,
};

let mounted = 0;
let stop: (() => void) | null = null;

export function useAxiomRuntimeTracking() {
  useEffect(() => {
    if (mounted++ === 0) stop = start();
    return () => {
      if (--mounted === 0) stop?.();
    };
  }, []);
}

function start() {
  {
    const rt = axiomRuntime;
    rt.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      rt.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rt.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      rt.pointer.active = true;
    };
    const onLeave = () => (rt.pointer.active = false);
    const onDown = () => {
      if (rt.hovering) rt.boops++;
    };
    const tick = () => {
      const now = performance.now();
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      rt.scroll = Math.min(1, Math.max(0, y / max));
      const dt = Math.max(1, now - lastT);
      const v = Math.abs(y - lastY) / dt; // px per ms
      // ease toward instantaneous velocity, decay when idle
      rt.scrollVelocity += (Math.min(v / 3, 2) - rt.scrollVelocity) * 0.12;
      lastY = y;
      lastT = now;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }
}
