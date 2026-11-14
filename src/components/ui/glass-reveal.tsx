import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassRevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  glass?: boolean;
};

/** Smooth entrance for glass panels — opacity + slight rise, respects reduced motion. */
export function GlassReveal({
  className,
  delay = 0,
  glass = true,
  children,
  ...props
}: GlassRevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(glass && "glass-card", className)}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
