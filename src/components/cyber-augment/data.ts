export const ASSETS = {
  heroVideo: "/media/cyber-augment-loop.mp4",
  heroPoster: "/media/cyber-augment-poster.jpg",
  workshop: "/media/cyber-augment-workshop.jpg",
  armory: "/media/cyber-augment-armory.jpg",
} as const;

/** Native pixel size of both supplementary stills — keeps annotation coordinates aligned. */
export const STILL_ASPECT = 2576 / 1438;

export type UpgradePackageId =
  | "ocular-red10"
  | "neural-lattice"
  | "hydraulic-limb"
  | "dermal-weave"
  | "full-chassis";

export interface UpgradePackage {
  id: UpgradePackageId;
  name: string;
  category: string;
  installTime: string;
  recovery: string;
  warranty: string;
  price: string;
}

export const UPGRADE_PACKAGES: readonly UpgradePackage[] = [
  {
    id: "ocular-red10",
    name: "Ocular Core RED-10",
    category: "Optics",
    installTime: "3 hrs",
    recovery: "48 hrs",
    warranty: "5 yr",
    price: "$18,400",
  },
  {
    id: "neural-lattice",
    name: "Neural Sync Lattice",
    category: "Neural",
    installTime: "6 hrs",
    recovery: "5 days",
    warranty: "Lifetime",
    price: "$42,000",
  },
  {
    id: "hydraulic-limb",
    name: "Hydraulic Limb Mk.IV",
    category: "Limb",
    installTime: "9 hrs",
    recovery: "10 days",
    warranty: "7 yr",
    price: "$64,500",
  },
  {
    id: "dermal-weave",
    name: "Ballistic Dermal Weave",
    category: "Armor",
    installTime: "4 hrs",
    recovery: "72 hrs",
    warranty: "5 yr",
    price: "$27,900",
  },
  {
    id: "full-chassis",
    name: "Full Chassis Integration",
    category: "Bundle",
    installTime: "2 days",
    recovery: "3 wks",
    warranty: "Lifetime",
    price: "$148,000",
  },
] as const;

export interface HardwareSpecGroup {
  id: string;
  label: string;
  code: string;
  accent: "red" | "cyan";
  summary: string;
  specs: readonly { label: string; value: string }[];
}

export const HARDWARE_SPECS: readonly HardwareSpecGroup[] = [
  {
    id: "ocular",
    label: "Ocular Core",
    code: "RED-10",
    accent: "red",
    summary:
      "Sub-retinal infrared array with predictive target lock and low-light amplification tuned for urban environments.",
    specs: [
      { label: "Spectral range", value: "380 nm – 14 µm" },
      { label: "Refresh", value: "480 Hz" },
      { label: "Lock latency", value: "2.1 ms" },
      { label: "Zoom", value: "1× – 24× optical" },
      { label: "Power draw", value: "0.8 W idle / 3.2 W active" },
      { label: "Firmware", value: "OCU-OS 10.4.2" },
    ],
  },
  {
    id: "neural",
    label: "Neural Sync",
    code: "NSL-7",
    accent: "cyan",
    summary:
      "Closed-loop neural lattice that bridges motor cortex intent to augmented limbs with self-calibrating drift correction.",
    specs: [
      { label: "Sync stability", value: "99.8% sustained" },
      { label: "Channels", value: "4,096 bidirectional" },
      { label: "Signal latency", value: "< 0.9 ms" },
      { label: "Drift correction", value: "Adaptive, 60 s cycle" },
      { label: "Isolation", value: "Galvanic, triple-redundant" },
      { label: "Firmware", value: "SYNAPSE 7.1.0" },
    ],
  },
  {
    id: "limb",
    label: "Hydraulic Limb",
    code: "MK.IV",
    accent: "red",
    summary:
      "Aerospace-alloy arm assembly with micro-hydraulic joints, haptic fingertip feedback and field-swappable power cells.",
    specs: [
      { label: "Grip force", value: "2,200 N peak" },
      { label: "Joint actuators", value: "27 micro-hydraulic" },
      { label: "Haptic resolution", value: "0.2 mm" },
      { label: "Mass", value: "3.4 kg" },
      { label: "Cell runtime", value: "38 hrs typical" },
      { label: "Ingress rating", value: "IP68" },
    ],
  },
  {
    id: "armor",
    label: "Dermal Weave",
    code: "BDW-3",
    accent: "cyan",
    summary:
      "Flexible sub-dermal composite mesh layered with an external modular plate system for full personal protection.",
    specs: [
      { label: "Mesh layers", value: "12 aramid-graphene" },
      { label: "Plate system", value: "Modular, quick-release" },
      { label: "Thermal comfort", value: "Active wicking" },
      { label: "Added mass", value: "1.1 kg (mesh)" },
      { label: "Fitting", value: "3D body-scan tailored" },
      { label: "Service interval", value: "18 months" },
    ],
  },
] as const;

