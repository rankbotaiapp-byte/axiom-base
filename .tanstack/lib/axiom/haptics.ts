/**
 * Haptic feedback for conversion buttons.
 * navigator.vibrate works on Android Chrome/Firefox. iOS Safari does not
 * implement it, so this is a silent no-op there — never rely on it for UX.
 */
export type HapticPattern = 'tap' | 'select' | 'success' | 'error';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 12,
  select: 8,
  success: [14, 50, 22],
  error: [40, 60, 40],
};

export function haptic(pattern: HapticPattern = 'tap'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* blocked by permissions policy or no user activation yet */
  }
}
