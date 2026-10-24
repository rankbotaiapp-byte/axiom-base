const CERAMIC =
  /\b(?:auto|car|vehicle|mobile)\s+detail(?:ing|er)?\b|\bdetailers?\b|\bceramic(?:\s+(?:coat|armor))?\b|\b(?:vinyl|car|vehicle|paint)\s+wraps?\b|\bwrap shops?\b|\bppf\b/i;

/** Detailing and wrap shops use the mud-to-ceramic swipe hero. */
export function usesCeramicReveal(niche: string, text = ""): boolean {
  if (niche === "detailer") return true;
  return CERAMIC.test(`${niche} ${text}`);
}
