"use client";

import { useEffect, useRef } from "react";

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: 0 | 1 };

/**
 * Floating spark overlay. Canvas-based, capped at 2x DPR, paused while
 * off-screen or in a hidden tab, and disabled for reduced-motion visitors.
 * Call `burst()` on the returned ref target via the `burstKey` prop: every
 * time it changes, a ring of sparks erupts from the centre.
 */
export default function SparkField({
  colors,
  density = 46,
  burstKey = 0,
  className = "",
}: {
  colors: [string, string];
  density?: number;
  burstKey?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const size = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spawn = (fromCentre = false): Spark => {
      const { w, h } = size.current;
      const angle = Math.random() * Math.PI * 2;
      const speed = fromCentre ? 60 + Math.random() * 160 : 0;
      return {
        x: fromCentre ? w / 2 : Math.random() * w,
        y: fromCentre ? h / 2 : h * (0.35 + Math.random() * 0.65),
        vx: fromCentre ? Math.cos(angle) * speed : (Math.random() - 0.5) * 14,
        vy: fromCentre ? Math.sin(angle) * speed : -(10 + Math.random() * 26),
        life: 0,
        max: fromCentre ? 0.9 + Math.random() * 0.8 : 2.5 + Math.random() * 3.5,
        r: 0.6 + Math.random() * 1.6,
        hue: Math.random() < 0.65 ? 1 : 0,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.current = { w: rect.width, h: rect.height };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    sparks.current = Array.from({ length: density }, () => {
      const s = spawn();
      s.life = Math.random() * s.max;
      return s;
    });
    // Exposed so the burst effect below can add sparks without re-running this effect.
    (canvas as HTMLCanvasElement & { __burst?: () => void }).__burst = () => {
      for (let i = 0; i < 70; i++) sparks.current.push(spawn(true));
    };

    let raf = 0;
    let last = 0;
    let visible = true;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(Math.max((t - last) / 1000, 0), 0.05);
      last = t;
      if (!visible || document.hidden) return;
      const { w, h } = size.current;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const list = sparks.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life >= s.max) {
          if (list.length > density) list.splice(i, 1);
          else list[i] = spawn();
          continue;
        }
        const k = s.life / s.max;
        ctx.globalAlpha = Math.sin(Math.PI * k) * 0.9;
        ctx.fillStyle = colors[s.hue];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [colors, density]);

  useEffect(() => {
    if (burstKey === 0) return;
    (canvasRef.current as (HTMLCanvasElement & { __burst?: () => void }) | null)?.__burst?.();
  }, [burstKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
