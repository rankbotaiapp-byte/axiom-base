import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { identitySurface, type StudioIdentity } from "@/lib/axiom/studio-identity";
import { cn } from "@/lib/utils";

/**
 * The published hero. The branded plate is a 3D card: a slow orbit, a neon
 * sweep, and the mark sitting in front of the landscape.
 */
export function StudioCinematicHero({
  plateUrl,
  identity,
  className,
  children,
}: {
  plateUrl: string;
  identity: StudioIdentity;
  className?: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const motionOn = reduced === false;
  return (
    <section
      className={cn("studio-cine", className)}
      style={identitySurface(identity)}
      aria-label={`${identity.businessName} hero`}
    >
      <div className="studio-cine-stage" aria-hidden>
        <motion.div
          className="studio-cine-rig"
          initial={{ rotateX: 7, rotateY: -8, scale: 1.08, z: 24 }}
          animate={
            motionOn
              ? { rotateX: [7, 2, 7], rotateY: [-8, 8, -8], scale: [1.08, 1.16, 1.08], z: [24, 56, 24] }
              : { rotateX: 7, rotateY: -8, scale: 1.08, z: 24 }
          }
          transition={motionOn ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
        >
          <img src={plateUrl} alt="" />
          <span className="studio-cine-neon" />
        </motion.div>
        {motionOn ? (
          <motion.span
            className="studio-cine-beam"
            initial={{ x: "-40%" }}
            animate={{ x: ["-40%", "140%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <span className="studio-cine-beam is-still" />
        )}
      </div>
      <div className="studio-cine-copy">{children}</div>
    </section>
  );
}
