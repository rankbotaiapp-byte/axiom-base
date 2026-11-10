/**
 * Single source of truth for business details, pricing and content.
 * Swap these values to re-skin the site for another land-clearing client.
 *
 * ⚠ Before launch: replace the phone, email, service area, rates,
 * stats and case studies with the client's real numbers.
 */

export const site = {
  name: 'AXIOM',
  tagline: 'TACTICAL LAND CLEARING',
  legalName: 'Axiom Tactical Land Clearing',
  description:
    'Tactical, high-impact land clearing and forestry mulching for impossible terrain across the Pacific Northwest.',
  phoneDisplay: '(541) 555-0142',
  phoneHref: 'tel:+15415550142',
  email: 'deploy@axiomlandclearing.com',
  serviceArea: 'Southern Oregon · Rogue Valley · Northern California',
  baseCoords: '42.4390° N  123.1720° W',
  hours: 'Mon–Sat · 6:00 AM – 7:00 PM',
  url: 'https://axiomlandclearing.com',
};

export const nav = [
  { label: 'Services', href: '#services' },
  { label: 'Our Fleet', href: '#fleet' },
  { label: 'Case Studies', href: '#cases' },
  { label: 'Contact', href: '#contact' },
];

/* ------------------------------------------------------------------ */
/* Estimator                                                           */
/* ------------------------------------------------------------------ */

export type ServiceKey = 'mulching' | 'lot' | 'firebreak' | 'row';
export type DensityKey = 'light' | 'medium' | 'heavy';
export type TerrainKey = 'flat' | 'rolling' | 'steep';

export const estimator = {
  /** Base $ per acre at medium density on flat ground. */
  services: {
    mulching: { label: 'Forestry Mulching', short: 'Mulching', perAcre: 1900 },
    lot: { label: 'Lot & Land Clearing', short: 'Lot Clear', perAcre: 2700 },
    firebreak: { label: 'Wildfire Defensible Space', short: 'Fire Break', perAcre: 1500 },
    row: { label: 'Right-of-Way / Trail Cut', short: 'ROW / Trail', perAcre: 2100 },
  } satisfies Record<ServiceKey, { label: string; short: string; perAcre: number }>,
  density: {
    light: { label: 'Light Brush', short: 'Light', mult: 0.72, acresPerDay: 3.2 },
    medium: { label: 'Mixed Growth', short: 'Mixed', mult: 1, acresPerDay: 2 },
    heavy: { label: 'Heavy Timber', short: 'Heavy', mult: 1.5, acresPerDay: 1.1 },
  } satisfies Record<DensityKey, { label: string; short: string; mult: number; acresPerDay: number }>,
  terrain: {
    flat: { label: 'Flat', mult: 1, speed: 1 },
    rolling: { label: 'Rolling', mult: 1.15, speed: 0.85 },
    steep: { label: 'Steep', mult: 1.4, speed: 0.65 },
  } satisfies Record<TerrainKey, { label: string; mult: number; speed: number }>,
  mobilization: 450,
  minimumJob: 1500,
  /** ± spread applied to the point estimate. */
  spread: 0.15,
  acres: { min: 0.25, max: 40, step: 0.25, default: 3 },
};

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const stats = [
  { value: 4200, suffix: '+', label: 'Acres Cleared' },
  { value: 48, suffix: ' HR', label: 'Site Recon Turnaround' },
  { value: 45, suffix: '°', label: 'Max Operating Slope' },
  { value: 100, suffix: '%', label: 'Mulch Left On-Site' },
];

