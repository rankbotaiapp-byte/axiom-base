import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-surface-2/80 px-3.5 font-mono text-sm text-fg placeholder:text-faint shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)] outline-none backdrop-blur-md transition-[box-shadow] duration-150 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_55%,transparent),0_0_20px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
