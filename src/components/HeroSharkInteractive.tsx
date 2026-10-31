import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const SHARK_LOOP = "/media/shark-hero-animation.mp4";
const SPRING = { type: "spring" as const, stiffness: 280, damping: 18 };

const CREATURES = [
  { id: "barracuda", kind: "school" as const, label: "Startle the barracudas", x: 78, y: 28, w: 22, h: 18 },
  { id: "octopus", kind: "octopus" as const, label: "Startle the octopus", x: 18, y: 72, w: 24, h: 22 },
  { id: "shark", kind: "apex" as const, label: "Nudge the shark", x: 48, y: 42, w: 28, h: 20 },
  { id: "eel", kind: "eel" as const, label: "Startle the eel", x: 22, y: 38, w: 18, h: 16 },
] as const;

type Ripple = { id: number; x: number; y: number };
type Ink = { id: number; x: number; y: number };
type Dart = { dx: number; dy: number; ink?: boolean };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Deep-sea overlay: ripples, startled schools, ink, and a splash veil. */
export function HeroSharkInteractive({
  active,
  src,
  children,
}: {
  active: boolean;
  src?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const lastRipple = useRef(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [ink, setInk] = useState<Ink[]>([]);
  const [darts, setDarts] = useState<Record<string, Dart>>({});

  if (!active) return children ?? null;

  function point(event: PointerEvent<HTMLElement>) {
    const box = stage.current?.getBoundingClientRect();
    if (!box || box.width < 1 || box.height < 1) return { x: 50, y: 50 };
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 100, 3, 97),
      y: clamp(((event.clientY - box.top) / box.height) * 100, 3, 97),
    };
  }

  function ripple(x: number, y: number) {
    const now = performance.now();
    if (now - lastRipple.current < 40) return;
    lastRipple.current = now;
    const id = nextId.current++;
    setRipples((rows) => [...rows.slice(-6), { id, x, y }]);
    window.setTimeout(() => {
      setRipples((rows) => rows.filter((row) => row.id !== id));
    }, 900);
  }

  function startle(id: string, kind: (typeof CREATURES)[number]["kind"], event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const at = point(event);
    ripple(at.x, at.y);
    if (reduce) return;
    const creature = CREATURES.find((row) => row.id === id);
    const awayX = creature && at.x < creature.x ? 14 : -14;
    const awayY = creature && at.y < creature.y ? 10 : -10;
    const burst = kind === "octopus";
    if (burst) {
      const inkId = nextId.current++;
      setInk((rows) => [...rows.slice(-3), { id: inkId, x: at.x, y: at.y }]);
      window.setTimeout(() => setInk((rows) => rows.filter((row) => row.id !== inkId)), 1100);
    }
    setDarts((current) => ({
      ...current,
      [id]: {
        dx: kind === "school" ? awayX * 1.6 : awayX,
        dy: kind === "eel" ? awayY * 1.4 : awayY,
        ink: burst,
      },
    }));
    window.setTimeout(() => {
      setDarts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }, 900);
  }

  const film = children ?? (
    <video className="film-hero-media" src={src || SHARK_LOOP} autoPlay muted loop playsInline preload="auto" aria-hidden />
  );

  return (
    <div ref={stage} className="sea-stage">
      <div className="sea-reel">{film}</div>
      <div
        className="sea-water"
        onPointerDown={(event) => ripple(point(event).x, point(event).y)}
        onPointerMove={(event) => {
          if (event.buttons) ripple(point(event).x, point(event).y);
        }}
      />
      {CREATURES.map((creature) => {
        const dart = darts[creature.id];
        return (
          <motion.button
            key={creature.id}
            type="button"
            className={`sea-hit is-${creature.kind}${dart?.ink ? " is-ink" : ""}`}
            style={{
              left: `${creature.x}%`,
              top: `${creature.y}%`,
              width: `${creature.w}%`,
              height: `${creature.h}%`,
            }}
            aria-label={creature.label}
            animate={
              reduce
                ? undefined
                : dart
                  ? { x: dart.dx * 6, y: dart.dy * 5, scale: creature.kind === "apex" ? 1.04 : 0.92 }
                  : { x: 0, y: 0, scale: 1 }
            }
            transition={SPRING}
            onPointerDown={(event) => startle(creature.id, creature.kind, event)}
          />
        );
      })}
      <div className="sea-fx" aria-hidden>
        {ripples.map((row) => (
          <span key={row.id} className="sea-ripple" style={{ left: `${row.x}%`, top: `${row.y}%` }} />
        ))}
        {ink.map((row) => (
          <span key={row.id} className="sea-ink" style={{ left: `${row.x}%`, top: `${row.y}%` }} />
        ))}
      </div>
    </div>
  );
}
