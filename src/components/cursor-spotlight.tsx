import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Ambient light behind a grid. Fine pointers only. The wash never takes the click. */
export function CursorSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    const sync = () => {
      live.current = fine.matches && !reduce.matches;
      if (!live.current) ref.current?.classList.remove("is-hot");
    };
    sync();
    reduce.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
    };
  }, []);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (!live.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
    event.currentTarget.classList.add("is-hot");
  }

  return (
    <div
      ref={ref}
      className={cn("spot-field relative", className)}
      onPointerMove={onMove}
      onPointerLeave={(event) => event.currentTarget.classList.remove("is-hot")}
    >
      <span className="section-spot" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
