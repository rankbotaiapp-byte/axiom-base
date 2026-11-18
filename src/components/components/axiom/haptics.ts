/** Short vibration on devices that support it (Android Chrome). iOS Safari has no vibrate API, so this is a no-op there. */
export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* blocked by browser policy: ignore */
    }
  }
}
