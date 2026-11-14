/** A service button plays one of these for exactly three seconds, then loops. */

export const CRAFT_LOOP_SECONDS = 3;

export const CRAFT_KINDS = [
  "saw",
  "wash",
  "blade",
  "shear",
  "needle",
  "shutter",
  "leash",
  "string",
  "flame",
  "key",
  "bow",
  "pulse",
] as const;

export type CraftKind = (typeof CRAFT_KINDS)[number];

const NICHE_CRAFT: Record<string, CraftKind> = {
  contractor: "saw",
  firewood: "saw",
  field: "saw",
  trade: "saw",
  landscaper: "blade",
  clean: "wash",
  detailer: "wash",
  salon: "shear",
  beauty: "shear",
  tattoo: "needle",
  photo: "shutter",
  pets: "leash",
  dogwalk: "leash",
  music: "string",
  foodtruck: "flame",
  locksmith: "key",
  security: "key",
  hunting: "bow",
  bowtech: "bow",
  fitness: "pulse",
  wellness: "pulse",
  therapy: "pulse",
  combat: "pulse",
  lessons: "pulse",
};

function mentions(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

/**
 * The picture inside a service button. The service name wins when it names the
 * work (a detailer who also pressure-washes). Otherwise the shop's trade does.
 */
export function craftKindFor(niche: string, serviceName: string): CraftKind {
  const text = serviceName.toLowerCase();
  const trade = niche.trim().toLowerCase();
  if (mentions(text, /pressure|power wash|wash|rinse|foam|ceramic/)) return "wash";
  if (mentions(text, /lockout|rekey|\bkey\b|\block\b/)) return "key";
  if (mentions(text, /tattoo|\bink\b/)) return "needle";
  if (mentions(text, /photo|portrait|headshot/)) return "shutter";
  if (mentions(text, /mow|lawn|hedge|\bleaf\b/)) return "blade";
  if (mentions(text, /\bbow\b|hunt|scout/)) return "bow";
  if (trade === "salon" || trade === "beauty" || mentions(text, /\bhair\b|\blash(?:es)?\b|\bbrow\b|\bbeard\b|\bfade\b|balayage/)) {
    if (mentions(text, /saw|lumber|framing|deck|stump/)) return "saw";
    return "shear";
  }
  if (mentions(text, /saw|lumber|framing|deck|stump|firewood|\bcord\b|\bcut\b/)) return "saw";
  if (mentions(text, /walk|groom|\bbath\b|nail trim|\bpup\b|\bdog\b/)) return "leash";
  if (mentions(text, /song|mix|vocal|guitar/)) return "string";
  if (mentions(text, /cater|taco|grill|truck/)) return "flame";
  return NICHE_CRAFT[trade] ?? "pulse";
}
