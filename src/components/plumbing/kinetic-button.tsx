import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type KineticVariant = "primary" | "dispatch" | "glass";

type Wave = { id: number; x: number; y: number };
type Spark = { id: number; x: number; y: number; angle: number; dist: number; size: number };

let seq = 0;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Kinetic CTA for the plumber outreach page.
 * - idle: tactile depth on obsidian glass; `pulse` adds a breathing emergency beacon
 * - hover (pointer devices only): a neon light tracks the cursor and the border ignites
 * - press: shockwave rings + a particle burst from the exact touch point, a short haptic tick
 * - busy: spinner, presses ignored
 *
 * With `href` it is a real link (tel:, sms:, same-origin paths) so it works before
 * hydration and with JavaScript off; otherwise it is a button.
 * Sizing is fluid: full width on phones, 52px+ tap target everywhere, labels wrap instead of clipping.
 */
export function KineticButton({
  children,
  variant = "primary",
  href,
  onPress,
  icon,
  sub,
  pulse = false,
  busy = false,
  disabled = false,
  block = false,
  size = "lg",
  type = "button",
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  variant?: KineticVariant;
  href?: string;
  onPress?: () => void;
  icon?: ReactNode;
  /** Small second line under the label (e.g. the phone number). */
  sub?: ReactNode;
  pulse?: boolean;
  busy?: boolean;
  disabled?: boolean;
  /** Fill the container at every width (phones always do). */
  block?: boolean;
  size?: "md" | "lg";
  type?: "button" | "submit";
  ariaLabel?: string;
  className?: string;
}) {
  const timers = useRef<number[]>([]);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function burst(event: MouseEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    // Keyboard activation reports 0,0 — burst from the centre instead.
    const keyboard = event.clientX === 0 && event.clientY === 0;
    const x = keyboard ? box.width / 2 : event.clientX - box.left;
    const y = keyboard ? box.height / 2 : event.clientY - box.top;
    try {
      navigator.vibrate?.(variant === "dispatch" ? [10, 30, 14] : 12);
    } catch {
      /* some browsers throw outside a user gesture */
    }
    if (reducedMotion()) return;
    const wave = { id: ++seq, x, y };
    setWaves((list) => [...list, wave]);
    later(() => setWaves((list) => list.filter((w) => w.id !== wave.id)), 900);
    const next: Spark[] = Array.from({ length: 14 }, (_, i) => ({
      id: ++seq,
      x,
      y,
      angle: (i / 14) * 360 + Math.random() * 22,
      dist: 38 + Math.random() * 54,
      size: 3 + Math.random() * 4,
    }));
    setSparks((list) => [...list, ...next]);
    later(() => setSparks((list) => list.filter((s) => !next.includes(s))), 760);
  }

  function track(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--kx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--ky", `${event.clientY - box.top}px`);
  }

  const inert = busy || disabled;
  const classes = [
    "po-btn",
    `is-${variant}`,
    `is-${size}`,
    pulse ? "is-pulse" : "",
    block ? "is-block" : "",
    busy ? "is-busy" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <span className="po-btn-light" aria-hidden />
      <span className="po-btn-face">
        {busy ? <LoaderCircle className="po-btn-spin" size={18} aria-hidden /> : icon ? <span className="po-btn-icon">{icon}</span> : null}
        <span className="po-btn-text">
          <span className="po-btn-label">{children}</span>
          {sub ? <span className="po-btn-sub">{sub}</span> : null}
        </span>
      </span>
      <span className="po-btn-fx" aria-hidden>
        {waves.map((w) => (
          <span key={w.id} className="po-btn-wave" style={{ left: w.x, top: w.y }}>
            <span />
            <span />
          </span>
        ))}
        {sparks.map((s) => (
          <span
            key={s.id}
            className="po-btn-spark"
            style={{ left: s.x, top: s.y, width: s.size, height: s.size, "--a": `${s.angle}deg`, "--d": `${s.dist}px` } as CSSProperties}
          />
        ))}
      </span>
    </>
  );

  if (href && !inert) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onPointerMove={track}
        onClick={(event) => {
          burst(event);
          onPress?.();
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      disabled={inert}
      onPointerMove={track}
      onClick={(event) => {
        if (inert) return;
        burst(event);
        onPress?.();
      }}
    >
      {inner}
    </button>
  );
}
