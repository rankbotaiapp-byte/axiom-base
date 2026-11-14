import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { Magnetic } from "@/components/magnetic";
import { cn } from "@/lib/utils";

/**
 * Fine-pointer tilt and sheen, with a gentle magnetic pull.
 * Touch and reduced motion leave the card still.
 */
export function HoloCard({
  children,
  className,
  tilt = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  const live = useRef(false);
  const tiltRef = useRef(tilt);
  tiltRef.current = tilt;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    const sync = () => {
      live.current = fine.matches && !reduce.matches;
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
    if (box.width < 1 || box.height < 1) return;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    event.currentTarget.style.setProperty("--sx", `${((px + 0.5) * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--sy", `${((py + 0.5) * 100).toFixed(1)}%`);
    if (!tiltRef.current) return;
    event.currentTarget.style.setProperty("--rx", `${(-py * 2.5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--ry", `${(px * 2.5).toFixed(2)}deg`);
  }

  function onLeave(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  }

  return (
    <Magnetic className="h-full min-w-0 max-w-full">
      <div
        className={cn("holo-tilt h-full min-w-0", tilt && "holo-tilt-on", className)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {children}
        <span className="holo-sheen" aria-hidden />
      </div>
    </Magnetic>
  );
}