export const services = [
  {
    icon: 'Trees',
    code: 'SVC-01',
    title: 'Forestry Mulching',
    body: 'One machine, one pass. Standing brush and trees up to 8" are ground into erosion-stopping mulch — no burn piles, no haul-off.',
  },
  {
    icon: 'Tractor',
    code: 'SVC-02',
    title: 'Lot & Land Clearing',
    body: 'Build sites, pasture reclamation and view corridors cleared to grade-ready condition, stumps and all.',
  },
  {
    icon: 'Flame',
    code: 'SVC-03',
    title: 'Wildfire Defensible Space',
    body: 'Fuel reduction and fire breaks built to Oregon and CAL FIRE spacing guidance. Paperwork-ready for insurers.',
  },
  {
    icon: 'Route',
    code: 'SVC-04',
    title: 'Right-of-Way & Trails',
    body: 'Power-line, pipeline, access-road and trail corridors cut clean and kept open on a maintenance schedule.',
  },
  {
    icon: 'Sprout',
    code: 'SVC-05',
    title: 'Invasive Removal',
    body: 'Himalayan blackberry, Scotch broom and gorse taken out at the crown so the ground can actually recover.',
  },
  {
    icon: 'Axe',
    code: 'SVC-06',
    title: 'Stump Grinding',
    body: 'Below-grade stump removal on cleared ground or one-off problem stumps in tight residential lots.',
  },
] as const;

export const fleet = [
  {
    id: 'mulcher',
    name: 'AX-1 Tracked Mulcher',
    role: 'Primary assault unit',
    image: '/media/land-clearing-fleet.jpg' as string | undefined,
    specs: [
      { label: 'Engine', value: '300 HP Tier 4' },
      { label: 'Cutting width', value: '8 ft drum' },
      { label: 'Max tree size', value: '10 in DBH' },
      { label: 'Ground pressure', value: '4.2 psi' },
    ],
    readiness: 96,
  },
  {
    id: 'ctl',
    name: 'AX-2 Compact Track Loader',
    role: 'Tight-access unit',
    image: undefined as string | undefined,
    specs: [
      { label: 'Engine', value: '110 HP' },
      { label: 'Cutting width', value: '5 ft head' },
      { label: 'Max tree size', value: '6 in DBH' },
      { label: 'Access width', value: '6.5 ft gate' },
    ],
    readiness: 100,
  },
  {
    id: 'excavator',
    name: 'AX-3 Excavator + Thumb',
    role: 'Stump & debris recovery',
    image: undefined as string | undefined,
    specs: [
      { label: 'Operating weight', value: '20 t' },
      { label: 'Reach', value: '31 ft' },
      { label: 'Attachment', value: 'Hydraulic thumb' },
      { label: 'Max stump', value: '36 in' },
    ],
    readiness: 92,
  },
];

export const protocol = [
  { step: '01', title: 'Recon', body: 'On-site walk or drone pass. We map acreage, slope, access and anything that has to stay standing.' },
  { step: '02', title: 'Mission Plan', body: 'Fixed written quote, scope map and a start date. No hourly surprises.' },
  { step: '03', title: 'Deployment', body: 'Machines on site, work zones flagged, progress photos to your phone daily.' },
  { step: '04', title: 'Extraction', body: 'Final walk-through, mulch spread even, gates closed. You sign off before we roll out.' },
];

/** Sample projects for the template — replace with the client's real jobs. */
export const caseStudies = [
  {
    tag: 'WILDFIRE PREP',
    title: '18-acre defensible space perimeter',
    location: 'Jacksonville, OR',
    metrics: [
      { label: 'Acres', value: '18' },
      { label: 'Days on site', value: '7' },
      { label: 'Fuel load cut', value: '72%' },
    ],
    body: 'Overgrown oak and manzanita ladder fuels removed around a ridge-top homestead ahead of fire season.',
  },
  {
    tag: 'BUILD SITE',
    title: 'Timbered lot cleared to pad-ready',
    location: 'Rogue River, OR',
    metrics: [
      { label: 'Acres', value: '4.5' },
      { label: 'Days on site', value: '3' },
      { label: 'Haul-offs', value: '0' },
    ],
    body: 'Second-growth fir and blackberry mulched in place, stumps ground, driveway corridor opened for the builder.',
  },
  {
    tag: 'RIGHT-OF-WAY',
    title: '2.3-mile access road reopened',
    location: 'Josephine County, OR',
    metrics: [
      { label: 'Miles', value: '2.3' },
      { label: 'Days on site', value: '5' },
      { label: 'Corridor', value: '24 ft' },
    ],
    body: 'Decade-old logging road reclaimed from alder and broom so crews and fire engines can reach the back parcel.',
  },
];
