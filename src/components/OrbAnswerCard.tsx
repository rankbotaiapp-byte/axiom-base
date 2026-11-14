"use client";

import { motion } from "framer-motion";

export function OrbAnswerCard({
  open,
  question,
  answer,
}: {
  open: boolean;
  question: string;
  answer: string;
}) {
  return (
    <motion.article
      aria-hidden={!open}
      animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.9 }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
      className="pointer-events-none w-44 text-center"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-accent">Live Out Loud</p>
      {question ? <p className="mt-2 text-xs leading-5 text-muted">{question}</p> : null}
      <p className="mt-2 font-display text-lg leading-6 text-fg">{answer || "Listening for the question."}</p>
    </motion.article>
  );
}
