"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeviceTier } from "./config";

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

const ORDER: DeviceTier[] = ["desktop", "mobile", "low"];

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectDeviceTier(): DeviceTier {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("tier");
  if (forced === "desktop" || forced === "mobile" || forced === "low") return forced;

  const nav = navigator as NavigatorWithHints;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = nav.connection?.effectiveType === "2g" || nav.connection?.effectiveType === "slow-2g";
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  const lowCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;

  if (reducedMotion || saveData || slowNetwork || lowMemory || lowCores || !supportsWebGL2()) return "low";

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  return coarse || narrow ? "mobile" : "desktop";
}

/**
 * Resolves the rendering tier on the client. `null` while detecting (first paint
 * shows the poster), then a tier. `downgrade()` steps one tier lower — called by
 * the WebGL stage's FPS watchdog or after a lost GL context.
 */
export function useDeviceTier(): { tier: DeviceTier | null; downgrade: () => void } {
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    setTier(detectDeviceTier());
  }, []);

  const downgrade = useCallback(() => {
    setTier((current) => {
      if (!current) return current;
      const next = ORDER[Math.min(ORDER.indexOf(current) + 1, ORDER.length - 1)];
      return next ?? current;
    });
  }, []);

  return { tier, downgrade };
}
