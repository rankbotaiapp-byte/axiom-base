"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Mutable camera-rig state read every frame by the renderers (no React re-renders). */
export interface PointerRig {
  /** Smoothed lean, −1 … 1 (x right, y up). */
  x: number;
  y: number;
  /** Raw targets. */
  tx: number;
  ty: number;
  /** Smoothed zoom, 1 … MAX_ZOOM. */
  zoom: number;
  targetZoom: number;
  /** Signed swirl energy fed by pointer velocity; decays to 0. */
  swirl: number;
  /** Whether the latest input was touch (drives spring-back behaviour). */
  touch: boolean;
}

const MAX_ZOOM = 1.6;
const IGNORE_SELECTOR = "[data-rig-ignore]";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Cursor parallax on desktop, drag-to-lean + pinch-to-zoom on touch.
 * Publishes `--apex-tilt-x`, `--apex-tilt-y`, `--apex-zoom` CSS variables on the
 * host element so DOM layers (HUD, CSS-tier video) share the same camera.
 */
export function usePointerRig(hostRef: RefObject<HTMLElement | null>, enabled: boolean): RefObject<PointerRig> {
  const rig = useRef<PointerRig>({ x: 0, y: 0, tx: 0, ty: 0, zoom: 1, targetZoom: 1, swirl: 0, touch: false });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) return;

    const state = rig.current;
    const touches = new Map<number, { x: number; y: number }>();
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let lastMouse: { x: number; y: number; t: number } | null = null;

    const isIgnored = (target: EventTarget | null) =>
      target instanceof Element && target.closest(IGNORE_SELECTOR) !== null;

    const pinchDistance = () => {
      const [a, b] = Array.from(touches.values());
      if (!a || !b) return 0;
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onPointerMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        state.touch = false;
        state.tx = clamp((e.clientX / w) * 2 - 1, -1, 1);
        state.ty = clamp(-((e.clientY / h) * 2 - 1), -1, 1);
        const now = performance.now();
        if (lastMouse) {
          const dt = Math.max(8, now - lastMouse.t);
          const vx = (e.clientX - lastMouse.x) / dt;
          const vy = (e.clientY - lastMouse.y) / dt;
          // Cross product with the vector from screen centre gives rotational direction.
          const cx = e.clientX - w / 2;
          const cy = e.clientY - h / 2;
          const spin = (cx * vy - cy * vx) / Math.max(w, h);
          state.swirl = clamp(state.swirl + spin * 0.12, -3, 3);
        }
        lastMouse = { x: e.clientX, y: e.clientY, t: now };
        return;
      }

      const previous = touches.get(e.pointerId);
      if (!previous) return;
      state.touch = true;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (touches.size >= 2) {
        const distance = pinchDistance();
        if (pinchStartDistance > 0) {
          state.targetZoom = clamp(pinchStartZoom * (distance / pinchStartDistance), 1, MAX_ZOOM);
        }
        return;
      }

      const dx = e.clientX - previous.x;
      const dy = e.clientY - previous.y;
      state.tx = clamp(state.tx + (dx / w) * 2.4, -1, 1);
      state.ty = clamp(state.ty - (dy / h) * 2.4, -1, 1);
      state.swirl = clamp(state.swirl + (dx / w) * 4, -3, 3);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || isIgnored(e.target)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        pinchStartDistance = pinchDistance();
        pinchStartZoom = state.targetZoom;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinchStartDistance = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || isIgnored(e.target)) return; // trackpad pinch on desktop
      e.preventDefault();
      state.targetZoom = clamp(state.targetZoom - e.deltaY * 0.01, 1, MAX_ZOOM);
    };

    const onLeave = () => {
      state.tx = 0;
      state.ty = 0;
      lastMouse = null;
    };

    // Smoothing loop + CSS variable bridge.
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state.touch && touches.size === 0) {
        // Gentle spring back to centre after a drag.
        state.tx *= 1 - dt * 1.4;
        state.ty *= 1 - dt * 1.4;
      }
      const k = 1 - Math.exp(-dt * 5.5);
      state.x += (state.tx - state.x) * k;
      state.y += (state.ty - state.y) * k;
      state.zoom += (state.targetZoom - state.zoom) * (1 - Math.exp(-dt * 8));
      state.swirl *= Math.exp(-dt * 1.6);
      host.style.setProperty("--apex-tilt-x", state.x.toFixed(4));
      host.style.setProperty("--apex-tilt-y", state.y.toFixed(4));
      host.style.setProperty("--apex-zoom", state.zoom.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    host.addEventListener("wheel", onWheel, { passive: false });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      host.removeEventListener("wheel", onWheel);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [hostRef, enabled]);

  return rig;
}
