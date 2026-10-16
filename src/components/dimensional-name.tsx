import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Beveled display type. Reduced motion keeps the depth and drops the sheen loop. */
export function DimensionalName({
  children,
  className,
  as: Tag = "h1",
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setLive(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Tag className={cn("type-3d", live && "type-3d-live", className)}>
      <span className="type-3d-face">{children}</span>
    </Tag>
  );
}
