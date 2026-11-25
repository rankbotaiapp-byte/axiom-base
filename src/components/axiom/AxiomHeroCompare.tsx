"use client";

import { useCallback, useId, useRef, useState } from "react";

export const LANDING_HERO_BEFORE = "/images/showcase/axiom-before.jpg";
export const LANDING_HERO_AFTER = "/images/showcase/axiom-after.jpg";

export type HeroCompareMode = "before" | "after" | "split";

const MODES: { id: HeroCompareMode; label: string }[] = [
  { id: "before", label: "Before" },
  { id: "after", label: "After" },
  { id: "split", label: "Split" },
];

const IMG_CLASS =
  "absolute inset-0 h-full w-full object-cover select-none pointer-events-none";

function clampPct(value: number) {
  return Math.min(100, Math.max(0, value));
}

function tickFor(value: number): 0 | 50 | 100 | null {
  if (value <= 0.75) return 0;
  if (value >= 99.25) return 100;
  if (Math.abs(value - 50) <= 1.25) return 50;
  return null;
}

interface AxiomHeroCompareProps {
  beforeSrc?: string;
  afterSrc?: string;
  onAfterError?: () => void;
}

export default function AxiomHeroCompare({
  beforeSrc = LANDING_HERO_BEFORE,
  afterSrc = LANDING_HERO_AFTER,
  onAfterError,
}: AxiomHeroCompareProps) {
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const lastTickRef = useRef<0 | 50 | 100 | null>(50);
  const [mode, setMode] = useState<HeroCompareMode>("split");
  const [split, setSplit] = useState(50);
  const [beforeFailed, setBeforeFailed] = useState(false);
  const [afterFailed, setAfterFailed] = useState(false);

  const pct = mode === "before" ? 100 : mode === "after" ? 0 : split;

  const applySplit = useCallback((value: number) => {
    const next = clampPct(value);
    const tick = tickFor(next);
    if (tick !== null && lastTickRef.current !== tick) {
      navigator.vibrate?.(8);
    }
    lastTickRef.current = tick;
    setSplit(next);
  }, []);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = rootRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      applySplit(((clientX - box.left) / Math.max(1, box.width)) * 100);
    },
    [applySplit],
  );

  const beginScrub = (clientX: number) => {
    setMode("split");
    dragRef.current = true;
    setFromClientX(clientX);
  };

  if (afterFailed) return null;

  return (
    <div className="ax-compare">
      <div
        ref={rootRef}
        className="ax-compare-stage relative aspect-video w-full overflow-hidden"
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={mode === "split" ? `${Math.round(split)} percent before` : mode}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          beginScrub(event.clientX);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* pointer already released */
          }
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          setFromClientX(event.clientX);
        }}
        onPointerUp={() => {
          dragRef.current = false;
        }}
        onPointerCancel={() => {
          dragRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setMode("split");
            applySplit(pct - 4);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            setMode("split");
            applySplit(pct + 4);
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt="After — Axiom branded shopfront"
          className={IMG_CLASS}
          draggable={false}
          onError={() => {
            setAfterFailed(true);
            onAfterError?.();
          }}
        />
        {beforeFailed ? (
          <div className="ax-compare-before-fill absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={beforeSrc}
            alt="Before — original shopfront"
            className={IMG_CLASS}
            draggable={false}
            style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
            onError={() => setBeforeFailed(true)}
          />
        )}
        {mode === "split" ? (
          <div className="ax-compare-rule" style={{ left: `${pct}%` }}>
            <span className="ax-compare-grip" aria-hidden>
              ǁ
            </span>
          </div>
        ) : null}
        <span className="ax-compare-chip ax-compare-chip-before">Before</span>
        <span className="ax-compare-chip ax-compare-chip-after">After — Axiom</span>
      </div>

      <div id={labelId} className="ax-compare-toggle" role="tablist" aria-label="Before after view">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "is-on" : ""}
            onClick={() => {
              setMode(item.id);
              if (item.id === "before") applySplit(100);
              if (item.id === "after") applySplit(0);
              if (item.id === "split") applySplit(50);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
