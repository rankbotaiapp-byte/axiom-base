"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: "spark" | "red" | "cyan";
}

interface FireTestOverlayProps {
  /** Increments to trigger a burst. 0 = never fired. */
  burstKey: number;
  active: boolean;
}

const COLORS = {
  spark: [255, 214, 140],
  red: [255, 42, 61],
  cyan: [34, 230, 255],
} as const;

/** Full-screen particle muzzle-flash burst drawn on a canvas. */
export function FireTestOverlay({ burstKey, active }: FireTestOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: Particle[] = [];
    const count = reduced ? 60 : w < 640 ? 220 : 420;
    // Three staggered muzzle points, roughly where the hero's weapon sits
    const origins = [
      { x: w * 0.56, y: h * 0.46, delay: 0 },
      { x: w * 0.58, y: h * 0.44, delay: 110 },
      { x: w * 0.55, y: h * 0.47, delay: 220 },
    ];
    const start = performance.now();
    const spawned = new Set<number>();

    const spawn = (ox: number, oy: number) => {
      for (let i = 0; i < count / origins.length; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * (w < 640 ? 9 : 16);
        const roll = Math.random();
        particles.push({
          x: ox,
          y: oy,
          vx: Math.cos(angle) * speed * 1.4,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 30 + Math.random() * 50,
          size: 0.6 + Math.random() * 2.6,
          hue: roll < 0.6 ? "spark" : roll < 0.85 ? "red" : "cyan",
        });
      }
    };

    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      origins.forEach((o, i) => {
        if (!spawned.has(i) && elapsed >= o.delay) {
          spawned.add(i);
          spawn(o.x, o.y);
        }
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 0.12;
        const px = p.x;
        const py = p.y;
        p.x += p.vx;
        p.y += p.vy;
        const k = 1 - p.life / p.maxLife;
        if (k <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const [r, g, b] = COLORS[p.hue];
        ctx.strokeStyle = `rgba(${r},${g},${b},${k})`;
        ctx.lineWidth = p.size * k + 0.3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      if (particles.length > 0 || spawned.size < origins.length) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [burstKey, reduced]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <AnimatePresence>
        {active && (
          <>
            {/* White-hot flash */}
            <motion.div
              key={`flash-${burstKey}`}
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 56% 46%, rgba(255,240,210,0.95) 0%, rgba(255,120,60,0.45) 18%, rgba(255,42,61,0.18) 40%, transparent 70%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: reduced ? [0, 0.4, 0] : [0, 1, 0.2, 0.9, 0.1, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, times: reduced ? undefined : [0, 0.08, 0.25, 0.33, 0.55, 0.62, 1] }}
            />
            {/* Chromatic glitch bands */}
            {!reduced &&
              [18, 41, 67, 83].map((top, i) => (
                <motion.div
                  key={`band-${burstKey}-${i}`}
                  className="absolute inset-x-0 h-[3px] mix-blend-screen"
                  style={{
                    top: `${top}%`,
                    background: i % 2 ? "var(--color-neon-cyan)" : "var(--color-neon-red)",
                  }}
                  initial={{ opacity: 0, x: "-10%" }}
                  animate={{ opacity: [0, 0.9, 0, 0.7, 0], x: ["-10%", "6%", "-4%", "2%", "0%"] }}
                  transition={{ duration: 0.5, delay: 0.28 + i * 0.03 }}
                />
              ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
