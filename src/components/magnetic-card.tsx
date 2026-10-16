import type { ReactNode } from "react";
import { Magnetic } from "@/components/magnetic";
import { cn } from "@/lib/utils";

/** Gentle cursor pull for an interactive card. Fine pointers only. */
export function MagneticCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Magnetic className={cn("h-full min-w-0 max-w-full", className)}>{children}</Magnetic>;
}
