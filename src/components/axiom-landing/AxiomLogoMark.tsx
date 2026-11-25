"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const LOGO_LOOP = "/media/studio-cyan-fog-loop.mp4";
const LOGO_POSTER = "/media/studio-cyan-fog-poster.jpg";

/**
 * Nav and hero lockup. The first paint is the resting logo so reduced-motion
 * visitors are never left on the hidden entrance pose. When motion is allowed,
 * the stone mark scales and fades in, then tilts slightly on hover.
 */
export function AxiomLogoMark({
  href = "#top",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <motion.a
      href={href}
      aria-label="Axiom"
      className={`inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00ffcc] ${className}`}
      initial={false}
      animate={live ? { opacity: [0, 1], scale: [0.84, 1], rotate: [0, 0] } : { opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      whileHover={{ scale: 1.06, rotate: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      <video
        src={LOGO_LOOP}
        poster={LOGO_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="block h-10 w-auto max-w-[9.5rem] object-contain sm:h-12"
        style={{ objectFit: "contain" }}
      />
    </motion.a>
  );
}
