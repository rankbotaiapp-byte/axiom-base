/**
 * AQUA OTTER ADVOCATES — page configuration.
 * Every brand-facing value lives here so the experience can be re-skinned
 * for another client without touching component code.
 */

export interface TelemetryReading {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "amber";
}

export interface HabitatMetric {
  label: string;
  value: string;
  /** 0–100, drives the progress bar */
  score: number;
  detail: string;
}

export interface ConservationFact {
  title: string;
  body: string;
}

export const OTTER_CONFIG = {
  brand: {
    name: "AQUA OTTER ADVOCATES",
    tagline: "Protect the river. Meet the guardians beneath it.",
    unitId: "AOA-RIVER-07",
  },

  media: {
    video: "/media/otter-adventures-loop.mp4",
    poster: "/media/otter-adventures-poster.jpg",
  },

  /** Booking portal. Set NEXT_PUBLIC_BOOKING_URL in .env to point at Cal.com / Calendly / your own route. */
  bookingUrl: process.env.VITE_BOOKING_URL ?? "/otter-adventures/book",

  /** Vapi voice concierge. Both values come from the Vapi dashboard. */
  vapi: {
    publicKey: process.env.VITE_VAPI_PUBLIC_KEY ?? "",
    assistantId: process.env.VITE_VAPI_ASSISTANT_ID ?? "",
  },

  telemetry: [
    { label: "WATER TEMP", value: "16.5°C STABLE", tone: "cyan" },
    { label: "CURRENT STATUS", value: "PLAYFUL // DIVING", tone: "emerald" },
  ] satisfies TelemetryReading[],

  habitat: [
    { label: "Water Clarity", value: "4.8 m visibility", score: 86, detail: "Secchi depth across monitored river reaches." },
    { label: "Dissolved Oxygen", value: "9.2 mg/L", score: 92, detail: "Well above the 6 mg/L threshold for healthy prey fish." },
    { label: "Riparian Cover", value: "71% canopy", score: 71, detail: "Bankside vegetation that shelters dens and cools water." },
    { label: "Prey Abundance", value: "High", score: 80, detail: "Crayfish and small-fish density from seasonal surveys." },
    { label: "Den Sites Protected", value: "38 holts", score: 64, detail: "Active den sites under conservation easement." },
    { label: "Pollution Load", value: "Low", score: 88, detail: "Inverse score — higher is cleaner." },
  ] satisfies HabitatMetric[],

  facts: [
    { title: "Keystone species", body: "River otters regulate prey populations and signal ecosystem health. Where otters thrive, rivers thrive." },
    { title: "Where your adoption goes", body: "Funds riparian restoration, water-quality monitoring and den-site protection along partner river corridors." },
    { title: "Expeditions", body: "Small-group guided paddles and shoreline tracking walks led by trained naturalists. Low-impact by design." },
  ] satisfies ConservationFact[],
} as const;
