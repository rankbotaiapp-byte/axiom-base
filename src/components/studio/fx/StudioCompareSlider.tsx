"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { STUDIO_CYAN } from "@/lib/axiom/studio-fx";

type Props = {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  afterOverlay?: ReactNode;
};

/** Live before/after scrub monitor — neon cyan divider. */
export function StudioCompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Raw Snapshot",
  afterLabel = "Axiom Studio Output",
  className = "",
  afterOverlay,
}: Props) {
  const [pct, setPct] = useState(52);
  const dragging = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = ((clientX - r.left) / Math.max(1, r.width)) * 100;
    setPct(Math.max(4, Math.min(96, next)));
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050507] shadow-[0_0_40px_rgba(0,255,204,0.08)] [container-type:inline-size] ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        setFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label="Compare raw and branded studio output"
      tabIndex={0}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {afterOverlay ? (
        <div className="absolute inset-0 z-[1]" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
          {afterOverlay}
        </div>
      ) : null}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute left-0 top-0 h-full w-[100cqw] max-w-none object-cover"
          style={{
            width: "100cqi",
            minWidth: "100%",
            filter: "grayscale(0.35) contrast(0.92) brightness(1.05)",
          }}
          draggable={false}
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 w-0.5"
        style={{ left: `${pct}%`, background: STUDIO_CYAN, boxShadow: `0 0 18px ${STUDIO_CYAN}` }}
      >
        <div
          className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#00ffcc]/80 bg-[#050507]/90"
          style={{ boxShadow: `0 0 20px ${STUDIO_CYAN}` }}
        >
          <span className="font-mono text-[10px] text-[#00ffcc]">ǁ</span>
        </div>
      </div>

      <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70 backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full border border-[#00ffcc]/35 bg-black/55 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#00ffcc] backdrop-blur">
        {afterLabel}
      </span>
    </div>
  );
}
