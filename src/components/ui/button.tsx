import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Magnetic } from "@/components/magnetic";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[scale,background-color,color,box-shadow,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary:
          "bg-fg text-bg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] hover:bg-fg/90",
        secondary:
          "glass-panel text-fg hover:text-fg",
        ghost: "glass-panel text-fg hover:text-fg",
        accent: "bg-accent text-bg hover:bg-accent/90",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3 text-sm",
        md: "h-11 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-[14px] px-5 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <Magnetic className={cn("inline-flex max-w-full", className?.includes("w-full") && "w-full")}>
      <button
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    </Magnetic>
  );
}
