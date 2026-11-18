"use client";

import { useEffect, useRef, useState } from "react";

type WarpStar = {
  x: number;
  y: number;
  z: number;
  speed: number;
  baseSize: number;
  hue: number; // 0 cyan-leaning, 1 white
};

const STAR_COUNT = 520;
const Z_NEAR = 0.12;
const Z_FAR = 1;
const FOCAL = 320;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function spawnStar(spread = 1): WarpStar {
  // Random point in a unit disk around the camera axis
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * spread;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: rand(Z_NEAR + 0.05, Z_FAR),
    speed: rand(0.0045, 0.018),
    baseSize: rand(0.6, 2.4),
    hue: Math.random(),
  };
}

/**
 * 3D warp-speed orbiting starfield — perspective projection with continuous z descent.
 * `px = (x / z) * focal + centerX`, radius/alpha inverse to depth; recycle past camera plane.
 */
export function AxiomStarfieldBackground({
  className = "",
  opacityClass = "opacity-70",
}: {
  className?: string;
  opacityClass?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) {
      console.error("[AxiomStarfieldBackground] getContext('2d') returned null");
      return;
    }

    let running = true;
    let raf: number | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: WarpStar[] = [];

    const mouse = { x: 0.5, y: 0.5 };
    const smooth = { x: 0.5, y: 0.5 };

    const seed = () => {
      stars = Array.from({ length: STAR_COUNT }, () => spawnStar(1.15));
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(window.innerWidth) || 1);
      h = Math.max(1, Math.floor(window.innerHeight) || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stars.length === 0) seed();
    };

    const onMove = (event: PointerEvent) => {
      if (w < 1 || h < 1) return;
      mouse.x = event.clientX / w;
      mouse.y = event.clientY / h;
    };

    resize();
    seed();
    const boot = window.requestAnimationFrame(() => resize());
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    let last = performance.now();
    let breathT = 0;

    const drawCore = () => {
      const breath = 0.7 + Math.sin(breathT * 0.55) * 0.3;
      const cx = w * 0.5 + (smooth.x - 0.5) * 22;
      const cy = h * 0.48 + (smooth.y - 0.5) * 14;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      grd.addColorStop(0, `rgba(0, 242, 254, ${0.09 * breath})`);
      grd.addColorStop(0.35, `rgba(14, 116, 144, ${0.05 * breath})`);
      grd.addColorStop(1, "rgba(3, 7, 18, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(w, h) * 0.38, Math.max(w, h) * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      if (!running) return;
      if (w < 1 || h < 1) {
        resize();
        raf = window.requestAnimationFrame(frame);
        return;
      }

      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      breathT += dt;

      const lerp = reduceMotion ? 1 : 0.05;
      smooth.x += (mouse.x - smooth.x) * lerp;
      smooth.y += (mouse.y - smooth.y) * lerp;

      // Parallax shifts the vanishing point slightly
      const centerX = w * 0.5 + (smooth.x - 0.5) * 40;
      const centerY = h * 0.5 + (smooth.y - 0.5) * 28;
      const focal = FOCAL * (Math.min(w, h) / 900);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawCore();

      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i]!;

        if (!reduceMotion) {
          // Continuous warp toward camera (z decreases every frame)
          s.z -= s.speed * (dt / 0.016);
        }

        // Reset past the camera plane → far field (seamless infinite loop)
        if (s.z <= Z_NEAR) {
          const next = spawnStar(1.15);
          s.x = next.x;
          s.y = next.y;
          s.z = Z_FAR;
          s.speed = next.speed;
          s.baseSize = next.baseSize;
          s.hue = next.hue;
        }

        const z = Math.max(Z_NEAR, s.z);
        const px = (s.x / z) * focal + centerX;
        const py = (s.y / z) * focal + centerY;

        // Inverse depth: tiny in the distance, rush into foreground
        const depth = 1 - (z - Z_NEAR) / (Z_FAR - Z_NEAR);
        const radius = s.baseSize * (0.25 + depth * 2.4);
        const alpha = 0.15 + depth * 0.85;

        // Motion streak when close (warp trails)
        const streak = reduceMotion ? 0 : depth * depth * 14 * s.speed * 40;
        const trailX = (s.x / Math.min(Z_FAR, z + 0.08)) * focal + centerX;
        const trailY = (s.y / Math.min(Z_FAR, z + 0.08)) * focal + centerY;

        if (px < -40 || px > w + 40 || py < -40 || py > h + 40) {
          // Off-screen — recycle early for density
          if (depth > 0.85) {
            const next = spawnStar(1.15);
            s.x = next.x;
            s.y = next.y;
            s.z = Z_FAR;
            s.speed = next.speed;
          }
          continue;
        }

        const r = Math.round(180 + s.hue * 50);
        const g = Math.round(230 + s.hue * 20);
        const b = 254;
        const color = `rgba(${r},${g},${b},${alpha})`;

        if (streak > 1.2) {
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(0.5, radius * 0.55);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(trailX, trailY);
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = `rgba(0, 242, 254, ${alpha * 0.7})`;
        ctx.shadowBlur = 2 + depth * 3;
        ctx.arc(px, py, Math.max(0.35, radius), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf != null) window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(boot);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      stars = [];
    };
  }, [reduceMotion]);

  return (
    <div
      aria-hidden
      data-axiom-starfield=""
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className={`pointer-events-none absolute inset-0 h-full w-full mix-blend-screen ${opacityClass}`}
      />
    </div>
  );
}
