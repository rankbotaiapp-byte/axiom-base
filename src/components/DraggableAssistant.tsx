"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { OrbAnswerCard } from "@/components/OrbAnswerCard";

export function DraggableAssistant({
  boundsRef,
  listening,
  question,
  answer,
  asking,
  error,
  onToggle,
}: {
  boundsRef: RefObject<HTMLElement | null>;
  listening: boolean;
  question: string;
  answer: string;
  asking: boolean;
  error: string | null;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(true);
  }, []);

  return (
    <motion.div
      className="cinematic-orb-hit is-pass"
      drag
      dragConstraints={boundsRef}
      dragElastic={0.2}
      dragMomentum
      whileDrag={{ scale: 1.04 }}
      aria-label="Colored orb assistant"
    >
      <motion.div
        className="relative h-full w-full"
        animate={reduce || !live ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-0 grid place-items-center px-4">
          <OrbAnswerCard open={Boolean(answer) || asking} question={question} answer={asking ? "Shaping the answer…" : answer} />
        </div>
        <button
          type="button"
          className="glass-btn absolute bottom-1 left-1/2 z-30 h-11 -translate-x-1/2 rounded-full px-4 text-sm text-fg"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onToggle}
        >
          {listening ? "Listening" : "Ask aloud"}
        </button>
        {error ? <p className="absolute bottom-14 left-0 right-0 text-center text-xs text-muted">{error}</p> : null}
      </motion.div>
    </motion.div>
  );
}
