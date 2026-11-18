"use client";

import { Zap } from "lucide-react";
import { useStorefrontBookingOptional } from "@/components/conversion/StorefrontBookingHost";
import { dispatchedTodayCount } from "@/lib/axiom/instant-quote-catalog";
import { cn } from "@/lib/utils";

export function EmergencyDispatchBar({
  city,
  className,
  placement = "bottom",
}: {
  city: string;
  className?: string;
  placement?: "top" | "bottom";
}) {
  const booking = useStorefrontBookingOptional();
  const count = dispatchedTodayCount(city || "your area");
  const place = city.trim() || "your area";

  if (!booking) return null;

  const position =
    placement === "top"
      ? "fixed inset-x-0 top-0 z-[45] border-b"
      : "fixed inset-x-0 bottom-0 z-[45] storefront-dispatch-bar";

  return (
    <div
      className={cn(position, className)}
      style={{
        paddingBottom: placement === "bottom" ? "max(0.65rem, env(safe-area-inset-bottom))" : undefined,
        paddingTop: placement === "top" ? "max(0.35rem, env(safe-area-inset-top))" : undefined,
      }}
      role="region"
      aria-label="Emergency dispatch"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/75 sm:text-[11px]">
          <span className="storefront-dispatch-dot h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
          <span>
            <strong className="text-emerald-200">{count}</strong> local techs dispatched today in{" "}
            <span className="text-[var(--brand-glow)]">{place}</span>
          </span>
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/12 px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand-glow)] shadow-[0_0_24px_color-mix(in_srgb,var(--brand-primary)_22%,transparent)] transition hover:brightness-110 sm:w-auto sm:min-w-[280px]"
          onClick={() => booking.openVideoBooking("emergency")}
        >
          <Zap className="h-4 w-4 text-[var(--brand-primary)]" />
          Request emergency dispatch (under 45 min)
        </button>
      </div>
    </div>
  );
}