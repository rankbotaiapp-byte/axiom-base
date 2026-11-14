import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 70, damping: 16, mass: 0.85 };

/** Scrolls a block in with a spring. Reduced motion stays fully visible. */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Stagger direct children along the grid instead of moving the whole block. */
  stagger?: boolean;
}) {
  const reduce = useReducedMotion();
  const still = reduce !== false;

  if (stagger) {
    return (
      <div className={cn(className)}>
        {Children.map(children, (child, index) => (
          <motion.div
            key={index}
            className="min-w-0"
            initial={still ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -24px 0px" }}
            transition={still ? { duration: 0 } : { ...spring, delay: delay + index * 0.06 }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -24px 0px" }}
      transition={still ? { duration: 0 } : { ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}
