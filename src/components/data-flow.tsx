import { cn } from "@/lib/utils";

const PATH = "M120 2 V16 C120 28 176 28 176 40 V52 C176 62 120 62 120 70";

/** Thin neon route between major blocks. Pointer events stay off the line. */
export function DataFlow({ className }: { className?: string }) {
  return (
    <div className={cn("data-flow pointer-events-none w-full overflow-hidden px-5 sm:px-10", className)} aria-hidden>
      <svg viewBox="0 0 240 72" preserveAspectRatio="xMidYMid meet" className="mx-auto block h-16 w-full max-w-3xl">
        <path className="data-flow-track" d={PATH} />
        <path className="data-flow-pulse" d={PATH} />
      </svg>
    </div>
  );
}
