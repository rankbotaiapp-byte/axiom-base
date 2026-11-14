import { Check } from "lucide-react";
import { PRICING } from "@/lib/axiom-landing/pricing";

export function TrustMarks({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={
        compact
          ? "mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider text-mist"
          : "mt-5 grid gap-2 sm:grid-cols-2"
      }
    >
      {PRICING.trust.map((item) => (
        <li key={item.id} className={compact ? "inline-flex items-center gap-1.5" : "flex items-center gap-2 text-sm text-mist"}>
          <Check className="h-3.5 w-3.5 shrink-0 text-copper" aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
