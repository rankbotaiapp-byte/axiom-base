// Niche demo templates shown in the Proof-of-Work section.
// Add a niche = add an object here. Everything in the UI is driven from this list.

export type NicheTemplate = {
  id: string;
  trade: string;
  tagline: string;
  icon: string; // emoji keeps it dependency-free; swap for SVGs later
  accent: string; // hex — used for the card glow + phone preview theme
  services: { name: string; price: string; duration: string }[];
  jobs: { customer: string; address: string; time: string; status: "En route" | "Scheduled" | "On site" | "Done" }[];
  automations: string[];
  /** Optional: a live deployed demo URL. When set, the modal shows an iframe tab. */
  liveUrl?: string;
};

export const TEMPLATES: NicheTemplate[] = [
  {
    id: "plumbing",
    trade: "Plumbing & Drains",
    tagline: "Emergency calls booked, routed, and dispatched while you're under a sink.",
    icon: "🔧",
    accent: "#3fd8ff",
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
    id: "electrical",
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
    id: "hvac",
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
    id: "barbershop",
    trade: "Barbershops",
    tagline: "Chairs stay full. No-shows get texted. Walk-ins see live wait times.",
    icon: "💈",
    accent: "#ff6b8a",
    services: [
      { name: "Signature cut", price: "$35", duration: "40 min" },
      { name: "Skin fade + beard", price: "$50", duration: "1 hr" },
      { name: "Kids cut", price: "$25", duration: "30 min" },
    ],
    jobs: [
      { customer: "Marcus", address: "Chair 1 · Dre", time: "9:00 AM", status: "Done" },
      { customer: "Tyler", address: "Chair 2 · Sal", time: "9:40 AM", status: "On site" },
      { customer: "Jordan", address: "Chair 1 · Dre", time: "10:20 AM", status: "Scheduled" },
    ],
    automations: ["Book-by-barber with live availability", "No-show deposit + reminders", "Rebook prompt after every cut"],
  },
  {
    id: "mobile-tech",
    trade: "Mobile Service Techs",
    tagline: "Detailers, mobile mechanics, phone repair — your van becomes the storefront.",
    icon: "🚐",
    accent: "#e08a3c",
    services: [
      { name: "Full mobile detail", price: "$220", duration: "3 hr" },
      { name: "On-site diagnostic", price: "$95", duration: "1 hr" },
      { name: "Screen replacement", price: "$129+", duration: "45 min" },
    ],
    jobs: [
      { customer: "K. Diaz", address: "Costco lot · Medford", time: "8:30 AM", status: "Done" },
      { customer: "S. Reyes", address: "77 Vine St", time: "11:00 AM", status: "En route" },
      { customer: "A. Moore", address: "12 Bluff Rd", time: "2:00 PM", status: "Scheduled" },
    ],
    automations: ["Service-area map with travel buffer", "Pay-on-site links", "Review request after every job"],
  },
  {
    id: "tattoo",
    trade: "Tattoo Studios",
    tagline: "Deposits, consult forms, and artist calendars in one tap.",
    icon: "🖋️",
    accent: "#a98bff",
    services: [
      { name: "Consultation", price: "Free", duration: "20 min" },
      { name: "Half-day session", price: "$600", duration: "4 hr" },
      { name: "Flash piece", price: "$150+", duration: "1.5 hr" },
    ],
    jobs: [
      { customer: "Riley", address: "Artist · Nova", time: "12:00 PM", status: "On site" },
      { customer: "Sam", address: "Artist · Kai", time: "2:00 PM", status: "Scheduled" },
      { customer: "Avery", address: "Consult · Nova", time: "5:00 PM", status: "Scheduled" },
    ],
    automations: ["Deposit required to book", "Digital consent + consult forms", "Aftercare texts on autopilot"],
  },
];

export const getTemplate = (id?: string | null) => TEMPLATES.find((t) => t.id === id);
