import type { ReactNode } from "react";
import { InteractiveOtterHero } from "@/components/interactive-otter-hero";

/** Storefront and studio overlay for the otter loop, or any uploaded hero film. */
export function HeroOtterInteractive({
  src = "/media/otter-hero-animation.mp4",
  active = true,
  children,
}: {
  src?: string;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <InteractiveOtterHero active={active} src={src}>
      {children}
    </InteractiveOtterHero>
  );
}

export { InteractiveOtterHero };
