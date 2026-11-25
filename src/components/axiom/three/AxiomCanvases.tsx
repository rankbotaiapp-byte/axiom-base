"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { AxiomConfig, AxiomExpression } from "@/lib/axiom/landing/config";
import { ParticleField } from "./ParticleField";
import { AxiomCharacter } from "./AxiomCharacter";

const glProps = { antialias: true, alpha: true, powerPreference: "high-performance" as const };

/** Background layer. Sits BELOW the copy. */
export function ParticleCanvas({ config, mode, className = "" }: { config: AxiomConfig; mode?: "page" | "hero"; className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas linear flat dpr={[1, 1.75]} gl={glProps} camera={{ position: [0, 0, 10], fov: 50 }}>
        <ParticleField config={config} mode={mode} />
      </Canvas>
    </div>
  );
}

/** Foreground layer. Sits ABOVE the copy but ignores pointer events so CTAs stay clickable. */
export function CharacterCanvas({
  config,
  expression,
  fitHeight,
  offset,
  className = "",
}: {
  config: AxiomConfig;
  expression?: AxiomExpression;
  fitHeight?: number;
  offset?: [number, number];
  className?: string;
}) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas linear flat dpr={[1, 2]} gl={glProps} camera={{ position: [0, 0, 8], fov: 35 }}>
        <Suspense fallback={null}>
          <AxiomCharacter config={config} expression={expression} fitHeight={fitHeight} offset={offset} />
        </Suspense>
      </Canvas>
    </div>
  );
}
