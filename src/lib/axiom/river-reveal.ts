const RIVER = /\briver[-\s]?hawk\b|\bfishing guides?\b|\bfly[-\s]?fish/i;

/** Fishing outfitters use the river ripple hero. Hunting stays on the owl film. */
export function usesRiverReveal(niche: string, text = ""): boolean {
  if (niche === "guide") return true;
  return RIVER.test(`${niche} ${text}`);
}
