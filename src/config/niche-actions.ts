import { CATALOG_NICHES, isCatalogNiche, type CatalogNiche } from "./catalog.ts";

export type NicheServiceCard = {
  title: string;
  detail: string;
  priceLabel: string;
};

export type NicheActions = {
  primaryCta: string;
  secondaryCta: string;
  badge: string;
  services: readonly [NicheServiceCard, NicheServiceCard, NicheServiceCard];
};

function cards(
  a: NicheServiceCard,
  b: NicheServiceCard,
  c: NicheServiceCard,
): NicheActions["services"] {
  return [a, b, c];
}

/**
 * Explicit storefront copy for every verified catalog niche.
 * Unknown niches return undefined from `getNicheActions` — this map has no generic fallback.
 */
export const NICHE_ACTION_MAP: Record<CatalogNiche, NicheActions> = {
  auto: {
    primaryCta: "Book a diagnostic sweep",
    secondaryCta: "Request a bay slot",
    badge: "Diagnostic bay",
    services: cards(
      { title: "Diagnostic sweep", detail: "Codes, compression, and the first fault.", priceLabel: "$129" },
      { title: "Brake and fluid service", detail: "Pads, fluid, and a road test.", priceLabel: "$189" },
      { title: "Full detail", detail: "Paint correction and interior reset.", priceLabel: "$320" },
    ),
  },
  barber: {
    primaryCta: "Book the chair",
    secondaryCta: "Hold a walk-in block",
    badge: "Chair open",
    services: cards(
      { title: "Signature cut", detail: "Consult, cut, and finish.", priceLabel: "$45" },
      { title: "Skin fade", detail: "Tight blend, razor line, hot towel.", priceLabel: "$52" },
      { title: "Beard sculpt", detail: "Shape, lineup, and oil.", priceLabel: "$28" },
    ),
  },
  "bow-tech": {
    primaryCta: "Book archery tuning",
    secondaryCta: "Schedule a string build",
    badge: "Bench open",
    services: cards(
      { title: "Archery tuning", detail: "Limb, rest, and paper tune.", priceLabel: "$85" },
      { title: "String and cable", detail: "Build, serve, and set timing.", priceLabel: "$140" },
      { title: "Sight and rest setup", detail: "Mount, level, and confirm impact.", priceLabel: "$95" },
    ),
  },
  canine: {
    primaryCta: "Book the run",
    secondaryCta: "Reserve boarding",
    badge: "Kennel open",
    services: cards(
      { title: "Bath and brush", detail: "Coat, nails, and a dry-down.", priceLabel: "$65" },
      { title: "Day board", detail: "A supervised run and midday check.", priceLabel: "$48" },
      { title: "Trail pack", detail: "Outdoor work with a handler.", priceLabel: "$90" },
    ),
  },
  contractor: {
    primaryCta: "Book a site walk",
    secondaryCta: "Request a crew day",
    badge: "Job book",
    services: cards(
      { title: "Site walk", detail: "Scope, photos, and the next step.", priceLabel: "$89" },
      { title: "Punch list", detail: "Close the open items on one visit.", priceLabel: "$240" },
      { title: "Crew day", detail: "A full day on the job.", priceLabel: "$680" },
    ),
  },
  electrical: {
    primaryCta: "Book a panel survey",
    secondaryCta: "Schedule a high-voltage grid",
    badge: "Live panel",
    services: cards(
      { title: "Panel survey", detail: "Load, breaker map, and the first fault.", priceLabel: "$149" },
      { title: "High-voltage grid", detail: "Service entrance, grounding, and the run.", priceLabel: "$420" },
      { title: "Circuit add", detail: "A dedicated run to the new load.", priceLabel: "$260" },
    ),
  },
  fabrication: {
    primaryCta: "Book a fab ticket",
    secondaryCta: "Request a weld fit",
    badge: "Shop floor",
    services: cards(
      { title: "Cut and fit", detail: "Layout, cut, and a dry fit.", priceLabel: "$180" },
      { title: "Weld-up", detail: "Joint prep and the finished bead.", priceLabel: "$320" },
      { title: "Custom bracket", detail: "One-off fixture from your sketch.", priceLabel: "$140" },
    ),
  },
  forestry: {
    primaryCta: "Book a stand day",
    secondaryCta: "Mark a timber line",
    badge: "Crew marked",
    services: cards(
      { title: "Stand walk", detail: "Mark trees and the skid path.", priceLabel: "$160" },
      { title: "Cord drop", detail: "Cut, split, and stack at the drive.", priceLabel: "$280" },
      { title: "Crew day", detail: "A full day on the marked stand.", priceLabel: "$740" },
    ),
  },
  glasswork: {
    primaryCta: "Book a pane measure",
    secondaryCta: "Schedule the set",
    badge: "Measure locked",
    services: cards(
      { title: "Pane measure", detail: "Opening, thickness, and the order.", priceLabel: "$75" },
      { title: "Set and glaze", detail: "Install, seal, and a clean edge.", priceLabel: "$240" },
      { title: "Repair chip", detail: "Stop the run before it travels.", priceLabel: "$90" },
    ),
  },
  hvac: {
    primaryCta: "Book a system check",
    secondaryCta: "Hold a same-day slot",
    badge: "Air on the book",
    services: cards(
      { title: "System check", detail: "Filter, charge, and the first fault.", priceLabel: "$129" },
      { title: "Season tune", detail: "Heat or cool, coils, and drains.", priceLabel: "$189" },
      { title: "Duct balance", detail: "Rooms that never quite match.", priceLabel: "$260" },
    ),
  },
  landscaping: {
    primaryCta: "Book the grounds",
    secondaryCta: "Schedule irrigation",
    badge: "Yard on the book",
    services: cards(
      { title: "Grounds visit", detail: "Mow, edge, and the blow-off.", priceLabel: "$95" },
      { title: "Irrigation check", detail: "Heads, zones, and a leak hunt.", priceLabel: "$140" },
      { title: "Hardscape day", detail: "A crew day on beds and borders.", priceLabel: "$620" },
    ),
  },
  machining: {
    primaryCta: "Book a spindle slot",
    secondaryCta: "Send a print",
    badge: "Tolerance held",
    services: cards(
      { title: "Print review", detail: "Tolerance, material, and the quote.", priceLabel: "$80" },
      { title: "Single setup", detail: "One fixture, one run, inspected.", priceLabel: "$220" },
      { title: "Fixture build", detail: "A repeatable hold for the next lot.", priceLabel: "$480" },
    ),
  },
  plumbing: {
    primaryCta: "Book a line call",
    secondaryCta: "Hold an emergency slot",
    badge: "Line on call",
    services: cards(
      { title: "Leak locate", detail: "Find the line before the wall opens.", priceLabel: "$149" },
      { title: "Fixture swap", detail: "Valve, supply, and a dry test.", priceLabel: "$210" },
      { title: "Drain clear", detail: "The stoppage and a camera check.", priceLabel: "$189" },
    ),
  },
  "power-sports": {
    primaryCta: "Book a lesson block",
    secondaryCta: "Reserve the sled",
    badge: "Block open",
    services: cards(
      { title: "Lesson block", detail: "Gear, the hill, and a coach.", priceLabel: "$120" },
      { title: "Tune and wax", detail: "Base, edge, and the next run.", priceLabel: "$65" },
      { title: "Private half-day", detail: "Your group, one instructor.", priceLabel: "$340" },
    ),
  },
  roofing: {
    primaryCta: "Book a roof walk",
    secondaryCta: "Request a metal quote",
    badge: "On the pitch",
    services: cards(
      { title: "Roof walk", detail: "Pitch, leaks, and the photo set.", priceLabel: "$99" },
      { title: "Shingle repair", detail: "The blown course and the ridge.", priceLabel: "$280" },
      { title: "Metal panel day", detail: "A crew day on the new skin.", priceLabel: "$860" },
    ),
  },
  security: {
    primaryCta: "Book a post",
    secondaryCta: "Request a patrol loop",
    badge: "Post covered",
    services: cards(
      { title: "Site survey", detail: "Doors, cameras, and the first gap.", priceLabel: "$160" },
      { title: "Night post", detail: "One officer, one address, one shift.", priceLabel: "$420" },
      { title: "Patrol loop", detail: "Timed checks across the property.", priceLabel: "$240" },
    ),
  },
  "stone-masonry": {
    primaryCta: "Book a wall set",
    secondaryCta: "Schedule a course repair",
    badge: "Stone on site",
    services: cards(
      { title: "Course repair", detail: "Reset the loose face and repoint.", priceLabel: "$220" },
      { title: "New veneer", detail: "Layout, mortar, and the first course.", priceLabel: "$480" },
      { title: "Hardscape day", detail: "A crew day on steps or a wall.", priceLabel: "$720" },
    ),
  },
  taxidermy: {
    primaryCta: "Book the mount",
    secondaryCta: "Request a restoration",
    badge: "Mount waiting",
    services: cards(
      { title: "Mount consult", detail: "Species, pose, and the timeline.", priceLabel: "$75" },
      { title: "Shoulder mount", detail: "Form, finish, and the habitat base.", priceLabel: "$680" },
      { title: "Restoration", detail: "Repair a cracked ear or faded cape.", priceLabel: "$240" },
    ),
  },
  "tool-repair": {
    primaryCta: "Book a bench slot",
    secondaryCta: "Drop a tool",
    badge: "Bench open",
    services: cards(
      { title: "Sharpen", detail: "Edge geometry and a test cut.", priceLabel: "$35" },
      { title: "Rebuild", detail: "Bearings, seals, and a run-in.", priceLabel: "$120" },
      { title: "Diagnostic bench", detail: "Find why it stalls before parts.", priceLabel: "$65" },
    ),
  },
  "water-systems": {
    primaryCta: "Book a well check",
    secondaryCta: "Schedule filtration",
    badge: "Water on schedule",
    services: cards(
      { title: "Well check", detail: "Pressure, drawdown, and the pump.", priceLabel: "$149" },
      { title: "Filter service", detail: "Cartridges, UV, and a sample.", priceLabel: "$110" },
      { title: "Line locate", detail: "Find the supply before you dig.", priceLabel: "$180" },
    ),
  },
  woodworking: {
    primaryCta: "Book the mill",
    secondaryCta: "Request a joint sample",
    badge: "Grain matched",
    services: cards(
      { title: "Mill consult", detail: "Species, joinery, and the drawing.", priceLabel: "$90" },
      { title: "Custom door", detail: "Stile, rail, and a matched panel.", priceLabel: "$640" },
      { title: "Finish day", detail: "Sand, stain, and the topcoat.", priceLabel: "$280" },
    ),
  },
};

/** Compile-time and runtime proof that every catalog niche has its own actions. */
export function assertNicheActionMap(): void {
  for (const id of CATALOG_NICHES) {
    const row = NICHE_ACTION_MAP[id];
    if (!row?.primaryCta || !row.secondaryCta || !row.badge || row.services.length !== 3) {
      throw new Error(`NICHE_ACTION_MAP is missing ${id}`);
    }
  }
}

/** Exact catalog niche only. Unknown or legacy keys return undefined — no generic copy. */
export function getNicheActions(niche: string | null | undefined): NicheActions | undefined {
  const key = (niche ?? "").trim().toLowerCase();
  if (!isCatalogNiche(key)) return undefined;
  return NICHE_ACTION_MAP[key];
}
