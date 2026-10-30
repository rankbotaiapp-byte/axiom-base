import { useState, type ReactNode } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

const BUBBLES = [
  { id: "a", x: 10, y: 58, size: 18 },
  { id: "b", x: 24, y: 76, size: 12 },
  { id: "c", x: 72, y: 62, size: 16 },
  { id: "d", x: 86, y: 78, size: 11 },
  { id: "e", x: 16, y: 40, size: 10 },
  { id: "f", x: 82, y: 44, size: 14 },
  { id: "g", x: 46, y: 84, size: 13 },
] as const;

const FLIP = { type: "spring" as const, stiffness: 300, damping: 20 };

/** Barrel-rolls the otter loop and floats bubbles that dissolve on touch. */
export function InteractiveOtterHero({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [turns, setTurns] = useState(0);
  const [popped, setPopped] = useState<ReadonlySet<string>>(new Set());

  if (!active) return children;

  function flip(_event: unknown, info: PanInfo) {
    if (reduce) return;
    const distance = info.offset.x;
    const speed = info.velocity.x;
    if (Math.abs(distance) < 56 && Math.abs(speed) < 480) return;
    const counterClockwise = distance < 0 || speed < -480;
    setTurns((value) => value + (counterClockwise ? -1 : 1));
  }

  function pop(id: string) {
    setPopped((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setPopped((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 1400);
  }

  return (
    <>
      <motion.div
        className="otter-reel"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={flip}
        animate={reduce ? undefined : { rotate: turns * 360 }}
        transition={FLIP}
      >
        {children}
      </motion.div>
      <div className="otter-bubbles" aria-hidden={false}>
        {BUBBLES.map((bubble) => {
          const gone = popped.has(bubble.id);
          return (
            <button
              key={bubble.id}
              type="button"
              className={gone ? "otter-bubble is-pop" : "otter-bubble"}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
              }}
              aria-label="Pop bubble"
              onPointerDown={(event) => {
                event.stopPropagation();
                pop(bubble.id);
              }}
            />
          );
        })}
      </div>
    </>
  );
}