export interface Annotation {
  id: string;
  /** Percent of the still's width/height where the callout pin sits. */
  x: number;
  y: number;
  /** Which side of the pin the label extends toward. */
  side: "left" | "right";
  title: string;
  detail: string;
  accent: "red" | "cyan";
}

export const WORKSHOP_ANNOTATIONS: readonly Annotation[] = [
  {
    id: "finger-servos",
    x: 27,
    y: 36,
    side: "right",
    title: "Phalanx Servo Stack",
    detail: "14 independent actuators · 0.2 mm haptic resolution",
    accent: "cyan",
  },
  {
    id: "micro-led",
    x: 40,
    y: 50,
    side: "left",
    title: "Micro-LED Status Array",
    detail: "Per-joint health telemetry · red = load, cyan = sync",
    accent: "red",
  },
  {
    id: "wrist-hydraulic",
    x: 53,
    y: 61,
    side: "right",
    title: "Wrist Hydraulic Joint",
    detail: "3-axis rotary coupling · 2,200 N rated",
    accent: "cyan",
  },
  {
    id: "forearm-core",
    x: 84,
    y: 29,
    side: "left",
    title: "Forearm Power Core",
    detail: "Hot-swap cell · 38 hr runtime",
    accent: "red",
  },
] as const;

export interface ArsenalHotspot {
  id: string;
  x: number;
  y: number;
  title: string;
  tag: string;
  description: string;
  specs: readonly { label: string; value: string }[];
}

export const ARSENAL_HOTSPOTS: readonly ArsenalHotspot[] = [
  {
    id: "carriers",
    x: 21,
    y: 33,
    title: "Ballistic Carrier Series",
    tag: "Custom Ballistic Gear",
    description: "Body-scan tailored plate carriers that interlock with the Dermal Weave mesh for seamless coverage.",
    specs: [
      { label: "Fit", value: "3D-scan tailored" },
      { label: "Plates", value: "Modular quick-release" },
      { label: "Integration", value: "BDW-3 mesh lock" },
    ],
  },
  {
    id: "diagnostics",
    x: 49,
    y: 33,
    title: "Diagnostic Command Wall",
    tag: "Live Telemetry",
    description: "Every install is monitored in real time — neural sync, power curves and joint loads on one wall.",
    specs: [
      { label: "Channels", value: "4,096 streams" },
      { label: "Sampling", value: "1 kHz" },
      { label: "Alerts", value: "Predictive, < 50 ms" },
    ],
  },
  {
    id: "chassis",
    x: 46,
    y: 63,
    title: "Upgrade Chassis Core",
    tag: "Heavy-Duty Chassis",
    description: "Mobile power-and-calibration rig that charges, flashes and stress-tests augment hardware before fitting.",
    specs: [
      { label: "Output", value: "Dual 48 V rails" },
      { label: "Flash time", value: "< 4 min" },
      { label: "Stress cycles", value: "10,000 / unit" },
    ],
  },
  {
    id: "rack",
    x: 83,
    y: 34,
    title: "Modular Hardware Rack",
    tag: "Modular Hardware",
    description: "Interchangeable mounts, optics and accessory rails, all matched to the RED-10 ocular overlay.",
    specs: [
      { label: "Mount standard", value: "Universal rail" },
      { label: "Optic pairing", value: "RED-10 native" },
      { label: "Swap time", value: "< 30 s" },
    ],
  },
  {
    id: "bench",
    x: 69,
    y: 58,
    title: "Calibration Bench",
    tag: "Integration",
    description: "Where hardware meets the human — final tuning to your gait, grip and reflex profile.",
    specs: [
      { label: "Session", value: "90 min" },
      { label: "Profiles", value: "Gait · Grip · Reflex" },
      { label: "Tolerance", value: "± 0.05 mm" },
    ],
  },
] as const;
