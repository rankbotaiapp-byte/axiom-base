import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronsUp } from "lucide-react";
import { LAUNCH_PLANS, type LaunchPlan } from "@/lib/axiom/launch-plans";
import { cn } from "@/lib/utils";

const FLING_X = 110;
const FLING_VX = 600;
const PROVISION_Y = -120;
const PROVISION_VY = -700;
const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

const HUE: Record<LaunchPlan["hue"], string> = {
  cyan: "var(--color-accent)",
  signal: "var(--color-signal)",
  amber: "var(--color-amber)",
};

/**
 * Tactile 3D card stack for the launch tiers.
 * Swipe sideways (or arrows / ← →) to cycle tiers. Swipe up, tap the CTA, or press Enter to provision.
 */
export function PricingCardStack({ onProvision }: { onProvision: (plan: LaunchPlan) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [order, setOrder] = useState<number[]>(() => LAUNCH_PLANS.map((_, i) => i));
  const front = order[0]!;

  const cycle = useCallback((dir: 1 | -1) => {
    setOrder((prev) => (dir === 1 ? [...prev.slice(1), prev[0]!] : [prev[prev.length - 1]!, ...prev.slice(0, -1)]));
  }, []);

  const jumpTo = useCallback((index: number) => {
    setOrder((prev) => {
      const at = prev.indexOf(index);
      return at <= 0 ? prev : [...prev.slice(at), ...prev.slice(0, at)];
    });
  }, []);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      cycle(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      cycle(-1);
    } else if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      onProvision(LAUNCH_PLANS[front]!);
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="price-stack relative mx-auto outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        role="region"
        aria-roledescription="carousel"
        aria-label="Axiom launch plans"
        tabIndex={0}
        onKeyDown={onKey}
      >
        {order
          .map((planIndex, depth) => ({ planIndex, depth }))
          .reverse()
          .map(({ planIndex, depth }) => (
            <StackCard
              key={LAUNCH_PLANS[planIndex]!.id}
              plan={LAUNCH_PLANS[planIndex]!}
              depth={depth}
              reduce={reduce}
              onFling={cycle}
              onProvision={onProvision}
            />
          ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => cycle(-1)}
          className="grid size-11 place-items-center rounded-full border border-line bg-obsidian/60 text-muted backdrop-blur-md transition hover:border-accent/60 hover:text-fg"
          aria-label="Previous plan"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose a plan">
          {LAUNCH_PLANS.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              role="tab"
              aria-selected={i === front}
              aria-label={plan.name}
              onClick={() => jumpTo(i)}
              className="grid h-11 min-w-8 place-items-center"
            >
              <span
                className={cn("block h-1.5 rounded-full transition-all duration-300", i === front ? "w-7" : "w-2.5 bg-fg/25")}
                style={i === front ? { background: HUE[plan.hue] } : undefined}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => cycle(1)}
          className="grid size-11 place-items-center rounded-full border border-line bg-obsidian/60 text-muted backdrop-blur-md transition hover:border-accent/60 hover:text-fg"
          aria-label="Next plan"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Swipe to browse · swipe <ChevronsUp className="inline size-3 align-[-2px]" aria-hidden /> to provision
      </p>
    </div>
  );
}

function StackCard({
  plan,
  depth,
  reduce,
  onFling,
  onProvision,
}: {
  plan: LaunchPlan;
  depth: number;
  reduce: boolean;
  onFling: (dir: 1 | -1) => void;
  onProvision: (plan: LaunchPlan) => void;
}) {
  const isFront = depth === 0;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tiltX = useSpring(0, { stiffness: 220, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 220, damping: 18 });
  const dragRotY = useTransform(x, [-240, 240], [-26, 26]);
  const dragRotZ = useTransform(x, [-240, 240], [-9, 9]);
  const dragRotX = useTransform(y, [-200, 0, 200], [18, 0, -10]);
  const rotateY = useTransform(() => dragRotY.get() + tiltY.get());
  const rotateX = useTransform(() => dragRotX.get() + tiltX.get());
  const provisionGlow = useTransform(y, [PROVISION_Y * 1.2, 0], [1, 0]);
  const sheenRef = useRef<HTMLDivElement>(null);
  const flinging = useRef(false);
  const drag = useRef<{ id: number; sx: number; sy: number; samples: { x: number; y: number; t: number }[] } | null>(null);

  useEffect(() => {
    if (!isFront) {
      tiltX.set(0);
      tiltY.set(0);
    }
  }, [isFront, tiltX, tiltY]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!isFront || flinging.current || e.button > 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const now = performance.now();
    const recent = d.samples.filter((s) => now - s.t < 120);
    const first = recent[0] ?? d.samples[d.samples.length - 1]!;
    const dt = Math.max(16, now - first.t) / 1000;
    const velocity = { x: (e.clientX - first.x) / dt, y: (e.clientY - first.y) / dt };
    const offset = { x: e.clientX - d.sx, y: e.clientY - d.sy };
    if (Math.hypot(offset.x, offset.y) < 6) {
      void animate(x, 0, SPRING);
      void animate(y, 0, SPRING);
      return;
    }
    onDragEnd(offset, velocity);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d && d.id === e.pointerId) {
      // Rubber-band the vertical axis so a sideways swipe stays sideways.
      x.set(e.clientX - d.sx);
      y.set((e.clientY - d.sy) * 0.7);
      d.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (d.samples.length > 8) d.samples.shift();
      return;
    }
    if (!isFront || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tiltY.set((px - 0.5) * 16);
    tiltX.set((0.5 - py) * 12);
    sheenRef.current?.style.setProperty("--mx", `${px * 100}%`);
    sheenRef.current?.style.setProperty("--my", `${py * 100}%`);
  }

  function onPointerLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  function onDragEnd(offset: { x: number; y: number }, velocity: { x: number; y: number }) {
    if (offset.y < PROVISION_Y || velocity.y < PROVISION_VY) {
      void animate(y, -70, { ...SPRING, velocity: velocity.y }).then(() => void animate(y, 0, SPRING));
      void animate(x, 0, SPRING);
      onProvision(plan);
      return;
    }
    if (Math.abs(offset.x) > FLING_X || Math.abs(velocity.x) > FLING_VX) {
      const dir = (offset.x || velocity.x) > 0 ? 1 : -1;
      flinging.current = true;
      void animate(x, dir * 560, { duration: reduce ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }).then(() => {
        onFling(1);
        x.jump(0);
        y.jump(0);
        flinging.current = false;
      });
      void animate(y, offset.y * 0.4, SPRING);
      return;
    }
    void animate(x, 0, SPRING);
    void animate(y, 0, SPRING);
  }

  const accent = HUE[plan.hue];

  return (
    <motion.div
      className="price-card absolute inset-0"
      style={
        {
          x,
          y,
          rotateX: isFront ? rotateX : 0,
          rotateY: isFront ? rotateY : 0,
          rotateZ: isFront ? dragRotZ : 0,
          zIndex: 10 - depth,
          "--card-accent": accent,
        } as unknown as CSSProperties
      }
      initial={false}
      animate={{
        scale: 1 - depth * 0.06,
        translateY: depth * 22,
        translateZ: -depth * 70,
        opacity: depth > 2 ? 0 : 1 - depth * 0.22,
        filter: depth ? `blur(${depth * 1.2}px) saturate(0.8)` : "blur(0px) saturate(1)",
      }}
      transition={reduce ? { duration: 0 } : SPRING}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden={!isFront}
      inert={!isFront}
    >
      <div className="price-card-face">
        <div ref={sheenRef} className="price-card-sheen" aria-hidden />
        <motion.div className="price-card-provision" style={{ opacity: provisionGlow }} aria-hidden />

        <div className="relative flex h-full flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: accent }}>
              {plan.tagline}
            </p>
            {plan.id === "lifetime" ? (
              <span className="rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-signal">
                Best value
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-3xl text-fg">{plan.name}</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold tracking-tight text-fg">{plan.priceLabel}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{plan.priceNote}</p>

          <ul className="mt-6 grid gap-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-fg/90">
                <Check className="mt-0.5 size-4 shrink-0" style={{ color: accent }} aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={() => onProvision(plan)}
            className="price-card-cta mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-[0.18em]"
          >
            {plan.cta}
            <ChevronsUp className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
