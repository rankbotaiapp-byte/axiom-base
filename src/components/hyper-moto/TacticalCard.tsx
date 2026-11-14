import type { ReactNode } from "react";

type TacticalCardProps = {
  /** Short index code shown in crimson, e.g. "01". */
  code?: string;
  /** Uppercase header label, e.g. "Live Telemetry". */
  label?: string;
  /** Right side of the header strip (status pill, meta text). */
  aside?: ReactNode;
  /** Brighter edge-light + stronger glow for the primary card in a row. */
  featured?: boolean;
  className?: string;
  bodyClassName?: string;
  id?: string;
  children: ReactNode;
};

const tick = "pointer-events-none absolute h-3 w-3 border-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.9)]";

/**
 * The one framing primitive for every panel on the page:
 * obsidian glass, neon cyan edge-light, corner ticks, and an optional header strip.
 */
export default function TacticalCard({
  code,
  label,
  aside,
  featured = false,
  className = "",
  bodyClassName = "p-5",
  id,
  children,
}: TacticalCardProps) {
  return (
    <div
      id={id}
      className={`relative flex flex-col rounded-xl border bg-[#0b1220]/60 backdrop-blur-xl ${
        featured
          ? "border-cyan-400/60 shadow-[0_0_44px_rgba(6,182,212,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]"
      } ${className}`}
    >
      {/* Edge-light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80"
      />
      {/* Corner ticks */}
      <span aria-hidden className={`${tick} -top-px -left-px rounded-tl-xl border-t-2 border-l-2`} />
      <span aria-hidden className={`${tick} -top-px -right-px rounded-tr-xl border-t-2 border-r-2`} />
      <span aria-hidden className={`${tick} -bottom-px -left-px rounded-bl-xl border-b-2 border-l-2`} />
      <span aria-hidden className={`${tick} -right-px -bottom-px rounded-br-xl border-r-2 border-b-2`} />

      {(code || label || aside) && (
        <div className="flex h-10 items-center justify-between gap-3 border-b border-cyan-500/15 px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {code && <span className="font-mono text-[10px] font-bold tracking-widest text-red-400">{code}</span>}
            {code && label && <span aria-hidden className="h-3 w-px bg-cyan-500/30" />}
            {label && (
              <span className="truncate font-mono text-[11px] tracking-[0.25em] text-slate-300 uppercase">{label}</span>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function StatusPill({ online, label }: { online: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ${
        online ? "border-cyan-400/40 text-cyan-300" : "border-red-500/50 text-red-400"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            online ? "bg-cyan-400" : "bg-red-500"
          }`}
        />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${online ? "bg-cyan-400" : "bg-red-500"}`} />
      </span>
      {label ?? (online ? "Online" : "Offline")}
    </span>
  );
}
