"use client";

import { motion, type Variants } from "framer-motion";
import { CalendarCheck, ShieldCheck, Waves, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ActionDockProps {
  onDive: () => void;
  onSpecs: () => void;
  bookingUrl: string;
  diving: boolean;
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 1.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const btnBase =
  "group relative flex w-full items-center justify-center gap-2 sm:justify-start sm:gap-3 sm:text-left overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950/45 px-2 py-2 shadow sm:px-3 sm:py-3-[0_0_35px_rgba(6,182,212,0.2)] backdrop-blur-2xl transition-colors hover:border-cyan-300/80 hover:bg-cyan-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:px-4 lg:w-[17.5rem]";

function DockInner({
  icon: Icon,
  title,
  shortTitle,
  sub,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  shortTitle: string;
  sub: string;
  accent?: ReactNode;
}) {
  return (
    <>
      <span className="absolute inset-y-0 left-0 w-0.5 bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.9)] transition-all group-hover:w-1" aria-hidden="true" />
      <span className="grid h-7 w-7 shrink-0 sm:h-9 sm:w-9 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 transition group-hover:bg-cyan-400/20 group-hover:text-cyan-50">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 sm:flex-1">
        <span className="block truncate font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-50 sm:text-xs sm:tracking-[0.16em]">
          <span className="sm:hidden">{shortTitle}</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
        <span className="mt-0.5 hidden truncate text-[11px] text-slate-400 sm:block">{sub}</span>
      </span>
      {accent}
    </>
  );
}

export function ActionDock({ onDive, onSpecs, bookingUrl, diving }: ActionDockProps) {
  const external = /^https?:\/\//.test(bookingUrl);

  return (
    <motion.nav
      data-fx-ignore
      aria-label="Expedition actions"
      className="pointer-events-auto grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto lg:flex-col lg:gap-3"
      variants={list}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <motion.button
          type="button"
          onClick={onDive}
          disabled={diving}
          whileTap={{ scale: 0.96 }}
          className={`${btnBase} disabled:cursor-wait`}
          aria-label="Start dive"
        >
          <DockInner
            icon={Waves}
            title={diving ? "Diving…" : "Start Dive"}
            shortTitle={diving ? "Diving" : "Dive"}
            sub="Immersive descent"
            accent={
              diving ? (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-t from-cyan-400/30 to-transparent"
                  initial={{ y: "100%" }}
                  animate={{ y: "-100%" }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  aria-hidden="true"
                />
              ) : null
            }
          />
        </motion.button>
      </motion.div>

      <motion.div variants={item}>
        <motion.button type="button" onClick={onSpecs} whileTap={{ scale: 0.96 }} className={btnBase} aria-haspopup="dialog">
          <DockInner icon={ShieldCheck} title="Conservation Specs" shortTitle="Specs" sub="Habitat metrics" />
        </motion.button>
      </motion.div>

      <motion.div variants={item}>
        <motion.a
          href={bookingUrl}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          whileTap={{ scale: 0.96 }}
          className={btnBase}
        >
          <DockInner icon={CalendarCheck} title="Book Expedition" shortTitle="Book" sub="Guided expedition" />
        </motion.a>
      </motion.div>

    </motion.nav>
  );
}
