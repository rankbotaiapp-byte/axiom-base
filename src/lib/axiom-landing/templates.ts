// Niche demo templates shown in the Proof-of-Work section.
// Add a niche = add an object here. Everything in the UI is driven from this list.

export type NicheTemplate = {
  id: string;
  /** Public demo route segment under `/demo/[niche]` */
  demoPath: string;
  /** Example tenant slug under `/[shopSlug]` */
  sampleSlug: string;
  trade: string;
  tagline: string;
  icon: string;
  accent: string;
  services: { name: string; price: string; duration: string }[];
  jobs: { customer: string; address: string; time: string; status: "En route" | "Scheduled" | "On site" | "Done" }[];
  automations: string[];
  /** Optional: a live deployed demo URL. When set, the modal shows an iframe tab. */
  liveUrl?: string;
};

export const TEMPLATES: NicheTemplate[] = [
  {
    id: "plumbing",
    demoPath: "/demo/plumbing",
    sampleSlug: "accurate-plumbing",
    trade: "Plumbing & Drains",
    tagline: "Emergency calls booked, routed, and dispatched while you're under a sink.",
    icon: "🔧",
    accent: "#00f2fe",
    services: [
      { name: "Drain clearing", price: "$189", duration: "1 hr" },
      { name: "Water heater install", price: "$1,450+", duration: "4 hr" },
      { name: "Leak detection", price: "$249", duration: "1.5 hr" },
    ],
    jobs: [
      { customer: "M. Alvarez", address: "214 Pine St", time: "8:30 AM", status: "On site" },
      { customer: "J. Chen", address: "88 River Rd", time: "10:15 AM", status: "En route" },
      { customer: "Dana K.", address: "5 Oak Ct", time: "1:00 PM", status: "Scheduled" },
    ],
    automations: ["24/7 AI receptionist answers + books", "Auto-route by zip & drive time", "Tech gets job + map by text"],
  },
  {
    id: "hvac",
    demoPath: "/demo/hvac",
    sampleSlug: "summit-hvac",
    trade: "HVAC",
    tagline: "Seasonal tune-ups that sell themselves and fill your slow months.",
    icon: "❄️",
    accent: "#7cf0c5",
    services: [
      { name: "AC tune-up", price: "$129", duration: "1 hr" },
      { name: "Furnace repair", price: "$275+", duration: "2 hr" },
      { name: "Maintenance plan", price: "$19/mo", duration: "—" },
    ],
    jobs: [
      { customer: "L. Nguyen", address: "6 Cedar Way", time: "8:00 AM", status: "Done" },
      { customer: "G. Ortiz", address: "310 Hill St", time: "10:00 AM", status: "On site" },
      { customer: "B. Walsh", address: "52 Lake Dr", time: "2:30 PM", status: "Scheduled" },
    ],
    automations: ["Seasonal reminder campaigns", "Maintenance-plan billing", "Parts list attached to each job"],
  },
  {
    id: "electrical",
    demoPath: "/demo/electrical",
    sampleSlug: "cascade-electric",
    trade: "Electrical",
    tagline: "Quotes, permits, and panel jobs — tracked without a single sticky note.",
    icon: "⚡",
    accent: "#ffd23f",
    services: [
      { name: "Panel upgrade", price: "$2,100+", duration: "6 hr" },
      { name: "EV charger install", price: "$950", duration: "3 hr" },
      { name: "Outlet / switch repair", price: "$145", duration: "45 min" },
    ],
    jobs: [
      { customer: "R. Patel", address: "19 Elm Ave", time: "9:00 AM", status: "En route" },
      { customer: "Summit Dental", address: "400 Main St", time: "11:30 AM", status: "Scheduled" },
      { customer: "T. Brooks", address: "73 Ridge Ln", time: "3:00 PM", status: "Scheduled" },
    ],
    automations: ["Instant quote request intake", "Permit + inspection reminders", "Crew calendar auto-balanced"],
  },
  {
    id: "outfitter",
    demoPath: "/demo/forestry",
    sampleSlug: "river-outfitters",
    trade: "Local Outfitters",
    tagline: "Guides, trips, and gear days — booked before the trailhead fills up.",
    icon: "🧭",
    accent: "#e08a3c",
    services: [
      { name: "Half-day guided trip", price: "$275", duration: "4 hr" },
      { name: "Full-day expedition", price: "$525", duration: "8 hr" },
      { name: "Gear rental day pack", price: "$85", duration: "—" },
    ],
    jobs: [
      { customer: "Party of 4", address: "Put-in A", time: "7:00 AM", status: "En route" },
      { customer: "Private guide", address: "Lodge desk", time: "9:30 AM", status: "On site" },
      { customer: "Family float", address: "Take-out C", time: "1:00 PM", status: "Scheduled" },
    ],
    automations: ["Trip capacity + weather holds", "Waiver + deposit before launch", "Crew SMS with put-in map"],
  },
];

export const getTemplate = (id?: string | null) => TEMPLATES.find((t) => t.id === id);
