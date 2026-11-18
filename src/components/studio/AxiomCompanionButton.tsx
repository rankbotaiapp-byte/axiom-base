"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

type AxiomCompanionButtonProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
};

type Parallax = { x: number; y: number; rx: number; ry: number };

const REST: Parallax = { x: 0, y: 0, rx: 0, ry: 0 };

/** Floating Axiom Guy inside a refractive 3D water droplet. */
export function AxiomCompanionButton({
  href = "/companion",
  onClick,
  className = "",
}: AxiomCompanionButtonProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [parallax, setParallax] = useState<Parallax>(REST);
  const [reduceMotion, setReduceMotion] = useState(false);
  const raf = useRef<number | null>(null);
  const pending = useRef<Parallax>(REST);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const flushParallax = useCallback(() => {
    raf.current = null;
    setParallax(pending.current);
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const node = rootRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const cx = clamp(nx);
      const cy = clamp(ny);
      pending.current = {
        x: cx * 6,
        y: cy * 6,
        rx: -cy * 10,
        ry: cx * 10,
      };
      if (raf.current == null) raf.current = requestAnimationFrame(flushParallax);
    },
    [flushParallax, reduceMotion],
  );

  const onPointerLeave = useCallback(() => {
    pending.current = REST;
    if (raf.current == null) raf.current = requestAnimationFrame(flushParallax);
  }, [flushParallax]);

  const body = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2 -top-6 -z-10 h-24 w-24 rounded-full bg-[#00f2fe]/15 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:bg-[#00f2fe]/28"
      />

      <div className="relative mr-3 flex shrink-0 flex-col items-center pb-2">
        {/* Idle bob on outer wrapper so hover lift/morph on the bead stay independent */}
        <div className="axiom-droplet-bob relative">
          <div
            className="relative h-20 w-20 isolate overflow-hidden rounded-full transition-[border-radius,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform group-hover:-translate-y-2 group-hover:rounded-[48%_52%_51%_49%/52%_48%_52%_48%]"
            style={{
              boxShadow: [
                "inset 0 2px 4px rgba(255,255,255,0.65)",
                "inset 0 0 14px rgba(2,6,23,0.75)",
                "inset 0 -7px 14px rgba(34,211,238,0.65)",
                "0 12px 24px -4px rgba(0,0,0,0.75)",
                "0 0 20px rgba(6,182,212,0.35)",
              ].join(", "),
              background:
                "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.22), transparent 42%), radial-gradient(circle at 50% 70%, rgba(34,211,238,0.18), transparent 55%), rgba(8,12,20,0.35)",
            }}
          >
            {/* Magnified character — parallax behind fixed water highlights */}
            <div
              className="absolute inset-[-12%] flex items-center justify-center transition-transform duration-150 ease-out"
              style={{
                transform: reduceMotion
                  ? "none"
                  : `perspective(420px) translate3d(${parallax.x}px, ${parallax.y}px, 0) rotateX(${parallax.rx}deg) rotateY(${parallax.ry}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <img
                src="/media/axiom-guy.png"
                alt=""
                width={160}
                height={160}
                className="pointer-events-none h-full w-full scale-[1.3] object-cover object-[50%_42%] select-none"
                draggable={false}
              />
            </div>

            {/* Fixed wet speculars (stationary over parallax) */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-2 left-3 z-20 h-3 w-6 -rotate-[25deg] rounded-full bg-gradient-to-b from-white/80 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-5 left-2.5 z-20 h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.85)]"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-1 ring-inset ring-white/25"
            />
          </div>
        </div>

        {/* Bottom caustic pool focused through the bead onto the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-5 w-14 -translate-x-1/2 rounded-full bg-cyan-400/40 blur-md transition-all duration-500 group-hover:w-16 group-hover:bg-cyan-300/50"
          style={{
            boxShadow: "0 0 18px rgba(34,211,238,0.55), 0 4px 12px rgba(6,182,212,0.35)",
          }}
        />
      </div>

      <div className="flex min-w-0 flex-col items-start text-left">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00f2fe]">
          AI Assistant
        </span>
        <span className="text-sm font-bold text-white transition-colors group-hover:text-cyan-200">
          Talk to Axiom
        </span>
      </div>
    </>
  );

  const shell =
    `group relative flex w-full items-center justify-center overflow-visible rounded-xl border border-[#00f2fe]/30 bg-zinc-950/80 px-5 py-5 shadow-[0_0_28px_rgba(0,242,254,0.08)] backdrop-blur-md transition-all duration-300 hover:border-[#00f2fe]/70 hover:shadow-[0_0_36px_rgba(0,242,254,0.16)] active:scale-[0.98] ${className}`;

  const interaction = {
    onPointerMove,
    onPointerLeave,
  };

  if (onClick && !href) {
    return (
      <button
        type="button"
        ref={(node) => {
          rootRef.current = node;
        }}
        onClick={onClick}
        className={shell}
        aria-label="Talk to Axiom AI assistant"
        {...interaction}
      >
        {body}
        <DropletFloatStyles />
      </button>
    );
  }

  return (
    <Link
      href={href}
      ref={(node) => {
        rootRef.current = node;
      }}
      onClick={onClick}
      className={shell}
      aria-label="Talk to Axiom AI assistant"
      {...interaction}
    >
      {body}
      <DropletFloatStyles />
    </Link>
  );
}

function DropletFloatStyles() {
  return (
    <style>{`
      @keyframes axiom-droplet-bob {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(0, -3px, 0); }
      }
      .axiom-droplet-bob {
        animation: axiom-droplet-bob 3.8s ease-in-out infinite;
        will-change: transform;
      }
      @media (prefers-reduced-motion: reduce) {
        .axiom-droplet-bob { animation: none; }
      }
    `}</style>
  );
}
