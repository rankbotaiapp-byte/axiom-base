"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; vy: number; vx: number; a: number };

const MAX_PARTICLES = 36;

function readBrandColor(): string {
  if (typeof document === "undefined") return "#00f2fe";
  const root = document.documentElement;
  const fromShop = getComputedStyle(root).getPropertyValue("--shop-primary").trim();
  if (fromShop) return fromShop;
  const fromBrand = getComputedStyle(document.querySelector(".storefront-cro-root") || root)
    .getPropertyValue("--brand-primary")
    .trim();
  return fromBrand || "#00f2fe";
}

/**
 * Fixed, pointer-events-none ember field — scroll nudges drift only (no layout impact).
 */
export function AxiomScrollAtmosphere({ className, enabled = true }: { className?: string; enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();
  const scrollY = useRef(0);

  useEffect(() => {
    if (!enabled || reduceMotion) return;
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, reduceMotion]);

  useEffect(() => {
    if (!enabled || reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let color = readBrandColor();
    let width = 0;
    let height = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        particles = Array.from({ length: MAX_PARTICLES }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 1.8,
          vy: 0.08 + Math.random() * 0.22,
          vx: (Math.random() - 0.5) * 0.12,
          a: 0.08 + Math.random() * 0.18,
        }));
      }
    };

    const onVis = () => {
      visible = document.visibilityState === "visible";
    };

    const tick = () => {
      if (!visible) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      color = readBrandColor();
      const scrollBoost = (scrollY.current % 800) / 8000;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.vy + scrollBoost;
        p.x += p.vx + scrollBoost * 0.4;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, reduceMotion]);

  if (!enabled || reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-0 opacity-[0.35]",
        className,
      )}
      aria-hidden
    />
  );
}