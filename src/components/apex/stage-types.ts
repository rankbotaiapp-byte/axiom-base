import type { Ref, RefObject } from "react";
import type { PointerRig } from "./usePointerRig";

/** Imperative API shared by the WebGL stage and the CSS fallback stage. */
export interface StageHandle {
  /** Fires the launch surge: particle storm, bloom spike, flash, chromatic shake. */
  surge: () => void;
}

export interface StageProps {
  rig: RefObject<PointerRig>;
  /** Exhaust flame hue rotation in radians (0 = stock cyan). */
  flameHue: number;
  onReady?: () => void;
  stageRef?: Ref<StageHandle>;
}
