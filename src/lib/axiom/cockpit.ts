const AUTOMOTIVE = /\b(mobile mechanics?|auto(?:motive)?\s+repairs?|auto services?|mechanics?)\b/i;
const OTHER_FIELD =
  /\b(handym[ae]n|handy man|appliances?|garage doors?|towing|pressure wash\w*|window clean\w*|junk removal|tree services?|pest control|pool services?|chimneys?|hauling|movers?|moving compan(?:y|ies))\b/i;

/**
 * The first-person cockpit replaces the cinematic hero for mobile mechanic
 * and auto repair. Other field trades (handyman, towing, pest) keep the film.
 * The public field book is the mechanic van, so an unnamed field shop qualifies.
 */
export function usesAutomotiveCockpit(niche: string, text = ""): boolean {
  const blob = `${niche} ${text}`;
  if (OTHER_FIELD.test(blob) && !AUTOMOTIVE.test(blob)) return false;
  if (AUTOMOTIVE.test(blob)) return true;
  return niche === "field";
}
