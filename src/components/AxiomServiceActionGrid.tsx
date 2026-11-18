"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  Headphones,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

type ServiceAction = {
  id: string;
  label: string;
  blurb: string;
  href: string;
  Icon: LucideIcon;
  /** Tailwind theme tokens for rim / glow / text */
  rim: string;
  glow: string;
  icon: string;
  face: string;
  labelColor: string;
};

const ACTIONS: ServiceAction[] = [
  {
    id: "schedule",
    label: "Schedule",
    blurb: "24/7 booking",
    href: "#launch",
    Icon: CalendarDays,
    rim: "from-amber-200/90 via-amber-500/70 to-amber-800/80",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.45),0_0_56px_rgba(245,158,11,0.2)]",
    icon: "text-amber-300",
    face: "from-amber-500/25 via-slate-950/90 to-slate-950/95",
    labelColor: "text-amber-100/95",
  },
  {
    id: "payments",
    label: "Payments",
    blurb: "Stripe billing",
    href: "#pricing",
    Icon: CreditCard,
    rim: "from-cyan-100/90 via-cyan-400/70 to-cyan-800/80",
    glow: "shadow-[0_0_28px_rgba(6,182,212,0.45),0_0_56px_rgba(6,182,212,0.2)]",
    icon: "text-cyan-300",
    face: "from-cyan-500/25 via-slate-950/90 to-slate-950/95",
    labelColor: "text-cyan-100/95",
  },
  {
    id: "support",
    label: "Support",
    blurb: "Live dispatch",
    href: "#how",
    Icon: Headphones,
    rim: "from-emerald-100/90 via-emerald-400/70 to-emerald-800/80",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.45),0_0_56px_rgba(16,185,129,0.2)]",
    icon: "text-emerald-300",
    face: "from-emerald-500/25 via-slate-950/90 to-slate-950/95",
    labelColor: "text-emerald-100/95",
  },
  {
    id: "analytics",
    label: "Analytics",
    blurb: "Live metrics",
    href: "#proof",
    Icon: LayoutDashboard,
    rim: "from-purple-100/90 via-purple-400/70 to-purple-900/80",
    glow: "shadow-[0_0_28px_rgba(168,85,247,0.45),0_0_56px_rgba(168,85,247,0.2)]",
    icon: "text-purple-300",
    face: "from-purple-500/25 via-slate-950/90 to-slate-950/95",
    labelColor: "text-purple-100/95",
  },
];

function ServiceActionButton({ action }: { action: ServiceAction }) {
  const { Icon } = action;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      whileHover={{ scale: 1.05, z: 20 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <Link
        href={action.href}
        className={`group relative flex h-[118px] w-[118px] items-center justify-center rounded-full sm:h-[132px] sm:w-[132px] lg:h-[148px] lg:w-[148px] ${action.glow} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50`}
        aria-label={`${action.label} — ${action.blurb}`}
      >
        {/* Brushed metal outer ring */}
        <span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${action.rim} p-[2.5px]`}
          aria-hidden
        >
          <span
            className="absolute inset-[2.5px] rounded-full"
            style={{
              background: `
                conic-gradient(from 210deg,
                  rgba(255,255,255,0.55) 0deg,
                  rgba(148,163,184,0.35) 70deg,
                  rgba(71,85,105,0.8) 140deg,
                  rgba(226,232,240,0.45) 210deg,
                  rgba(100,116,139,0.7) 280deg,
                  rgba(255,255,255,0.5) 360deg)
              `,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))",
            }}
          />
        </span>

        {/* Inset dark glassmorphic face */}
        <span
          className={`relative z-[1] flex h-[78%] w-[78%] flex-col items-center justify-center gap-1 rounded-full border border-white/10 bg-gradient-to-b ${action.face} backdrop-blur-xl transition group-hover:border-white/25`}
          style={{
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.28)",
              "inset 0 -18px 28px rgba(0,0,0,0.55)",
              "inset 0 12px 20px rgba(255,255,255,0.06)",
            ].join(","),
          }}
        >
          <Icon
            className={`h-7 w-7 sm:h-8 sm:w-8 ${action.icon} drop-shadow-[0_0_10px_currentColor]`}
            strokeWidth={1.6}
            aria-hidden
          />
          <span
            className={`font-mono text-[9px] font-semibold uppercase tracking-[0.14em] sm:text-[10px] ${action.labelColor}`}
          >
            {action.label}
          </span>
        </span>

        {/* Back-lit rim wash */}
        <span
          className="pointer-events-none absolute inset-[-6%] rounded-full opacity-70 blur-md transition group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, transparent 48%, rgba(255,255,255,0.12) 62%, transparent 78%)",
          }}
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}

/**
 * 2×2 metallic / glassmorphic service action grid with a Master Core hub.
 */
export function AxiomServiceActionGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto grid w-[min(92vw,340px)] grid-cols-2 gap-3 sm:w-[min(80vw,380px)] sm:gap-4 lg:w-[400px] lg:gap-5 ${className}`}
      data-axiom-service-action-grid=""
    >
      {/* Cross spines — decorative only */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-1/2 top-[12%] h-[76%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
        <div className="absolute left-[12%] top-1/2 h-px w-[76%] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      {/* Master Core — primary BOOK NOW hub (grid cards untouched) */}
      <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="group/core relative flex flex-col items-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
        >
          {/* Dual-color cyan ↔ amber pulse */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0,242,254,0.55) 0%, rgba(245,158,11,0.35) 45%, transparent 70%)",
              animation: "axiom-core-pulse 2.4s ease-in-out infinite alternate",
            }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.65) 0%, rgba(0,242,254,0.4) 50%, transparent 72%)",
              animation: "axiom-core-pulse 2.4s ease-in-out infinite alternate-reverse",
            }}
            aria-hidden
          />

          <Link
            href="#launch"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-slate-100/50 via-slate-700/90 to-slate-950 shadow-[0_0_28px_rgba(0,242,254,0.55),0_0_48px_rgba(245,158,11,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 sm:h-12 sm:w-12"
            style={{
              boxShadow: [
                "inset 0 1px 2px rgba(255,255,255,0.55)",
                "inset 0 -6px 12px rgba(0,0,0,0.45)",
                "0 0 28px rgba(0,242,254,0.55)",
                "0 0 48px rgba(245,158,11,0.35)",
              ].join(","),
            }}
            aria-label="Book now — start 24/7 AI booking"
          >
            <span className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#00f2fe] via-amber-300 to-amber-500 opacity-90 blur-[0.5px]" />
            <span className="relative z-[1] font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-slate-950 sm:text-[8px]">
              START
            </span>
          </Link>

          {/* Floating label — reveals on hover */}
          <span className="pointer-events-none absolute top-[calc(100%+8px)] whitespace-nowrap rounded-full border border-white/15 bg-slate-950/85 px-2.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-cyan-100/90 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-md transition-opacity duration-200 group-hover/core:opacity-100 sm:text-[9px]">
            BOOK 24/7
          </span>
        </motion.div>
      </div>

      <style>{`
        @keyframes axiom-core-pulse {
          from {
            opacity: 0.55;
            transform: translate(-50%, -50%) scale(0.88);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.18);
          }
        }
      `}</style>

      {ACTIONS.map((action) => (
        <ServiceActionButton key={action.id} action={action} />
      ))}
    </div>
  );
}

export default AxiomServiceActionGrid;
