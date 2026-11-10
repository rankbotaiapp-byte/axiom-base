"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { WaterFXEngine } from "@/lib/otter/water-fx-engine";

export interface WaterFXHandle {
  surge: () => void;
}

interface WaterFXCanvasProps {
  onPop: (x: number, y: number) => void;
  /** Pointer events inside elements matching this selector won't ripple or pop. */
  ignoreSelector?: string;
}

export const WaterFXCanvas = forwardRef<WaterFXHandle, WaterFXCanvasProps>(function WaterFXCanvas(
  { onPop, ignoreSelector = "[data-fx-ignore]" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WaterFXEngine | null>(null);
  const onPopRef = useRef(onPop);

  useEffect(() => {
    onPopRef.current = onPop;
  }, [onPop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new WaterFXEngine(canvas, {
      ignoreSelector,
      onPop: (x, y) => onPopRef.current(x, y),
    });
    engine.start();
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [ignoreSelector]);

  useImperativeHandle(ref, () => ({
    surge: () => engineRef.current?.surge(),
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
});
