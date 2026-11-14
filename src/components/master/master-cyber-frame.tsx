import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const MASTER_GLASS =
  "bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] rounded-xl";

export function MasterCyberFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-slate-200 [color-scheme:dark]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.07)_1px,transparent_1px)] bg-[size:48px_48px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/25 blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-red-600/20 blur-[140px]"
        aria-hidden
      />
      <div className={cn("relative z-10 min-h-dvh", className)}>{children}</div>
    </div>
  );
}
