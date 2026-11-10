"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export function SectionHeading({ index, eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`mb-10 max-w-3xl sm:mb-14 ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <p
        className={`flex items-center gap-3 font-mono text-[11px] tracking-[0.35em] text-neon-cyan ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        <span className="text-neon-red">{index}</span>
        <span className="h-px w-8 bg-neon-cyan/50" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base text-slate-400 sm:text-lg">{description}</p>
    </motion.header>
  );
}
