import { useEffect, useRef } from "react";

type Shard = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  size: number;
  hue: number;
  life: number;
};

/**
 * Iridescent glass-shard burst + shockwave ring, drawn on a 2D canvas (no extra WebGL context).
 * Fires once on mount. Respects reduced motion by drawing nothing.
 */
export function ParticleBurst({ accent = "#00ffcc", count = 170 }: { accent?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
    };
    resize();

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;
    const cx = W() / 2;
    const cy = H() * 0.42;
    const hues = [178, 195, 300, 320, 45];
    const shards: Shard[] = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const sp = 220 + Math.random() * 520;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 120,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
        size: 3 + Math.random() * 9,
        hue: hues[i % hues.length]! + (Math.random() - 0.5) * 20,
        life: 1,
      };
    });

    let raf = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W(), H());

      // Shockwave ring.
      if (t < 0.9) {
        const k = t / 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + k * Math.max(W(), H()) * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = (1 - k) * 0.7;
        ctx.lineWidth = 2 + (1 - k) * 6;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      let alive = 0;
      for (const s of shards) {
        if (s.life <= 0) continue;
        alive += 1;
        s.vx *= Math.exp(-dt * 1.6);
        s.vy = s.vy * Math.exp(-dt * 1.6) + 420 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.r += s.vr * dt;
        s.life -= dt * 0.55;
        const shimmer = 0.5 + 0.5 * Math.sin(t * 9 + s.hue);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r);
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = `hsl(${s.hue} 95% ${55 + shimmer * 30}%)`;
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.55, s.size * 0.6);
        ctx.lineTo(-s.size * 0.45, s.size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (alive > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [accent, count]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
