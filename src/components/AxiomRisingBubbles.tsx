"use client";

import { useEffect, useRef } from "react";
import {
  sampleFlutter,
  sampleGlassJourney,
  type BubbleSide,
} from "@/lib/axiom/bubble-path";

type Slot = {
  side: BubbleSide;
  seed: number;
  /** 0 = waiting, 1 = glass journey (stages 1–3), 2 = flutter (stage 4) */
  mode: 0 | 1 | 2;
  wait: number;
  pathT: number;
  pathSpeed: number;
  flutterT: number;
  flutterSpeed: number;
  swayAmp: number;
  releaseX: number;
  releaseY: number;
  r: number;
};

function randomRadiusPx() {
  // 7–15px diameter → radius 3.5–7.5
  return Math.random() < 0.75 ? 3.5 + Math.random() * 1.5 : 6 + Math.random() * 1.5;
}

function idleWait() {
  return 4.5 + Math.random() * 9;
}

function makeSlot(i: number): Slot {
  return {
    side: i % 2 === 0 ? -1 : 1,
    seed: Math.random() * 1000,
    mode: 0,
    wait: Math.random() * 7,
    pathT: 0,
    pathSpeed: 0.045 + Math.random() * 0.05,
    flutterT: 0,
    flutterSpeed: 28 + Math.random() * 42, // px/s → ~6–15s across typical viewports
    swayAmp: 10 + Math.random() * 12,
    releaseX: 0,
    releaseY: 0,
    r: randomRadiusPx(),
  };
}

function drawGlassBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fade: number,
  thrusterGlow: number,
  stretchX: number,
  stretchY: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(stretchX, stretchY);

  const body = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
  body.addColorStop(0, `rgba(255,255,255,${0.03 * fade})`);
  body.addColorStop(0.55, `rgba(255,255,255,${0.02 * fade})`);
  body.addColorStop(0.82, `rgba(255,255,255,${0.045 * fade})`);
  body.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  // Dark refractive outer edge
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(8,12,24,${0.35 * fade})`;
  ctx.lineWidth = Math.max(0.7, r * 0.1);
  ctx.stroke();

  // Bright inner rim
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * fade})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Warm solar-amber lower caustic
  const amber = 0.25 + thrusterGlow * 0.45;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, 0.25, 1.55);
  ctx.strokeStyle = `rgba(251,191,36,${amber * fade})`;
  ctx.lineWidth = Math.max(0.7, r * 0.09);
  ctx.stroke();

  // Dual pinpoint speculars
  ctx.beginPath();
  ctx.arc(-r * 0.48, -r * 0.56, Math.max(0.55, r * 0.1), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.32, r * 0.26, Math.max(0.4, r * 0.055), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.4 * fade})`;
  ctx.fill();

  ctx.restore();
}

function readOrbFrame(): { cx: number; cy: number; R: number } | null {
  const img = document.querySelector(
    "[data-axiom-elite-orb-portal] img",
  ) as HTMLImageElement | null;
  if (!img) return null;
  const r = img.getBoundingClientRect();
  if (r.width < 40 || r.height < 40) return null;
  // Glass sphere fills most of the square still
  const R = Math.min(r.width, r.height) * 0.42;
  return {
    cx: r.left + r.width * 0.5,
    cy: r.top + r.height * 0.48,
    R,
  };
}

/**
 * Sparse 4-stage journey bubbles — under glass → booster → outer rim → flutter
 * off the top of the screen. Only 1–2 active at a time.
 */
export function AxiomRisingBubbles({ count = 7 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const n = Math.max(6, Math.min(8, count));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    let w = 0;
    let h = 0;
    let dpr = 1;
    const slots: Slot[] = Array.from({ length: n }, (_, i) => makeSlot(i));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);

      const orb = readOrbFrame();
      const time = now * 0.001;

      let active = 0;
      for (const s of slots) if (s.mode !== 0) active++;

      for (const b of slots) {
        if (b.mode === 0) {
          b.wait -= dt;
          if (b.wait <= 0 && active < 2 && orb) {
            b.mode = 1;
            b.pathT = 0;
            b.r = randomRadiusPx();
            b.pathSpeed = 0.038 + Math.random() * 0.04;
            // Surface-tension hesitation: slower near lip via later modulation
            b.flutterSpeed = (h * 0.55) / (6 + Math.random() * 9); // 6–15s to clear
            b.swayAmp = 10 + Math.random() * 12;
            b.seed = Math.random() * 1000;
            b.side = Math.random() < 0.5 ? -1 : 1;
            active++;
          }
          continue;
        }

        if (!orb) {
          // Orb offscreen / not ready — park
          continue;
        }

        const { cx, cy, R } = orb;

        if (b.mode === 1) {
          // Slow more during lip crawl (pathT ~0.2–0.45)
          const lipSlow = b.pathT > 0.2 && b.pathT < 0.48 ? 0.55 : 1;
          b.pathT += b.pathSpeed * lipSlow * dt;

          if (b.pathT >= 1) {
            const end = sampleGlassJourney(1, cx, cy, R, b.side, b.r, b.seed, time, 1);
            b.releaseX = end.x;
            b.releaseY = end.y;
            b.flutterT = 0;
            b.mode = 2;
          } else {
            const p = sampleGlassJourney(b.pathT, cx, cy, R, b.side, b.r, b.seed, time, 1);
            drawGlassBubble(
              ctx,
              p.x,
              p.y,
              b.r,
              p.opacity,
              p.thrusterGlow,
              p.stretchX,
              p.stretchY,
            );
          }
          continue;
        }

        // Stage 4 — flutter past top of viewport
        b.flutterT += dt;
        const p = sampleFlutter(
          b.releaseX,
          b.releaseY,
          b.flutterT,
          b.side,
          b.seed,
          b.flutterSpeed,
          b.swayAmp,
          1,
        );
        if (p.y < -20) {
          b.mode = 0;
          b.wait = idleWait();
          continue;
        }
        drawGlassBubble(
          ctx,
          p.x,
          p.y,
          b.r,
          p.opacity,
          0,
          p.stretchX,
          p.stretchY,
        );
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [n]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[25]"
      aria-hidden
      data-axiom-rising-bubbles=""
    />
  );
}

export default AxiomRisingBubbles;
