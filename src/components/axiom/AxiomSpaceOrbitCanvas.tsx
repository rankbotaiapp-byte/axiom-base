"use client";

import { useEffect, useRef } from "react";
import type { OrbitAnchor } from "@/components/axiom/AxiomAssistantWidget";

const REPULSE_RADIUS = 140;

type Orbiter = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  kind: "dust" | "star";
  color: string;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
};

function seedOrbiters(width: number, height: number): Orbiter[] {
  const reach = Math.hypot(width, height) * 0.48;
  const colors = ["#00f0ff", "#d4a348", "#7dffe8", "#f6e7b2"];
  const count = Math.round(Math.min(110, Math.max(64, (width * height) / 18000)));
  return Array.from({ length: count }, (_, index) => {
    const kind = index % 5 === 0 ? "star" : "dust";
    return {
      angle: Math.random() * Math.PI * 2,
      radius: 80 + Math.random() * reach,
      speed: (0.0008 + Math.random() * 0.0022) * (index % 2 === 0 ? 1 : -1),
      size: kind === "star" ? 1.4 + Math.random() * 1.6 : 0.6 + Math.random() * 1.3,
      kind,
      color: colors[index % colors.length],
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
    };
  });
}

export function AxiomSpaceOrbitCanvas({ anchor }: { anchor: OrbitAnchor | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let orbiters: Orbiter[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;

    const fit = () => {
      const parent = canvas.parentElement;
      const nextWidth = parent?.clientWidth || window.innerWidth;
      const nextHeight = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(nextWidth * dpr));
      canvas.height = Math.max(1, Math.floor(nextHeight * dpr));
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (Math.abs(nextWidth - width) > 40 || Math.abs(nextHeight - height) > 40 || orbiters.length === 0) {
        width = nextWidth;
        height = nextHeight;
        orbiters = seedOrbiters(width, height);
      } else {
        width = nextWidth;
        height = nextHeight;
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const magnet = anchorRef.current;
      const box = magnet ? canvas.getBoundingClientRect() : null;
      const magnetX = magnet && box ? magnet.x - box.left : 0;
      const magnetY = magnet && box ? magnet.y - box.top : 0;
      const originX = width / 2;
      const originY = height / 2;
      for (const mote of orbiters) {
        mote.angle += mote.speed;
        const homeX = originX + Math.cos(mote.angle) * mote.radius;
        const homeY = originY + Math.sin(mote.angle) * mote.radius * 0.58;
        const drawX = homeX + mote.ox;
        const drawY = homeY + mote.oy;
        if (magnet) {
          const dx = drawX - magnetX;
          const dy = drawY - magnetY;
          const distance = Math.hypot(dx, dy);
          if (distance < REPULSE_RADIUS && distance > 0.01) {
            const push = (1 - distance / REPULSE_RADIUS) * 2.4;
            mote.vx += (dx / distance) * push;
            mote.vy += (dy / distance) * push;
          }
        }
        mote.vx += -mote.ox * 0.05;
        mote.vy += -mote.oy * 0.05;
        mote.vx *= 0.84;
        mote.vy *= 0.84;
        mote.ox += mote.vx;
        mote.oy += mote.vy;

        context.save();
        context.translate(homeX + mote.ox, homeY + mote.oy);
        context.fillStyle = mote.color;
        context.globalAlpha = mote.kind === "star" ? 0.85 : 0.45;
        if (mote.kind === "star") {
          context.rotate(mote.angle);
          context.fillRect(-mote.size * 1.8, -0.4, mote.size * 3.6, 0.8);
          context.fillRect(-0.4, -mote.size * 1.8, 0.8, mote.size * 3.6);
        } else {
          context.beginPath();
          context.arc(0, 0, mote.size, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
      frame = window.requestAnimationFrame(draw);
    };

    fit();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", fit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
