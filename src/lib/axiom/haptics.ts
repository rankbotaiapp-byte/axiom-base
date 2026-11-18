export type HapticPattern = "tap" | "select" | "success" | "error";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 12,
  select: 8,
  success: [14, 50, 22],
  error: [40, 60, 40],
};

export function haptic(pattern: HapticPattern = "tap"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    /* blocked by permissions policy or no user activation yet */
  }
}

/** Tail breaks the surface on hero-loop-optimized.mp4. */
export const FISH_SPLASH_AT = 9.88;

/** Fish-release splash: one short pulse, a gap, then a second short pulse. */
export function vibrateSplash(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([25, 50, 25]);
  } catch {
    /* blocked by permissions policy or no user activation yet */
  }
}

/** Short double-tap used when the hero loop starts or restarts. */
export function hapticLoopStart(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate([10, 24, 14]);
  } catch {
    /* blocked by permissions policy or no user activation yet */
  }
}

export const triggerHaptic = (pattern: "light" | "medium" | "heavy" | "success" | "generate") => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (pattern) {
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(40);
        break;
      case "heavy":
        navigator.vibrate([80, 50, 80]);
        break;
      case "success":
        navigator.vibrate([50, 30, 50, 30, 100]);
        break;
      case "generate":
        navigator.vibrate([30, 40, 30, 40, 120]);
        break;
      default:
        navigator.vibrate(25);
    }
  } catch (err) {
    console.warn("Haptic feedback suppressed or unsupported:", err);
  }
};
