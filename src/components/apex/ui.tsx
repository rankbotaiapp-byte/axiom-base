import type { ReactNode, SVGProps } from "react";

/** Shared glass HUD surface. */
export const glassPanel =
  "relative border border-cyan-500/40 bg-slate-950/55 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.2)]";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Sharp tactical corner brackets. */
export function CornerBrackets({ size = 14, className = "" }: { size?: number; className?: string }) {
  const s = { width: size, height: size };
  const base = "pointer-events-none absolute border-cyan-300/90";
  return (
    <span aria-hidden="true" className={className}>
      <span className={cx(base, "-left-px -top-px border-l-2 border-t-2")} style={s} />
      <span className={cx(base, "-right-px -top-px border-r-2 border-t-2")} style={s} />
      <span className={cx(base, "-bottom-px -left-px border-b-2 border-l-2")} style={s} />
      <span className={cx(base, "-bottom-px -right-px border-b-2 border-r-2")} style={s} />
    </span>
  );
}

export function PanelLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
        {children}
      </span>
      {right && <span className="text-slate-400/80">{right}</span>}
    </div>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

const iconBase = (props: IconProps): IconProps => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...props,
});

export const Icon = {
  Bolt: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Gauge: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M12 14 16 9" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <circle cx="12" cy="14" r="1.4" />
    </svg>
  ),
  Sliders: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  Mic: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  Phone: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  Close: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Volume: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  ),
  Mute: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      <path d="m17 9 5 6M22 9l-5 6" />
    </svg>
  ),
  ArrowUp: (p: IconProps) => (
    <svg {...iconBase({ width: 12, height: 12, strokeWidth: 2.4, ...p })}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  ),
  ArrowDown: (p: IconProps) => (
    <svg {...iconBase({ width: 12, height: 12, strokeWidth: 2.4, ...p })}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...iconBase(p)}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  ),
};

/** APEX chevron mark. */
export function ApexMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="apex-mark" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <path d="M2 30 32 2l30 28h-9L32 11 11 30Z" fill="url(#apex-mark)" />
      <path d="M22 30 32 21l10 9Z" fill="#22d3ee" opacity="0.85" />
    </svg>
  );
}
