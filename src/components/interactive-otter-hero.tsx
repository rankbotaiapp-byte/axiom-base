import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

const SEED = [
  { id: "a", x: 8, y: 58, size: 18 },
  { id: "b", x: 22, y: 78, size: 13 },
  { id: "c", x: 74, y: 64, size: 16 },
  { id: "d", x: 88, y: 80, size: 11 },
  { id: "e", x: 12, y: 38, size: 10 },
  { id: "f", x: 84, y: 42, size: 14 },
  { id: "g", x: 48, y: 86, size: 12 },
] as const;

const FLIP = { type: "spring" as const, stiffness: 300, damping: 20 };
const OTTER_LOOP = "/media/otter-hero-animation.mp4";

type Bubble = { id: string; x: number; y: number; size: number };
type Ripple = { id: number; x: number; y: number };
type Splash = { id: number; x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Barrel-rolls the loop, pops bubbles into spray, and ripples on tap. */
export function InteractiveOtterHero({
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
  const hit = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);
  const [turns, setTurns] = useState(0);
  const [pops, setPops] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => SEED.map((row) => ({ ...row })));
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);

  useEffect(() => {
    if (!active || reduce) return;
    const timer = window.setInterval(() => {
      setBubbles((rows) => {
        if (rows.length >= 14) return rows;
        const id = `s${nextId.current++}`;
        const edge = Math.random() < 0.5;
        return [
          ...rows,
          {
            id,
            x: edge ? (Math.random() < 0.5 ? 8 + Math.random() * 12 : 80 + Math.random() * 12) : 18 + Math.random() * 64,
            y: edge ? 36 + Math.random() * 48 : 78 + Math.random() * 12,
            size: 10 + Math.round(Math.random() * 8),
          },
        ];
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, [active, reduce]);

  if (!active) return children ?? null;

  function mark(x: number, y: number) {
    const id = nextId.current++;
    setRipples((rows) => [...rows.slice(-5), { id, x, y }]);
    setSplashes((rows) => [...rows.slice(-5), { id, x, y }]);
    window.setTimeout(() => {
      setRipples((rows) => rows.filter((row) => row.id !== id));
      setSplashes((rows) => rows.filter((row) => row.id !== id));
    }, 700);
  }

  function point(event: PointerEvent<HTMLElement>) {
    const box = stage.current?.getBoundingClientRect();
    if (!box || box.width < 1 || box.height < 1) return { x: 50, y: 50 };
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 100, 4, 96),
      y: clamp(((event.clientY - box.top) / box.height) * 100, 4, 96),
    };
  }

  function flip(_event: unknown, info: PanInfo) {
    if (reduce) return;
    const distance = info.offset.x;
    const speed = info.velocity.x;
    if (Math.abs(distance) < 48 && Math.abs(speed) < 420) return;
    const counterClockwise = distance < 0 || speed < -420;
    setTurns((value) => value + (counterClockwise ? -1 : 1));
  }

  function tap(event: PointerEvent<HTMLButtonElement>) {
    mark(point(event).x, point(event).y);
    setPops((value) => value + 1);
    if (!reduce) setTurns((value) => value + (value % 2 === 0 ? 1 : -1));
  }

  function pop(id: string, event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const at = point(event);
    mark(at.x, at.y);
    setPops((value) => value + 1);
    setBubbles((rows) => rows.filter((row) => row.id !== id));
    window.setTimeout(() => {
      setBubbles((rows) => {
        if (rows.some((row) => row.id === id) || rows.length >= 12) return rows;
        return [...rows, { id, x: 10 + Math.random() * 80, y: 42 + Math.random() * 40, size: 11 + Math.round(Math.random() * 7) }];
      });
    }, 1400);
  }

  const film = children ?? (
    <video className="film-hero-media" src={src || OTTER_LOOP} autoPlay muted loop playsInline preload="auto" aria-hidden />
  );

  return (
    <div ref={stage} className="otter-stage">
      <motion.div className="otter-reel" animate={reduce ? undefined : { rotate: turns * 360 }} transition={FLIP}>
        {film}
      </motion.div>
      <motion.button
        ref={hit}
        type="button"
        className="otter-hit"
        aria-label="Flip the otter"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={flip}
        onPointerDown={tap}
      />
      <div className="otter-bubbles">
        {ripples.map((ripple) => (
          <span key={`r${ripple.id}`} className="otter-ripple" style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }} aria-hidden />
        ))}
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            type="button"
            className="otter-bubble"
            style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.size, height: bubble.size }}
            aria-label="Pop bubble"
            onPointerDown={(event) => pop(bubble.id, event)}
          />
        ))}
        {splashes.map((splash) => (
          <span key={`s${splash.id}`} className="otter-splash" style={{ left: `${splash.x}%`, top: `${splash.y}%` }} aria-hidden>
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className={`otter-spray is-${index}`} />
            ))}
          </span>
        ))}
      </div>
      <p className="otter-count" aria-live="polite">
        {pops ? `${pops} pops` : ""}
      </p>
    </div>
  );
}
